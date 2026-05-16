import { TickerSearch } from "@/components/TickerSearch";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Earnings Move Analyzer</h1>
        <p className="text-gray-500 text-sm">
          Compare market-implied expected moves vs. actual post-earnings price action
        </p>
      </div>
      <TickerSearch />
      <p className="mt-4 text-xs text-gray-400">
        Try: GOOG · AAPL · MSFT · NVDA
      </p>
      <a href="/twitter" className="mt-6 text-xs text-blue-500 hover:underline">
        Twitter Intelligence →
      </a>
    </main>
  );
}
