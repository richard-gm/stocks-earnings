import type { OIDataPoint, OpenInterestApiResponse } from "@/types";
import { detectAllCrossovers } from "@/lib/calculations/detectCrossovers";

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

function generateTradingDates(endDate: string, count: number): string[] {
  const dates: string[] = [];
  const d = new Date(endDate + "T12:00:00Z");
  while (dates.length < count) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) {
      dates.push(d.toISOString().slice(0, 10));
    }
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return dates.reverse();
}

interface TickerConfig {
  tickerSeed: number;
  callOIStart: number;
  putOIStart: number;
  priceStart: number;
  putsCrossAt: number | null;
  callsCrossAt: number | null;
}

function tickerHash(ticker: string): number {
  let h = 5381;
  for (let i = 0; i < ticker.length; i++) {
    h = ((h << 5) + h) ^ ticker.charCodeAt(i);
    h = h >>> 0;
  }
  return h;
}

function configFromTicker(ticker: string): TickerConfig {
  const h = tickerHash(ticker);
  return {
    tickerSeed: (h % 900) + 100,
    callOIStart: 80_000 + (h % 120_000),
    putOIStart: 50_000 + (h % 80_000),
    priceStart: 30 + (h % 970),
    putsCrossAt: h % 7 === 0 ? (h % 200) + 40 : null,
    callsCrossAt: h % 11 === 0 ? (h % 200) + 140 : null,
  };
}

const CONFIGS: Record<string, TickerConfig> = {
  GOOG: {
    tickerSeed: 100,
    callOIStart: 140_000,
    putOIStart: 95_000,
    priceStart: 165,
    putsCrossAt: 162,
    callsCrossAt: 220,
  },
  AAPL: {
    tickerSeed: 200,
    callOIStart: 150_000,
    putOIStart: 100_000,
    priceStart: 215,
    putsCrossAt: null,
    callsCrossAt: null,
  },
  MSFT: {
    tickerSeed: 300,
    callOIStart: 100_000,
    putOIStart: 70_000,
    priceStart: 420,
    putsCrossAt: 180,
    callsCrossAt: null,
  },
  NVDA: {
    tickerSeed: 400,
    callOIStart: 200_000,
    putOIStart: 130_000,
    priceStart: 135,
    putsCrossAt: null,
    callsCrossAt: null,
  },
};

function generateOiSeries(ticker: string): OIDataPoint[] {
  const cfg = CONFIGS[ticker] ?? configFromTicker(ticker);
  const today = new Date().toISOString().slice(0, 10);
  const dates = generateTradingDates(today, 252);
  const s = cfg.tickerSeed;

  let callOI = cfg.callOIStart;
  let putOI = cfg.putOIStart;
  let price = cfg.priceStart;

  const result: OIDataPoint[] = [];

  for (let i = 0; i < 252; i++) {
    callOI *= 1 + (seededRandom(s + i * 3) - 0.5) * 0.04;
    putOI *= 1 + (seededRandom(s + i * 3 + 1) - 0.5) * 0.04;
    price *= 1 + (seededRandom(s + i * 3 + 2) - 0.5) * 0.016;

    callOI = Math.max(30_000, Math.min(350_000, callOI));
    putOI = Math.max(30_000, Math.min(350_000, putOI));

    const putsCrossAt = cfg.putsCrossAt;
    const callsCrossAt = cfg.callsCrossAt;

    if (putsCrossAt !== null && callsCrossAt !== null) {
      if (i < putsCrossAt) {
        if (putOI >= callOI) putOI = callOI * 0.91;
      } else if (i === putsCrossAt) {
        putOI = callOI * 1.05;
      } else if (i > putsCrossAt && i < callsCrossAt) {
        if (callOI >= putOI) callOI = putOI * 0.91;
      } else if (i === callsCrossAt) {
        callOI = putOI * 1.05;
      } else {
        if (putOI >= callOI) putOI = callOI * 0.91;
      }
    } else if (putsCrossAt !== null) {
      if (i < putsCrossAt) {
        if (putOI >= callOI) putOI = callOI * 0.91;
      } else if (i === putsCrossAt) {
        putOI = callOI * 1.05;
      } else {
        if (callOI >= putOI) callOI = putOI * 0.91;
      }
    } else if (callsCrossAt !== null) {
      if (i < callsCrossAt) {
        if (callOI >= putOI) callOI = putOI * 0.91;
      } else if (i === callsCrossAt) {
        callOI = putOI * 1.05;
      } else {
        if (putOI >= callOI) putOI = callOI * 0.91;
      }
    } else {
      if (putOI >= callOI) putOI = callOI * 0.88;
    }

    result.push({
      date: dates[i],
      callOI: Math.round(callOI),
      putOI: Math.round(putOI),
      pcRatio: callOI > 0 ? Math.round((putOI / callOI) * 1000) / 1000 : null,
      stockPrice: Math.round(price * 100) / 100,
    });
  }

  return result;
}

const MOCK_OI_DB: Record<string, OIDataPoint[]> = {
  GOOG: generateOiSeries("GOOG"),
  AAPL: generateOiSeries("AAPL"),
  MSFT: generateOiSeries("MSFT"),
  NVDA: generateOiSeries("NVDA"),
};

export function getMockOiResponse(ticker: string): OpenInterestApiResponse {
  const upper = ticker.toUpperCase();
  const key = upper === "GOOGL" ? "GOOG" : upper;
  const data = MOCK_OI_DB[key] ?? generateOiSeries(upper);
  return {
    ticker: upper,
    data,
    crossovers: detectAllCrossovers(data),
    cachedAt: new Date().toISOString(),
    dataMode: "mock",
  };
}
