interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry || Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export const TTL = {
  EARNINGS_HISTORY: 6 * 60 * 60 * 1000,
  OPTIONS_CHAIN: 5 * 60 * 1000,
  OPTIONS_FLOW: 60 * 60 * 1000,
  TICKER_INFO: 24 * 60 * 60 * 1000,
} as const;
