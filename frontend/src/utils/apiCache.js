const apiCache = new Map();
const DEFAULT_TTL = 30000;

export function getCached(key) {
  const hit = apiCache.get(key);
  if (hit && Date.now() - hit.ts < hit.ttl) return hit.data;
  if (hit) apiCache.delete(key);
  return null;
}

export function setCache(key, data, ttl = DEFAULT_TTL) {
  apiCache.set(key, { ts: Date.now(), data, ttl });
}

export function invalidateCache(pattern) {
  for (const key of apiCache.keys()) {
    if (key.includes(pattern)) apiCache.delete(key);
  }
}

export function clearCache() {
  apiCache.clear();
}

export async function cachedFetch(url, options = {}, ttl = DEFAULT_TTL) {
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  setCache(cacheKey, data, ttl);
  return data;
}

export function createCachedApi(api, ttl = 30000) {
  return new Proxy(api, {
    get(target, prop) {
      const orig = target[prop];
      if (typeof orig !== 'function') return orig;
      return async (...args) => {
        const cacheKey = `${prop}:${JSON.stringify(args)}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;
        const result = await orig(...args);
        setCache(cacheKey, result, ttl);
        return result;
      };
    }
  });
}
