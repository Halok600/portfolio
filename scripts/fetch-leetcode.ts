// Refreshes data/leetcode.json from LeetCode's public GraphQL endpoint.
// Usage: npm run fetch-leetcode            (username comes from content/site.json)
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { LeetcodeSchema, SiteSchema } from "../lib/schema";
import { buildLeetcodeData, QUERY, type ApiResponse } from "./leetcode-data";

async function main() {
  const root = process.cwd();
  const site = SiteSchema.parse(JSON.parse(readFileSync(path.join(root, "content/site.json"), "utf8")));
  const username = new URL(site.profile.links.leetcode).pathname.split("/").filter(Boolean).pop();
  if (!username) throw new Error("Could not read the LeetCode username from profile.links.leetcode");

  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
    body: JSON.stringify({ query: QUERY, variables: { u: username } }),
  });
  if (!res.ok) throw new Error(`LeetCode responded with HTTP ${res.status}`);

  const data = buildLeetcodeData((await res.json()) as ApiResponse, new Date());
  LeetcodeSchema.parse(data); // never write something the site would reject

  const file = path.join(root, "data/leetcode.json");
  const before = (() => {
    try { return JSON.parse(readFileSync(file, "utf8")); } catch { return null; }
  })();
  // ignore the timestamp so an unchanged profile does not create a commit
  const strip = (o: Record<string, unknown> | null) => (o ? { ...o, fetchedAt: undefined } : o);
  if (JSON.stringify(strip(before)) === JSON.stringify(strip(data as unknown as Record<string, unknown>))) {
    console.log("LeetCode data unchanged; file left as is.");
    return;
  }
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Updated data/leetcode.json: ${data.solved} solved, ${data.activeDays} active days in the past year.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
