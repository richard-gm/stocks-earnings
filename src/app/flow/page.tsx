"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FlowTable } from "@/components/FlowTable";
import type { FlowSummary } from "@/lib/calculations/unusualFlow";

interface FlowApiResponse extends FlowSummary {
  ticker: string;
  dataAsOf: string;
  dataMode: "end_of_day";
}

function PutCallBadge({ ratio }: { ratio: number }) {
  const bearish = ratio > 1;
  const neutral = ratio >= 0.7 && ratio <= 1;
  const className = bearish
    ? "bg-red-100 text-red-800 border-red-300"
    : neutral
    ? "bg-gray-100 text-gray-700 border-gray-300"
    : "bg-green-100 text-green-700 border-green-300";
  const label = bearish ? "Bearish skew" : neutral ? "Neutral" : "Bullish skew";
  return (
    <span className={`text-xs border rounded px-2 py-0.5 font-medium ${className}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default function FlowPage() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState(searchParams.get("ticker") ?? "");
  const [data, setData] = useState<FlowApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get("ticker");
    if (t) search(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = useCallback(async (ticker: string) => {
    const symbol = ticker.trim().toUpperCase();
    if (!symbol) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/flow/${encodeURIComponent(symbol)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Unknown error");
      setData(json as FlowApiResponse);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Unusual Options Flow</h1>
        <p className="text-sm text-gray-500 mt-1">
          End-of-day options data — detects whale positioning, high volume/OI contracts, and sweep candidates.
        </p>
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => { e.preventDefault(); search(input); }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="Enter ticker (e.g. AAPL)"
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Analyze"}
        </button>
      </form>

      {error && (
        <div className={`text-sm rounded-lg px-4 py-3 border ${error.includes("paid plan") ? "bg-yellow-50 border-yellow-200 text-yellow-800" : "bg-red-50 border-red-200 text-red-700"}`}>
          {error.includes("paid plan") ? "⚠️ " : ""}{error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">{data.ticker}</h2>
            <PutCallBadge ratio={data.putCallRatio} />
            <span className="text-xs text-gray-400">EOD · {data.dataAsOf}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Put/Call Ratio" value={data.putCallRatio.toFixed(2)} />
            <StatCard label="Total Call Volume" value={data.totalCallVolume.toLocaleString()} />
            <StatCard label="Total Put Volume" value={data.totalPutVolume.toLocaleString()} />
            <StatCard label="Unusual Contracts" value={String(data.unusualContracts.length)} />
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Flagged Contracts ({data.unusualContracts.length})
            </h3>
            <FlowTable contracts={data.unusualContracts} />
          </div>
        </div>
      )}
    </div>
  );
}
