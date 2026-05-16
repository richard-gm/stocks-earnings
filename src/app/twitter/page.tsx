import { TwitterDashboard } from "@/components/TwitterDashboard";

export const metadata = { title: "Twitter Intelligence — Earnings Analyzer" };

export default function TwitterPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-4">
        <a href="/" className="text-xs text-gray-400 hover:text-gray-600">
          ← Back to Earnings Analyzer
        </a>
      </div>
      <TwitterDashboard />
    </main>
  );
}
