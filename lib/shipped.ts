import { cacheLife } from "next/cache";
import { site } from "@/lib/content";
import {
  allowedRepos, firstLine, groupPushes, isNoise, repoFromUrl, type PushEvent, type Shipped,
} from "@/lib/github-activity";

const API = "https://api.github.com";

function headers(): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "portfolio-site",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  // optional: a token only raises the rate limit, the strip works without it
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

/**
 * The latest meaningful push to each project repo, newest first (at most four).
 * Cached for about an hour. Any failure returns [] so a GitHub outage can never break a build or a page.
 */
export async function getShipped(): Promise<Shipped[]> {
  "use cache";
  cacheLife("hours");

  try {
    const owner = repoFromUrl(`${site.profile.links.github}/x`)?.split("/")[0];
    if (!owner) return [];

    const res = await fetch(`${API}/users/${owner}/events/public?per_page=100`, { headers: headers() });
    if (!res.ok) return [];
    const events = (await res.json()) as PushEvent[];

    // The events feed has no commit messages any more, so look commits up. Per repo, walk its
    // recent pushes (newest first) until one is real work. At most 6 repos x 3 pushes = 18 calls.
    const groups = groupPushes(events, allowedRepos(site), { perRepo: 3, maxRepos: 6 });
    const found = await Promise.all(
      groups.map(async (g): Promise<Shipped | null> => {
        for (const p of g.pushes) {
          const r = await fetch(`${API}/repos/${g.repo}/commits/${p.head}`, { headers: headers() });
          if (!r.ok) continue;
          const c = (await r.json()) as { html_url: string; commit: { message: string } };
          const message = firstLine(c.commit.message);
          if (!isNoise(message)) return { repo: g.repo.split("/")[1], message, url: c.html_url, at: p.at };
        }
        return null;
      }),
    );
    return found
      .filter((x): x is Shipped => x !== null)
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, 4);
  } catch {
    return [];
  }
}
