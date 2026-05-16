export type FlowSignal = "high_volume_oi" | "large_premium" | "sweep_candidate";

export interface UnusualContract {
  contractType: "call" | "put";
  strike: number;
  expiry: string;
  volume: number;
  openInterest: number;
  volumeOiRatio: number;
  estimatedPremium: number;
  impliedVolatility: number | null;
  signals: FlowSignal[];
}

export interface FlowSummary {
  putCallRatio: number;
  totalCallVolume: number;
  totalPutVolume: number;
  unusualContracts: UnusualContract[];
}
