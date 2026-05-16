import { EarningsDashboard } from "@/components/EarningsDashboard";
import { TickerSearch } from "@/components/TickerSearch";

export default async function TickerPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <a href="/" className="text-blue-600 text-sm hover:underline">
            ← Back
          </a>
          <TickerSearch defaultValue={symbol} />
        </div>
        <EarningsDashboard ticker={symbol} />
      </div>
    </main>
  );
}
