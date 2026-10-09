import { describe, expect, it } from "vitest";
import { buildFacts } from "@/lib/facts";
import { leetcode, site } from "@/lib/content";

describe("buildFacts", () => {
  it("derives three facts from the seed", () => {
    const f = buildFacts(site, leetcode);
    expect(f.map((x) => x.value)).toEqual([`${leetcode.solved} solved`, "3 live projects", "India Space Lab"]);
    expect(f[0].label).toBe(`LeetCode · ${leetcode.hard} Hard`);
    expect(f[1].label).toBe("PolyO · The Aerial Guardian · Enagram.io");
    expect(f[2].label).toBe("Embedded Systems Intern");
  });

  it("drops the LeetCode fact when it is switched off", () => {
    const off = { ...site, dsa: { ...site.dsa, show: { ...site.dsa.show, solved: false } } };
    expect(buildFacts(off, leetcode).map((x) => x.value)).not.toContain(`${leetcode.solved} solved`);
  });

  it("skips hidden experience", () => {
    const hidden = { ...site, experience: site.experience.map((e) => ({ ...e, visible: false })) };
    expect(buildFacts(hidden, leetcode)).toHaveLength(2);
  });
});
