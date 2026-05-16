import type { EarningsApiResponse, EarningsHistoryEntry } from "@/types";

function mockHistory(
  dates: Array<{ date: string; time: "AMC" | "BMO"; quarter: string; priceBefore: number; actualPct: number; expectedPct: number }>
): EarningsHistoryEntry[] {
  return dates.map(({ date, time, quarter, priceBefore, actualPct, expectedPct }) => {
    const priceAfter = priceBefore * (1 + actualPct / 100);
    const atmPrice = (expectedPct / 100) * priceBefore;
    const halfAtm = atmPrice / 2;
    return {
      earningsDate: { date, time, fiscalQuarter: quarter },
      stockPriceBefore: priceBefore,
      stockPriceAfter: parseFloat(priceAfter.toFixed(2)),
      actualMovePercent: actualPct,
      expectedMovePercent: expectedPct,
      atmCallPrice: parseFloat(halfAtm.toFixed(2)),
      atmPutPrice: parseFloat(halfAtm.toFixed(2)),
      dataSource: "mock",
    };
  });
}

const GOOG_HISTORY = mockHistory([
  { date: "2023-04-25", time: "AMC", quarter: "Q1 2023", priceBefore: 107.5, actualPct: 0.2, expectedPct: 5.8 },
  { date: "2023-07-25", time: "AMC", quarter: "Q2 2023", priceBefore: 124.3, actualPct: 5.8, expectedPct: 5.2 },
  { date: "2023-10-24", time: "AMC", quarter: "Q3 2023", priceBefore: 138.5, actualPct: -6.1, expectedPct: 5.5 },
  { date: "2024-01-30", time: "AMC", quarter: "Q4 2023", priceBefore: 158.2, actualPct: -5.8, expectedPct: 5.4 },
  { date: "2024-04-25", time: "AMC", quarter: "Q1 2024", priceBefore: 160.4, actualPct: 10.2, expectedPct: 5.1 },
  { date: "2024-07-23", time: "AMC", quarter: "Q2 2024", priceBefore: 180.3, actualPct: -4.7, expectedPct: 6.0 },
  { date: "2024-10-29", time: "AMC", quarter: "Q3 2024", priceBefore: 171.5, actualPct: -4.9, expectedPct: 5.9 },
  { date: "2025-02-04", time: "AMC", quarter: "Q4 2024", priceBefore: 197.8, actualPct: -0.6, expectedPct: 6.4 },
  { date: "2025-04-24", time: "AMC", quarter: "Q1 2025", priceBefore: 155.2, actualPct: 1.9, expectedPct: 7.2 },
  { date: "2025-07-23", time: "AMC", quarter: "Q2 2025", priceBefore: 187.4, actualPct: 1.4, expectedPct: 6.1 },
  { date: "2025-10-29", time: "AMC", quarter: "Q3 2025", priceBefore: 190.5, actualPct: -0.9, expectedPct: 5.8 },
  { date: "2026-02-03", time: "AMC", quarter: "Q4 2025", priceBefore: 201.3, actualPct: 3.2, expectedPct: 6.3 },
  { date: "2026-04-22", time: "AMC", quarter: "Q1 2026", priceBefore: 165.0, actualPct: 4.1, expectedPct: 6.8 },
]);

const AAPL_HISTORY = mockHistory([
  { date: "2023-05-04", time: "AMC", quarter: "Q2 FY23", priceBefore: 168.5, actualPct: 4.7, expectedPct: 4.2 },
  { date: "2023-08-03", time: "AMC", quarter: "Q3 FY23", priceBefore: 191.2, actualPct: -4.8, expectedPct: 3.9 },
  { date: "2023-11-02", time: "AMC", quarter: "Q4 FY23", priceBefore: 177.6, actualPct: 0.5, expectedPct: 3.5 },
  { date: "2024-02-01", time: "AMC", quarter: "Q1 FY24", priceBefore: 183.9, actualPct: 0.5, expectedPct: 3.8 },
  { date: "2024-05-02", time: "AMC", quarter: "Q2 FY24", priceBefore: 170.1, actualPct: 6.0, expectedPct: 4.1 },
  { date: "2024-08-01", time: "AMC", quarter: "Q3 FY24", priceBefore: 218.8, actualPct: 0.8, expectedPct: 4.5 },
  { date: "2024-10-31", time: "AMC", quarter: "Q4 FY24", priceBefore: 225.1, actualPct: -1.3, expectedPct: 3.6 },
  { date: "2025-01-30", time: "AMC", quarter: "Q1 FY25", priceBefore: 235.0, actualPct: -0.5, expectedPct: 4.4 },
  { date: "2025-05-01", time: "AMC", quarter: "Q2 FY25", priceBefore: 212.4, actualPct: 3.7, expectedPct: 4.7 },
  { date: "2025-07-31", time: "AMC", quarter: "Q3 FY25", priceBefore: 203.8, actualPct: -2.1, expectedPct: 4.0 },
  { date: "2025-10-30", time: "AMC", quarter: "Q4 FY25", priceBefore: 220.5, actualPct: 1.2, expectedPct: 3.8 },
  { date: "2026-01-29", time: "AMC", quarter: "Q1 FY26", priceBefore: 228.3, actualPct: -3.4, expectedPct: 4.2 },
  { date: "2026-04-30", time: "AMC", quarter: "Q2 FY26", priceBefore: 198.7, actualPct: 2.9, expectedPct: 4.6 },
]);

