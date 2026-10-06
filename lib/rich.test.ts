import { describe, expect, it } from "vitest";
import { parseBold } from "@/lib/rich";

describe("parseBold", () => {
  it("returns an empty list for empty input", () => {
    expect(parseBold("")).toEqual([]);
  });

  it("returns one plain span when there are no markers", () => {
    expect(parseBold("plain text")).toEqual([{ text: "plain text", bold: false }]);
  });

  it("splits bold spans out of the text", () => {
    expect(parseBold("a **b** c")).toEqual([
      { text: "a ", bold: false },
      { text: "b", bold: true },
      { text: " c", bold: false },
    ]);
  });

  it("handles several bold spans and bold at the edges", () => {
    expect(parseBold("**x** and **y**")).toEqual([
      { text: "x", bold: true },
      { text: " and ", bold: false },
      { text: "y", bold: true },
    ]);
  });

  it("leaves an unmatched marker as plain text", () => {
    expect(parseBold("a **b")).toEqual([{ text: "a **b", bold: false }]);
  });

  it("never produces markup, only text spans", () => {
    expect(parseBold("**<script>x</script>**")).toEqual([
      { text: "<script>x</script>", bold: true },
    ]);
  });
});
