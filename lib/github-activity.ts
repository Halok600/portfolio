// Pure helpers for the "Recently shipped" strip. No network here, so they are easy to test.
import type { Site } from "@/lib/schema";

export type Shipped = { repo: string; message: string; url: string; at: string };

export type PushEvent = {
  type: string;
  repo: { name: string };
  created_at: string;
  payload: { head?: string };
};

const DAY = 86_400_000;

/** "https://github.com/Owner/Name/" -> "owner/name", or null when it is not a repo URL. */
export function repoFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const [owner, name] = u.pathname.split("/").filter(Boolean);
    return owner && name ? `${owner}/${name}`.toLowerCase() : null;
  } catch {
    return null;
  }
}

/** Repos the strip may show: visible projects on the site, plus this portfolio itself. */
export function allowedRepos(site: Site): Set<string> {
  const set = new Set<string>();
  for (const p of site.projects) {
    if (!p.visible || !p.links.github) continue;
    const r = repoFromUrl(p.links.github);
    if (r) set.add(r);
  }
  const owner = repoFromUrl(`${site.profile.links.github}/portfolio`)?.split("/")[0];
  if (owner) set.add(`${owner}/portfolio`);
  return set;
}

export type PushGroup = { repo: string; pushes: { head: string; at: string }[] };

/**
 * Allowed pushes grouped by repo. Repos are ordered by their newest push, and each repo keeps
 * its newest few pushes (newest first), so a noisy latest commit can fall back to an earlier one.
 */
export function groupPushes(
  events: PushEvent[],
  allowed: Set<string>,
  { perRepo, maxRepos }: { perRepo: number; maxRepos: number },
): PushGroup[] {
  const groups = new Map<string, PushGroup>();
  const pushes = events
    .filter((e) => e.type === "PushEvent" && e.payload.head && allowed.has(e.repo.name.toLowerCase()))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  for (const e of pushes) {
    const key = e.repo.name.toLowerCase();
    let g = groups.get(key);
    if (!g) {
      if (groups.size >= maxRepos) continue;
      g = { repo: e.repo.name, pushes: [] };
      groups.set(key, g);
    }
    if (g.pushes.length < perRepo) g.pushes.push({ head: e.payload.head as string, at: e.created_at });
  }
  return [...groups.values()];
}

/** Housekeeping commits that say nothing about what was built. */
export function isNoise(message: string): boolean {
  return (
    /^(chore|docs|ci|style|test|build)(\([^)]*\))?!?:/i.test(message) ||
    /^(merge|wip|initial commit)\b/i.test(message) ||
    /^(add|update|create|edit|fix)\s+(an?\s+)?(mit\s+)?(licen[cs]e|readme|\.gitignore|gitignore)/i.test(message)
  );
}

export function firstLine(message: string, max = 90): string {
  const line = message.split("\n")[0].trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

const utcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

export function relativeTime(iso: string, now: Date): string {
  const days = Math.max(0, Math.round((utcDay(now) - utcDay(new Date(iso))) / DAY));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export function isFresh(iso: string, now: Date, maxAgeDays: number): boolean {
  return now.getTime() - Date.parse(iso) <= maxAgeDays * DAY;
}
