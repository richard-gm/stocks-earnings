"use client";

import type { PostEarningsSummary } from "@/types";

function Bold({ children }: { children: React.ReactNode }) {
  return <span className="font-bold">{children}</span>;
}

function ColorBold({ value, children }: { value: number; children: React.ReactNode }) {
  const color = value >= 0 ? "text-green-700" : "text-red-600";
  return <span className={`font-bold ${color}`}>{children}</span>;
}

export function PostEarningsPanel({
  ticker,
  summary,
}: {
  ticker: string;
  summary: PostEarningsSummary;
}) {
  const { lastEarningsDate, lastExpectedMove, lastActualMove, overestimatedCount, totalQuarters, avgExpectedMove, avgActualAbsMove } = summary;
  const overestimatedPct = Math.round((overestimatedCount / totalQuarters) * 100);
  const sign = (n: number) => (n >= 0 ? "+" : "");

  return (
    <div className="border border-gray-400 rounded p-4">
      <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide border-b border-gray-300 pb-1">
        {ticker} Post Earnings Movement
      </p>
      <p className="text-sm text-gray-800 leading-relaxed">
        {ticker} last reported earnings on{" "}
        <Bold>
          {lastEarningsDate.date}{" "}
          {lastEarningsDate.time !== "unknown" ? lastEarningsDate.time : ""}
        </Bold>
        .
        <br />
        The options prices predicted a{" "}
        <Bold>±{lastExpectedMove.toFixed(1)}%</Bold> post earnings move,
        compared to a{" "}
        <ColorBold value={lastActualMove}>
          {sign(lastActualMove)}{lastActualMove.toFixed(1)}%
        </ColorBold>{" "}
        actual move. The options market{" "}
        <Bold>overestimated</Bold> {ticker} stocks earnings move{" "}
        <Bold>{overestimatedPct}%</Bold> of the time in the last{" "}
        <Bold>{totalQuarters}</Bold> quarters. The predicted move after
        earnings announcement was{" "}
        <Bold>±{avgExpectedMove.toFixed(1)}%</Bold> on average vs an
        average of the actual earnings moves of{" "}
        <Bold>{avgActualAbsMove.toFixed(1)}%</Bold> (in absolute terms).
      </p>
    </div>
  );
}
