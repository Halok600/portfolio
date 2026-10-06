import { readFileSync } from "node:fs";
import path from "node:path";
import { LeetcodeSchema, SiteSchema } from "../lib/schema";

type Checkable = {
  safeParse: (v: unknown) => {
    success: boolean;
    error?: { issues: { path: PropertyKey[]; message: string }[] };
  };
};

function check(file: string, schema: Checkable): boolean {
  const data: unknown = JSON.parse(readFileSync(path.join(process.cwd(), file), "utf8"));
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`INVALID ${file}`);
    for (const issue of result.error?.issues ?? []) {
      console.error(`  ${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`);
    }
    return false;
  }
  console.log(`ok ${file}`);
  return true;
}

const ok = [
  check("content/site.json", SiteSchema),
  check("data/leetcode.json", LeetcodeSchema),
];
process.exit(ok.every(Boolean) ? 0 : 1);
