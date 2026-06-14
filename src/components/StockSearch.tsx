"use client";

interface StockSearchProps {
  tickers: string[];
  value: string;
  onChange: (value: string) => void;
  onNavigate: (ticker: string) => void;
}

export default function StockSearch({ tickers, value, onChange, onNavigate }: StockSearchProps) {
  const query = value.trim().toUpperCase();
  const matches = query ? tickers.filter((t) => t.startsWith(query)) : tickers;
  const hasQuery = value.trim().length > 0;
  const noMatch = hasQuery && matches.length === 0;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && matches.length === 1) {
      onNavigate(matches[0]);
    }
    if (e.key === "Escape") {
      onChange("");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: noMatch ? "var(--accent-red)" : "var(--text-muted)" }}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder="Search ticker — e.g. PLTR — press Enter to open"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="w-full rounded-lg pl-9 pr-9 py-2.5 text-sm font-mono font-semibold outline-none transition-colors"
          style={{
            backgroundColor: "var(--surface)",
            color: "var(--text)",
            border: `1.5px solid ${noMatch ? "var(--accent-red)" : "var(--border)"}`,
          }}
        />

        {hasQuery && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs rounded-full w-5 h-5 flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{ backgroundColor: "var(--border)", color: "var(--text-muted)" }}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {noMatch && (
        <p className="text-xs px-1" style={{ color: "var(--accent-red)" }}>
          No results for &quot;{value.trim().toUpperCase()}&quot;
        </p>
      )}

      {hasQuery && matches.length === 1 && (
        <p className="text-xs px-1" style={{ color: "var(--text-muted)" }}>
          Press Enter to open {matches[0]}
        </p>
      )}
    </div>
  );
}
