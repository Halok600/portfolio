import { describe, expect, it } from "vitest";
import { SiteSchema } from "@/lib/schema";

function minimalSite() {
  return {
    version: 1,
    settings: { accent: "signal", defaultTheme: "dark" },
    profile: {
      name: "A B",
      role: "Engineer",
      headline: "Engineer",
      tagline: "Builds things.",
      status: { show: true, text: "Open to work" },
      location: "Noida, India",
      email: "a@example.com",
      links: {
        github: "https://github.com/a",
        linkedin: "https://www.linkedin.com/in/a",
        leetcode: "https://leetcode.com/u/a",
      },
      resumePdf: "/resume.pdf",
    },
    sections: [{ id: "hero", title: "Hero", visible: true }],
    projects: [
      {
        id: "p1",
        slug: "p1",
        title: "P1",
        oneLiner: "One liner",
        stack: ["TS"],
        bullets: ["did **a thing**"],
        links: { github: "https://github.com/a/p1" },
        featured: true,
        visible: true,
      },
    ],
    experience: [],
    education: [],
    skills: [],
    achievements: [],
    dsa: {
      show: {
        solved: true, byDifficulty: true, hard: true, activeDays: true,
        streak: true, contestRating: false, topPercent: false,
      },
      streakMinimum: 7,
    },
    recentlyShipped: { show: true, hideIfOlderThanDays: 30 },
  };
}

describe("SiteSchema", () => {
  it("accepts a minimal valid site", () => {
    expect(SiteSchema.safeParse(minimalSite()).success).toBe(true);
  });

  it("rejects javascript: links", () => {
    const s = minimalSite();
    s.projects[0].links.github = "javascript:alert(1)";
    expect(SiteSchema.safeParse(s).success).toBe(false);
  });

  it("rejects duplicate project slugs", () => {
    const s = minimalSite();
    s.projects.push({ ...s.projects[0], id: "p2" });
    expect(SiteSchema.safeParse(s).success).toBe(false);
  });

  it("rejects duplicate project ids", () => {
    const s = minimalSite();
    s.projects.push({ ...s.projects[0], slug: "other" });
    expect(SiteSchema.safeParse(s).success).toBe(false);
  });

  it("rejects image paths outside /uploads/", () => {
    const s = minimalSite() as ReturnType<typeof minimalSite> & {
      projects: { image?: string }[];
    };
    s.projects[0].image = "/etc/passwd.png";
    expect(SiteSchema.safeParse(s).success).toBe(false);
    s.projects[0].image = "/uploads/shot.webp";
    expect(SiteSchema.safeParse(s).success).toBe(true);
  });

  it("rejects an unknown accent", () => {
    const s = minimalSite();
    (s.settings as { accent: string }).accent = "pink";
    expect(SiteSchema.safeParse(s).success).toBe(false);
  });

  it("rejects a too-long headline", () => {
    const s = minimalSite();
    s.profile.headline = "x".repeat(121);
    expect(SiteSchema.safeParse(s).success).toBe(false);
  });

  it("rejects unknown keys, so a stray phone field can never slip in", () => {
    const s = minimalSite();
    (s.profile as Record<string, unknown>).phone = "123";
    expect(SiteSchema.safeParse(s).success).toBe(false);
  });
  it("accepts kind and highlights on a project", () => {
    const s = minimalSite() as ReturnType<typeof minimalSite> & {
      projects: { kind?: string; highlights?: string[] }[];
    };
    s.projects[0].kind = "Computer vision";
    s.projects[0].highlights = ["YOLOv8", "ONNX"];
    expect(SiteSchema.safeParse(s).success).toBe(true);
  });

  it("rejects more than four highlights", () => {
    const s = minimalSite() as ReturnType<typeof minimalSite> & {
      projects: { highlights?: string[] }[];
    };
    s.projects[0].highlights = ["a", "b", "c", "d", "e"];
    expect(SiteSchema.safeParse(s).success).toBe(false);
  });

  it("rejects the retired cyan accent", () => {
    const s = minimalSite();
    (s.settings as { accent: string }).accent = "cyan";
    expect(SiteSchema.safeParse(s).success).toBe(false);
  });
});
