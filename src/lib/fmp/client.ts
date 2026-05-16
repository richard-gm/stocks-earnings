import { env } from "@/lib/env";

export interface EarningsItem {
  date: string;
  eps: number | null;
  epsEstimated: number | null;
  time: "AMC" | "BMO" | "unknown";
}

// Fail fast for 5 min after hitting the AV rate limit — avoids burning remaining daily quota
let rateLimitedUntil = 0;

export async function getEarningsDates(symbol: string): Promise<EarningsItem[]> {
  if (!env.alphaVantageApiKey) throw new Error("ALPHA_VANTAGE_API_KEY is not configured");

  if (Date.now() < rateLimitedUntil) {
    const waitMin = Math.ceil((rateLimitedUntil - Date.now()) / 60_000);
    const waitSec = Math.ceil((rateLimitedUntil - Date.now()) / 1000);
    const waitStr = waitMin >= 2 ? `~${waitMin} min` : `${waitSec}s`;
    throw new Error(`Alpha Vantage rate limit — retry in ${waitStr}`);
  }

  const url = `https://www.alphavantage.co/query?function=EARNINGS&symbol=${symbol}&apikey=${env.alphaVantageApiKey}`;
  console.log(`[alphavantage] fetching earnings for ${symbol}`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Alpha Vantage earnings failed: ${res.status}`);

  const data = (await res.json()) as {
    quarterlyEarnings?: Array<{
      reportedDate: string;
      reportedEPS: string;
      estimatedEPS: string;
    }>;
    Information?: string;
    Note?: string;
  };

  if (data.Information) {
    // Daily quota (25 req/day) exhausted — back off for 1 hour, not 5 min
    rateLimitedUntil = Date.now() + 60 * 60 * 1000;
    throw new Error("Alpha Vantage daily quota reached (25 req/day). Earnings data will be unavailable for ~1 hour.");
  }
  if (data.Note) {
    // Per-second burst limit — back off for 30 seconds
    rateLimitedUntil = Date.now() + 30 * 1000;
    throw new Error("Alpha Vantage rate limit — requests too fast. Retry in 30s.");
  }

  const today = new Date().toISOString().split("T")[0];
  const quarters = data.quarterlyEarnings ?? [];
  if (quarters.length > 0) console.log(`[alphavantage] sample:`, JSON.stringify(quarters[0]));

  const items = quarters
    .filter((q) => q.reportedDate && q.reportedDate !== "0000-00-00" && q.reportedDate <= today)
    .sort((a, b) => a.reportedDate.localeCompare(b.reportedDate))
    .slice(-20)
    .map((q) => ({
      date: q.reportedDate,
      eps: q.reportedEPS !== "None" ? parseFloat(q.reportedEPS) : null,
      epsEstimated: q.estimatedEPS !== "None" ? parseFloat(q.estimatedEPS) : null,
      time: "unknown" as const,
    }));

  console.log(`[alphavantage] ${symbol} returned ${items.length} past earnings dates`);
  return items;
}
