"use client";

import { useState } from "react";

type RunState = "idle" | "loading" | "queued" | "error";

interface RunAnalysisButtonProps {
  ticker?: string;
}

const LABELS: Record<RunState, string> = {
  idle: "Run Analysis",
  loading: "Triggering…",
  queued: "Running in background ✓ — refresh in a few minutes",
  error: "Failed — check Kronos container is running",
};

export default function RunAnalysisButton({ ticker }: RunAnalysisButtonProps) {
  const [state, setState] = useState<RunState>("idle");

  async function handleClick() {
    setState("loading");
    try {
      const endpoint = ticker ? "/api/kronos/stock" : "/api/kronos/portfolio";
      const body = ticker ? JSON.stringify({ ticker }) : undefined;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState("queued");
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 5000);
    }
  }

  const isDisabled = state === "loading" || state === "queued";

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-60"
      style={{
        borderColor: "var(--border)",
        color: state === "error" ? "var(--accent-red, #f87171)" : "var(--accent)",
        cursor: isDisabled ? "default" : "pointer",
      }}
      title={ticker ? `Run Kronos on ${ticker}` : "Score all portfolio tickers with Kronos AI"}
    >
      {LABELS[state]}
    </button>
  );
}
