import { z } from "zod";

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
const LANGUAGE_IDS = LANGUAGES.map((l) => l.id) as [LanguageId, ...LanguageId[]];

export const RequestSchema = z.object({
  code: z.string().min(1).max(MAX_CODE),
  language: z.enum(LANGUAGE_IDS),
});

// Only the fields the page shows. Everything else PolyO returns is dropped on purpose.
const Part = z.object({
  class: z.string(),
  expression: z.string().optional(),
  confidence: z.number().optional(),
  engine: z.string().optional(),
  certainty: z.string().optional(),
  abstain: z.boolean().optional(),
});
const Curve = z.object({ predicted_class: z.string(), series: z.record(z.string(), z.array(z.number())) });

export const ResultSchema = z.object({
  language_detected: z.string(),
  time: Part,
  space: Part,
  engine: z.string(),
  derivation: z.array(z.object({ line: z.number(), kind: z.string(), text: z.string() })),
  curve: z.object({ n: z.array(z.number()), time: Curve, space: Curve }).optional(),
});

export type PolyoResult = z.infer<typeof ResultSchema>;

/** "O(n^2)" -> "O(n²)", "O(n * m)" -> "O(n·m)". */
export function formatBigO(s: string): string {
  return s
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/\^n/g, "ⁿ")
    .replace(/\s\*\s/g, "·");
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
