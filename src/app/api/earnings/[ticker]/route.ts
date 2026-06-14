import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { cacheGet, cacheSet, TTL } from "@/lib/cache";
import { getMockResponse } from "@/lib/mockData";
import { getEarningsWithPrices } from "@/lib/yahoo/client";
import { computeAllStrategies } from "@/lib/calculations/strategyPnl";
import type { EarningsApiResponse, PostEarningsSummary } from "@/types";

const requestCounts = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip) ?? { count: 0, windowStart: now };
  if (now - entry.windowStart > 60_000) {
    requestCounts.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  requestCounts.set(ip, entry);
  return true;
}

function buildSummary(
  history: Awaited<ReturnType<typeof getEarningsWithPrices>>
): PostEarningsSummary {
  const last = history[history.length - 1];
  const overestimated = history.filter(
    (h) => h.expectedMovePercent > Math.abs(h.actualMovePercent)
  ).length;
  const avgExpected =
    history.reduce((s, h) => s + h.expectedMovePercent, 0) / history.length;
  const avgActualAbs =
    history.reduce((s, h) => s + Math.abs(h.actualMovePercent), 0) / history.length;
  return {
    lastEarningsDate: last.earningsDate,
    lastExpectedMove: parseFloat(last.expectedMovePercent.toFixed(1)),
    lastActualMove: parseFloat(last.actualMovePercent.toFixed(1)),
    overestimatedCount: overestimated,
    totalQuarters: history.length,
    avgExpectedMove: parseFloat(avgExpected.toFixed(1)),
    avgActualAbsMove: parseFloat(avgActualAbs.toFixed(1)),
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { ticker } = await params;
  const symbol = ticker.toUpperCase().trim();

  if (!/^[A-Z]{1,5}$/.test(symbol)) {
    return NextResponse.json({ error: "Invalid ticker symbol" }, { status: 400 });
  }

  const cacheKey = `earnings:${symbol}`;
  const cached = cacheGet<EarningsApiResponse>(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (env.isMockMode) {
    const mock = getMockResponse(symbol);
    if (!mock) {
      return NextResponse.json(
        { error: `No data for ${symbol}. Supported tickers in mock mode: GOOG, AAPL, MSFT, NVDA` },
        { status: 404 }
      );
    }
    cacheSet(cacheKey, mock, TTL.EARNINGS_HISTORY);
    return NextResponse.json(mock);
  }

  try {
    const history = await getEarningsWithPrices(symbol);
    if (history.length === 0) {
      return NextResponse.json(
        { error: `No earnings history found for ${symbol}` },
        { status: 404 }
      );
    }

    const response: EarningsApiResponse = {
      ticker: symbol,
      summary: buildSummary(history),
      strategies: computeAllStrategies(history),
      history,
      cachedAt: new Date().toISOString(),
      dataMode: "live",
    };

    cacheSet(cacheKey, response, TTL.EARNINGS_HISTORY);
    return NextResponse.json(response);
  } catch (err) {
    logger.error(`[earnings/${symbol}]`, err);
    const message = err instanceof Error ? err.message : "Failed to fetch earnings data";
    const isRateLimit = message.toLowerCase().includes("rate limit");
    return NextResponse.json(
      { error: isRateLimit ? message : "Failed to fetch earnings data" },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
