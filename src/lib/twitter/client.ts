import fs from "fs";
import path from "path";
import type { TweetPost } from "@/types";
import { logger } from "@/lib/logger";

// Public web bearer token embedded in x.com's JS bundle (same for all web sessions)
const BEARER = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I4xL1g38=";

interface BrowserCookie {
  name: string;
  value: string;
  [key: string]: unknown;
}

interface TwitterV1Tweet {
  id_str: string;
  full_text?: string;
  text?: string;
  created_at: string;
  favorite_count?: number;
  retweet_count?: number;
  user?: { name: string; screen_name: string };
  retweeted_status?: unknown;
}

function loadSession(): { cookieHeader: string; csrfToken: string } {
  const cookiePath =
    process.env.TWITTER_COOKIES_FILE ??
    path.join(process.cwd(), "config", "twitter-cookies.json");

  const raw = fs.readFileSync(cookiePath, "utf-8");
  const cookies = JSON.parse(raw) as BrowserCookie[];

  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  const csrfToken = cookies.find((c) => c.name === "ct0")?.value ?? "";

  if (!csrfToken) logger.warn("[twitter] ct0 cookie missing — requests may be rejected");

  return { cookieHeader, csrfToken };
}

function buildHeaders(cookieHeader: string, csrfToken: string): HeadersInit {
  return {
    authorization: `Bearer ${BEARER}`,
    cookie: cookieHeader,
    "x-csrf-token": csrfToken,
    "x-twitter-active-user": "yes",
    "x-twitter-auth-type": "OAuth2Session",
    "content-type": "application/json",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };
}

export async function fetchUserTweets(
  username: string,
  since: Date
): Promise<{ posts: TweetPost[]; displayName: string } | null> {
  const { cookieHeader, csrfToken } = loadSession();
  const headers = buildHeaders(cookieHeader, csrfToken);

  const posts: TweetPost[] = [];
  let maxId: string | undefined;
  let displayName = username;

  for (let page = 0; page < 5; page++) {
    const params = new URLSearchParams({
      screen_name: username,
      count: "200",
      tweet_mode: "extended",
      include_rts: "false",
      trim_user: "false",
    });
    if (maxId) params.set("max_id", maxId);

    const res = await fetch(
      `https://api.twitter.com/1.1/statuses/user_timeline.json?${params}`,
      { headers }
    );

    if (res.status === 401 || res.status === 403) {
      throw new Error("Twitter session expired — export fresh cookies from your browser and redeploy");
    }
    if (res.status === 429) {
      throw new Error("Twitter rate limit — try again later");
    }
    if (res.status === 404) return null;
    if (!res.ok) {
      logger.warn(`[twitter] unexpected status ${res.status} for @${username}`);
      break;
    }

    const tweets = (await res.json()) as TwitterV1Tweet[];

    if (!Array.isArray(tweets) || tweets.length === 0) {
      if (page === 0) return null;
      break;
    }

    if (page === 0 && tweets[0]?.user?.name) {
      displayName = tweets[0].user.name;
    }

    let hitOldTweet = false;
    for (const t of tweets) {
      if (t.retweeted_status) continue;

      const createdAt = new Date(t.created_at);
      if (createdAt < since) {
        hitOldTweet = true;
        break;
      }

      posts.push({
        id: t.id_str,
        text: t.full_text ?? t.text ?? "",
        createdAt: createdAt.toISOString(),
        likeCount: t.favorite_count ?? 0,
        retweetCount: t.retweet_count ?? 0,
      });
    }

    if (hitOldTweet || tweets.length < 200) break;

    // max_id is exclusive-end: subtract 1 to avoid returning the last tweet again
    const lowestId = BigInt(tweets[tweets.length - 1].id_str) - 1n;
    maxId = lowestId.toString();
  }

  return { posts, displayName };
}
