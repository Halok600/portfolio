import { describe, expect, it } from "vitest";
import {
  allowedRepos, firstLine, groupPushes, isFresh, isNoise, relativeTime, repoFromUrl,
} from "@/lib/github-activity";
import { site } from "@/lib/content";

const NOW = new Date("2026-10-07T12:00:00Z");

describe("repoFromUrl", () => {
  it("reads owner/name from a GitHub URL", () => {
    expect(repoFromUrl("https://github.com/Halok600/polyo")).toBe("halok600/polyo");
    expect(repoFromUrl("https://github.com/Halok600/The-Aerial-Guardian/")).toBe("halok600/the-aerial-guardian");
  });
  it("rejects other hosts and profile-only URLs", () => {
    expect(repoFromUrl("https://example.com/Halok600/polyo")).toBeNull();
    expect(repoFromUrl("https://github.com/Halok600")).toBeNull();
  });
});

describe("allowedRepos", () => {
  const allowed = allowedRepos(site);
  it("includes visible projects and this portfolio", () => {
    expect(allowed.has("halok600/polyo")).toBe(true);
    expect(allowed.has("halok600/portfolio")).toBe(true);
  });
  it("leaves out hidden projects", () => {
    expect(allowed.has("halok600/leehint")).toBe(false);
    expect(allowed.has("halok600/drone-tilt-detection")).toBe(false);
  });
});

describe("groupPushes", () => {
  const ev = (repo: string, at: string, head = "abc1234") => ({
    type: "PushEvent", repo: { name: repo }, created_at: at, payload: { head },
  });
  const allowed = new Set(["halok600/polyo", "halok600/portfolio"]);
  const events = [
    ev("Halok600/polyo", "2026-10-03T00:00:00Z", "old"),
    ev("Halok600/portfolio", "2026-10-06T00:00:00Z", "p1"),
    ev("Halok600/polyo", "2026-10-05T00:00:00Z", "new"),
    ev("Halok600/secret-repo", "2026-10-07T00:00:00Z", "x"),
    { type: "WatchEvent", repo: { name: "Halok600/polyo" }, created_at: "2026-10-07T00:00:00Z", payload: {} },
  ];

  it("groups allowed pushes by repo, newest repo first and newest push first", () => {
    const groups = groupPushes(events, allowed, { perRepo: 3, maxRepos: 6 });
    expect(groups.map((g) => g.repo)).toEqual(["Halok600/portfolio", "Halok600/polyo"]);
    expect(groups[1].pushes.map((p) => p.head)).toEqual(["new", "old"]);
  });

  it("ignores other event types and repos that are not on the site", () => {
    const flat = groupPushes(events, allowed, { perRepo: 3, maxRepos: 6 }).flatMap((g) => g.pushes.map((p) => p.head));
    expect(flat).not.toContain("x");
  });

  it("limits pushes per repo and the number of repos", () => {
    expect(groupPushes(events, allowed, { perRepo: 1, maxRepos: 6 })[1].pushes).toHaveLength(1);
    expect(groupPushes(events, allowed, { perRepo: 3, maxRepos: 1 })).toHaveLength(1);
  });
});

describe("isNoise", () => {
  it("skips housekeeping commits", () => {
    for (const m of [
      "chore: refresh LeetCode data", "docs: update plan", "ci: bump", "Merge pull request #3",
      "style: format", "test: add", "Add MIT license", "Update README", "Initial commit", "Create .gitignore",
    ]) {
      expect(isNoise(m), m).toBe(true);
    }
  });
  it("keeps real work", () => {
    for (const m of ["feat: add GNN rung", "fix: handle empty input", "perf: faster tokenizer", "Add conformal prediction"]) {
      expect(isNoise(m), m).toBe(false);
    }
  });
});

describe("firstLine", () => {
  it("takes the first line and trims long messages", () => {
    expect(firstLine("feat: thing\n\nlong body")).toBe("feat: thing");
    expect(firstLine("x".repeat(120), 20)).toBe("xxxxxxxxxxxxxxxxxxx…");
  });
});

describe("relativeTime", () => {
  const at = (iso: string) => relativeTime(iso, NOW);
  it("speaks in plain days, weeks and months", () => {
    expect(at("2026-10-07T01:00:00Z")).toBe("today");
    expect(at("2026-10-06T01:00:00Z")).toBe("yesterday");
    expect(at("2026-10-03T12:00:00Z")).toBe("4 days ago");
    expect(at("2026-09-16T12:00:00Z")).toBe("3 weeks ago");
    expect(at("2026-06-01T12:00:00Z")).toBe("4 months ago");
  });
});

describe("isFresh", () => {
  it("compares against the maximum age in days", () => {
    expect(isFresh("2026-09-20T00:00:00Z", NOW, 30)).toBe(true);
    expect(isFresh("2026-08-01T00:00:00Z", NOW, 30)).toBe(false);
  });
});
