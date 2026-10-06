import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  EXAMPLES, LANGUAGES, MAX_CODE, engineLabel, formatBigO, looksLikeResult, trimSaturation,
} from "@/lib/polyo";
import { RequestSchema, ResultSchema } from "@/lib/polyo-schema";

describe("formatBigO", () => {
  it("writes exponents as superscripts", () => {
    expect(formatBigO("O(n^2)")).toBe("O(n²)");
    expect(formatBigO("O(n^3)")).toBe("O(n³)");
    expect(formatBigO("O(2^n)")).toBe("O(2ⁿ)");
  });
  it("tidies multiplication and leaves everything else alone", () => {
    expect(formatBigO("O(n * m)")).toBe("O(n·m)");
    expect(formatBigO("O(n log n)")).toBe("O(n log n)");
    expect(formatBigO("O(1)")).toBe("O(1)");
  });
});

describe("trimSaturation", () => {
  it("stops a series where PolyO's numbers overflow and flat-line", () => {
    const capped = [256, 2.62e5, 2.2e12, 1.84e19, 1.84e19, 1.84e19, 1.84e19];
    expect(trimSaturation(capped)).toEqual([256, 2.62e5, 2.2e12, 1.84e19]);
  });
  it("leaves a genuinely constant series alone", () => {
    expect(trimSaturation([1, 1, 1, 1, 1])).toEqual([1, 1, 1, 1, 1]);
  });
  it("leaves ordinary growth alone", () => {
    expect(trimSaturation([8, 18, 41, 93])).toEqual([8, 18, 41, 93]);
  });
});

describe("looksLikeResult", () => {
  it("accepts a real answer and the bundled sample", () => {
    const sample = JSON.parse(readFileSync(path.join(process.cwd(), "lib/polyo-sample.json"), "utf8"));
    expect(looksLikeResult(sample)).toBe(true);
  });
  it("rejects anything else", () => {
    for (const bad of [null, "x", 3, {}, { time: {}, space: {} }, { time: { class: "O(1)" }, space: { class: "O(1)" } }]) {
      expect(looksLikeResult(bad)).toBe(false);
    }
  });
});

describe("engineLabel", () => {
  it("is honest about which engine answered", () => {
    expect(engineLabel("symbolic")).toBe("static analysis");
    expect(engineLabel("learned")).toBe("learned model");
    expect(engineLabel("anything-else")).toBe("learned model");
  });
});

describe("RequestSchema", () => {
  it("accepts supported languages within the size limit", () => {
    expect(RequestSchema.safeParse({ code: "x", language: "python" }).success).toBe(true);
    expect(RequestSchema.safeParse({ code: "x".repeat(MAX_CODE), language: "go" }).success).toBe(true);
  });
  it("rejects empty code, oversize code and unknown languages", () => {
    expect(RequestSchema.safeParse({ code: "", language: "python" }).success).toBe(false);
    expect(RequestSchema.safeParse({ code: "x".repeat(MAX_CODE + 1), language: "python" }).success).toBe(false);
    expect(RequestSchema.safeParse({ code: "x", language: "cobol" }).success).toBe(false);
  });
});

describe("examples and sample", () => {
  it("offer only languages the API supports, with code inside the limit", () => {
    const ids = LANGUAGES.map((l) => l.id);
    for (const e of EXAMPLES) {
      expect(ids).toContain(e.language);
      expect(e.code.length).toBeGreaterThan(10);
      expect(e.code.length).toBeLessThanOrEqual(MAX_CODE);
    }
  });

  it("the bundled sample result is a valid PolyO answer for the first example", () => {
    const sample = JSON.parse(readFileSync(path.join(process.cwd(), "lib/polyo-sample.json"), "utf8"));
    const parsed = ResultSchema.safeParse(sample);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.time.class).toBe("O(n^2)");
    expect(parsed.data?.space.class).toBe("O(1)");
  });
});

describe("ResultSchema", () => {
  const base = {
    language_detected: "python",
    time: { class: "O(n)" },
    space: { class: "O(1)" },
    engine: "learned",
    derivation: [],
  };
  it("tolerates the optional fields a learned-model answer may leave out", () => {
    expect(ResultSchema.safeParse(base).success).toBe(true);
  });
  it("drops fields we do not display", () => {
    const out = ResultSchema.parse({ ...base, ir: { nodes: 3 }, attribution: [1] });
    expect(out).not.toHaveProperty("ir");
    expect(out).not.toHaveProperty("attribution");
  });
  it("rejects an answer with no time class", () => {
    expect(ResultSchema.safeParse({ ...base, time: {} }).success).toBe(false);
  });
});
