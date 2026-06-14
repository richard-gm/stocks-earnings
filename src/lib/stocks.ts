import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { StockAnalysis } from "@/types";

const DATA_DIR = join(process.cwd(), "src", "data", "stocks");

function readAllJson(): StockAnalysis[] {
  try {
    const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
    return files
      .map((file) => JSON.parse(readFileSync(join(DATA_DIR, file), "utf-8")) as StockAnalysis)
      .sort((a, b) => a.ticker.localeCompare(b.ticker));
  } catch {
    return [];
  }
}

function readJsonSingle(ticker: string): StockAnalysis | null {
  try {
    const raw = readFileSync(join(DATA_DIR, `${ticker.toUpperCase()}.json`), "utf-8");
    return JSON.parse(raw) as StockAnalysis;
  } catch {
    return null;
  }
}

export async function getAllStocks(): Promise<StockAnalysis[]> {
  try {
    const { getSupabaseClient } = await import("@/lib/supabase");
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from("stocks")
      .select("data")
      .order("ticker");
    if (error) throw error;
    if (data?.length) return data.map((r) => r.data as StockAnalysis);
  } catch {
    // Supabase not configured or table empty — fall back to local JSON files
  }
  return readAllJson();
}

export async function getStock(ticker: string): Promise<StockAnalysis | null> {
  try {
    const { getSupabaseClient } = await import("@/lib/supabase");
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from("stocks")
      .select("data")
      .eq("ticker", ticker.toUpperCase())
      .maybeSingle();
    if (error) throw error;
    if (data) return data.data as StockAnalysis;
  } catch {
    // Supabase not configured — fall back to local JSON
  }
  return readJsonSingle(ticker);
}
