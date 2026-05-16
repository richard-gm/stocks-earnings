"use client";

import type { StrategyResult } from "@/types";

const STRATEGY_LINKS: Record<string, string> = {
  long_straddle: "https://www.tastytrade.com/learn/trading-options/straddle",
  long_strangle: "https://www.tastytrade.com/learn/trading-options/strangle",
  credit_iron_butterfly: "https://www.tastytrade.com/learn/trading-options/iron-butterfly",
  credit_iron_condor: "https://www.tastytrade.com/learn/trading-options/iron-condor",
};

function colorReturn(val: number) {
  if (val > 0) return "text-green-700 font-semibold";
  return "text-red-600 font-semibold";
}

export function StrategyTable({
  ticker,
  strategies,
}: {
  ticker: string;
  strategies: StrategyResult[];
}) {
  return (
    <div className="border border-gray-400 rounded p-4">
      <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide border-b border-gray-300 pb-1">
        {ticker} Earnings Option Strategy
      </p>
      <p className="text-xs text-gray-600 mb-3">
        See How Non-Directional Option Strategies Have Performed Around Earnings
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-1 font-semibold text-gray-700">Strategy</th>
            <th className="text-right py-1 font-semibold text-gray-700">Average Return</th>
            <th className="text-right py-1 font-semibold text-gray-700">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {strategies.map((s) => (
            <tr key={s.strategy} className="border-b border-gray-100 last:border-0">
              <td className="py-1.5">
                <a
                  href={STRATEGY_LINKS[s.strategy]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {s.label}
                </a>
              </td>
              <td className={`text-right py-1.5 ${colorReturn(s.averageReturn)}`}>
                {s.averageReturn > 0 ? "+" : ""}
                {s.averageReturn}%
              </td>
              <td className="text-right py-1.5 text-gray-700">
                {Math.round(s.winRate * 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 text-center">
        <a href="#" className="text-blue-600 text-xs hover:underline">
          See More Option Strategies Around Earnings
        </a>
      </div>
    </div>
  );
}
