import rawLeetcode from "@/data/leetcode.json";
import rawSite from "@/content/site.json";
import {
  LeetcodeSchema, SiteSchema,
  type Leetcode, type Project, type Section, type Site,
} from "@/lib/schema";

export const site: Site = SiteSchema.parse(rawSite);
export const leetcode: Leetcode = LeetcodeSchema.parse(rawLeetcode);

export function visibleSections(): Section[] {
  return site.sections.filter((s) => s.visible);
}

export function featuredProjects(): Project[] {
  return site.projects.filter((p) => p.visible && p.featured);
}

export function gridProjects(): Project[] {
  return site.projects.filter((p) => p.visible && !p.featured);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}