const NVDA_HISTORY = mockHistory([
  { date: "2023-05-24", time: "AMC", quarter: "Q1 FY24", priceBefore: 305.0, actualPct: 24.1, expectedPct: 12.8 },
  { date: "2023-08-23", time: "AMC", quarter: "Q2 FY24", priceBefore: 471.2, actualPct: 0.1, expectedPct: 11.5 },
  { date: "2023-11-21", time: "AMC", quarter: "Q3 FY24", priceBefore: 499.4, actualPct: 2.5, expectedPct: 9.6 },
  { date: "2024-02-21", time: "AMC", quarter: "Q4 FY24", priceBefore: 625.2, actualPct: 16.4, expectedPct: 10.8 },
  { date: "2024-05-22", time: "AMC", quarter: "Q1 FY25", priceBefore: 894.0, actualPct: 9.3, expectedPct: 11.2 },
  { date: "2024-08-28", time: "AMC", quarter: "Q2 FY25", priceBefore: 125.6, actualPct: 9.5, expectedPct: 10.1 },
  { date: "2024-11-20", time: "AMC", quarter: "Q3 FY25", priceBefore: 145.3, actualPct: 4.9, expectedPct: 9.8 },
  { date: "2025-02-26", time: "AMC", quarter: "Q4 FY25", priceBefore: 131.2, actualPct: 4.0, expectedPct: 10.5 },
  { date: "2025-05-28", time: "AMC", quarter: "Q1 FY26", priceBefore: 111.0, actualPct: 5.1, expectedPct: 9.2 },
  { date: "2025-08-27", time: "AMC", quarter: "Q2 FY26", priceBefore: 138.4, actualPct: 3.8, expectedPct: 8.9 },
  { date: "2025-11-19", time: "AMC", quarter: "Q3 FY26", priceBefore: 152.1, actualPct: -2.3, expectedPct: 9.4 },
  { date: "2026-02-25", time: "AMC", quarter: "Q4 FY26", priceBefore: 145.0, actualPct: 6.2, expectedPct: 10.1 },
  { date: "2026-05-27", time: "AMC", quarter: "Q1 FY27", priceBefore: 125.8, actualPct: -1.8, expectedPct: 9.7 },
]);

const MSFT_HISTORY = mockHistory([
  { date: "2023-04-25", time: "AMC", quarter: "Q3 FY23", priceBefore: 284.5, actualPct: 7.2, expectedPct: 4.4 },
  { date: "2023-07-25", time: "AMC", quarter: "Q4 FY23", priceBefore: 345.2, actualPct: 3.8, expectedPct: 4.1 },
  { date: "2023-10-24", time: "AMC", quarter: "Q1 FY24", priceBefore: 331.5, actualPct: 3.7, expectedPct: 3.9 },
  { date: "2024-01-30", time: "AMC", quarter: "Q2 FY24", priceBefore: 395.2, actualPct: 2.7, expectedPct: 4.2 },
  { date: "2024-04-25", time: "AMC", quarter: "Q3 FY24", priceBefore: 420.2, actualPct: -2.5, expectedPct: 4.0 },
  { date: "2024-07-30", time: "AMC", quarter: "Q4 FY24", priceBefore: 446.5, actualPct: -3.3, expectedPct: 4.3 },
  { date: "2024-10-30", time: "AMC", quarter: "Q1 FY25", priceBefore: 436.0, actualPct: 0.7, expectedPct: 3.8 },
  { date: "2025-01-29", time: "AMC", quarter: "Q2 FY25", priceBefore: 415.5, actualPct: -5.9, expectedPct: 4.5 },
  { date: "2025-04-30", time: "AMC", quarter: "Q3 FY25", priceBefore: 388.2, actualPct: 9.1, expectedPct: 5.1 },
  { date: "2025-07-29", time: "AMC", quarter: "Q4 FY25", priceBefore: 475.3, actualPct: 4.2, expectedPct: 4.4 },
  { date: "2025-10-29", time: "AMC", quarter: "Q1 FY26", priceBefore: 451.0, actualPct: -1.1, expectedPct: 4.0 },
  { date: "2026-01-28", time: "AMC", quarter: "Q2 FY26", priceBefore: 423.8, actualPct: 3.6, expectedPct: 4.2 },
  { date: "2026-04-29", time: "AMC", quarter: "Q3 FY26", priceBefore: 452.1, actualPct: 1.8, expectedPct: 4.1 },
]);

