"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EarningsApiResponse } from "@/types";
import { StrategyTable } from "./StrategyTable";
import { PostEarningsPanel } from "./PostEarningsPanel";
import { EarningsChart } from "./EarningsChart";
import { OpenInterestChart } from "./OpenInterestChart";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { ErrorBanner } from "./ErrorBanner";

interface FlowSnippet {
  putCallRatio: number;
  totalCallVolume: number;
  totalPutVolume: number;
  unusualContracts: { signals: string[] }[];
}

export function EarningsDashboard({ ticker }: { ticker: string }) {
  const [data, setData] = useState<EarningsApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [flow, setFlow] = useState<FlowSnippet | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    setFlow(null);

    fetch(`/api/earnings/${encodeURIComponent(ticker)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Unknown error");
        return json as EarningsApiResponse;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));

    fetch(`/api/flow/${encodeURIComponent(ticker)}`)
      .then(async (res) => { if (res.ok) setFlow(await res.json()); })
      .catch(() => {});
  }, [ticker]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorBanner message={error} />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">
          About {data.ticker} Last Earnings Move
        </h1>
        {data.dataMode === "mock" && (
          <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 rounded px-2 py-0.5">
            Mock Data
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StrategyTable ticker={data.ticker} strategies={data.strategies} />
        <PostEarningsPanel ticker={data.ticker} summary={data.summary} />
      </div>
      <EarningsChart ticker={data.ticker} history={data.history} />
      <OpenInterestChart ticker={data.ticker} />

      {flow && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Unusual Options Activity</h2>
            <Link
              href={`/flow?ticker=${data.ticker}`}
              className="text-xs text-blue-600 hover:underline"
            >
              View full flow →
            </Link>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-gray-500 text-xs">Put/Call Ratio</span>
              <p className="font-bold text-gray-900">{flow.putCallRatio.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Call Volume</span>
              <p className="font-bold text-green-700">{flow.totalCallVolume.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Put Volume</span>
              <p className="font-bold text-red-700">{flow.totalPutVolume.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Unusual Contracts</span>
              <p className="font-bold text-purple-700">{flow.unusualContracts.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
