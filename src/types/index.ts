export interface EarningsDate {
  date: string;
  time: "AMC" | "BMO" | "unknown";
  fiscalQuarter: string;
}

export interface EarningsHistoryEntry {
  earningsDate: EarningsDate;
  stockPriceBefore: number;
  stockPriceAfter: number;
  actualMovePercent: number;
  expectedMovePercent: number;
  atmCallPrice: number | null;
  atmPutPrice: number | null;
  dataSource: "tastytrade" | "iv_proxy" | "mock";
}

export interface PostEarningsSummary {
  lastEarningsDate: EarningsDate;
  lastExpectedMove: number;
  lastActualMove: number;
  overestimatedCount: number;
  totalQuarters: number;
  avgExpectedMove: number;
  avgActualAbsMove: number;
}

export type StrategyKey =
  | "long_straddle"
  | "long_strangle"
  | "credit_iron_butterfly"
  | "credit_iron_condor";

export interface StrategyTrade {
  earningsDate: string;
  entryDebit: number | null;
  exitValue: number | null;
  returnPercent: number | null;
  won: boolean | null;
}

export interface StrategyResult {
  strategy: StrategyKey;
  label: string;
  averageReturn: number;
  winRate: number;
  trades: StrategyTrade[];
}

export interface EarningsApiResponse {
  ticker: string;
  summary: PostEarningsSummary;
  strategies: StrategyResult[];
  history: EarningsHistoryEntry[];
  cachedAt: string;
  dataMode: "live" | "mock";
}

export interface OIDataPoint {
  date: string;
  callOI: number;
  putOI: number;
  pcRatio: number | null;
  stockPrice: number;
}

export interface OICrossoverEvent {
  date: string;
  index: number;
  direction: "puts_lead" | "calls_lead";
  callOIAtCross: number;
  putOIAtCross: number;
}

export interface OpenInterestApiResponse {
  ticker: string;
  data: OIDataPoint[];
  crossovers: OICrossoverEvent[];
  cachedAt: string;
  dataMode: "live" | "mock";
}

export interface TweetPost {
  id: string;
  text: string;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
}

export interface TickerMention {
  ticker: string;
  sentiment: "bullish" | "bearish" | "neutral";
  signal: "buy" | "sell" | "hold" | null;
  mentionCount: number;
  keyQuotes: string[];
}

export interface TwitterAccountAnalysis {
  username: string;
  displayName: string;
  postCount: number;
  analyzedRange: { from: string; to: string };
  tickers: TickerMention[];
  summary: string;
  cachedAt: string;
  dataMode: "live" | "mock";
}

export interface TickerInfo {
  price: number;
  change1D: number;
  return3M: number;
  return1Y: number;
  exchange: string;
  tvUrl: string;
}
