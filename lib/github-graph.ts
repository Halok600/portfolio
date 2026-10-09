import { cacheLife } from "next/cache";
import { site } from "@/lib/content";
import { profileName } from "@/lib/github-activity";
import { parseContributions, type Contributions } from "@/lib/github-contributions";

export type GithubGraph = { calendar: Contributions; asOf: string; username: string };

/**
 * The past year of GitHub contributions, read from the public graph every profile serves (no token).
 * Cached for an hour; a failure is cached for only a few minutes so an outage heals quickly.
 * Returns null on any failure so the graph is simply left out and a build can never break.
 */
export async function getGithubGraph(): Promise<GithubGraph | null> {
  "use cache";

  let graph: GithubGraph | null = null;
  try {
    const username = profileName(site.profile.links.github);
    if (username) {
      const res = await fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions`, {
        headers: { Accept: "text/html", "User-Agent": "portfolio-site" },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const calendar = parseContributions(await res.text());
        // an empty result means the page changed shape or was a rate-limit page, not a quiet year
        if (Object.keys(calendar).length > 0) {
          graph = { calendar, asOf: new Date().toISOString().slice(0, 10), username };
        }
      }
    }
  } catch {
    graph = null;
  }

  if (graph) cacheLife("hours");
  else cacheLife({ stale: 300, revalidate: 300, expire: 600 });
  return graph;
}
