// Browser-safe PolyO helpers: no runtime dependencies. The strict Zod schemas live in
// lib/polyo-schema.ts and are only used on the server.
import type { PolyoResult } from "@/lib/polyo-schema";

export type { PolyoResult };

export const MAX_CODE = 5000;

export const LANGUAGES = [
  { id: "python", label: "Python" },
  { id: "cpp", label: "C++" },
  { id: "java", label: "Java" },
  { id: "javascript", label: "JavaScript" },
  { id: "c", label: "C" },
  { id: "go", label: "Go" },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];

/**
 * A cheap sanity check for the browser. Our own proxy has already validated the answer with
 * the strict schema, so this only guards against a broken deployment.
 */
export function looksLikeResult(x: unknown): x is PolyoResult {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  const cls = (p: unknown) =>
    typeof p === "object" && p !== null && typeof (p as Record<string, unknown>).class === "string";
  return cls(r.time) && cls(r.space) && typeof r.engine === "string" && Array.isArray(r.derivation);
}

/** "O(n^2)" -> "O(n²)", "O(n * m)" -> "O(n·m)". */
export function formatBigO(s: string): string {
  return s
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/\^n/g, "ⁿ")
    .replace(/\s\*\s/g, "·");
}

/**
 * PolyO's numbers overflow at 2^64 and then repeat. Drawing that plateau would suggest the
 * growth stops, so keep the series only up to the first overflowed point. A genuinely
 * constant series (like O(1)) never reaches that size, so it is left alone.
 */
export function trimSaturation(values: number[]): number[] {
  for (let i = 0; i + 2 < values.length; i++) {
    if (values[i] >= 2 ** 53 && values[i] === values[i + 1] && values[i + 1] === values[i + 2]) {
      return values.slice(0, i + 1);
    }
  }
  return values;
}

/** Be honest about which part of PolyO produced the answer. */
export function engineLabel(engine: string): string {
  return engine === "symbolic" ? "static analysis" : "learned model";
}

export const EXAMPLES: { id: string; title: string; language: LanguageId; code: string }[] = [
  {
    id: "nested",
    title: "Nested loops",
    language: "python",
    code: "def f(a):\n    for i in range(len(a)):\n        for j in range(len(a)):\n            print(a[i] + a[j])\n",
  },
  {
    id: "bsearch",
    title: "Binary search",
    language: "python",
    code:
      "def search(a, x):\n    lo, hi = 0, len(a) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n" +
      "        if a[mid] == x:\n            return mid\n        if a[mid] < x:\n            lo = mid + 1\n" +
      "        else:\n            hi = mid - 1\n    return -1\n",
  },
  {
    id: "fib",
    title: "Recursive Fibonacci",
    language: "javascript",
    code: "function fib(n) {\n  if (n < 2) return n;\n  return fib(n - 1) + fib(n - 2);\n}\n",
  },
];
