import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet, TTL } from "@/lib/cache";
import { twitterReadCache, twitterWriteCache } from "@/lib/supabase-cache";
import type { TwitterAccountAnalysis } from "@/types";

const requestCounts = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip) ?? { count: 0, windowStart: now };
  if (now - entry.windowStart > 60_000) {
    requestCounts.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  requestCounts.set(ip, entry);
  return true;
}

const MOCK_ANALYSES: Record<string, TwitterAccountAnalysis> = {
  chamath: {
    username: "chamath",
    displayName: "Chamath Palihapitiya",
    postCount: 87,
    analyzedRange: { from: "2026-01-23", to: "2026-04-23" },
    tickers: [
      {
        ticker: "NVDA",
        sentiment: "bullish",
        signal: "buy",
        mentionCount: 12,
        keyQuotes: ["AI infrastructure buildout is just getting started", "NVDA is the picks-and-shovels play"],
      },
      {
        ticker: "TSLA",
        sentiment: "bullish",
        signal: "hold",
        mentionCount: 8,
        keyQuotes: ["Full Self-Driving is closer than people think", "Long TSLA for the robotics story"],
      },
      {
        ticker: "META",
        sentiment: "bearish",
        signal: "sell",
        mentionCount: 5,
        keyQuotes: ["Metaverse bet is not paying off", "Reality Labs losses are unsustainable"],
      },
      {
        ticker: "GOOG",
        sentiment: "neutral",
        signal: null,
        mentionCount: 4,
        keyQuotes: ["Google search still dominant but AI is a real threat"],
      },
    ],
    summary:
      "Chamath is primarily bullish on AI infrastructure plays, especially NVDA and semiconductor names. He has turned cautious on legacy tech and social media.",
    cachedAt: new Date().toISOString(),
    dataMode: "mock",
  },
  elonmusk: {
    username: "elonmusk",
    displayName: "Elon Musk",
    postCount: 143,
    analyzedRange: { from: "2026-01-23", to: "2026-04-23" },
    tickers: [
      {
        ticker: "TSLA",
        sentiment: "bullish",
        signal: "buy",
        mentionCount: 23,
        keyQuotes: ["Optimus robots will be worth more than the car business", "FSD v13 is incredible"],
      },
      {
        ticker: "NVDA",
        sentiment: "bullish",
        signal: null,
        mentionCount: 6,
        keyQuotes: ["Training our models on NVDA clusters"],
      },
    ],
    summary:
      "Elon is heavily focused on TSLA and his own ventures, consistently bullish on robotics and AI.",
    cachedAt: new Date().toISOString(),
    dataMode: "mock",
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { username } = await params;
  const handle = username.toLowerCase().replace(/^@/, "");

  if (!/^[a-z0-9_]{1,50}$/.test(handle)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const range = (req.nextUrl.searchParams.get("range") ?? "3m") as "3m" | "6m";
  const cacheKey = `twitter:${handle}:${range}`;

  // L1: in-memory cache
  const cached = cacheGet<TwitterAccountAnalysis>(cacheKey);
  if (cached) return NextResponse.json(cached);

  // L2: Supabase cache
  const sbCached = await twitterReadCache(handle, range);

  // Mock mode: no cookie session configured
  if (!process.env.TWITTER_COOKIES_FILE) {
    const mock = MOCK_ANALYSES[handle];
    if (!mock) {
      return NextResponse.json(
        { error: `No data for @${handle} in mock mode. Try: chamath, elonmusk` },
        { status: 404 }
      );
    }
    cacheSet(cacheKey, mock, TTL.OPTIONS_FLOW);
    return NextResponse.json(mock);
  }

  // Live mode
  try {
    const { fetchUserTweets } = await import("@/lib/twitter/client");
    const { analyzeTweets } = await import("@/lib/twitter/analysis");

    const daysBack = range === "6m" ? 180 : 90;
    const windowStart = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Incremental: if we have prior data, only fetch tweets since cachedAt
    const since = sbCached
      ? new Date(sbCached.analysis.cachedAt)
      : windowStart;

    const result = await fetchUserTweets(handle, since);

    // API failed but we have Supabase cache — serve stale rather than error
    if (!result) {
      if (sbCached) {
        cacheSet(cacheKey, sbCached.analysis, TTL.OPTIONS_FLOW);
        return NextResponse.json(sbCached.analysis);
      }
      return NextResponse.json(
        { error: `Account @${handle} not found or has no posts` },
        { status: 404 }
      );
    }

    const { posts: newPosts, displayName } = result;

    // No new tweets since last fetch — existing analysis is still current
    if (newPosts.length === 0 && sbCached) {
      cacheSet(cacheKey, sbCached.analysis, TTL.OPTIONS_FLOW);
      return NextResponse.json(sbCached.analysis);
    }

    // Below threshold — not enough new content to justify a Claude re-run
    const MIN_NEW_TWEETS = 20;
    if (newPosts.length < MIN_NEW_TWEETS && sbCached) {
      cacheSet(cacheKey, sbCached.analysis, TTL.OPTIONS_FLOW);
      return NextResponse.json(sbCached.analysis);
    }

    // Merge new posts with stored ones, trimmed to the range window
    const allTweets = sbCached
      ? [...newPosts, ...sbCached.rawTweets].filter(
          (t) => new Date(t.createdAt) >= windowStart
        )
      : newPosts;

    if (allTweets.length === 0) {
      return NextResponse.json(
        { error: `No posts found for @${handle} in the last ${range === "3m" ? "3 months" : "6 months"}` },
        { status: 404 }
      );
    }

    const effectiveDisplayName =
      displayName !== handle ? displayName : (sbCached?.analysis.displayName ?? handle);

    const fromDate = windowStart.toISOString().slice(0, 10);
    const toDate = new Date().toISOString().slice(0, 10);

    const analysis = await analyzeTweets(handle, effectiveDisplayName, allTweets, {
      from: fromDate,
      to: toDate,
    });

    // Only persist if Claude actually produced results
    if (analysis.tickers.length > 0) {
      await twitterWriteCache(handle, range, analysis, allTweets);
    }
    cacheSet(cacheKey, analysis, TTL.OPTIONS_FLOW);
    return NextResponse.json(analysis);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to analyze account";
    const status = message.includes("rate limit") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
