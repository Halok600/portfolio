import { describe, expect, it, vi } from "vitest";
import { createLimiter } from "@/lib/rate-limit";
import { handlePredict, handleWarmup, type Deps } from "@/lib/polyo-proxy";

const UPSTREAM_OK = {
  language_detected: "python",
  time: { class: "O(n^2)", expression: "O(n^2)", confidence: 0.92, engine: "symbolic", certainty: "certain", abstain: false },
  space: { class: "O(1)", expression: "O(1)", confidence: 0.94, engine: "symbolic", certainty: "certain", abstain: false },
  engine: "symbolic",
  derivation: [{ line: 2, kind: "loop", text: "loop runs O(n) times" }],
  ir: { nodes: 22 }, // must not be passed on
};

function deps(fetchImpl: Deps["fetch"], over: Partial<Deps> = {}): Deps {
  return {
    fetch: fetchImpl,
    limiter: createLimiter({ limit: 100, windowMs: 60_000 }),
    upstream: "https://upstream.test",
    timeoutMs: 1000,
    ...over,
  };
}

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://site.test/api/polyo", {
    method: "POST",
    headers: { "content-type": "application/json", host: "site.test", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const ok = () => vi.fn(async () => Response.json(UPSTREAM_OK));

describe("handlePredict", () => {
  it("returns the validated answer and strips fields we do not show", async () => {
    const f = ok();
    const res = await handlePredict(post({ code: "def f(): pass", language: "python" }), deps(f));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.time.class).toBe("O(n^2)");
    expect(body).not.toHaveProperty("ir");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(f).toHaveBeenCalledWith("https://upstream.test/v1/predict", expect.objectContaining({ method: "POST" }));
  });

  it("refuses requests that come from another website", async () => {
    const f = ok();
    const res = await handlePredict(post({ code: "x", language: "python" }, { origin: "https://evil.test" }), deps(f));
    expect(res.status).toBe(403);
    expect(f).not.toHaveBeenCalled();
  });

  it("accepts requests from its own origin", async () => {
    const res = await handlePredict(post({ code: "x", language: "python" }, { origin: "https://site.test" }), deps(ok()));
    expect(res.status).toBe(200);
  });

  it("rate-limits per caller with a retry hint", async () => {
    const d = deps(ok(), { limiter: createLimiter({ limit: 2, windowMs: 60_000 }) });
    const call = () => handlePredict(post({ code: "x", language: "python" }, { "x-forwarded-for": "1.2.3.4, 9.9.9.9" }), d);
    expect((await call()).status).toBe(200);
    expect((await call()).status).toBe(200);
    const third = await call();
    expect(third.status).toBe(429);
    expect(Number(third.headers.get("retry-after"))).toBeGreaterThanOrEqual(1);
  });

  it("rejects bad input before calling PolyO", async () => {
    const f = ok();
    for (const body of [
      { code: "", language: "python" },
      { code: "x".repeat(5001), language: "python" },
      { code: "x", language: "cobol" },
      "not json",
    ]) {
      const res = await handlePredict(post(body), deps(f));
      expect(res.status, JSON.stringify(body).slice(0, 40)).toBe(400);
      expect((await res.json()).error).toBeTruthy();
    }
    expect(f).not.toHaveBeenCalled();
  });

  it("passes on a clear message when PolyO rejects the code", async () => {
    const f = vi.fn(async () => Response.json({ detail: "unsupported language: 'x'" }, { status: 400 }));
    const res = await handlePredict(post({ code: "x", language: "python" }), deps(f));
    expect(res.status).toBe(422);
    expect((await res.json()).error).toContain("unsupported language");
  });

  it("maps an upstream crash to 502 without leaking details", async () => {
    const f = vi.fn(async () => new Response("stack trace here", { status: 500 }));
    const res = await handlePredict(post({ code: "x", language: "python" }), deps(f));
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain("stack trace");
  });

  it("maps a timeout to 504", async () => {
    const f = vi.fn(async () => {
      throw new DOMException("timed out", "TimeoutError");
    });
    const res = await handlePredict(post({ code: "x", language: "python" }), deps(f));
    expect(res.status).toBe(504);
  });

  it("maps a network failure to 502", async () => {
    const f = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    expect((await handlePredict(post({ code: "x", language: "python" }), deps(f))).status).toBe(502);
  });

  it("rejects an upstream answer with an unexpected shape", async () => {
    const f = vi.fn(async () => Response.json({ hello: "world" }));
    expect((await handlePredict(post({ code: "x", language: "python" }), deps(f))).status).toBe(502);
  });
});

describe("handleWarmup", () => {
  const get = (headers: Record<string, string> = {}) =>
    new Request("https://site.test/api/polyo", { headers: { host: "site.test", ...headers } });

  it("pings the upstream health endpoint and answers 204", async () => {
    const f = vi.fn(async () => Response.json({ status: "ok" }));
    const res = await handleWarmup(get(), deps(f));
    expect(res.status).toBe(204);
    expect(f).toHaveBeenCalledWith("https://upstream.test/health", expect.anything());
  });

  it("says 502 when the upstream is down and 403 for other origins", async () => {
    const down = vi.fn(async () => new Response("", { status: 503 }));
    expect((await handleWarmup(get(), deps(down))).status).toBe(502);
    expect((await handleWarmup(get({ origin: "https://evil.test" }), deps(ok()))).status).toBe(403);
  });
});
