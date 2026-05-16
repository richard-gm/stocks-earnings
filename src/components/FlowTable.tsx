"use client";

import type { UnusualContract, FlowSignal } from "@/lib/calculations/unusualFlow";

const SIGNAL_LABELS: Record<FlowSignal, { label: string; className: string }> = {
  high_volume_oi: { label: "HIGH VOL/OI", className: "bg-orange-100 text-orange-800 border-orange-300" },
  large_premium: { label: "WHALE $$$", className: "bg-purple-100 text-purple-800 border-purple-300" },
  sweep_candidate: { label: "SWEEP?", className: "bg-blue-100 text-blue-800 border-blue-300" },
};

function formatPremium(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function FlowTable({ contracts }: { contracts: UnusualContract[] }) {
  if (contracts.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-6">
        No unusual options activity detected.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
            <th className="pb-2 pr-4">Type</th>
            <th className="pb-2 pr-4">Strike</th>
            <th className="pb-2 pr-4">Expiry</th>
            <th className="pb-2 pr-4 text-right">Volume</th>
            <th className="pb-2 pr-4 text-right">OI</th>
            <th className="pb-2 pr-4 text-right">Vol/OI</th>
            <th className="pb-2 pr-4 text-right">Est. Premium</th>
            <th className="pb-2 pr-4 text-right">IV</th>
            <th className="pb-2">Signals</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 pr-4">
                <span
                  className={`font-semibold ${c.contractType === "call" ? "text-green-700" : "text-red-700"}`}
                >
                  {c.contractType.toUpperCase()}
                </span>
              </td>
              <td className="py-2 pr-4">${c.strike.toFixed(2)}</td>
              <td className="py-2 pr-4 text-gray-600">{c.expiry}</td>
              <td className="py-2 pr-4 text-right">{c.volume.toLocaleString()}</td>
              <td className="py-2 pr-4 text-right">{c.openInterest.toLocaleString()}</td>
              <td className="py-2 pr-4 text-right font-mono">{c.volumeOiRatio}x</td>
              <td className="py-2 pr-4 text-right font-mono">{formatPremium(c.estimatedPremium)}</td>
              <td className="py-2 pr-4 text-right text-gray-600">
                {c.impliedVolatility != null ? `${(c.impliedVolatility * 100).toFixed(0)}%` : "—"}
              </td>
              <td className="py-2">
                <div className="flex flex-wrap gap-1">
                  {c.signals.map((s) => (
                    <span
                      key={s}
                      className={`text-xs border rounded px-1.5 py-0.5 font-medium ${SIGNAL_LABELS[s].className}`}
                    >
                      {SIGNAL_LABELS[s].label}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
