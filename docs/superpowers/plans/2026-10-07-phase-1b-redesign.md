# Portfolio Phase 1b — Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the template-looking presentation layer with the approved "detection box" design, keeping every piece of content, the content schema, the tests and the deployment.

**Architecture:** Same data flow as Phase 1 (JSON → Zod → static server components). Only the presentation changes: a bespoke global stylesheet ported from the approved prototype, three Google fonts, and four small client islands (theme toggle, Noida clock, scroll ruler, work index). Everything else stays a static server component.

**Tech Stack:** Next.js 16.4 (Cache Components, static), React 19.3, TypeScript, plain CSS (global) + Tailwind preflight, `next/font/google`, Zod 4, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-07-portfolio-design.md` (§7 is superseded by this plan and the prototype)
**Design reference (approved by Priyanshu, 7 Oct 2026):** `docs/design/prototype/index.html` — open it in a browser. Markup and CSS are ported from it; where this plan says "port", copy from that file.

## Global Constraints

- **Priyanshu is the sole contributor.** Every commit uses `Priyanshu Kumar Tiwari <143282195+Halok600@users.noreply.github.com>` and carries **no** `Co-Authored-By`, no "Generated with" line, no mention of any tool. Before pushing: `git log --all --format='%an <%ae>%n%cn <%ce>' | sort -u` must print exactly one line and `git log --all --format=%B | grep -ci "co-authored-by\|claude\|anthropic"` must print 0.
- **No phone number** anywhere in data, code, repo or the published PDF (a test enforces it).
- No ISRO claim. India Space Lab stays "Embedded Systems Intern".
- LinkedIn is `https://www.linkedin.com/in/priyanshu0604`.
- Public pages stay **fully static** (no `cookies()`/`headers()`, no bare `new Date()` in server components).
- **No loading screen, no WebGL/3D, no auto-playing audio.** Motion must switch off under `prefers-reduced-motion`. Hover-only effects must have a keyboard (`:focus-visible`) equivalent. Lighthouse mobile target stays **95+** in all four categories.
- Contrast: small text must meet 4.5:1 in both themes. The accent colour is used for fills, lines and *large* numerals only, never for small body text.
- Do not show WeaponShield's or MedFusionAI's demo links. Enagram's live link is kept but its screenshot is not used as a figure (it is a login screen).
- Read `node_modules/next/dist/docs/` before using any Next API not shown in this plan.

## File Structure

```
app/layout.tsx            fonts, theme init script, skip link, <Header/>
app/globals.css           ported prototype CSS + section CSS
app/not-found.tsx         restyled
components/
  Header.tsx              brand, <Ruler/>, <LocalTime/>, <ThemeToggle/>, résumé link
  Ruler.tsx               client: scroll ruler
  LocalTime.tsx           client: Noida clock (IST)
  ThemeToggle.tsx         client: dark/light
  Reveal.tsx              client: scroll-reveal wrapper
  Inline.tsx              <RichText/> (bold) + <Emph/> (serif italic)
  SectionHead.tsx         the ruled section header row
  SectionRenderer.tsx     registry (rewritten)
  sections/Hero.tsx  Work.tsx  AlsoBuilt.tsx  Experience.tsx  Dsa.tsx
            Skills.tsx  Achievements.tsx  Education.tsx  Contact.tsx
  work/WorkIndex.tsx      client: the index rows, lock-on box, cursor figure, accordion
lib/schema.ts             + role, kind, highlights, new accent presets
lib/rich.ts               + parseEmphasis
lib/facts.ts              buildFacts()
public/uploads/polyo.jpg aerial.jpg
docs/design/prototype/    approved reference (already committed in Task 0)
```

Deleted at the end (Task 7): `components/ui.tsx`, `components/RichText.tsx`, and the old section files.

---

### Task 0: Commit the reference

- [ ] **Step 1: Commit the prototype and this plan**

```bash
git add docs/design docs/superpowers/plans/2026-10-07-phase-1b-redesign.md
git commit -m "docs: approved design prototype and redesign plan"
```

---

### Task 1: Schema additions and seed content (TDD)

**Files:** Modify `lib/schema.ts`, `lib/schema.test.ts`, `lib/content.test.ts`, `content/site.json`. Create `public/uploads/polyo.jpg`, `public/uploads/aerial.jpg`.

**Interfaces — Produces:**
- `ACCENTS = ["signal","ultraviolet","amber","mint","rose","ice"]`
- `Site["profile"]["role"]: string` (short job title, used for `<title>`)
- `Project["kind"]?: string` (≤40), `Project["highlights"]?: string[]` (≤4 items, ≤30 chars each)

- [ ] **Step 1: Update the tests first** — in `lib/schema.test.ts`: set `settings.accent` to `"signal"` in `minimalSite()`, add `role: "Engineer"` to `profile`, add these tests inside `describe("SiteSchema")`:

```ts
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
```

In `lib/content.test.ts` add inside `describe("seed content")`:

```ts
  it("gives every visible project a kind", () => {
    for (const p of site.projects.filter((x) => x.visible)) {
      expect(p.kind, p.title).toBeTruthy();
    }
  });

  it("only references figure images that exist on disk", () => {
    for (const p of site.projects) {
      if (p.image) {
        expect(existsSync(path.join(process.cwd(), "public", p.image)), p.image).toBe(true);
      }
    }
  });

  it("uses the signal accent and a role title", () => {
    expect(site.settings.accent).toBe("signal");
    expect(site.profile.role).toBe("AI/ML Engineer");
  });
```

