import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import RunAnalysisButton from "@/components/RunAnalysisButton";
import FilterableStockGrid from "@/components/FilterableStockGrid";
import { getAllStocks } from "@/lib/stocks";
import { getAllKronosScores } from "@/lib/kronos";

export default async function HomePage() {
  const [stocks, kronosScores] = await Promise.all([
    getAllStocks(),
    getAllKronosScores(),
  ]);

  const hasKronos = Object.keys(kronosScores).length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <header
        className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
      >
        <div>
          <h1 className="text-lg font-bold tracking-tight">Stock Analysis Dashboard</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Options strategy research
          </p>
        </div>
        <div className="flex items-center gap-2">
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/flow"
              className="text-xs px-3 py-1.5 rounded-md border hover:opacity-80 transition-opacity"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              Options Flow
            </Link>
            <Link
              href="/twitter"
              className="text-xs px-3 py-1.5 rounded-md border hover:opacity-80 transition-opacity"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              Twitter Intel
            </Link>
          </nav>
          <RunAnalysisButton />
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Analyzed Positions</h2>
            <p style={{ color: "var(--text-muted)" }} className="text-sm">
              {stocks.length} position{stocks.length !== 1 ? "s" : ""} tracked
              {hasKronos && (
                <span className="ml-2" style={{ color: "var(--accent)" }}>
                  · Kronos signals loaded
                </span>
              )}
            </p>
          </div>
        </div>

        <FilterableStockGrid stocks={stocks} kronosScores={kronosScores} />
      </main>

      <footer
        className="border-t mt-16 px-6 py-4 text-center text-xs"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        All option prices are Black-Scholes estimates. Verify on IBKR/Tastytrade before entering. Not financial advice.
      </footer>
    </div>
  );
}
