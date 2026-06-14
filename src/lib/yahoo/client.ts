/* eslint-disable @typescript-eslint/no-explicit-any */
import YahooFinance from "yahoo-finance2";
import { logger } from "@/lib/logger";
import type { EarningsHistoryEntry } from "@/types";
import { computeActualMovePercent } from "@/lib/calculations/actualMove";
import { ivProxyExpectedMove } from "@/lib/calculations/expectedMove";
import { getEarningsDates } from "@/lib/fmp/client";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey", "ripHistorical"],
});

export async function getEarningsWithPrices(symbol: string): Promise<EarningsHistoryEntry[]> {
  const earningsDates = await getEarningsDates(symbol);
  if (earningsDates.length === 0) return [];

  const results: EarningsHistoryEntry[] = [];

  for (const entry of earningsDates) {
    try {
      const earningsMs = new Date(entry.date).getTime();
      if (isNaN(earningsMs)) continue;

      const d = new Date(earningsMs);
      const fiscalQuarter = `Q${Math.ceil((d.getUTCMonth() + 1) / 3)} ${d.getUTCFullYear()}`;

      const periodStart = new Date(earningsMs - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const periodEnd = new Date(earningsMs + 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const historical: any[] = await (yahooFinance as any).historical(symbol, {
        period1: periodStart,
        period2: periodEnd,
        interval: "1d",
      });

      if (!Array.isArray(historical) || historical.length < 2) continue;

      historical.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Find the trading day on or after the earnings date
      const earningsIdx = historical.findIndex(
        (h: any) => new Date(h.date).getTime() >= earningsMs
      );
      if (earningsIdx <= 0) continue;

      const dayBefore = historical[earningsIdx - 1];
      const earningsDay = historical[earningsIdx];

      // Close-to-close: captures full market reaction including intraday trading
      if (!dayBefore?.close || !earningsDay?.close) continue;

      const priceBefore: number = dayBefore.close;
      const priceAfter: number = earningsDay.close;
      const actualMovePercent = computeActualMovePercent(priceBefore, priceAfter);
      const expectedMovePercent = ivProxyExpectedMove(0.35, 1);

      results.push({
        earningsDate: {
          date: entry.date,
          time: entry.time,
          fiscalQuarter,
        },
        stockPriceBefore: parseFloat(priceBefore.toFixed(2)),
        stockPriceAfter: parseFloat(priceAfter.toFixed(2)),
        actualMovePercent,
        expectedMovePercent,
        atmCallPrice: null,
        atmPutPrice: null,
        dataSource: "iv_proxy",
      });
    } catch {
      continue;
    }
  }

  logger.info(`[yahoo] ${symbol} returning ${results.length} valid entries`);
  return results;
}
