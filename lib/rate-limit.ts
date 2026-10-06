// A small in-memory sliding-window limiter. On serverless each instance keeps its own counts,
// so this is a best-effort guard against casual abuse, not a hard guarantee.

export type Limiter = {
  check(key: string, now?: number): { ok: boolean; retryAfter: number };
  size(): number;
};

export function createLimiter({ limit, windowMs }: { limit: number; windowMs: number }): Limiter {
  const hits = new Map<string, number[]>();

  function sweep(now: number) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(key);
    }
  }

  return {
    check(key, now = Date.now()) {
      if (hits.size > 500) sweep(now);
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false, retryAfter: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
      }
      recent.push(now);
      hits.set(key, recent);
      return { ok: true, retryAfter: 0 };
    },
    size: () => hits.size,
  };
}
