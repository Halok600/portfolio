import { createLimiter, type Limiter } from "@/lib/rate-limit";
import { RequestSchema, ResultSchema } from "@/lib/polyo-schema";

export type Deps = {
  fetch: typeof fetch;
  limiter: Limiter;
  upstream: string;
  timeoutMs: number;
};

export const defaultDeps: Deps = {
  fetch: (...args) => fetch(...args),
  limiter: createLimiter({ limit: 12, windowMs: 60_000 }),
  upstream: process.env.POLYO_API_URL ?? "https://polyo-api.onrender.com",
  timeoutMs: 55_000,
};

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

/** Blocks other websites from calling this route from a browser. Non-browser callers send no Origin. */
function crossOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

function callerKey(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim() || "unknown";
}

function isTimeout(e: unknown): boolean {
  return e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError");
}

export async function handlePredict(req: Request, deps: Deps): Promise<Response> {
  if (crossOrigin(req)) return json({ error: "This endpoint is only for the portfolio site." }, 403);

  const limit = deps.limiter.check(callerKey(req));
  if (!limit.ok) {
    return json({ error: "Too many requests. Please wait a moment and try again." }, 429, {
      "Retry-After": String(limit.retryAfter),
    });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "The request was not valid JSON." }, 400);
  }
  const parsed = RequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: "Send some code (up to 5,000 characters) and pick a supported language." }, 400);
  }

  let upstream: Response;
  try {
    upstream = await deps.fetch(`${deps.upstream}/v1/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(deps.timeoutMs),
    });
  } catch (e) {
    if (isTimeout(e)) return json({ error: "PolyO's server took too long to wake up. Try again in a moment." }, 504);
    return json({ error: "Could not reach PolyO right now." }, 502);
  }

  if (upstream.status >= 400 && upstream.status < 500) {
    const detail = await upstream.json().then((b: { detail?: unknown }) => b.detail, () => undefined);
    const message = typeof detail === "string" ? detail.slice(0, 200) : "PolyO could not analyse that code.";
    return json({ error: message }, 422);
  }
  if (!upstream.ok) return json({ error: "PolyO had a problem. Please try again." }, 502);

  const result = ResultSchema.safeParse(await upstream.json().catch(() => null));
  if (!result.success) return json({ error: "PolyO returned an unexpected answer." }, 502);
  return json(result.data);
}

/** Wakes the free-tier server before the visitor presses Analyse. */
export async function handleWarmup(req: Request, deps: Deps): Promise<Response> {
  if (crossOrigin(req)) return json({ error: "This endpoint is only for the portfolio site." }, 403);
  try {
    const res = await deps.fetch(`${deps.upstream}/health`, { signal: AbortSignal.timeout(deps.timeoutMs) });
    return res.ok ? new Response(null, { status: 204 }) : json({ error: "PolyO is not ready." }, 502);
  } catch (e) {
    return json({ error: "PolyO is not ready." }, isTimeout(e) ? 504 : 502);
  }
}
