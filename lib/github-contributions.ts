// Reads the public contribution graph that github.com serves for every profile
// (https://github.com/users/<name>/contributions). No token needed. Pure parsing only, no network.

/** ISO date -> contributions that day. Days with none are left out, like the LeetCode calendar. */
export type Contributions = Record<string, number>;

const CELL = /<td\b[^>]*>/g;
const TOOLTIP = /<tool-tip\b([^>]*)>([^<]*)<\/tool-tip>/g;
const attr = (tag: string, name: string) => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];

export function parseContributions(html: string): Contributions {
  // the count lives in a tooltip that points at its cell by id: "4 contributions on March 1st."
  const counts = new Map<string, number>();
  for (const [, attrs, text] of html.matchAll(TOOLTIP)) {
    const target = attr(attrs, "for");
    const n = /^([\d,]+) contributions?\b/.exec(text.trim())?.[1];
    if (target && n) counts.set(target, Number(n.replace(/,/g, "")));
  }

  const out: Contributions = {};
  for (const [tag] of html.matchAll(CELL)) {
    const date = attr(tag, "data-date");
    const id = attr(tag, "id");
    const count = id ? counts.get(id) : undefined;
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && count) out[date] = count;
  }
  return out;
}
