import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet, TTL } from "@/lib/cache";
import { getMockOiResponse } from "@/lib/mockOiData";
import { fetchMarketDataOI } from "@/lib/marketdata/client";
import { loadOICache, saveOICache } from "@/lib/marketdata/fileCache";
import { detectAllCrossovers } from "@/lib/calculations/detectCrossovers";
import { env } from "@/lib/env";
import type { OpenInterestApiResponse, OIDataPoint } from "@/types";

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

  const cacheKey = `oi:${symbol}`;
  const cached = cacheGet<OpenInterestApiResponse>(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (env.marketDataApiKey !== null) {
    try {
      // Load what we already have on disk
      const fileCache = loadOICache(symbol);
      const existingDates = new Set(Object.keys(fileCache.data));

      // Fetch only the dates we're missing
      const newPoints = await fetchMarketDataOI(
        symbol,
        env.marketDataApiKey,
        existingDates,
        365
      );

      // Merge new points into the file cache
      for (const p of newPoints) {
        fileCache.data[p.date] = {
          callOI: p.callOI,
          putOI: p.putOI,
          stockPrice: p.stockPrice,
        };
      }

      if (newPoints.length > 0) {
        saveOICache(symbol, fileCache.data);
      }

      if (Object.keys(fileCache.data).length === 0) {
        throw new Error("No OI data returned from MarketData.app");
      }

      // Build sorted OIDataPoint[] for the last 365 days
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      const data: OIDataPoint[] = Object.entries(fileCache.data)
        .filter(([date]) => date >= cutoffStr)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, { callOI, putOI, stockPrice }]) => ({
          date,
          callOI,
          putOI,
          pcRatio:
            callOI > 0 && putOI > 0
              ? Math.round((putOI / callOI) * 1000) / 1000
              : null,
          stockPrice,
        }));

      const response: OpenInterestApiResponse = {
        ticker: symbol,
        data,
        crossovers: detectAllCrossovers(data),
        cachedAt: new Date().toISOString(),
        dataMode: "live",
      };

      cacheSet(cacheKey, response, TTL.EARNINGS_HISTORY);
      return NextResponse.json(response);
    } catch (err) {
      console.error(`[oi/${symbol}] live fetch failed, falling back to mock:`, err);
    }
  }

  const mock = getMockOiResponse(symbol);
  cacheSet(cacheKey, mock, TTL.EARNINGS_HISTORY);
  return NextResponse.json(mock);
}
