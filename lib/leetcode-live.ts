import { cacheLife } from "next/cache";
import { leetcode as committed, site } from "@/lib/content";
import { profileName } from "@/lib/github-activity";
import { LeetcodeSchema, type Leetcode } from "@/lib/schema";
import { buildLeetcodeData, QUERY, type ApiResponse } from "@/scripts/leetcode-data";

/**
 * LeetCode stats fetched live from its public GraphQL endpoint, cached for an hour.
 * Any failure falls back to data/leetcode.json (kept fresh by the daily Action), so the section never breaks.
 * `live` says which one the page is showing.
 */
export async function getLeetcode(): Promise<{ data: Leetcode; live: boolean }> {
  "use cache";

  let data: Leetcode | null = null;
  try {
    const username = profileName(site.profile.links.leetcode);
    if (username) {
      const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
        body: JSON.stringify({ query: QUERY, variables: { u: username } }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        // never show something the schema would reject
        data = LeetcodeSchema.parse(buildLeetcodeData((await res.json()) as ApiResponse, new Date()));
      }
    }
  } catch {
    data = null;
  }

  if (data) cacheLife("hours");
  else cacheLife({ stale: 300, revalidate: 300, expire: 600 });
  return { data: data ?? committed, live: data !== null };
}
