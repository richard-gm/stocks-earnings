import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { TweetPost, TwitterAccountAnalysis, TickerMention } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a financial analyst extracting stock recommendations from social media posts.
Your task: analyze tweets and extract structured information about stock ticker mentions.

Respond ONLY with valid JSON matching this exact schema:
{
  "tickers": [
    {
      "ticker": "AAPL",
      "sentiment": "bullish",
      "signal": "buy",
      "mentionCount": 3,
      "keyQuotes": ["1 excerpt max 60 chars"]
    }
  ],
  "summary": "2 sentences describing this account's overall market stance and investment style."
}

Rules:
- Recognize cashtags ($AAPL), plain uppercase tickers (AAPL), and company names (Apple → AAPL)
- Use standard US stock tickers only (ignore crypto, ignore non-stock mentions)
- sentiment: "bullish" = positive language/outlook, "bearish" = negative, "neutral" = mentioned without clear stance
- signal: "buy" only for explicit purchase intent ("buying", "long", "added"), "sell" for explicit exit ("selling", "short", "exit"), "hold" if mentioned but no action, null if not discussed
- keyQuotes: exactly 1 verbatim excerpt under 60 chars that best illustrates the sentiment
- Sort tickers by mentionCount descending
- summary: focus on investment style and most-discussed themes, not a list of tickers`;

interface ClaudeAnalysisResult {
  tickers: TickerMention[];
  summary: string;
}

function formatTweets(posts: TweetPost[]): string {
  return posts
    .map((p, i) => {
      const date = new Date(p.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      return `${i + 1}. [${date}] ${p.text.replace(/\n+/g, " ")}`;
    })
    .join("\n");
}

export async function analyzeTweets(
  username: string,
  displayName: string,
  posts: TweetPost[],
  range: { from: string; to: string }
): Promise<TwitterAccountAnalysis> {
  const tweetsText = formatTweets(posts);

  let parsed: ClaudeAnalysisResult = { tickers: [], summary: "Analysis unavailable." };

  try {
    const response = await client.messages.create({
      model: env.anthropicModel,
      max_tokens: 4096,
      // Cache the system prompt — it's identical for every call, so this saves
      // ~400 tokens on every cache hit (5-min TTL on Anthropic's side).
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze these ${posts.length} tweets from @${username} (${range.from} to ${range.to}):\n\n${tweetsText}`,
              // Cache the tweets block too — same account hit twice within 5 min
              // (e.g. two app users) skips re-processing the full token input.
              cache_control: { type: "ephemeral" },
            } as Anthropic.TextBlockParam & { cache_control: { type: "ephemeral" } },
          ],
        },
      ],
    });

    const content = response.content[0];
    logger.info("[analysis] content type:", content.type);
    if (content.type === "text") {
      logger.info("[analysis] raw response:", content.text.slice(0, 500));
      const raw = content.text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      const json = JSON.parse(raw) as ClaudeAnalysisResult;
      logger.info("[analysis] parsed tickers:", json.tickers?.length, "summary:", !!json.summary);
      if (json.tickers && json.summary) parsed = json;
    }
  } catch (err) {
    logger.error("[analysis] Claude call failed:", err);
  }

  return {
    username,
    displayName,
    postCount: posts.length,
    analyzedRange: range,
    tickers: parsed.tickers,
    summary: parsed.summary,
    cachedAt: new Date().toISOString(),
    dataMode: "live",
  };
}
