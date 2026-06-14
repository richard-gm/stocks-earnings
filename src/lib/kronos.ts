import type { Rating } from "@/types";
import { getSupabaseClient } from "@/lib/supabase";

export interface KronosScore {
  ticker: string;
  predicted_return: number;
  signal: Rating;
  confidence: number;
  last_close: number;
  predicted_close: number;
  pred_days: number;
  run_at: string;
  volume_spike_ratio?: number | null;
}

export async function getAllKronosScores(): Promise<Record<string, KronosScore>> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return {};

  try {
    const { data, error } = await getSupabaseClient()
      .from("kronos_scores")
      .select("*")
      .order("run_at", { ascending: false });

    if (error || !data) return {};

    return Object.fromEntries(data.map((row) => [row.ticker, row as KronosScore]));
  } catch {
    return {};
  }
}

export async function getKronosScore(ticker: string): Promise<KronosScore | null> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return null;

  try {
    const { data, error } = await getSupabaseClient()
      .from("kronos_scores")
      .select("*")
      .eq("ticker", ticker.toUpperCase())
      .single();

    if (error || !data) return null;
    return data as KronosScore;
  } catch {
    return null;
  }
}
