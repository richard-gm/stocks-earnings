import fs from "fs";
import path from "path";
import type { TwitterAccountAnalysis, TweetPost } from "@/types";

const CACHE_DIR = path.join(process.cwd(), "data", "twitter-cache");

interface FileCacheEntry {
  analysis: TwitterAccountAnalysis;
  rawTweets: TweetPost[];
}

function cachePath(username: string, range: string): string {
  return path.join(CACHE_DIR, `${username}-${range}.json`);
}

export function readFileCache(
  username: string,
  range: string
): FileCacheEntry | null {
  try {
    const raw = fs.readFileSync(cachePath(username, range), "utf-8");
    return JSON.parse(raw) as FileCacheEntry;
  } catch {
    return null;
  }
}

export function writeFileCache(
  username: string,
  range: string,
  analysis: TwitterAccountAnalysis,
  rawTweets: TweetPost[]
): void {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(
      cachePath(username, range),
      JSON.stringify({ analysis, rawTweets }, null, 2)
    );
  } catch {
    console.warn("[twitter] failed to write file cache:", username, range);
  }
}
