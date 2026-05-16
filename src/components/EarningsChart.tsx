"use client";

import {
  ComposedChart,
  Bar,
  Cell,
  ErrorBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { EarningsHistoryEntry } from "@/types";

interface ChartEntry {
  label: string;
  actualMovePercent: number;
  expectedMoveRange: number;
  fill: string;
}

function formatLabel(entry: EarningsHistoryEntry) {
  const d = entry.earningsDate.date;
  const t = entry.earningsDate.time !== "unknown" ? ` ${entry.earningsDate.time}` : "";
  return `${d}${t}`;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartEntry; value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-300 rounded p-3 text-xs shadow">
      <p className="font-semibold mb-1">{label}</p>
      <p>
        Actual:{" "}
        <span className={d.actualMovePercent >= 0 ? "text-green-700" : "text-red-600"}>
          {d.actualMovePercent >= 0 ? "+" : ""}
          {d.actualMovePercent.toFixed(2)}%
        </span>
      </p>
      <p className="text-blue-600">
        Expected: ±{d.expectedMoveRange.toFixed(2)}%
      </p>
    </div>
  );
};

const renderLegend = () => (
  <div className="flex items-center gap-6 text-xs mt-2 justify-end pr-4">
    <span className="flex items-center gap-1">
      <span className="inline-block w-3 h-3 bg-blue-500" />
      Market Implied Earnings Range +/−
    </span>
    <span className="flex items-center gap-1">
      <span className="inline-block w-3 h-3 bg-green-500" />
      Positive Actual Earnings Move
    </span>
    <span className="flex items-center gap-1">
      <span className="inline-block w-3 h-3 bg-red-400" />
      Negative Actual Earnings Move
    </span>
  </div>
);

export function EarningsChart({
  ticker,
  history,
}: {
  ticker: string;
  history: EarningsHistoryEntry[];
}) {
  const data: ChartEntry[] = history.map((h) => ({
    label: formatLabel(h),
    actualMovePercent: h.actualMovePercent,
    expectedMoveRange: h.expectedMovePercent,
    fill: h.actualMovePercent >= 0 ? "#22c55e" : "#f87171",
  }));

  return (
    <div className="border border-gray-300 rounded p-4">
      <h2 className="text-sm font-semibold text-gray-800 mb-0.5">
        Expected Earnings Move vs. Actual Earnings Move
      </h2>
      <p className="text-xs text-gray-500 mb-2">Last {history.length} Earnings Dates</p>
      {renderLegend()}
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 20, bottom: 60, left: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            angle={-35}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 10, fill: "#6b7280" }}
            label={{
              value: "Earnings Date",
              position: "insideBottom",
              offset: -10,
              fontSize: 11,
              fill: "#6b7280",
            }}
          />
          <YAxis
            tickFormatter={(v: number) => `${v.toFixed(1)}%`}
            tick={{ fontSize: 10, fill: "#6b7280" }}
            label={{
              value: "Percentage Change",
              angle: -90,
              position: "insideLeft",
              offset: -10,
              fontSize: 11,
              fill: "#6b7280",
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} />
          <Bar dataKey="actualMovePercent" maxBarSize={40}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
            <ErrorBar
              dataKey="expectedMoveRange"
              direction="y"
              width={8}
              strokeWidth={2}
              stroke="#3b82f6"
            />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
