import type { Leetcode, Site } from "@/lib/schema";

export type Fact = { value: string; label: string };

export function buildFacts(site: Site, lc: Leetcode): Fact[] {
  const facts: Fact[] = [];
  if (site.dsa.show.solved) {
    facts.push({ value: `${lc.solved} solved`, label: `LeetCode · ${lc.hard} Hard` });
  }
  const live = site.projects.filter((p) => p.visible && p.links.live);
  if (live.length > 0) {
    facts.push({
      value: `${live.length} live project${live.length === 1 ? "" : "s"}`,
      label: live.map((p) => p.title).join(" · "),
    });
  }
  const job = site.experience.find((e) => e.visible);
  if (job) facts.push({ value: job.org, label: job.role });
  return facts;
}
