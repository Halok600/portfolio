import { cacheLife } from "next/cache";
import { site } from "@/lib/content";
import { allowedRepos, pickCommit, type ApiCommit, type Shipped } from "@/lib/github-activity";

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
 * The latest real-work commit in each project repo, newest first (at most four).
 * Cached for about an hour. Any failure returns [] so a GitHub outage can never break a build or a page.
 * (One request per repo, at most 8 repos, well inside GitHub's anonymous limit of 60 an hour.)
 */
export async function getShipped(): Promise<Shipped[]> {
  "use cache";
  cacheLife("hours");

  try {
    const repos = [...allowedRepos(site)].slice(0, 8);
    const found = await Promise.all(
      repos.map(async (repo): Promise<Shipped | null> => {
        const res = await fetch(`${API}/repos/${repo}/commits?per_page=10`, { headers: headers() });
        if (!res.ok) return null;
        const picked = pickCommit((await res.json()) as ApiCommit[]);
        // report the repo's real casing from the commit URL (github.com/Owner/Name/commit/sha)
        const name = picked ? picked.url.split("/")[4] : repo.split("/")[1];
        return picked ? { repo: name, ...picked } : null;
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
