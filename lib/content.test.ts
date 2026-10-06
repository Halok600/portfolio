import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  featuredProjects, formatDate, gridProjects, leetcode, site, visibleSections,
} from "@/lib/content";
import { buildHeatmap } from "@/lib/leetcode-calendar";

const raw = (rel: string) => readFileSync(path.join(process.cwd(), rel), "utf8");

describe("leetcode data", () => {
  const hm = buildHeatmap(leetcode.calendar, leetcode.fetchedAt.slice(0, 10));

  it("keeps the stored active-day count consistent with the calendar", () => {
    expect(hm.activeDays).toBe(leetcode.activeDays);
    expect(Object.keys(leetcode.calendar)).toHaveLength(leetcode.activeDays);
  });

  it("has every calendar day inside the heatmap window", () => {
    const shown = hm.weeks.flat().filter((c) => c && c.count > 0).length;
    expect(shown).toBe(leetcode.activeDays);
  });

  it("never reports more problems solved by difficulty than in total", () => {
    expect(leetcode.easy + leetcode.medium + leetcode.hard).toBe(leetcode.solved);
  });
});

describe("seed content", () => {
  it("loads and validates", () => {
    expect(site.profile.name).toBe("Priyanshu Tiwari");
    expect(leetcode.solved).toBeGreaterThan(0);
  });

  it("uses the confirmed LinkedIn handle", () => {
    expect(site.profile.links.linkedin).toBe("https://www.linkedin.com/in/priyanshu0604");
  });

  it("contains NO phone number anywhere in the content files", () => {
    for (const file of ["content/site.json", "data/leetcode.json"]) {
      const text = raw(file);
      expect(text).not.toMatch(/\+\s?91/);
      expect(text).not.toMatch(/\b\d{10}\b/);
      expect(text).not.toMatch(/"phone"/i);
    }
  });

  it("never claims ISRO", () => {
    expect(raw("content/site.json")).not.toMatch(/ISRO/i);
  });

  it("shows India Space Lab as Embedded Systems Intern", () => {
    const e = site.experience.find((x) => x.org === "India Space Lab");
    expect(e?.role).toBe("Embedded Systems Intern");
    expect(e?.start).toBe("Jun 2025");
    expect(e?.end).toBe("Jul 2025");
  });

  it("has the three featured projects first", () => {
    expect(featuredProjects().map((p) => p.title)).toEqual([
      "PolyO", "The Aerial Guardian", "Enagram.io",
    ]);
  });

  it("shows WeaponShield in the grid and hides the unfinished ones", () => {
    expect(gridProjects().map((p) => p.title)).toEqual(["WeaponShield AI"]);
    const hidden = site.projects.filter((p) => !p.visible).map((p) => p.title);
    expect(hidden).toEqual(["MedFusionAI", "drone-tilt-detection", "Leehint", "reddit-insights"]);
  });

  it("has the typo fixes in skills", () => {
    const labels = site.skills.map((s) => s.label);
    expect(labels).toContain("Developer Tools");
    expect(labels).not.toContain("Devloper Tools");
    const ai = site.skills.find((s) => s.label === "AI and ML")!;
    expect(ai.items).toContain("TensorFlow");
    expect(site.skills.find((s) => s.label === "Frontend")!.items.at(-1)).toBe("HTML5");
  });

  it("keeps hero first and lists only visible sections", () => {
    expect(visibleSections()[0].id).toBe("hero");
    expect(visibleSections().every((s) => s.visible)).toBe(true);
  });

  it("does not show contest rating by default", () => {
    expect(site.dsa.show.contestRating).toBe(false);
  });
  it("gives every visible project a kind", () => {
    for (const p of site.projects.filter((x) => x.visible)) {
      expect(p.kind, p.title).toBeTruthy();
    }
  });

  it("only references figure images that exist on disk", () => {
    for (const p of site.projects) {
      if (p.image) {
        expect(existsSync(path.join(process.cwd(), "public", p.image)), p.image).toBe(true);
      }
    }
  });

  it("uses the signal accent and a role title", () => {
    expect(site.settings.accent).toBe("signal");
    expect(site.profile.role).toBe("AI/ML Engineer");
  });
});

describe("formatDate", () => {
  it("formats in UTC", () => {
    expect(formatDate("2026-10-06T00:00:00.000Z")).toBe("6 Oct 2026");
  });
});