const MOCK_DB: Record<string, EarningsHistoryEntry[]> = {
  GOOG: GOOG_HISTORY,
  GOOGL: GOOG_HISTORY,
  AAPL: AAPL_HISTORY,
  NVDA: NVDA_HISTORY,
  MSFT: MSFT_HISTORY,
};

function buildSummary(history: EarningsHistoryEntry[]) {
  const last = history[history.length - 1];
  const overestimated = history.filter(
    (h) => h.expectedMovePercent > Math.abs(h.actualMovePercent)
  ).length;
  const avgExpected =
    history.reduce((sum, h) => sum + h.expectedMovePercent, 0) / history.length;
  const avgActualAbs =
    history.reduce((sum, h) => sum + Math.abs(h.actualMovePercent), 0) / history.length;
  return {
    lastEarningsDate: last.earningsDate,
    lastExpectedMove: last.expectedMovePercent,
    lastActualMove: last.actualMovePercent,
    overestimatedCount: overestimated,
    totalQuarters: history.length,
    avgExpectedMove: parseFloat(avgExpected.toFixed(1)),
    avgActualAbsMove: parseFloat(avgActualAbs.toFixed(1)),
  };
}

function buildStrategies(history: EarningsHistoryEntry[]) {
  const strategies = [
    { key: "long_straddle" as const, label: "Long Straddle" },
    { key: "long_strangle" as const, label: "Long Strangle" },
    { key: "credit_iron_butterfly" as const, label: "Credit Iron Butterfly" },
    { key: "credit_iron_condor" as const, label: "Credit Iron Condor" },
  ];

  return strategies.map(({ key, label }) => {
    const trades = history.map((h) => {
      const expected = h.expectedMovePercent;
      const actual = Math.abs(h.actualMovePercent);
      let returnPercent: number;
      let won: boolean;

      if (key === "long_straddle") {
        won = actual > expected;
        returnPercent = won ? ((actual - expected) / expected) * 100 : -80;
      } else if (key === "long_strangle") {
        const entryPct = expected * 0.4;
        won = actual > expected + entryPct;
        returnPercent = won ? ((actual - expected - entryPct) / entryPct) * 100 : -90;
      } else if (key === "credit_iron_butterfly") {
        won = actual < expected;
        returnPercent = won ? 45 : -55;
      } else {
        won = actual < expected * 0.68;
        returnPercent = won ? 30 : -70;
      }

      return {
        earningsDate: h.earningsDate.date,
        entryDebit: h.atmCallPrice != null && h.atmPutPrice != null
          ? parseFloat((h.atmCallPrice + h.atmPutPrice).toFixed(2))
          : null,
        exitValue: null,
        returnPercent: parseFloat(returnPercent.toFixed(1)),
        won,
      };
    });

    const validTrades = trades.filter((t) => t.returnPercent != null);
    const avgReturn =
      validTrades.reduce((sum, t) => sum + (t.returnPercent ?? 0), 0) / validTrades.length;
    const winRate = validTrades.filter((t) => t.won).length / validTrades.length;

    return {
      strategy: key,
      label,
      averageReturn: parseFloat(avgReturn.toFixed(0)),
      winRate: parseFloat(winRate.toFixed(2)),
      trades,
    };
  });
}

export function getMockResponse(ticker: string): EarningsApiResponse | null {
  const upper = ticker.toUpperCase();
  const history = MOCK_DB[upper];
  if (!history) return null;

  return {
    ticker: upper,
    summary: buildSummary(history),
    strategies: buildStrategies(history),
    history,
    cachedAt: new Date().toISOString(),
    dataMode: "mock",
  };
}

export const SUPPORTED_MOCK_TICKERS = Object.keys(MOCK_DB);
