"use client";

import { useState } from "react";
import { EarningsDashboard } from "./EarningsDashboard";

export function EarningsSection({ ticker }: { ticker: string }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 border-b text-left"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <span
          className="font-semibold text-sm uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Earnings History &amp; Strategy Backtest
        </span>
        <span
          className="text-xs font-bold transition-transform duration-200"
          style={{
            color: "var(--text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            display: "inline-block",
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="px-5 py-4" style={{ backgroundColor: "var(--bg)" }}>
          <EarningsDashboard ticker={ticker} />
        </div>
      )}
    </section>
  );
}
