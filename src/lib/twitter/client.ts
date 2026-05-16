import type { TweetPost } from "@/types";

const BASE = "https://api.twitterapi.io";

function authHeaders(): HeadersInit {
  const key = process.env.TWITTERAPI_IO_KEY;
  if (!key) throw new Error("TWITTERAPI_IO_KEY is not set");
  return { "X-API-Key": key };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function fetchUserTweets(
  username: string,
  since: Date
): Promise<{ posts: TweetPost[]; displayName: string } | null> {
  const startDate = since;
  const posts: TweetPost[] = [];
  let cursor = "";
  let displayName = username;

  for (let page = 0; page < 5; page++) {
    // Free tier: 1 req/5 s — wait before every page after the first
    if (page > 0) await sleep(5500);

    const params = new URLSearchParams({ userName: username });
    if (cursor) params.set("cursor", cursor);

    const res = await fetch(`${BASE}/twitter/user/last_tweets?${params}`, {
      headers: authHeaders(),
    });

    if (res.status === 429)
      throw new Error("twitterapi.io rate limit — try again in 5 seconds");
    if (!res.ok) break;

    const json = await res.json();
    // Response shape: { status, code, msg, data: { pin_tweet, tweets: [...] } }
    const tweets = json.data?.tweets;
    if (!tweets?.length) {
      if (page === 0) return null;
      break;
    }

    if (page === 0 && tweets[0]?.author?.name) {
      displayName = tweets[0].author.name as string;
    }

    let hitOldTweet = false;
    for (const t of tweets as Array<{
      id: string;
      text: string;
      createdAt: string;
      likeCount?: number;
      retweetCount?: number;
    }>) {
      if (new Date(t.createdAt) < startDate) {
        hitOldTweet = true;
        break;
      }
      posts.push({
        id: t.id,
        text: t.text,
        createdAt: t.createdAt,
        likeCount: t.likeCount ?? 0,
        retweetCount: t.retweetCount ?? 0,
      });
    }

    // has_next_page / next_cursor may be top-level or inside data
    const hasNext = json.has_next_page ?? json.data?.has_next_page;
    const nextCursor = (json.next_cursor ?? json.data?.next_cursor) as string | undefined;
    if (hitOldTweet || !hasNext || !nextCursor) break;
    cursor = nextCursor;
  }

  return { posts, displayName };
}