and add `existsSync` to the `node:fs` import at the top of that file.

- [ ] **Step 2: Run, expect FAIL**

Run: `npx vitest run lib/schema.test.ts lib/content.test.ts`
Expected: failures (unknown key `role`, accent `signal` invalid, etc.).

- [ ] **Step 3: Edit `lib/schema.ts`**

Change `ACCENTS` to `["signal", "ultraviolet", "amber", "mint", "rose", "ice"] as const`. In `Project` add after `oneLiner`:

```ts
  kind: text(40).optional(),
  highlights: z.array(text(30)).max(4).optional(),
```

In `profile` add after `headline`: `role: text(60),`.

- [ ] **Step 4: Copy the two figures**

```bash
mkdir -p public/uploads
cp docs/design/prototype/img/polyo.jpg docs/design/prototype/img/aerial.jpg public/uploads/
```

(No Enagram figure: its live page is a Google sign-in screen.)

- [ ] **Step 5: Update `content/site.json`** with this script (run from the repo root):

```bash
python - <<'EOF'
import json, pathlib
p = pathlib.Path("content/site.json")
d = json.loads(p.read_text(encoding="utf-8"))
d["settings"]["accent"] = "signal"
pr = d["profile"]
pr["role"] = "AI/ML Engineer"
pr["headline"] = "AI/ML engineer building systems that _see_, _read code_ and _ship_."
pr["tagline"] = ("I train the model, then build the service around it: a drone tracker that runs in "
                 "your browser, a static analyser that predicts Big-O, an agent over your inbox.")
titles = {"featured": "Selected work", "projects": "Also built", "dsa": "Problem solving"}
for s in d["sections"]:
    if s["id"] in titles: s["title"] = titles[s["id"]]
meta = {
  "polyo": ("Developer tool · ML", ["tree-sitter", "GNN", "FastAPI"], "/uploads/polyo.jpg"),
  "aerial-guardian": ("Computer vision", ["YOLOv8", "ByteTrack", "ONNX Web"], "/uploads/aerial.jpg"),
  "enagram": ("AI agent", ["pgvector", "RAG", "OAuth"], None),
  "weaponshield": ("Computer vision", ["YOLOv8", "ONNX Runtime", "FastAPI"], None),
  "medfusion": ("Medical imaging", ["Transformer", "CNN"], None),
  "drone-tilt-detection": ("Embedded ML", ["TFLite", "ESP32-S3"], None),
  "leehint": ("Browser extension", ["Gemini", "Chrome"], None),
  "reddit-insights": ("NLP", ["RoBERTa", "LDA"], None),
}
for proj in d["projects"]:
    kind, hl, img = meta[proj["id"]]
    proj["kind"], proj["highlights"] = kind, hl
    if img: proj["image"] = img
p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("ok")
EOF
```

- [ ] **Step 6: Run, expect PASS**

Run: `npx vitest run && npm run validate-content`
Expected: all tests pass, both files `ok`.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: schema role, kind, highlights and new accent presets; reseed content"
```

---

### Task 2: Inline emphasis parser and derived facts (TDD)

**Files:** Modify `lib/rich.ts`, `lib/rich.test.ts`. Create `lib/facts.ts`, `lib/facts.test.ts`.

**Interfaces — Produces:**
- `parseEmphasis(input: string): { text: string; em: boolean }[]` — `_word_` becomes an em span; underscores inside words (`snake_case`) are left alone.
- `buildFacts(site: Site, lc: Leetcode): { value: string; label: string }[]`

- [ ] **Step 1: Tests** — append to `lib/rich.test.ts`:

```ts
import { parseEmphasis } from "@/lib/rich";

describe("parseEmphasis", () => {
  it("returns plain text unchanged", () => {
    expect(parseEmphasis("plain")).toEqual([{ text: "plain", em: false }]);
  });

  it("marks _words_ as emphasis", () => {
    expect(parseEmphasis("that _see_, _read code_ and _ship_.")).toEqual([
      { text: "that ", em: false },
      { text: "see", em: true },
      { text: ", ", em: false },
      { text: "read code", em: true },
      { text: " and ", em: false },
      { text: "ship", em: true },
      { text: ".", em: false },
    ]);
  });

  it("leaves underscores inside identifiers alone", () => {
    expect(parseEmphasis("use snake_case_names")).toEqual([
      { text: "use snake_case_names", em: false },
    ]);
  });
});
```

`lib/facts.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildFacts } from "@/lib/facts";
import { leetcode, site } from "@/lib/content";

