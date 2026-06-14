/**
 * Supabase persistence helpers — L2 cache layer (survives cold starts / deploys).
 * In-memory Map in individual route handlers is L1; this is L2.
 * All functions are silent on failure — callers fall back to live fetches.
 */

import { getSupabaseClient } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type {
  TwitterAccountAnalysis,
  TweetPost,
  EarningsApiResponse,
  TickerInfo,
} from "@/types";

// ─── OI History ──────────────────────────────────────────────────────────────

interface DayRecord {
  callOI: number;
  putOI: number;
  stockPrice: number;
}

export async function oiLoadCache(
  ticker: string
): Promise<Record<string, DayRecord>> {
  try {
    const sb = getSupabaseClient();
    const { data } = await sb
      .from("oi_history")
      .select("date, call_oi, put_oi, stock_price")
      .eq("ticker", ticker.toUpperCase());

    if (!data?.length) return {};

    return Object.fromEntries(
      data.map((row) => [
        row.date as string,
        {
          callOI: row.call_oi as number,
          putOI: row.put_oi as number,
          stockPrice: row.stock_price as number,
        },
      ])
    );
  } catch {
    return {};
  }
}

export async function oiSaveCache(
  ticker: string,
  newData: Record<string, DayRecord>
): Promise<void> {
  if (!Object.keys(newData).length) return;
  try {
    const sb = getSupabaseClient();
    const rows = Object.entries(newData).map(([date, r]) => ({
      ticker: ticker.toUpperCase(),
      date,
      call_oi: r.callOI,
      put_oi: r.putOI,
      stock_price: r.stockPrice,
    }));
    await sb.from("oi_history").upsert(rows, { onConflict: "ticker,date" });
  } catch {
    logger.warn("[oi-cache] Supabase write failed for", ticker);
  }
}

// ─── Twitter Analyses ────────────────────────────────────────────────────────

interface TwitterCacheEntry {
  analysis: TwitterAccountAnalysis;
  rawTweets: TweetPost[];
}

export async function twitterReadCache(
  username: string,
  range: string
): Promise<TwitterCacheEntry | null> {
  try {
    const sb = getSupabaseClient();
    const { data } = await sb
      .from("twitter_analyses")
      .select("analysis, raw_tweets")
      .eq("username", username.toLowerCase())
      .eq("range", range)
      .maybeSingle();

    if (!data) return null;
    return {
      analysis: data.analysis as TwitterAccountAnalysis,
      rawTweets: (data.raw_tweets ?? []) as TweetPost[],
    };
  } catch {
    return null;
  }
}

export async function twitterWriteCache(
  username: string,
  range: string,
  analysis: TwitterAccountAnalysis,
  rawTweets: TweetPost[]
): Promise<void> {
  try {
    const sb = getSupabaseClient();
    await sb.from("twitter_analyses").upsert(
      {
        username: username.toLowerCase(),
        range,
        analysis,
        raw_tweets: rawTweets,
        cached_at: new Date().toISOString(),
      },
      { onConflict: "username,range" }
    );
  } catch {
    logger.warn("[twitter] Supabase write failed for", username, range);
  }
}

// ─── Earnings Cache ───────────────────────────────────────────────────────────

export async function earningsGet(
  ticker: string
): Promise<EarningsApiResponse | null> {
  try {
    const sb = getSupabaseClient();
    const { data } = await sb
      .from("earnings_cache")
      .select("data, expires_at")
      .eq("ticker", ticker.toUpperCase())
      .maybeSingle();

    if (!data) return null;
    if (new Date(data.expires_at as string) < new Date()) return null;
    return data.data as EarningsApiResponse;
  } catch {
    return null;
  }
}

export async function earningsSet(
  ticker: string,
  response: EarningsApiResponse,
  ttlHours = 6
): Promise<void> {
  try {
    const sb = getSupabaseClient();
    const expiresAt = new Date(
      Date.now() + ttlHours * 60 * 60 * 1000
    ).toISOString();
    await sb.from("earnings_cache").upsert(
      {
        ticker: ticker.toUpperCase(),
        data: response,
        fetched_at: new Date().toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: "ticker" }
    );
  } catch {
    logger.warn("[earnings] Supabase write failed for", ticker);
  }
}

// ─── Ticker Info Cache ────────────────────────────────────────────────────────

export async function tickerInfoGet(
  cacheKey: string
): Promise<Record<string, TickerInfo> | null> {
  try {
    const sb = getSupabaseClient();
    const { data } = await sb
      .from("ticker_info_cache")
      .select("data, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (!data) return null;
    if (new Date(data.expires_at as string) < new Date()) return null;
    return data.data as Record<string, TickerInfo>;
  } catch {
    return null;
  }
}

export async function tickerInfoSet(
  cacheKey: string,
  response: Record<string, TickerInfo>,
  ttlHours = 24
): Promise<void> {
  try {
    const sb = getSupabaseClient();
    const expiresAt = new Date(
      Date.now() + ttlHours * 60 * 60 * 1000
    ).toISOString();
    await sb.from("ticker_info_cache").upsert(
      {
        cache_key: cacheKey,
        data: response,
        cached_at: new Date().toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: "cache_key" }
    );
  } catch {
    logger.warn("[ticker-info] Supabase write failed for", cacheKey);
  }
}
