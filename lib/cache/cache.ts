import type { CacheEntry } from "../../types/type";

const cache = new Map<string, CacheEntry<unknown>>();

export const getCached = <Value>(key: string): Value | undefined => {
  const entry = cache.get(key) as CacheEntry<Value> | undefined;

  if (!entry) {return undefined;}

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }

  return entry.value;
};

export const setCached = <Value>(key: string, value: Value, ttlMs: number): void => {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

export const clearCache = (): void => {
  cache.clear();
};
