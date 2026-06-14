import fs from "fs";
import path from "path";
import { logger } from "@/lib/logger";

const CACHE_DIR = path.join(process.cwd(), "data", "oi-history");

interface DayRecord {
  callOI: number;
  putOI: number;
  stockPrice: number;
}

interface OIHistoryFile {
  ticker: string;
  updatedAt: string;
  data: Record<string, DayRecord>;
}

function cachePath(ticker: string): string {
  return path.join(CACHE_DIR, `${ticker.toUpperCase()}.json`);
}

export function loadOICache(ticker: string): OIHistoryFile {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const raw = fs.readFileSync(cachePath(ticker), "utf-8");
    return JSON.parse(raw) as OIHistoryFile;
  } catch {
    return { ticker: ticker.toUpperCase(), updatedAt: new Date().toISOString(), data: {} };
  }
}

export function saveOICache(ticker: string, data: Record<string, DayRecord>): void {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const file: OIHistoryFile = {
      ticker: ticker.toUpperCase(),
      updatedAt: new Date().toISOString(),
      data,
    };
    fs.writeFileSync(cachePath(ticker), JSON.stringify(file, null, 2));
  } catch {
    logger.warn("[oi-cache] failed to write cache for", ticker);
  }
}
