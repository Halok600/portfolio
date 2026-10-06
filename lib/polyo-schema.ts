// Server-side validation for the PolyO proxy. Kept out of lib/polyo.ts on purpose: that file is
// imported by the browser bundle, and Zod would add about 120 KB of JavaScript for every visitor.
import { z } from "zod";
import { LANGUAGES, MAX_CODE, type LanguageId } from "@/lib/polyo";

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