describe("buildFacts", () => {
  it("derives three facts from the seed", () => {
    const f = buildFacts(site, leetcode);
    expect(f.map((x) => x.value)).toEqual(["603 solved", "3 live projects", "India Space Lab"]);
    expect(f[0].label).toBe("LeetCode · 70 Hard");
    expect(f[1].label).toBe("PolyO · The Aerial Guardian · Enagram.io");
    expect(f[2].label).toBe("Embedded Systems Intern");
  });

  it("drops the LeetCode fact when it is switched off", () => {
    const off = { ...site, dsa: { ...site.dsa, show: { ...site.dsa.show, solved: false } } };
    expect(buildFacts(off, leetcode).map((x) => x.value)).not.toContain("603 solved");
  });

  it("skips hidden experience", () => {
    const hidden = { ...site, experience: site.experience.map((e) => ({ ...e, visible: false })) };
    expect(buildFacts(hidden, leetcode)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run, expect FAIL** — `npx vitest run lib/rich.test.ts lib/facts.test.ts`

- [ ] **Step 3: Implement** — append to `lib/rich.ts`:

```ts
export type EmSpan = { text: string; em: boolean };

export function parseEmphasis(input: string): EmSpan[] {
  const out: EmSpan[] = [];
  const re = /(?<![\w])_([^_]+?)_(?![\w])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    if (m.index > last) out.push({ text: input.slice(last, m.index), em: false });
    out.push({ text: m[1], em: true });
    last = m.index + m[0].length;
  }
  if (last < input.length) out.push({ text: input.slice(last), em: false });
  return out;
}
```

`lib/facts.ts`:

```ts
import type { Leetcode, Site } from "@/lib/schema";

export type Fact = { value: string; label: string };

export function buildFacts(site: Site, lc: Leetcode): Fact[] {
  const facts: Fact[] = [];
  if (site.dsa.show.solved) {
    facts.push({ value: `${lc.solved} solved`, label: `LeetCode · ${lc.hard} Hard` });
  }
  const live = site.projects.filter((p) => p.visible && p.links.live);
  if (live.length > 0) {
    facts.push({
      value: `${live.length} live project${live.length === 1 ? "" : "s"}`,
      label: live.map((p) => p.title).join(" · "),
    });
  }
  const job = site.experience.find((e) => e.visible);
  if (job) facts.push({ value: job.org, label: job.role });
  return facts;
}
```

- [ ] **Step 4: Run, expect PASS** — `npx vitest run`

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: emphasis parser and derived hero facts"`

---

### Task 3: Foundation — fonts, global CSS, header, theme, clock, ruler

**Files:** Rewrite `app/layout.tsx`, `app/globals.css`, `app/not-found.tsx`, `components/Header.tsx`, `components/ThemeToggle.tsx`. Create `components/Ruler.tsx`, `components/LocalTime.tsx`, `components/Reveal.tsx`, `components/Inline.tsx`, `components/SectionHead.tsx`.

**Interfaces — Produces:**
- CSS custom properties `--bg --fg --mut --line --acc --on-acc --grain`, themes selected by `html[data-theme]`, accents by `html[data-accent]`.
- `<SectionHead id title note?>` renders `<div class="sh"><h2>…</h2><span class="mono">note</span></div>`.
- `<Reveal className?>{children}</Reveal>` adds class `rv`, then `in` when 12% visible.
- `<RichText text>` (bold, from Task 6 of Phase 1) and `<Emph text>` (serif italic) exported from `components/Inline.tsx`.

- [ ] **Step 1: Build `app/globals.css`**

```bash
python - <<'EOF'
import re, pathlib
src = pathlib.Path("docs/design/prototype/index.html").read_text(encoding="utf-8")
css = re.search(r"<style>(.*?)</style>", src, re.S).group(1)
# the prototype loads fonts from a <link>; the app uses next/font variables instead
css = css.replace('"Bricolage Grotesque"', 'var(--font-display)').replace('"JetBrains Mono"', 'var(--font-mono)').replace('"Instrument Serif"', 'var(--font-serif)')
# data-theme selectors: the prototype uses :root,[data-theme="dark"]; keep as is
accents = '''
/* accent presets: dark value first, light value second */
[data-accent="signal"]      { --acc-d: #d4ff3a; --acc-l: #ff4b1f; }
[data-accent="ultraviolet"] { --acc-d: #b69cff; --acc-l: #5b2bff; }
[data-accent="amber"]       { --acc-d: #ffb020; --acc-l: #d9480f; }
[data-accent="mint"]        { --acc-d: #3df5a8; --acc-l: #00875a; }
[data-accent="rose"]        { --acc-d: #ff6fa5; --acc-l: #d6246e; }
[data-accent="ice"]         { --acc-d: #7fd4ff; --acc-l: #0a66c2; }
:root, [data-theme="dark"]  { --acc: var(--acc-d, #d4ff3a); }
[data-theme="light"]        { --acc: var(--acc-l, #ff4b1f); }
'''
out = '@import "tailwindcss";\n' + css + accents
pathlib.Path("app/globals.css").write_text(out, encoding="utf-8")
print("css lines:", out.count("\n"))
EOF
```

Then **append** the section CSS from Step 2 below to the end of `app/globals.css`.

- [ ] **Step 2: Section CSS to append** (experience, education, skills, achievements, skip link, more list):

```css
/* ---------- skip link / utilities ---------- */
.skip { position: absolute; left: 12px; top: -60px; z-index: 100; background: var(--acc); color: var(--on-acc); padding: 8px 14px; border-radius: 99px; }
.skip:focus { top: 10px; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* ---------- experience / education datasheet ---------- */
.xp { display: grid; grid-template-columns: minmax(150px, 230px) 1fr; gap: 14px clamp(24px, 5vw, 80px); padding: clamp(22px, 3vw, 40px) 0; border-bottom: 1px solid var(--line); }
.xp .when { color: var(--mut); display: grid; gap: 6px; align-content: start; }
.xp h3 { font-size: clamp(28px, 4vw, 64px); font-weight: 500; letter-spacing: -.045em; line-height: .98; font-variation-settings: "opsz" 96; }
.xp .role { font-family: var(--font-serif), serif; font-style: italic; font-size: clamp(20px, 2vw, 30px); margin-top: 8px; }
.xp ul { list-style: none; margin-top: 22px; display: grid; gap: 14px; max-width: 72ch; color: var(--mut); line-height: 1.5; font-size: 16px; }
.xp li { display: grid; grid-template-columns: 22px 1fr; }
.xp li::before { content: "—"; font-family: var(--font-mono), monospace; color: var(--acc); }
.xp li strong { color: var(--fg); font-weight: 600; }
.xp .lnk { display: inline-block; margin-top: 18px; border-bottom: 1px solid var(--line); transition: color .2s, border-color .2s; }
.xp .lnk:hover { color: var(--acc); border-color: var(--acc); }
.xp.small h3 { font-size: clamp(22px, 2.4vw, 36px); }

/* ---------- skills ---------- */
.sk { display: grid; grid-template-columns: minmax(150px, 230px) 1fr; gap: 10px clamp(24px, 5vw, 80px); padding: 18px 0; border-bottom: 1px solid var(--line); }
.sk dt { color: var(--mut); text-transform: uppercase; letter-spacing: .08em; }
.sk dd { display: flex; flex-wrap: wrap; font-size: clamp(16px, 1.5vw, 21px); letter-spacing: -.01em; line-height: 1.5; }
.sk dd span:not(:last-child)::after { content: "/"; margin: 0 .6em; color: var(--mut); }

/* ---------- achievements ---------- */
.ac { display: grid; grid-template-columns: minmax(150px, 230px) 1fr; gap: 10px clamp(24px, 5vw, 80px); padding: 20px 0; border-bottom: 1px solid var(--line); }
.ac b { font-weight: 500; font-size: 18px; }
.ac p { color: var(--mut); max-width: 62ch; }

/* ---------- also built ---------- */
.ab { display: grid; grid-template-columns: 56px minmax(0, 1fr) minmax(170px, 270px) auto; gap: 18px; align-items: baseline; padding: 18px 0; border-bottom: 1px solid var(--line); }
.ab h3 { font-size: clamp(22px, 2.4vw, 34px); font-weight: 500; letter-spacing: -.035em; }
.ab .meta, .ab .idx { color: var(--mut); }
.ab .lk { display: flex; gap: 14px; }
.ab .lk a { border-bottom: 1px solid var(--line); transition: color .2s, border-color .2s; }
.ab .lk a:hover { color: var(--acc); border-color: var(--acc); }

/* ---------- work detail (accordion body) ---------- */
.detail { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .5s cubic-bezier(.2,.8,.2,1); }
.detail.open { grid-template-rows: 1fr; }
.detail > div { overflow: hidden; }
.detail .in { display: grid; grid-template-columns: 56px minmax(0, 1fr) minmax(170px, 270px); gap: 18px; padding: 8px 0 clamp(24px, 3vw, 40px); }
.detail ul { grid-column: 2; list-style: none; display: grid; gap: 14px; max-width: 72ch; color: var(--mut); line-height: 1.5; }
.detail li { display: grid; grid-template-columns: 22px 1fr; }
.detail li::before { content: "—"; font-family: var(--font-mono), monospace; color: var(--acc); }
.detail li strong { color: var(--fg); font-weight: 600; }
.detail .side { grid-column: 3; display: grid; gap: 14px; align-content: start; }
.detail .side a { border-bottom: 1px solid var(--line); justify-self: start; transition: color .2s, border-color .2s; }
.detail .side a:hover { color: var(--acc); border-color: var(--acc); }
.detail .stk { color: var(--mut); line-height: 1.6; }
.rv { will-change: opacity, transform; }
noscript .rv, .no-js .rv { opacity: 1; transform: none; }

@media (max-width: 820px) {
  .xp, .sk, .ac { grid-template-columns: 1fr; }
  .ab { grid-template-columns: 34px 1fr; }
  .ab .meta { grid-column: 2; } .ab .lk { grid-column: 2; }
  .detail .in { grid-template-columns: 34px 1fr; }
  .detail ul, .detail .side { grid-column: 2; }
}
```

- [ ] **Step 3: `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { site } from "@/lib/content";

const display = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz"], variable: "--font-display" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: `${site.profile.name} — ${site.profile.role}`,
  description: site.profile.tagline,
};

// Runs before first paint so there is no theme flash. defaultTheme is a
// schema-validated enum, so interpolating it is safe.
const themeScript = `(function(){var d=document.documentElement;try{var s=localStorage.getItem("theme");var t=(s==="light"||s==="dark")?s:(matchMedia("(prefers-color-scheme: light)").matches?"light":(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"${site.settings.defaultTheme}"));d.dataset.theme=t}catch(e){d.dataset.theme="${site.settings.defaultTheme}"}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme={site.settings.defaultTheme}
      data-accent={site.settings.accent}
      className={`${display.variable} ${serif.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip mono" href="#main">Skip to content</a>
        <Header />
        {children}
      </body>
    </html>
  );
}
```

Note: the prototype defaulted to dark regardless of system; the script above (kept from Phase 1) follows the visitor's system setting on a first visit, which is deliberate.

- [ ] **Step 4: `components/ThemeToggle.tsx`** — port from Phase 1 (same `useSyncExternalStore` on `data-theme`), but render the prototype's markup:

```tsx
"use client";

import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

function subscribe(onChange: () => void) {
  const o = new MutationObserver(onChange);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => o.disconnect();
}
const getTheme = (): Theme | null => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
const getServerTheme = (): Theme | null => null;

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);
  const next: Theme = theme === "light" ? "dark" : "light";

  function toggle() {
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch { /* not persisted in private mode */ }
  }

  return (
    <button className="tgl" type="button" onClick={toggle} aria-label={theme ? `Switch to ${next} theme` : "Toggle theme"}>
      ◐ <span>{theme ? (next === "light" ? "Light" : "Dark") : "Theme"}</span>
    </button>
  );
}
```

- [ ] **Step 5: `components/LocalTime.tsx`**

```tsx
"use client";

import { useSyncExternalStore } from "react";

const TZ = "Asia/Kolkata"; // Noida

const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 15_000);
  return () => clearInterval(id);
}
const getTime = () => fmt.format(new Date());
const getServerTime = () => "--:--";

export function LocalTime({ city, className }: { city: string; className?: string }) {
  const t = useSyncExternalStore(subscribe, getTime, getServerTime);
  return <span className={className} suppressHydrationWarning>{city} {t} IST</span>;
}
```

- [ ] **Step 6: `components/Ruler.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";

const N = 28;

export function Ruler() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ticks = Array.from(ref.current?.children ?? []) as HTMLElement[];
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      const cur = Math.min(N - 1, Math.round(p * (N - 1)));
      ticks.forEach((t, i) => { t.className = i < cur ? "on" : i === cur ? "cur" : ""; });
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="ruler" ref={ref} aria-hidden="true">
      {Array.from({ length: N }, (_, i) => <i key={i} />)}
    </div>
  );
}
```

- [ ] **Step 7: `components/Header.tsx`**

```tsx
import { site } from "@/lib/content";
import { LocalTime } from "@/components/LocalTime";
import { Ruler } from "@/components/Ruler";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const city = site.profile.location.split(",")[0];
  return (
    <header className="top">
      <div className="wrap">
        <div className="brand mono"><span className="dot" aria-hidden="true" /><span>{site.profile.name}</span></div>
        <Ruler />
        <div className="actions mono">
          <LocalTime city={city} className="time" />
          <ThemeToggle />
          <a className="cta" href={site.profile.resumePdf}>Résumé ↓</a>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 8: `components/Reveal.tsx`, `components/Inline.tsx`, `components/SectionHead.tsx`**

```tsx
// components/Reveal.tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`rv ${className}`}>{children}</div>;
}
```

```tsx
// components/Inline.tsx
import { parseBold, parseEmphasis } from "@/lib/rich";

export function RichText({ text }: { text: string }) {
  return (
    <>
      {parseBold(text).map((s, i) => (s.bold ? <strong key={i}>{s.text}</strong> : <span key={i}>{s.text}</span>))}
    </>
  );
}

export function Emph({ text }: { text: string }) {
  return (
    <>
      {parseEmphasis(text).map((s, i) => (s.em ? <em key={i}>{s.text}</em> : <span key={i}>{s.text}</span>))}
    </>
  );
}
```

```tsx
// components/SectionHead.tsx
export function SectionHead({ id, title, note }: { id: string; title: string; note?: string }) {
  return (
    <div className="sh">
      <h2 id={`${id}-title`}>{title}</h2>
      {note && <span className="mono">{note}</span>}
    </div>
  );
}
```

- [ ] **Step 9: Restyle `app/not-found.tsx`** using classes `wrap`, `mono`, `btn solid` (heading "That page doesn&apos;t exist." must be kept for the e2e test).

- [ ] **Step 10: Verify** — `npm run typecheck && npm run lint` (sections still old at this point; expect type errors only from files that import the removed `components/ui.tsx` *if* it was already deleted. Do not delete it yet). Commit: `git add -A && git commit -m "feat: redesign foundation: fonts, tokens, header, theme, clock, ruler"`.

---

### Task 4: Hero

**Files:** Create `components/sections/Hero.tsx` (replace). 

**Interfaces — Consumes:** `site`, `leetcode`, `buildFacts`, `Emph`. **Produces:** `<Hero/>` with `id="hero"`.

- [ ] **Step 1: Port** the hero markup from `docs/design/prototype/index.html` (`.hero` block). Data mapping:

| Prototype | Source |
|---|---|
| eyebrow left | `profile.status.text` (only if `status.show`) |
| eyebrow right | `profile.location` |
| H1 line 1 / line 2 | first word of `profile.name` / the rest, line 2 in `<span className="serif">`; `<h1 aria-label={profile.name}>` and `aria-hidden` on the two line spans |
| box label | `${profile.role.toLowerCase().split("/")[0]…}` — simply the literal text `engineer · id 01` |
| lead big text | `<Emph text={profile.headline} />` |
| side paragraph | `profile.tagline` |
| buttons | `Résumé ↓` → `profile.resumePdf` (`.btn.solid`); `Say hello ↗` → `mailto:${profile.email}` |
| facts | `buildFacts(site, leetcode)` as `<div><b>value</b><span>label</span></div>` inside `.facts.mono`; rendered only if non-empty |

Wrap in `<div className="wrap hero" id="hero">`; `<main id="main">` is added in `app/page.tsx`.

- [ ] **Step 2:** `npm run typecheck`. Commit: `git commit -am "feat: redesigned hero"` (add new files first).

---

### Task 5: Work index (client island) and Also built

**Files:** Create `components/work/WorkIndex.tsx`, `components/sections/Work.tsx`, `components/sections/AlsoBuilt.tsx`.

**Interfaces — Produces:**
- `<WorkIndex items={WorkItem[]} />` where

```ts
export type WorkItem = {
  id: string; title: string; kind: string; highlights: string[]; oneLiner: string;
  bullets: string[]; stack: string[]; links: { github?: string; live?: string };
  image?: string;
};
```

- [ ] **Step 1: `components/work/WorkIndex.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { RichText } from "@/components/Inline";

export type WorkItem = {
  id: string; title: string; kind: string; highlights: string[]; oneLiner: string;
  bullets: string[]; stack: string[]; links: { github?: string; live?: string };
  image?: string;
};

export function WorkIndex({ items }: { items: WorkItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const peekRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const capRef = useRef<HTMLSpanElement>(null);

  // cursor-following figure: pointer devices only, no React state per mouse move
  useEffect(() => {
    const root = rootRef.current, peek = peekRef.current, img = imgRef.current, cap = capRef.current;
    if (!root || !peek || !img || !cap) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    items.forEach((it) => { if (it.image) { const i = new Image(); i.src = it.image; } });

    let mx = 0, my = 0, px = 0, py = 0, active = false, raf = 0;
    const loop = () => {
      px += (mx - px) * 0.16; py += (my - py) * 0.16;
      const x = Math.min(px + 40, window.innerWidth - 380);
      const y = Math.max(py - 262, 66);
      peek.style.transform = `translate(${x}px,${y}px) rotate(${((mx - px) * 0.02).toFixed(2)}deg)`;
      raf = active ? requestAnimationFrame(loop) : 0;
    };
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; if (!active) { px = mx; py = my; } };
    const show = (row: HTMLElement) => {
      const src = row.dataset.img;
      if (!src) return hide();
      img.src = src; cap.textContent = row.dataset.cap ?? "";
      active = true; peek.classList.add("show"); if (!raf) loop();
    };
    const hide = () => { active = false; peek.classList.remove("show"); };
    const onOver = (e: MouseEvent) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>("[data-row]");
      if (row) show(row); else hide();
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    root.addEventListener("mouseover", onOver);
    root.addEventListener("mouseleave", hide);
    return () => {
      window.removeEventListener("mousemove", onMove);
      root.removeEventListener("mouseover", onOver);
      root.removeEventListener("mouseleave", hide);
      cancelAnimationFrame(raf);
    };
  }, [items]);

  return (
    <div className="index" ref={rootRef}>
      {items.map((it, n) => {
        const isOpen = open === it.id;
        const num = String(n + 1).padStart(2, "0");
        const host = it.links.live ? it.links.live.replace(/^https?:\/\//, "").replace(/\/$/, "") : it.title;
        return (
          <article key={it.id} className="item">
            <div className="row" data-row data-img={it.image} data-cap={host}>
              <span className="idx mono">{num}</span>
              <h3 className="ttl">
                <button type="button" className="hit" aria-expanded={isOpen} aria-controls={`d-${it.id}`}
                  onClick={() => setOpen(isOpen ? null : it.id)}>
                  {it.title}
                </button>
              </h3>
              <span className="meta mono"><span>{it.kind}</span><span>{it.highlights.join(" · ")}</span></span>
              <span className="arr" aria-hidden="true">{isOpen ? "−" : "+"}</span>
              <span className="sum"><p>{it.oneLiner}</p></span>
              <span className="box" aria-hidden="true"><b /><b /><b /><b /><span className="lab">id {num} · locked</span></span>
            </div>
            <div className={`detail${isOpen ? " open" : ""}`} id={`d-${it.id}`} role="region" aria-label={`${it.title} details`} hidden={!isOpen && false}>
              <div>
                <div className="in">
                  <ul>
                    {it.bullets.map((b, i) => <li key={i}><span><RichText text={b} /></span></li>)}
                  </ul>
                  <div className="side mono">
                    {it.links.live && <a href={it.links.live} target="_blank" rel="noopener noreferrer">Live ↗<span className="sr"> — {it.title}</span></a>}
                    {it.links.github && <a href={it.links.github} target="_blank" rel="noopener noreferrer">GitHub ↗<span className="sr"> — {it.title}</span></a>}
                    <span className="stk">{it.stack.join(" · ")}</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
      <div className="peek" ref={peekRef} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imgRef} alt="" src="" />
        <span className="cap" ref={capRef} />
      </div>
    </div>
  );
}
```

Required CSS tweaks (append to `app/globals.css`): the title button must stretch over the whole row and inherit title styling, and closed detail panels must not be focusable:

```css
.item { position: relative; }
.row .ttl { font: inherit; }              /* the h3 only carries the grid slot */
.row .hit { all: unset; display: block; cursor: crosshair; font-size: clamp(38px, 6.2vw, 108px); font-weight: 500; letter-spacing: -.045em; line-height: .92; font-variation-settings: "opsz" 96; transition: transform .5s cubic-bezier(.2,.8,.2,1); }
.row .hit::after { content: ""; position: absolute; inset: 0; }   /* whole row is the click target */
.row:hover .hit, .row:focus-within .hit { transform: translateX(14px); }
.row:focus-within .box { opacity: 1; transform: none; }
.row:focus-within .sum { grid-template-rows: 1fr; }
.row:focus-within .sum > p { padding-top: 14px; }
.index:has(.row:focus-within) .row:not(:focus-within) { opacity: .32; }
.row .hit:focus-visible { outline: none; }
.detail:not(.open) * { visibility: hidden; }
.detail.open * { visibility: visible; }
```

Remove the prototype's `.row .ttl` font-size/letter-spacing rule duplicates if they conflict (the button now carries them). The `.row` grid in the prototype has 4 columns: `56px 1fr minmax(170px,270px) 40px` — `.idx`, `.ttl`, `.meta`, `.arr`; `.sum` spans columns 2–3; `.box` is absolutely positioned.

- [ ] **Step 2: `components/sections/Work.tsx`**

```tsx
import { featuredProjects, site } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";
import { WorkIndex, type WorkItem } from "@/components/work/WorkIndex";

export function Work({ title }: { title: string }) {
  const items: WorkItem[] = featuredProjects().map((p) => ({
    id: p.id, title: p.title, kind: p.kind ?? "Project", highlights: p.highlights ?? p.stack.slice(0, 3),
    oneLiner: p.oneLiner, bullets: p.bullets, stack: p.stack, links: p.links, image: p.image,
  }));
  if (items.length === 0) return null;
  return (
    <section className="wrap" id="featured" aria-labelledby="featured-title">
      <Reveal>
        <SectionHead id="featured" title={title} note="hover to lock on · click to open" />
        <WorkIndex items={items} />
      </Reveal>
    </section>
  );
}
```

(`site` import not needed; remove if lint complains.)

- [ ] **Step 3: `components/sections/AlsoBuilt.tsx`** — server component. For each `gridProjects()` entry render `<article className="ab">`: `<span className="idx mono">+</span><h3>title</h3><span className="meta mono">kind + highlights</span><span className="lk mono">` GitHub/Live links (`target="_blank" rel="noopener noreferrer"`). Wrap in `<section className="wrap" id="projects" aria-labelledby="projects-title">` with `<SectionHead>`; return `null` when empty.

- [ ] **Step 4:** `npm run typecheck && npm run lint`. Commit: `git add -A && git commit -m "feat: work index with lock-on box, figure and accordion"`.

---

### Task 6: Remaining sections

**Files:** Replace `components/sections/Experience.tsx`, `Dsa.tsx`, `Skills.tsx`, `Achievements.tsx`, `Education.tsx`, `Contact.tsx`.

Each is a server component returning `<section className="wrap" id="…" aria-labelledby="…-title"><Reveal><SectionHead …/>…</Reveal></section>` and `null` when there is nothing visible.

- [ ] **Experience** — for each visible entry: `<article className="xp">` with left `<div className="when mono"><span>{start} – {end}</span><span>{location}</span></div>` and right `<div><h3>{org}</h3><p className="role">{role}</p><ul>{bullets.map(<li><span><RichText/></span></li>)}</ul>{link && <a className="lnk mono" …>View the project on GitHub ↗</a>}</div>`.
- [ ] **Education** — same `.xp.small` layout without bullets: left dates + location, right `<h3>school</h3><p className="role">degree</p>`.
- [ ] **Skills** — `<dl>`; each row `<div className="sk"><dt className="mono">{label}</dt><dd>{items.map(<span>)}</dd></div>`.
- [ ] **Achievements** — `<div className="ac"><b>{title}</b><p>{text}</p></div>` (+ link if present).
- [ ] **Dsa** — port the prototype's `#solving` block. Data from `leetcode`; honour every `site.dsa.show` flag: `solved` → the `.num` ("603" + `<sup>solved</sup>`; when off, show `hard` big instead), `hard` → `.hard b`, `byDifficulty` → `.bar` + `.legend` (flex values = easy/medium/hard counts), `activeDays` and `streak` (only if `streak >= streakMinimum`) in `.foot-note`, `contestRating` / `topPercent` as extra mono lines when on. Footer line: `updated {formatDate(fetchedAt)}` with a link to `profile.links.leetcode`. Bar segments need `aria-label` on the wrapper (`role="img"`): `"{easy} easy, {medium} medium, {hard} hard"`.
- [ ] **Contact** — port the prototype's `#contact`: big `.mail` link (`mailto:`), buttons (Résumé, GitHub, LinkedIn from `profile.links`), then `.bottom.mono` row: `© 2026 {name}`, `<LocalTime city=… />`, and `<nav>` anchors to `#featured`, `#solving`→`#dsa`, `#contact`. Use the real section ids from the registry (`featured`, `dsa`, `contact`).

- [ ] **Step: Verify and commit** — `npm run typecheck && npm run lint`; `git add -A && git commit -m "feat: redesigned experience, skills, DSA, education, contact"`.

---

### Task 7: Assemble, clean up, test

**Files:** Rewrite `components/SectionRenderer.tsx`, `app/page.tsx`, `tests/e2e/home.spec.ts`. Delete `components/ui.tsx`, `components/RichText.tsx`.

- [ ] **Step 1: `components/SectionRenderer.tsx`** — same registry pattern as Phase 1 with the new components: `hero → <Hero/>`, `featured → <Work title/>`, `projects → <AlsoBuilt title/>`, `experience`, `dsa`, `skills`, `achievements`, `education`, `contact`. `tryPolyo` stays unregistered (Phase 2).
- [ ] **Step 2: `app/page.tsx`**

```tsx
import { SectionRenderer } from "@/components/SectionRenderer";

export default function Page() {
  return (
    <main id="main">
      <SectionRenderer />
    </main>
  );
}
```

- [ ] **Step 3:** delete `components/ui.tsx` and `components/RichText.tsx`; `grep -rn "components/ui\|components/RichText" app components lib` must print nothing.
- [ ] **Step 4: Update `tests/e2e/home.spec.ts`**

Keep: no console errors, no phone / ISRO, rating hidden, theme persistence (button name "Switch to light theme"), system colour scheme, résumé link (link name now `Résumé ↓` — use `page.getByRole("link", { name: /Résumé/ }).first()`), external links `rel` check, 3 viewport overflow checks, 404. Change/add:

```ts
test("renders the main content", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Priyanshu Tiwari" })).toBeVisible();
  for (const name of ["PolyO", "The Aerial Guardian", "Enagram.io", "WeaponShield AI", "India Space Lab", "Jaypee Institute of Information Technology"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await expect(page.getByText("Embedded Systems Intern").first()).toBeVisible();
  await expect(page.getByText("603", { exact: true }).first()).toBeVisible();
});

test("a project opens and closes with the keyboard", async ({ page }) => {
  await page.goto("/");
  const btn = page.getByRole("button", { name: "PolyO" });
  await expect(btn).toHaveAttribute("aria-expanded", "false");
  await btn.focus();
  await page.keyboard.press("Enter");
  await expect(btn).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("no code execution and no LLM calls").first()).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(btn).toHaveAttribute("aria-expanded", "false");
});

test("hovering a project locks on and shows its figure", async ({ page }) => {
  await page.goto("/");
  const row = page.locator(".row").first();
  await row.scrollIntoViewIfNeeded();
  await row.hover();
  await expect(row.locator(".box")).toHaveCSS("opacity", "1");
  await expect(page.locator(".peek")).toHaveClass(/show/);
});

test("hidden projects do not appear", async ({ page }) => {
  await page.goto("/");
  for (const name of ["MedFusionAI", "Leehint", "reddit-insights", "drone-tilt-detection"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toHaveCount(0);
  }
});

test("reduced motion shows everything immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Problem solving" })).toBeVisible();
});
```

- [ ] **Step 5: Run everything** — `npm run typecheck && npm run lint && npm test && npm run validate-content && npm run e2e`. Expected: all green. Fix real failures; never weaken a test.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: assemble the redesigned site and update tests"`.

---

### Task 8: Visual QA, Lighthouse, publish

- [ ] **Step 1: Screenshots** — stop any server on port 3100 first (PowerShell: `Get-NetTCPConnection -LocalPort 3100 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }`), `npm run build && npm run start -- -p 3100`, then capture full-page and hover/open states at 1440, 768 and 390 px in dark and light, and **look at them**. Check against the prototype: hero lock-on box, label not colliding with the eyebrow, index rows on one line at 1440, figure not covering the hovered title, accordion open state, no horizontal scroll, readable contrast in light.
- [ ] **Step 2: Lighthouse mobile** — must be ≥95 in all four categories. If the hero's slide-up animation delays LCP, shorten it (`animation-duration .7s`, no delay on line 1) rather than removing the effect.
- [ ] **Step 3: Sole-contributor gate** — run both commands from Global Constraints; require exactly one identity and zero attribution mentions.
- [ ] **Step 4: Merge and push**

```bash
git checkout main && git merge --ff-only redesign && git push origin main
gh run watch $(gh run list --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
gh api repos/Halok600/portfolio/contributors --jq '.[].login'   # expect only Halok600
```

- [ ] **Step 5:** Vercel redeploys from `main` automatically. Ask Priyanshu for the live address, open it, and confirm the redesign is live and that `/resume.pdf` still downloads.

---

## Self-Review

- **Spec/approval coverage:** hero lock-on box ✓ T4; ruler + Noida clock + theme ✓ T3; numbered work index with hover summary, figure and box ✓ T5; accordion keeps every résumé bullet on the page ✓ T5; editorial DSA numerals ✓ T6; datasheet experience/education, plain skills ✓ T6; big-email contact ✓ T6; two themes with curated accents ✓ T3; mobile layout ✓ CSS media queries ported + T6 additions; reduced motion ✓ constraints + T7 test; content, schema, edit-mode compatibility unchanged ✓ (new fields optional).
- **Placeholder scan:** presentational sections (T4, T6) are specified by data mapping to a committed, approved prototype instead of repeated markup. That is deliberate and verifiable; logic modules (schema, parsers, facts, all client islands) are given in full.
- **Type consistency:** `WorkItem` fields match the mapping in `Work.tsx`; `buildFacts` signature matches its use in `Hero`; `Emph`/`RichText` both exported from `components/Inline.tsx`; section ids used by the contact nav (`featured`, `dsa`, `contact`) match the registry.
