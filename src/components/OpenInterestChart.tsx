"use client";

import { useEffect, useState } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { OpenInterestApiResponse, OIDataPoint } from "@/types";

type Range = "6M" | "1Y";

const RANGE_DAYS: Record<Range, number> = {
  "6M": 126,
  "1Y": 252,
};

function filterByRange(data: OIDataPoint[], range: Range): OIDataPoint[] {
  return data.slice(-RANGE_DAYS[range]);
}

interface TooltipItem {
  name: string;
  value: number;
  color: string;
}

interface PanelTooltipProps {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
}

const PCTooltip = ({ active, payload, label }: PanelTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded p-2 text-xs shadow space-y-0.5">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value?.toFixed(3)}
        </p>
      ))}
    </div>
  );
};

const OITooltip = ({ active, payload, label }: PanelTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded p-2 text-xs shadow space-y-0.5">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {(p.value / 1_000).toFixed(1)}K
        </p>
      ))}
    </div>
  );
};

const PriceTooltip = ({ active, payload, label }: PanelTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded p-2 text-xs shadow space-y-0.5">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: ${p.value?.toFixed(2)}
        </p>
      ))}
    </div>
  );
};

export function OpenInterestChart({ ticker }: { ticker: string }) {
  const [oiData, setOiData] = useState<OpenInterestApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("1Y");

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/oi/${encodeURIComponent(ticker)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load OI data");
        return json as OpenInterestApiResponse;
      })
      .then(setOiData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="border border-gray-300 rounded p-4">
        <div className="h-4 w-56 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-[120px] bg-gray-100 rounded animate-pulse mb-1" />
        <div className="h-[250px] bg-gray-100 rounded animate-pulse mb-1" />
        <div className="h-[160px] bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-gray-200 rounded p-4 text-xs text-gray-500">
        Open Interest unavailable: {error}
      </div>
    );
  }

  if (!oiData) return null;

  const filteredData = filterByRange(oiData.data, range);
  const crossoversInView = oiData.crossovers.filter((c) =>
    filteredData.some((d) => d.date === c.date)
  );
  const latestCrossover = oiData.crossovers.at(-1) ?? null;
  const tickInterval = Math.max(1, Math.floor(filteredData.length / 8));

  const sharedMarginLeft = 60;
  const sharedMarginRight = 16;

  return (
    <div className="border border-gray-300 rounded p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-800">
              Options Open Interest History
            </h2>
            {oiData.dataMode === "mock" && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 border border-gray-300 text-gray-500 rounded">
                Mock Data
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Historical OI for {ticker} — Call vs Put open interest, P/C ratio, and underlying price
          </p>
        </div>
        {/* Range buttons */}
        <div className="flex gap-1">
          {(["6M", "1Y"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-xs px-2 py-0.5 rounded ${
                range === r
                  ? "bg-gray-800 text-white"
                  : "bg-white border border-gray-300 text-gray-600 hover:border-gray-500"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 mb-1 text-xs">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-cyan-400" />
          <span className="text-gray-600">
            OI P/C Ratio: {filteredData.at(-1)?.pcRatio?.toFixed(2) ?? "—"}
          </span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-green-500" />
          <span className="text-gray-600">
            Call OI: {filteredData.at(-1) ? `${((filteredData.at(-1)!.callOI) / 1000).toFixed(1)}K` : "—"}
          </span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-red-500" />
          <span className="text-gray-600">
            Put OI: {filteredData.at(-1) ? `${((filteredData.at(-1)!.putOI) / 1000).toFixed(1)}K` : "—"}
          </span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-gray-400" />
          <span className="text-gray-600">
            Price: {filteredData.at(-1)?.stockPrice
              ? `$${filteredData.at(-1)!.stockPrice.toFixed(2)}`
              : "—"}
          </span>
        </span>
      </div>

      {/* Panel 1 — P/C Ratio */}
      <ResponsiveContainer width="100%" height={120}>
        <ComposedChart
          data={filteredData}
          syncId="oi-chart"
          syncMethod="value"
          margin={{ top: 8, right: sharedMarginRight, bottom: 0, left: sharedMarginLeft }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="date" hide />
          <YAxis
            orientation="left"
            width={55}
            tickFormatter={(v: number) => v.toFixed(2)}
            tick={{ fontSize: 9, fill: "#22d3ee" }}
          />
          <Tooltip content={<PCTooltip />} />
          <ReferenceLine y={1} stroke="#9ca3af" strokeDasharray="4 2" />
          <Line
            dataKey="pcRatio"
            name="P/C Ratio"
            stroke="#22d3ee"
            dot={false}
            strokeWidth={1.5}
            connectNulls={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Panel 2 — Call OI + Put OI */}
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart
          data={filteredData}
          syncId="oi-chart"
          syncMethod="value"
          margin={{ top: 4, right: sharedMarginRight, bottom: 0, left: sharedMarginLeft }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="date" hide />
          <YAxis
            orientation="left"
            width={55}
            tickFormatter={(v: number) => `${(v / 1_000).toFixed(0)}K`}
            tick={{ fontSize: 9, fill: "#6b7280" }}
          />
          <Tooltip content={<OITooltip />} />
          {crossoversInView.map((c) => (
            <ReferenceLine
              key={c.date}
              x={c.date}
              stroke={c.direction === "puts_lead" ? "#dc2626" : "#16a34a"}
              strokeDasharray="5 3"
              strokeWidth={1.5}
            />
          ))}
          <Line
            dataKey="callOI"
            name="Call OI"
            stroke="#22c55e"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Line
            dataKey="putOI"
            name="Put OI"
            stroke="#ef4444"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Panel 3 — Stock Price */}
      <ResponsiveContainer width="100%" height={160}>
        <ComposedChart
          data={filteredData}
          syncId="oi-chart"
          syncMethod="value"
          margin={{ top: 4, right: sharedMarginRight, bottom: 40, left: sharedMarginLeft }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "#9ca3af" }}
            interval={tickInterval}
            angle={-25}
            textAnchor="end"
            height={40}
            tickFormatter={(d: string) => d.slice(5)}
          />
          <YAxis
            orientation="left"
            width={55}
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
            tick={{ fontSize: 9, fill: "#9ca3af" }}
          />
          <Tooltip content={<PriceTooltip />} />
          <Line
            dataKey="stockPrice"
            name="Stock Price"
            stroke="#9ca3af"
            dot={false}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Signal banners */}
      {latestCrossover?.direction === "puts_lead" && (
        <div className="mt-2 border border-red-300 bg-red-50 rounded px-3 py-2 text-xs text-red-800 flex flex-wrap gap-1.5">
          <span className="font-semibold">Bearish Signal:</span>
          <span>
            Put OI overtook Call OI on <strong>{latestCrossover.date}</strong>.
            Increased hedging detected — consider short strategies.
          </span>
        </div>
      )}
      {latestCrossover?.direction === "calls_lead" && (
        <div className="mt-2 border border-green-300 bg-green-50 rounded px-3 py-2 text-xs text-green-800 flex flex-wrap gap-1.5">
          <span className="font-semibold">Bullish Reversal:</span>
          <span>
            Call OI retook the lead on <strong>{latestCrossover.date}</strong>.
            Sentiment shifted bullish — buying options suggested.
          </span>
        </div>
      )}
    </div>
  );
}
