const BASE_URL = "https://api.marketdata.app/v1";
const CONCURRENCY = 10;
const BATCH_DELAY_MS = 100;

interface ChainResponse {
  s: "ok" | "no_data" | "error";
  side?: string[];
  openInterest?: (number | null)[];
  underlyingPrice?: (number | null)[];
  errmsg?: string;
}

export interface DayOI {
  date: string;
  callOI: number;
  putOI: number;
  stockPrice: number;
}

function getWeekdays(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const d = new Date(startDate + "T12:00:00Z");
  const end = new Date(endDate + "T12:00:00Z");
  while (d <= end) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) {
      dates.push(d.toISOString().slice(0, 10));
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return dates;
}

async function fetchDayOI(
  ticker: string,
  date: string,
  apiKey: string
): Promise<DayOI | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/options/chain/${encodeURIComponent(ticker)}/?date=${date}`,
      {
        headers: { Authorization: `Token ${apiKey}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as ChainResponse;
    if (data.s !== "ok" || !data.side || !data.openInterest) return null;

    let callOI = 0;
    let putOI = 0;
    for (let i = 0; i < data.side.length; i++) {
      const oi = data.openInterest[i] ?? 0;
      if (data.side[i] === "call") callOI += oi;
      else if (data.side[i] === "put") putOI += oi;
    }

    const stockPrice = data.underlyingPrice?.[0] ?? 0;
    return { date, callOI, putOI, stockPrice };
  } catch {
    return null;
  }
}

export async function fetchMarketDataOI(
  ticker: string,
  apiKey: string,
  existingDates: Set<string>,
  days = 365
): Promise<DayOI[]> {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

  const allWeekdays = getWeekdays(
    startDate.toISOString().slice(0, 10),
    yesterday.toISOString().slice(0, 10)
  );

  // Most-recent-first so partial runs yield the freshest data
  const missing = allWeekdays
    .filter((d) => !existingDates.has(d))
    .reverse();

  if (missing.length === 0) return [];

  const results: DayOI[] = [];

  for (let i = 0; i < missing.length; i += CONCURRENCY) {
    const batch = missing.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((date) => fetchDayOI(ticker, date, apiKey))
    );
    for (const r of batchResults) {
      if (r !== null) results.push(r);
    }
    if (i + CONCURRENCY < missing.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return results;
}
