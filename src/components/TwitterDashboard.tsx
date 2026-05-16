"use client";

import { useState } from "react";
import { CURATED_ACCOUNTS } from "@/data/twitter-accounts";
import type { TwitterAccountAnalysis, TickerMention, TickerInfo } from "@/types";

type Range = "3m" | "6m";
type Tab = "account" | "ticker";

const SENTIMENT_STYLE: Record<string, string> = {
  bullish: "bg-green-100 text-green-800 border-green-200",
  bearish: "bg-red-100 text-red-800 border-red-200",
  neutral: "bg-gray-100 text-gray-600 border-gray-200",
};

const SIGNAL_STYLE: Record<string, string> = {
  buy: "bg-green-600 text-white",
  sell: "bg-red-600 text-white",
  hold: "bg-yellow-100 text-yellow-800",
};

function ReturnBadge({ label, value }: { label: string; value: number }) {
  const color = value > 0 ? "text-green-600" : value < 0 ? "text-red-500" : "text-gray-400";
  return (
    <span>
      <span className="text-gray-400">{label} </span>
      <span className={color}>{value > 0 ? "+" : ""}{value.toFixed(1)}%</span>
    </span>
  );
}

function TickerCard({ mention, info }: { mention: TickerMention; info?: TickerInfo }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-bold text-gray-900 text-sm">${mention.ticker}</span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded border font-medium ${SENTIMENT_STYLE[mention.sentiment]}`}
        >
          {mention.sentiment}
        </span>
        {mention.signal && mention.signal !== "hold" && (
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${SIGNAL_STYLE[mention.signal]}`}>
            {mention.signal.toUpperCase()}
          </span>
        )}
        <span className="text-xs text-gray-400 ml-auto">{mention.mentionCount} mention{mention.mentionCount !== 1 ? "s" : ""}</span>
      </div>
      {info && (
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="font-medium text-gray-800">${info.price.toFixed(2)}</span>
          <ReturnBadge label="1D" value={info.change1D} />
          <ReturnBadge label="3M" value={info.return3M} />
          <ReturnBadge label="1Y" value={info.return1Y} />
          <a
            href={info.tvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-blue-500 hover:underline text-xs"
          >
            Chart →
          </a>
        </div>
      )}
      {mention.keyQuotes.slice(0, 2).map((q, i) => (
        <p key={i} className="text-xs text-gray-600 italic border-l-2 border-gray-200 pl-2">
          &ldquo;{q}&rdquo;
        </p>
      ))}
    </div>
  );
}

function AccountPanel({
  analysis,
  loading,
  error,
  tickerInfo,
}: {
  analysis: TwitterAccountAnalysis | undefined;
  loading: boolean;
  error: string | undefined;
  tickerInfo: Record<string, TickerInfo>;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-64 bg-gray-100 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }
  if (error) {
    return <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>;
  }
  if (!analysis) {
    return <p className="text-xs text-gray-400 mt-8 text-center">Select an account to view analysis</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-gray-900">@{analysis.username}</h2>
          <span className="text-xs text-gray-400">
            {analysis.postCount} posts · {analysis.analyzedRange.from} → {analysis.analyzedRange.to}
          </span>
          {analysis.dataMode === "mock" && (
            <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 rounded px-1.5 py-0.5">
              Mock
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-1">{analysis.summary}</p>
      </div>

      {analysis.tickers.length === 0 ? (
        <p className="text-xs text-gray-400">No stock mentions found in this period.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Stocks mentioned ({analysis.tickers.length})
          </p>
          {analysis.tickers
            .filter((t, i, arr) => arr.findIndex((x) => x.ticker === t.ticker) === i)
            .map((t) => (
              <TickerCard key={t.ticker} mention={t} info={tickerInfo[t.ticker]} />
            ))}
        </div>
      )}
    </div>
  );
}

function TickerPanel({
  analyses,
  selectedTicker,
  onTickerChange,
}: {
  analyses: Record<string, TwitterAccountAnalysis>;
  selectedTicker: string;
  onTickerChange: (t: string) => void;
}) {
  // Collect all tickers seen across all analyses
  const allTickers = Array.from(
    new Set(
      Object.values(analyses).flatMap((a) => a.tickers.map((t) => t.ticker))
    )
  ).sort();

  const filtered = selectedTicker.trim().toUpperCase();

  // For each loaded account, find mentions of this ticker
  const rows = Object.values(analyses)
    .map((a) => ({
      analysis: a,
      mention: a.tickers.find((t) => t.ticker === filtered),
    }))
    .filter((r) => r.mention !== undefined);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={selectedTicker}
          onChange={(e) => onTickerChange(e.target.value.toUpperCase())}
          placeholder="Enter ticker (e.g. TSLA)"
          className="text-sm border border-gray-300 rounded px-2 py-1 w-36 font-mono focus:outline-none focus:ring-1 focus:ring-gray-400"
          maxLength={6}
        />
        {allTickers.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTickers.slice(0, 12).map((t) => (
              <button
                key={t}
                onClick={() => onTickerChange(t)}
                className={`text-xs px-1.5 py-0.5 rounded border ${
                  filtered === t
                    ? "bg-gray-800 text-white border-gray-800"
                    : "border-gray-300 text-gray-600 hover:border-gray-500"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length < 1 ? (
        <p className="text-xs text-gray-400">Enter a ticker symbol to see cross-account sentiment.</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-gray-400">
          {Object.keys(analyses).length === 0
            ? "Analyze some accounts first using the sidebar, then search by ticker."
            : `No loaded accounts mentioned ${filtered}.`}
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            ${filtered} — {rows.length} account{rows.length !== 1 ? "s" : ""} mentioning it
          </p>
          {rows.map(({ analysis, mention }) => (
            <div key={analysis.username} className="border border-gray-200 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-800">@{analysis.username}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${SENTIMENT_STYLE[mention!.sentiment]}`}>
                  {mention!.sentiment}
                </span>
                {mention!.signal && mention!.signal !== "hold" && (
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${SIGNAL_STYLE[mention!.signal]}`}>
                    {mention!.signal.toUpperCase()}
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-auto">{mention!.mentionCount} mention{mention!.mentionCount !== 1 ? "s" : ""}</span>
              </div>
              {mention!.keyQuotes[0] && (
                <p className="text-xs text-gray-600 italic border-l-2 border-gray-200 pl-2">
                  &ldquo;{mention!.keyQuotes[0]}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TwitterDashboard() {
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("3m");
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [selectedTicker, setSelectedTicker] = useState("");
  const [customAccounts, setCustomAccounts] = useState<string[]>([]);
  const [addInput, setAddInput] = useState("");
  const [analyses, setAnalyses] = useState<Record<string, TwitterAccountAnalysis>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tickerInfo, setTickerInfo] = useState<Record<string, TickerInfo>>({});

  const allAccounts = [
    ...CURATED_ACCOUNTS,
    ...customAccounts.map((u) => ({ username: u, displayName: `@${u}`, description: "Custom" })),
  ];

  async function loadAccount(username: string) {
    const key = `${username}:${range}`;
    if (analyses[key] || loading[key]) return;

    setLoading((l) => ({ ...l, [key]: true }));
    setErrors((e) => ({ ...e, [key]: "" }));

    try {
      const res = await fetch(`/api/twitter/${encodeURIComponent(username)}?range=${range}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      const analysis = json as TwitterAccountAnalysis;
      setAnalyses((a) => ({ ...a, [key]: analysis }));

      // Non-blocking: fetch price/returns for all tickers in the analysis
      const symbols = [...new Set(analysis.tickers.map((t) => t.ticker))];
      if (symbols.length > 0) {
        fetch(`/api/ticker-info?symbols=${symbols.join(",")}`)
          .then((r) => {
            if (!r.ok) return;
            return r.json();
          })
          .then((data?: Record<string, TickerInfo>) => {
            if (data) setTickerInfo((prev) => ({ ...prev, ...data }));
          })
          .catch(() => {});
      }
    } catch (err) {
      setErrors((e) => ({
        ...e,
        [key]: err instanceof Error ? err.message : "Failed to load",
      }));
    } finally {
      setLoading((l) => ({ ...l, [key]: false }));
    }
  }

  function selectAccount(username: string) {
    setSelectedUsername(username);
    loadAccount(username);
  }

  function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    const handle = addInput.trim().toLowerCase().replace(/^@/, "");
    if (!handle || allAccounts.some((a) => a.username === handle)) {
      setAddInput("");
      return;
    }
    setCustomAccounts((c) => [...c, handle]);
    setAddInput("");
    selectAccount(handle);
  }

  const currentKey = selectedUsername ? `${selectedUsername}:${range}` : null;
  const currentAnalysis = currentKey ? analyses[currentKey] : undefined;
  const currentLoading = currentKey ? !!loading[currentKey] : false;
  const currentError = currentKey ? errors[currentKey] : undefined;

  // All analyses for the current range (for ticker tab)
  const rangeAnalyses = Object.fromEntries(
    Object.entries(analyses)
      .filter(([k]) => k.endsWith(`:${range}`))
      .map(([k, v]) => [k.replace(`:${range}`, ""), v])
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Twitter Intelligence</h1>
          <p className="text-xs text-gray-500">Stock recommendations extracted from finance accounts</p>
        </div>
        <div className="flex gap-1">
          {(["3m", "6m"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-xs px-3 py-1 rounded ${
                range === r
                  ? "bg-gray-800 text-white"
                  : "bg-white border border-gray-300 text-gray-600 hover:border-gray-500"
              }`}
            >
              {r === "3m" ? "3 Months" : "6 Months"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-44 flex-shrink-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Tracked Accounts
          </p>
          <div className="space-y-0.5">
            {allAccounts.map((a) => {
              const key = `${a.username}:${range}`;
              const isSelected = selectedUsername === a.username;
              const isLoaded = !!analyses[key];
              return (
                <button
                  key={a.username}
                  onClick={() => selectAccount(a.username)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors ${
                    isSelected
                      ? "bg-gray-800 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title={a.description}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isLoaded ? "bg-green-500" : isSelected ? "bg-white/50" : "bg-gray-300"
                    }`}
                  />
                  <span className="truncate">@{a.username}</span>
                </button>
              );
            })}
          </div>

          {/* Add account */}
          <form onSubmit={handleAddAccount} className="mt-3">
            <div className="flex gap-1">
              <input
                value={addInput}
                onChange={(e) => setAddInput(e.target.value)}
                placeholder="@username"
                className="text-xs border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-gray-400"
                maxLength={50}
              />
              <button
                type="submit"
                className="text-xs px-2 py-1 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 flex-shrink-0"
              >
                +
              </button>
            </div>
          </form>
        </div>

        {/* Main panel */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-gray-200 pb-2">
            {([
              ["account", "By Account"],
              ["ticker", "By Ticker"],
            ] as [Tab, string][]).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs px-3 py-1 rounded-t font-medium transition-colors ${
                  activeTab === tab
                    ? "text-gray-900 border-b-2 border-gray-800 -mb-2"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "account" ? (
            <AccountPanel
              analysis={currentAnalysis}
              loading={currentLoading}
              error={currentError || undefined}
              tickerInfo={tickerInfo}
            />
          ) : (
            <TickerPanel
              analyses={rangeAnalyses}
              selectedTicker={selectedTicker}
              onTickerChange={setSelectedTicker}
            />
          )}
        </div>
      </div>
    </div>
  );
}
