import { describe, expect, it } from "vitest";
import { createLimiter } from "@/lib/rate-limit";

describe("createLimiter", () => {
  it("allows up to the limit and then blocks", () => {
    const l = createLimiter({ limit: 3, windowMs: 60_000 });
    expect([1, 2, 3].map((i) => l.check("a", i * 1000).ok)).toEqual([true, true, true]);
    const blocked = l.check("a", 4000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThanOrEqual(1);
  });

  it("frees a slot once the window has passed", () => {
    const l = createLimiter({ limit: 1, windowMs: 10_000 });
    expect(l.check("a", 0).ok).toBe(true);
    expect(l.check("a", 5_000).ok).toBe(false);
    expect(l.check("a", 10_001).ok).toBe(true);
  });

  it("counts each caller separately", () => {
    const l = createLimiter({ limit: 1, windowMs: 60_000 });
    expect(l.check("a", 0).ok).toBe(true);
    expect(l.check("b", 0).ok).toBe(true);
    expect(l.check("a", 1).ok).toBe(false);
  });

  it("does not grow forever", () => {
    const l = createLimiter({ limit: 1, windowMs: 1_000 });
    for (let i = 0; i < 2000; i++) l.check(`k${i}`, 0);
    l.check("late", 5_000); // triggers the sweep of expired callers
    expect(l.size()).toBeLessThan(10);
  });
});
