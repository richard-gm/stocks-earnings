import type { EarningsHistoryEntry, StrategyResult, StrategyTrade } from "@/types";

function computeStraddle(entry: EarningsHistoryEntry): StrategyTrade {
  const expected = entry.expectedMovePercent;
  const actual = Math.abs(entry.actualMovePercent);
  const entryDebit =
    entry.atmCallPrice != null && entry.atmPutPrice != null
      ? parseFloat((entry.atmCallPrice + entry.atmPutPrice).toFixed(2))
      : null;

  const won = actual > expected;
  const returnPercent = won
    ? parseFloat((((actual - expected) / expected) * 100).toFixed(1))
    : -80;

  return { earningsDate: entry.earningsDate.date, entryDebit, exitValue: null, returnPercent, won };
}

function computeStrangle(entry: EarningsHistoryEntry): StrategyTrade {
  const expected = entry.expectedMovePercent;
  const actual = Math.abs(entry.actualMovePercent);
  const straddle =
    entry.atmCallPrice != null && entry.atmPutPrice != null
      ? entry.atmCallPrice + entry.atmPutPrice
      : null;
  const entryDebit = straddle != null ? parseFloat((straddle * 0.4).toFixed(2)) : null;

  const breakeven = expected * 1.4;
  const won = actual > breakeven;
  const returnPercent = entryDebit != null && won
    ? parseFloat((((actual - breakeven) / (expected * 0.4)) * 100).toFixed(1))
    : won ? 50 : -90;

  return { earningsDate: entry.earningsDate.date, entryDebit, exitValue: null, returnPercent, won };
}

function computeIronButterfly(entry: EarningsHistoryEntry): StrategyTrade {
  const actual = Math.abs(entry.actualMovePercent);
  const expected = entry.expectedMovePercent;
  const won = actual < expected;
  const returnPercent = won ? 45 : -55;
  return {
    earningsDate: entry.earningsDate.date,
    entryDebit: null,
    exitValue: null,
    returnPercent,
    won,
  };
}

function computeIronCondor(entry: EarningsHistoryEntry): StrategyTrade {
  const actual = Math.abs(entry.actualMovePercent);
  const expected = entry.expectedMovePercent;
  const won = actual < expected * 0.68;
  const returnPercent = won ? 30 : -70;
  return {
    earningsDate: entry.earningsDate.date,
    entryDebit: null,
    exitValue: null,
    returnPercent,
    won,
  };
}

function aggregate(
  strategy: StrategyResult["strategy"],
  label: string,
  trades: StrategyTrade[]
): StrategyResult {
  const valid = trades.filter((t) => t.returnPercent != null);
  const avgReturn =
    valid.reduce((s, t) => s + (t.returnPercent ?? 0), 0) / valid.length;
  const winRate = valid.filter((t) => t.won).length / valid.length;
  return {
    strategy,
    label,
    averageReturn: parseFloat(avgReturn.toFixed(0)),
    winRate: parseFloat(winRate.toFixed(2)),
    trades,
  };
}

export function computeAllStrategies(history: EarningsHistoryEntry[]): StrategyResult[] {
  return [
    aggregate("long_straddle", "Long Straddle", history.map(computeStraddle)),
    aggregate("long_strangle", "Long Strangle", history.map(computeStrangle)),
    aggregate("credit_iron_butterfly", "Credit Iron Butterfly", history.map(computeIronButterfly)),
    aggregate("credit_iron_condor", "Credit Iron Condor", history.map(computeIronCondor)),
  ];
}
