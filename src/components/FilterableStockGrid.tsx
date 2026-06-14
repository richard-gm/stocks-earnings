"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StockSearch from "./StockSearch";
import KronosSignal from "./KronosSignal";
import { calculateUpside } from "@/lib/utils";
import type { StockAnalysis, Rating, CustomTicker } from "@/types";
import type { KronosScore } from "@/lib/kronos";

function RatingBadge({ rating }: { rating: Rating }) {
  const colors =
    rating === "BULLISH"
      ? "bg-green-500/15 text-green-400 border border-green-500/30"
      : rating === "BEARISH"
        ? "bg-red-500/15 text-red-400 border border-red-500/30"
        : "bg-amber-500/15 text-amber-400 border border-amber-500/30";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors}`}>
      {rating}
    </span>
  );
}

function AddTickerDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (ticker: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = value.trim().toUpperCase();
    if (!t) return;
    setLoading(true);
    setError("");
    try {
      await onAdd(t);
      onClose();
    } catch {
      setError("Failed to add ticker. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-xl border p-6 w-full max-w-sm flex flex-col gap-4"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <h2 className="text-lg font-bold">Track a Ticker</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="e.g. AAPL"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            className="rounded-lg border px-3 py-2 text-sm bg-transparent outline-none focus:border-blue-500"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-lg border"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !value.trim()}
              className="text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)", color: "#fff" }}
            >
              {loading ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function KronosOnlyCard({
  ticker,
  kronosScore,
  onRemove,
}: {
  ticker: string;
  kronosScore: KronosScore | null;
  onRemove: (ticker: string) => void;
}) {
  return (
    <article
      className="rounded-xl border p-6 flex flex-col gap-4"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--accent)" }}>
              {ticker}
            </span>
            <KronosSignal score={kronosScore} />
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>No full analysis — tracked via UI</p>
        </div>
        {kronosScore && (
          <div className="text-right shrink-0">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Last close</p>
            <p className="text-xl font-bold">${kronosScore.last_close.toFixed(2)}</p>
            <p className="text-xs font-medium" style={{ color: "var(--accent-green)" }}>
              → ${kronosScore.predicted_close.toFixed(2)} ({kronosScore.pred_days}d forecast)
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <span />
        <button
          onClick={() => onRemove(ticker)}
          className="text-xs px-3 py-1 rounded-lg border hover:border-red-500/60 hover:text-red-400 transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          Remove
        </button>
      </div>
    </article>
  );
}

interface StockCardProps {
  stock: StockAnalysis;
  kronosScore: KronosScore | null;
  onRemove: (ticker: string) => void;
}

function StockCard({ stock, kronosScore, onRemove }: StockCardProps) {
  const upside = calculateUpside(stock.priceAtAnalysis, stock.analystTarget);

  return (
    <article
      className="rounded-xl border p-6 flex flex-col gap-4 hover:border-blue-500/50 transition-colors"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--accent)" }}>
              {stock.ticker}
            </span>
            <RatingBadge rating={stock.rating} />
            <KronosSignal score={kronosScore} />
          </div>
          <p className="font-medium">{stock.company}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{stock.sector}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Entry price</p>
          <p className="text-xl font-bold">${stock.priceAtAnalysis.toFixed(2)}</p>
          <p className="text-xs font-medium" style={{ color: "var(--accent-green)" }}>
            Target ${stock.analystTarget.toFixed(2)} (+{upside}%)
          </p>
        </div>
      </div>

      <div
        className="rounded-lg px-4 py-3 border-l-4"
        style={{ backgroundColor: "var(--bg)", borderLeftColor: "var(--accent-green)" }}
      >
        <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--text-muted)" }}>RECOMMENDED STRATEGY</p>
        <p className="font-semibold text-sm">{stock.strategy}</p>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Analysis:{" "}
          {new Date(stock.analysisDate + "T12:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onRemove(stock.ticker)}
            className="text-xs px-3 py-1 rounded-lg border hover:border-red-500/60 hover:text-red-400 transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            Remove
          </button>
          <Link
            href={`/${stock.ticker}`}
            className="text-sm font-semibold hover:underline"
            style={{ color: "var(--accent)" }}
          >
            View Full Report →
          </Link>
        </div>
      </div>
    </article>
  );
}

interface FilterableStockGridProps {
  stocks: StockAnalysis[];
  kronosScores: Record<string, KronosScore>;
}

export default function FilterableStockGrid({ stocks, kronosScores }: FilterableStockGridProps) {
  const [query, setQuery] = useState("");
  const [hiddenTickers, setHiddenTickers] = useState<string[]>([]);
  const [customTickers, setCustomTickers] = useState<CustomTicker[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/tickers")
      .then((r) => r.json())
      .then((data) => {
        setHiddenTickers(data.hidden ?? []);
        setCustomTickers(data.custom ?? []);
      })
      .catch(() => {});
  }, []);

  async function handleRemove(ticker: string) {
    setHiddenTickers((prev) => [...prev, ticker]);
    try {
      await fetch("/api/tickers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });
    } catch {}
  }

  async function handleRestore(ticker: string) {
    setHiddenTickers((prev) => prev.filter((t) => t !== ticker));
    try {
      await fetch("/api/tickers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });
    } catch {}
  }

  async function handleAdd(ticker: string) {
    await fetch("/api/tickers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker }),
    });
    const data = await fetch("/api/tickers").then((r) => r.json());
    setHiddenTickers(data.hidden ?? []);
    setCustomTickers(data.custom ?? []);
  }

  const analysedTickers = new Set(stocks.map((s) => s.ticker));
  const visibleStocks = stocks.filter((s) => !hiddenTickers.includes(s.ticker));
  const filtered = query
    ? visibleStocks.filter((s) => s.ticker.startsWith(query.trim().toUpperCase()))
    : visibleStocks;

  const customOnlyTickers = customTickers.filter(
    (c) => !analysedTickers.has(c.ticker) && !hiddenTickers.includes(c.ticker)
  );

  const tickers = stocks.map((s) => s.ticker);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <StockSearch
            tickers={tickers}
            value={query}
            onChange={setQuery}
            onNavigate={(ticker) => router.push(`/${ticker}`)}
          />
        </div>
        {hiddenTickers.length > 0 && (
          <button
            onClick={() => setShowHidden((v) => !v)}
            className="shrink-0 text-sm px-3 py-2 rounded-lg border transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            {showHidden ? "Hide removed" : `Removed (${hiddenTickers.length})`}
          </button>
        )}
        <button
          onClick={() => setShowAddDialog(true)}
          className="shrink-0 text-sm font-semibold px-4 py-2 rounded-lg border hover:border-blue-500/60 transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--accent)" }}
        >
          + Add Ticker
        </button>
      </div>

      {filtered.length === 0 && customOnlyTickers.length === 0 ? (
        <div className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
          <p className="text-sm">No positions match your search.</p>
        </div>
      ) : (
        <>
          {filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map((stock) => (
                <StockCard
                  key={stock.ticker}
                  stock={stock}
                  kronosScore={kronosScores[stock.ticker] ?? null}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}

          {customOnlyTickers.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                TRACKED VIA UI
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {customOnlyTickers.map((c) => (
                  <KronosOnlyCard
                    key={c.ticker}
                    ticker={c.ticker}
                    kronosScore={kronosScores[c.ticker] ?? null}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showHidden && hiddenTickers.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            REMOVED — click Restore to bring back
          </h2>
          <div className="flex flex-wrap gap-2">
            {hiddenTickers.map((ticker) => (
              <div
                key={ticker}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
              >
                <span className="font-bold" style={{ color: "var(--text-muted)" }}>{ticker}</span>
                <button
                  onClick={() => handleRestore(ticker)}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: "var(--accent)" }}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddDialog && (
        <AddTickerDialog
          onClose={() => setShowAddDialog(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
