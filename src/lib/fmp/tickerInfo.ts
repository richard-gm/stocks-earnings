import { env } from "@/lib/env";
import type { TickerInfo } from "@/types";

const EXCHANGE_MAP: Record<string, string> = {
  "NASDAQ": "NASDAQ",
  "NYSE": "NYSE",
  "NYSE AMERICAN": "AMEX",
  "NYSE ARCA": "NYSEARCA",
  "OTC": "OTC",
  "CBOE": "CBOE",
};

function buildTvUrl(symbol: string, fmpExchange: string): string {
  const tv = EXCHANGE_MAP[fmpExchange];
  const prefix = tv ? `${tv}:` : "";
  return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(`${prefix}${symbol}`)}`;
}

export async function fetchTickerInfo(
  symbols: string[]
): Promise<Record<string, TickerInfo>> {
  if (!env.fmpApiKey) throw new Error("FMP_API_KEY not configured");

  const joined = symbols.join(",");

  const [quoteRes, changeRes] = await Promise.all([
    fetch(`https://financialmodelingprep.com/api/v3/quote/${joined}?apikey=${env.fmpApiKey}`),
    fetch(`https://financialmodelingprep.com/api/v3/stock-price-change/${joined}?apikey=${env.fmpApiKey}`),
  ]);

  const quotes: Array<{ symbol: string; price: number; changesPercentage: number; exchange: string }> =
    quoteRes.ok ? await quoteRes.json() : [];
  const changes: Array<{ symbol: string; "3M": number; "1Y": number }> =
    changeRes.ok ? await changeRes.json() : [];

  const changeMap = Object.fromEntries(changes.map((c) => [c.symbol, c]));

  const result: Record<string, TickerInfo> = {};
  for (const q of quotes) {
    const ch = changeMap[q.symbol];
    result[q.symbol] = {
      price: q.price,
      change1D: q.changesPercentage,
      return3M: ch?.["3M"] ?? 0,
      return1Y: ch?.["1Y"] ?? 0,
      exchange: q.exchange,
      tvUrl: buildTvUrl(q.symbol, q.exchange),
    };
  }
  return result;
}
