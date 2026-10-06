import { describe, expect, it } from "vitest";
import {
  allowedRepos, firstLine, isFresh, isNoise, pickCommit, relativeTime, repoFromUrl,
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

describe("pickCommit", () => {
  const c = (message: string, date: string, sha = "abc1234") => ({
    sha,
    html_url: `https://github.com/Halok600/x/commit/${sha}`,
    commit: { message, committer: { date } },
  });

  it("returns the newest commit that is real work (the API lists newest first)", () => {
    const picked = pickCommit([
      c("chore: refresh LeetCode data", "2026-10-07T00:00:00Z"),
      c("feat: add GNN rung\n\nlong body", "2026-10-05T00:00:00Z", "feat111"),
      c("fix: older", "2026-10-01T00:00:00Z", "fix2222"),
    ]);
    expect(picked).toEqual({
      message: "feat: add GNN rung",
      url: "https://github.com/Halok600/x/commit/feat111",
      at: "2026-10-05T00:00:00Z",
    });
  });

  it("returns null when every commit is housekeeping or the list is empty", () => {
    expect(pickCommit([c("Add MIT license", "2026-10-01T00:00:00Z"), c("docs: x", "2026-09-01T00:00:00Z")])).toBeNull();
    expect(pickCommit([])).toBeNull();
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
