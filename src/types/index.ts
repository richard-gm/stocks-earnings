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

// ─── Stock Analysis types (migrated from options-tracker) ─────────────────────

export type Rating = "BULLISH" | "NEUTRAL" | "BEARISH";

export interface ExitStep {
  label: string;
  trigger: string;
  optionGain: string;
}

export interface Recommendation {
  title: string;
  strike: number;
  expiry: string;
  type: string;
  estimatedPremium: string;
  contractCost: string;
  delta: number;
  breakeven: string;
  entryNote: string;
  exitPlan: ExitStep[];
}

export interface Financial {
  metric: string;
  value: string;
  note: string;
}

export interface StrikeRow {
  strike: string;
  type: string;
  isRecommended: boolean;
  premium: string;
  delta: number;
  contracts2Cost: string;
  breakeven: string;
  atTarget: string;
}

export interface DilutionItem {
  label: string;
  detail: string;
}

export interface DilutionInfo {
  summary: string;
  items: DilutionItem[];
}

export interface WheelLeg {
  strike: string;
  delta: string;
  dte: string;
  estimatedPremium: string;
  annualisedYield?: string;
  exitRule?: string;
  note?: string;
}

export interface WheelStrategy {
  eligible: boolean;
  ineligibleReason?: string;
  wheelFlag?: string;
  vixNote: string;
  bollingerEntry: string;
  csp?: WheelLeg;
  coveredCall?: WheelLeg;
}

export interface InsiderTransaction {
  insider: string;
  action: string;
  shares: number;
  price: string;
  date: string;
  value: string;
  note: string;
}

export interface InsiderFlow {
  summary: string;
  transactions: InsiderTransaction[];
  signal: string;
}

export interface ExpiryOption {
  expiry: string;
  daysTotal: number;
  daysLeftAtClose: number;
  premiumEst: string;
  flatScenario: string;
  atTarget: string;
  bestFor: string;
  recommended: boolean;
}

export interface ExpiryComparison {
  strike: number;
  underlyingPrice: number;
  iv: string;
  earningsDate: string;
  closeDeadline: string;
  exitRules: {
    entryTrigger: string;
    profitExit: string;
    timeStop: string;
    lossStop: string;
    earningsHardStop: string;
  };
  options: ExpiryOption[];
}

export interface CustomTicker {
  ticker: string;
  added_at: string;
}

export interface TechnicalSetupLevel {
  level: string;
  type: string;
  note: string;
}

export interface TechnicalSetup {
  pattern: string;
  description: string;
  keyLevels: TechnicalSetupLevel[];
}

export interface StockAnalysis {
  ticker: string;
  company: string;
  sector: string;
  analysisDate: string;
  priceAtAnalysis: number;
  analystTarget: number;
  rating: Rating;
  strategy: string;
  wheelStrategy?: WheelStrategy;
  expiryComparison?: ExpiryComparison;
  recommendation: Recommendation;
  companyOverview: string;
  technicalSetup?: TechnicalSetup;
  financials: Financial[];
  insiderFlow?: InsiderFlow;
  catalysts: string[];
  risks: string[];
  dilution: DilutionInfo | string;
  strikeTable: StrikeRow[];
}

// ─── Kronos ML signals ────────────────────────────────────────────────────────

export interface KronosScore {
  ticker: string;
  signal: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  score: number;
  confidence: number;
  updatedAt: string;
  factors?: Record<string, number>;
}
