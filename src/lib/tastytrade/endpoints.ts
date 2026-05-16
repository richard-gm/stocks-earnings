import { ttFetch } from "./client";
import type {
  TTOptionChainResponse,
  TTMarketMetricsResponse,
  TTQuoteResponse,
} from "./types";
import { computeExpectedMovePercent } from "@/lib/calculations/expectedMove";

export async function getOptionChain(symbol: string): Promise<TTOptionChainResponse> {
  return ttFetch<TTOptionChainResponse>(`/option-chains/${symbol}/nested`);
}

export async function getMarketMetrics(symbol: string): Promise<TTMarketMetricsResponse> {
  return ttFetch<TTMarketMetricsResponse>(`/market-metrics?symbols=${symbol}`);
}

export async function getOptionQuotes(symbols: string[]): Promise<TTQuoteResponse> {
  const joined = symbols.join(",");
  return ttFetch<TTQuoteResponse>(`/market-data/options?symbols=${joined}`);
}

export interface AtmStraddle {
  callPrice: number;
  putPrice: number;
  expectedMovePercent: number;
  strikePrice: number;
  expiration: string;
}

export async function getCurrentAtmStraddle(
  symbol: string,
  stockPrice: number,
  minDaysOut = 7
): Promise<AtmStraddle | null> {
  try {
    const chain = await getOptionChain(symbol);
    const expirations = chain.data.items;

    const eligible = expirations.filter(
      (e) => e["days-to-expiration"] >= minDaysOut
    );
    if (eligible.length === 0) return null;

    eligible.sort((a, b) => a["days-to-expiration"] - b["days-to-expiration"]);
    const expiry = eligible[0];

    const atm = expiry.strikes.reduce((best, s) =>
      Math.abs(s.strike - stockPrice) < Math.abs(best.strike - stockPrice) ? s : best
    );

    const quotes = await getOptionQuotes([atm.call, atm.put]);
    const callQ = quotes.data.items.find((q) => q.symbol === atm.call);
    const putQ = quotes.data.items.find((q) => q.symbol === atm.put);

    if (!callQ || !putQ) return null;

    const callMid = (callQ.bid + callQ.ask) / 2;
    const putMid = (putQ.bid + putQ.ask) / 2;

    return {
      callPrice: parseFloat(callMid.toFixed(2)),
      putPrice: parseFloat(putMid.toFixed(2)),
      expectedMovePercent: computeExpectedMovePercent(callMid, putMid, stockPrice),
      strikePrice: atm.strike,
      expiration: expiry["expiration-date"],
    };
  } catch {
    return null;
  }
}
