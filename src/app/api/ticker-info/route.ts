import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet, TTL } from "@/lib/cache";
import type { TickerInfo } from "@/types";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbols") ?? "";
  if (!raw) {
    return NextResponse.json({ error: "symbols param required" }, { status: 400 });
  }

  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0 || symbols.length > 100) {
    return NextResponse.json({ error: "1–100 symbols required" }, { status: 400 });
  }

  for (const s of symbols) {
    if (!/^[A-Z0-9.]{1,10}$/.test(s)) {
      return NextResponse.json({ error: `Invalid symbol: ${s}` }, { status: 400 });
    }
  }

  const sorted = [...symbols].sort();
  const cacheKey = `ticker-info:${sorted.join(",")}`;

  const cached = cacheGet<Record<string, TickerInfo>>(cacheKey);
  if (cached) return NextResponse.json(cached);

  if (!process.env.FMP_API_KEY) {
    return NextResponse.json({});
  }

  try {
    const { fetchTickerInfo } = await import("@/lib/fmp/tickerInfo");
    const data = await fetchTickerInfo(symbols);
    cacheSet(cacheKey, data, TTL.TICKER_INFO);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch ticker info";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
