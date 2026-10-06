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

import { parseEmphasis } from "@/lib/rich";

describe("parseEmphasis", () => {
  it("returns plain text unchanged", () => {
    expect(parseEmphasis("plain")).toEqual([{ text: "plain", em: false }]);
  });

  it("marks _words_ as emphasis", () => {
    expect(parseEmphasis("that _see_, _read code_ and _ship_.")).toEqual([
      { text: "that ", em: false },
      { text: "see", em: true },
      { text: ", ", em: false },
      { text: "read code", em: true },
      { text: " and ", em: false },
      { text: "ship", em: true },
      { text: ".", em: false },
    ]);
  });

  it("leaves underscores inside identifiers alone", () => {
    expect(parseEmphasis("use snake_case_names")).toEqual([
      { text: "use snake_case_names", em: false },
    ]);
  });
});
