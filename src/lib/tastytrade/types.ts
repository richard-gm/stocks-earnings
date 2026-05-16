export interface TTAuthResponse {
  data: {
    "session-token": string;
    user: { email: string; username: string };
  };
}

export interface TTStrike {
  strike: number;
  call: string;
  put: string;
}

export interface TTOptionExpiration {
  "expiration-date": string;
  "days-to-expiration": number;
  strikes: TTStrike[];
}

export interface TTOptionChainResponse {
  data: {
    items: TTOptionExpiration[];
  };
}

export interface TTMarketMetrics {
  symbol: string;
  "implied-volatility-index": number;
  "implied-volatility-index-rank": number;
  "implied-volatility-percentile": number;
}

export interface TTMarketMetricsResponse {
  data: {
    items: TTMarketMetrics[];
  };
}

export interface TTQuote {
  symbol: string;
  bid: number;
  ask: number;
  "implied-volatility": number | null;
}

export interface TTQuoteResponse {
  data: {
    items: TTQuote[];
  };
}
