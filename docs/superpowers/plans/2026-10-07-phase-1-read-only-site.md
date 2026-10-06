# Portfolio Phase 1 — Read-Only Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a fast, static, dark/light portfolio built from the main v2 résumé content, driven entirely by one validated JSON file, ready to deploy on Vercel.

**Architecture:** Next.js 16 App Router with Cache Components on. All content lives in `content/site.json` and `data/leetcode.json`, imported at build time and validated by one Zod schema, so every public page is fully static. Sections are server components looked up from a registry in the order and visibility the JSON says, which is exactly what edit mode will rewrite in later phases.

**Tech Stack:** Next.js 16.4, React 19.3, TypeScript 5, Tailwind CSS 4 (via the scaffold's `@tailwindcss/turbopack` loader), Zod 4, Vitest, Playwright, tsx.

**Spec:** `docs/superpowers/specs/2026-10-07-portfolio-design.md` (this plan covers §16 Phase 1 only. Phases 2–6 get their own plans.)

## Global Constraints

- **No phone number anywhere** in the data, code, repo or the published résumé PDF. A test enforces it. (Spec §13, his decision 7 Oct.)
- LinkedIn is `https://www.linkedin.com/in/priyanshu0604`.
- India Space Lab is shown as **"Embedded Systems Intern"** under Experience. Never "ISRO", no invented metrics.
- Résumé wording is copied verbatim into the seed. The only changes are the three typo fixes: "Developer Tools", "TensorFlow" (no stray space), "HTML5" (no trailing comma).
- No CGPA on the site.
- Links must be `http(s)` only. Schema objects are `strictObject`, so a stray key such as `phone` fails validation.
- Public pages are static. **No `cookies()`/`headers()` on any public page.** (Edit-mode detection will happen client-side in Phase 3.)
- Next.js 16 differs from older versions. Before using any Next API not shown in this plan, read `node_modules/next/dist/docs/` (the scaffold's `AGENTS.md` says so).
- **Priyanshu is the sole contributor.** Every commit uses his git identity (`Priyanshu Kumar Tiwari <143282195+Halok600@users.noreply.github.com>`) and carries **no** `Co-Authored-By` or tool-attribution lines.
- Phase 1 does NOT build: Try PolyO, Recently shipped, login, edit mode, case-study pages, Ctrl+K, OG image, `robots.ts`. Those are Phases 2–6.
- Lighthouse mobile target: **95+** in Performance, Accessibility, Best Practices, SEO.

## File Structure

```
D:\Projects\Portfolio\
  app/
    layout.tsx            html shell, fonts, theme init script, header, footer
    page.tsx              <main> + <SectionRenderer/>
    globals.css           design tokens (theme + accent), base styles
    not-found.tsx
  components/
    Header.tsx            name + section nav + ThemeToggle
    ThemeToggle.tsx       client; useSyncExternalStore on <html data-theme>
    RichText.tsx          renders **bold** spans
    ui.tsx                SectionShell, ExtLink, StackTags, ProjectLinks
    SectionRenderer.tsx   registry: SectionId → component, honours order + visible
    sections/
      Hero.tsx  Featured.tsx  ProjectGrid.tsx  Experience.tsx  Dsa.tsx
      Skills.tsx  Achievements.tsx  Education.tsx  Contact.tsx
  content/site.json       everything editable (seed from résumé)
  data/leetcode.json      daily-fetched numbers (seeded from 6 Oct fetch)
  lib/
    schema.ts  schema.test.ts        Zod schemas + types
    content.ts content.test.ts       loads + validates JSON, helpers
    rich.ts    rich.test.ts          parseBold()
  scripts/validate-content.ts        exit 1 when content invalid
  public/resume.pdf                  résumé WITHOUT phone number
  tests/e2e/home.spec.ts
  vitest.config.ts  playwright.config.ts
  .github/workflows/ci.yml
  README.md
```

---

### Task 1: Scaffold project and tooling

**Files:**
- Create (via scaffold): `package.json`, `app/*`, `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `AGENTS.md`, `public/`
- Create: `vitest.config.ts`, `playwright.config.ts`
- Modify: `package.json` (scripts, deps), `app/globals.css`, `app/page.tsx`

**Interfaces:**
- Produces: npm scripts `dev`, `build` (= validate then build), `start`, `lint`, `typecheck`, `test`, `validate-content`, `e2e`. Path alias `@/*` → repo root.

- [ ] **Step 1: Scaffold into the existing repo folder**

Run in `D:\Projects\Portfolio`:

```bash
npx --yes create-next-app@latest . --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-npm --turbopack --yes
```

If it refuses because the folder is not empty, scaffold into a scratch folder named `portfolio` and copy everything except `.git` and `node_modules` into `D:\Projects\Portfolio`, then run `npm install`.
Expected: `app/`, `package.json`, `next.config.ts` (with `cacheComponents: true`), `AGENTS.md` now exist.

- [ ] **Step 2: Install dependencies**

```bash
npm install zod
npm install -D vitest @playwright/test tsx
npx playwright install chromium
```

- [ ] **Step 3: Replace the scripts block in `package.json`**

```json
"scripts": {
  "dev": "next dev",
  "build": "npm run validate-content && next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "validate-content": "tsx scripts/validate-content.ts",
  "e2e": "npm run build && playwright test"
}
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
```

- [ ] **Step 5: Create `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    command: "npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: "http://localhost:3100" },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
```

- [ ] **Step 6: Remove scaffold boilerplate**

Delete `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`. Replace `app/page.tsx` with a placeholder:

```tsx
export default function Page() {
  return <main>Portfolio</main>;
}
```

Make `validate-content` a no-op until Task 3 so the build works: create `scripts/validate-content.ts` containing `console.log("validate-content: nothing to validate yet");`.

- [ ] **Step 7: Verify the toolchain**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: all three exit 0, build output lists `/` as a static route.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 16 app with Vitest and Playwright
```

---

### Task 2: Content schema (TDD)

**Files:**
- Create: `lib/schema.ts`
- Test: `lib/schema.test.ts`

**Interfaces:**
- Produces from `lib/schema.ts`:
  - `SectionIdSchema`, `type SectionId` = `"hero" | "tryPolyo" | "featured" | "projects" | "experience" | "dsa" | "skills" | "achievements" | "education" | "contact"`
  - `SiteSchema`, `type Site`, `type Project`, `type Section`
  - `LeetcodeSchema`, `type Leetcode`
  - `ACCENTS` = `["cyan","violet","green","amber","rose","blue"] as const`

- [ ] **Step 1: Write the failing tests** — `lib/schema.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { SiteSchema } from "@/lib/schema";

function minimalSite() {
  return {
    version: 1,
    settings: { accent: "cyan", defaultTheme: "dark" },
    profile: {
      name: "A B",
      headline: "Engineer",
      tagline: "Builds things.",
      status: { show: true, text: "Open to work" },
      location: "Noida, India",
      email: "a@example.com",
      links: {
        github: "https://github.com/a",
        linkedin: "https://www.linkedin.com/in/a",
        leetcode: "https://leetcode.com/u/a",
      },
      resumePdf: "/resume.pdf",
    },
    sections: [{ id: "hero", title: "Hero", visible: true }],
    projects: [
      {
        id: "p1",
        slug: "p1",
        title: "P1",
        oneLiner: "One liner",
        stack: ["TS"],
        bullets: ["did **a thing**"],
        links: { github: "https://github.com/a/p1" },
        featured: true,
        visible: true,
      },
    ],
    experience: [],
    education: [],
    skills: [],
    achievements: [],
    dsa: {
      show: {
        solved: true, byDifficulty: true, hard: true, activeDays: true,
        streak: true, contestRating: false, topPercent: false,
      },
      streakMinimum: 7,
    },
    recentlyShipped: { show: true, hideIfOlderThanDays: 30 },
  };
}

describe("SiteSchema", () => {
  it("accepts a minimal valid site", () => {
    expect(SiteSchema.safeParse(minimalSite()).success).toBe(true);
  });

  it("rejects javascript: links", () => {
    const s = minimalSite();
    s.projects[0].links.github = "javascript:alert(1)";
    expect(SiteSchema.safeParse(s).success).toBe(false);
  });

  it("rejects duplicate project slugs", () => {
    const s = minimalSite();
    s.projects.push({ ...s.projects[0], id: "p2" });
    expect(SiteSchema.safeParse(s).success).toBe(false);
  });

  it("rejects duplicate project ids", () => {
    const s = minimalSite();
    s.projects.push({ ...s.projects[0], slug: "other" });
    expect(SiteSchema.safeParse(s).success).toBe(false);
  });

  it("rejects image paths outside /uploads/", () => {
    const s = minimalSite() as ReturnType<typeof minimalSite> & {
      projects: { image?: string }[];
    };
    s.projects[0].image = "/etc/passwd.png";
    expect(SiteSchema.safeParse(s).success).toBe(false);
    s.projects[0].image = "/uploads/shot.webp";
    expect(SiteSchema.safeParse(s).success).toBe(true);
  });

  it("rejects an unknown accent", () => {
    const s = minimalSite();
    (s.settings as { accent: string }).accent = "pink";
    expect(SiteSchema.safeParse(s).success).toBe(false);
  });

  it("rejects a too-long headline", () => {
    const s = minimalSite();
    s.profile.headline = "x".repeat(121);
    expect(SiteSchema.safeParse(s).success).toBe(false);
  });

  it("rejects unknown keys, so a stray phone field can never slip in", () => {
    const s = minimalSite();
    (s.profile as Record<string, unknown>).phone = "123";
    expect(SiteSchema.safeParse(s).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/schema.test.ts`
Expected: FAIL — cannot resolve `@/lib/schema`.

- [ ] **Step 3: Implement `lib/schema.ts`**

```ts
import { z } from "zod";

export const ACCENTS = ["cyan", "violet", "green", "amber", "rose", "blue"] as const;
export const SECTION_IDS = [
  "hero", "tryPolyo", "featured", "projects", "experience",
  "dsa", "skills", "achievements", "education", "contact",
] as const;

function isHttpUrl(v: string): boolean {
  try {
    const p = new URL(v).protocol;
    return p === "http:" || p === "https:";
  } catch {
    return false;
  }
}

const idStr = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(40);
const text = (max: number) => z.string().trim().min(1).max(max);
const httpUrl = z.string().max(300).refine(isHttpUrl, "Must start with http:// or https://");
const uploadPath = z
  .string()
  .max(120)
  .regex(/^\/uploads\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:webp|png|jpe?g)$/, "Must be an image under /uploads/");

function list<S extends z.ZodType<{ id: string }>>(item: S) {
  return z
    .array(item)
    .max(50)
    .refine((arr) => new Set(arr.map((a) => a.id)).size === arr.length, "Duplicate id");
}

export const SectionIdSchema = z.enum(SECTION_IDS);
export type SectionId = z.infer<typeof SectionIdSchema>;

const Section = z.strictObject({
  id: SectionIdSchema,
  title: text(60),
  visible: z.boolean(),
});

const Project = z.strictObject({
  id: idStr,
  slug: idStr,
  title: text(80),
  oneLiner: text(300),
  stack: z.array(text(40)).max(12),
  bullets: z.array(text(500)).max(10),
  links: z.strictObject({ github: httpUrl.optional(), live: httpUrl.optional() }),
  image: uploadPath.optional(),
  videoUrl: httpUrl.optional(),
  featured: z.boolean(),
  visible: z.boolean(),
  caseStudy: z.string().max(20000).optional(),
});

const Experience = z.strictObject({
  id: idStr,
  org: text(80),
  role: text(80),
  location: text(80),
  start: text(20),
  end: text(20),
  bullets: z.array(text(500)).max(10),
  link: httpUrl.optional(),
  visible: z.boolean(),
});

const Education = z.strictObject({
  id: idStr,
  school: text(120),
  degree: text(160),
  start: text(20),
  end: text(20),
  location: text(80),
  visible: z.boolean(),
});

const SkillRow = z.strictObject({
  id: idStr,
  label: text(40),
  items: z.array(text(60)).max(30),
});

const Achievement = z.strictObject({
  id: idStr,
  title: text(80),
  text: text(400),
  link: httpUrl.optional(),
  visible: z.boolean(),
});

export const SiteSchema = z.strictObject({
  version: z.literal(1),
  settings: z.strictObject({
    accent: z.enum(ACCENTS),
    defaultTheme: z.enum(["dark", "light"]),
  }),
  profile: z.strictObject({
    name: text(60),
    headline: text(120),
    tagline: text(240),
    status: z.strictObject({ show: z.boolean(), text: text(120) }),
    location: text(80),
    email: z.email().max(120),
    links: z.strictObject({ github: httpUrl, linkedin: httpUrl, leetcode: httpUrl }),
    photo: uploadPath.optional(),
    resumePdf: z.string().regex(/^\/[a-zA-Z0-9_-]+\.pdf$/),
  }),
  sections: list(Section),
  projects: list(Project).refine(
    (arr) => new Set(arr.map((p) => p.slug)).size === arr.length,
    "Duplicate slug",
  ),
  experience: list(Experience),
  education: list(Education),
  skills: list(SkillRow),
  achievements: list(Achievement),
  dsa: z.strictObject({
    show: z.strictObject({
      solved: z.boolean(),
      byDifficulty: z.boolean(),
      hard: z.boolean(),
      activeDays: z.boolean(),
      streak: z.boolean(),
      contestRating: z.boolean(),
      topPercent: z.boolean(),
    }),
    streakMinimum: z.number().int().min(0).max(365),
  }),
  recentlyShipped: z.strictObject({
    show: z.boolean(),
    hideIfOlderThanDays: z.number().int().min(1).max(365),
  }),
});

export type Site = z.infer<typeof SiteSchema>;
export type Project = z.infer<typeof Project>;
export type Section = z.infer<typeof Section>;

export const LeetcodeSchema = z.strictObject({
  fetchedAt: z.iso.datetime(),
  solved: z.number().int().nonnegative(),
  easy: z.number().int().nonnegative(),
  medium: z.number().int().nonnegative(),
  hard: z.number().int().nonnegative(),
  activeDays: z.number().int().nonnegative(),
  streak: z.number().int().nonnegative(),
  rating: z.number().nonnegative(),
  topPercent: z.number().min(0).max(100),
  contests: z.number().int().nonnegative(),
});
export type Leetcode = z.infer<typeof LeetcodeSchema>;
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/schema.test.ts`
Expected: 8 passed. If a Zod 4 API name differs (`z.email`, `z.iso.datetime`, `z.strictObject`), check `node_modules/zod` types and adjust the call. The behaviour must not change.

- [ ] **Step 5: Commit**

```bash
git add lib/schema.ts lib/schema.test.ts
git commit -m "feat: content schema with strict validation
```

---

### Task 3: Seed content, loader and validation script (TDD)

**Files:**
- Create: `content/site.json`, `data/leetcode.json`, `lib/content.ts`, `scripts/validate-content.ts` (replace the no-op)
- Test: `lib/content.test.ts`

**Interfaces:**
- Consumes: `SiteSchema`, `LeetcodeSchema`, `Site`, `Project`, `Section`, `Leetcode` from `lib/schema.ts`.
- Produces from `lib/content.ts`:
  - `site: Site`, `leetcode: Leetcode`
  - `visibleSections(): Section[]` — in file order, `visible` only
  - `featuredProjects(): Project[]`, `gridProjects(): Project[]` — visible only
  - `formatDate(iso: string): string` — e.g. `"6 Oct 2026"`, always UTC

- [ ] **Step 1: Write the failing tests** — `lib/content.test.ts`

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  featuredProjects, formatDate, gridProjects, leetcode, site, visibleSections,
} from "@/lib/content";

const raw = (rel: string) => readFileSync(path.join(process.cwd(), rel), "utf8");

describe("seed content", () => {
  it("loads and validates", () => {
    expect(site.profile.name).toBe("Priyanshu Tiwari");
    expect(leetcode.solved).toBeGreaterThan(0);
  });

  it("uses the confirmed LinkedIn handle", () => {
    expect(site.profile.links.linkedin).toBe("https://www.linkedin.com/in/priyanshu0604");
  });

  it("contains NO phone number anywhere in the content files", () => {
    for (const file of ["content/site.json", "data/leetcode.json"]) {
      const text = raw(file);
      expect(text).not.toMatch(/\+\s?91/);
      expect(text).not.toMatch(/\b\d{10}\b/);
      expect(text).not.toMatch(/"phone"/i);
    }
  });

  it("never claims ISRO", () => {
    expect(raw("content/site.json")).not.toMatch(/ISRO/i);
  });

  it("shows India Space Lab as Embedded Systems Intern", () => {
    const e = site.experience.find((x) => x.org === "India Space Lab");
    expect(e?.role).toBe("Embedded Systems Intern");
    expect(e?.start).toBe("Jun 2025");
    expect(e?.end).toBe("Jul 2025");
  });

  it("has the three featured projects first", () => {
    expect(featuredProjects().map((p) => p.title)).toEqual([
      "PolyO", "The Aerial Guardian", "Enagram.io",
    ]);
  });

  it("shows WeaponShield in the grid and hides the unfinished ones", () => {
    expect(gridProjects().map((p) => p.title)).toEqual(["WeaponShield AI"]);
    const hidden = site.projects.filter((p) => !p.visible).map((p) => p.title);
    expect(hidden).toEqual(["MedFusionAI", "drone-tilt-detection", "Leehint", "reddit-insights"]);
  });

  it("has the typo fixes in skills", () => {
    const labels = site.skills.map((s) => s.label);
    expect(labels).toContain("Developer Tools");
    expect(labels).not.toContain("Devloper Tools");
    const ai = site.skills.find((s) => s.label === "AI and ML")!;
    expect(ai.items).toContain("TensorFlow");
    expect(site.skills.find((s) => s.label === "Frontend")!.items.at(-1)).toBe("HTML5");
  });

  it("keeps hero first and lists only visible sections", () => {
    expect(visibleSections()[0].id).toBe("hero");
    expect(visibleSections().every((s) => s.visible)).toBe(true);
  });

  it("does not show contest rating by default", () => {
    expect(site.dsa.show.contestRating).toBe(false);
  });
});

describe("formatDate", () => {
  it("formats in UTC", () => {
    expect(formatDate("2026-10-06T00:00:00.000Z")).toBe("6 Oct 2026");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/content.test.ts`
Expected: FAIL — cannot resolve `@/lib/content`.

- [ ] **Step 3: Create `data/leetcode.json`** (numbers fetched from the LeetCode API on 6 Oct 2026)

```json
{
  "fetchedAt": "2026-10-06T00:00:00.000Z",
  "solved": 603,
  "easy": 216,
  "medium": 317,
  "hard": 70,
  "activeDays": 164,
  "streak": 26,
  "rating": 1533.076,
  "topPercent": 36.31,
  "contests": 11
}
```

- [ ] **Step 4: Create `content/site.json`**

```json
{
  "version": 1,
  "settings": { "accent": "cyan", "defaultTheme": "dark" },
  "profile": {
    "name": "Priyanshu Tiwari",
    "headline": "AI/ML Engineer",
    "tagline": "I build ML systems end to end, from training the model to shipping the service.",
    "status": { "show": true, "text": "Open to AI/ML and SDE roles" },
    "location": "Noida, India",
    "email": "pkt.codes@gmail.com",
    "links": {
      "github": "https://github.com/Halok600",
      "linkedin": "https://www.linkedin.com/in/priyanshu0604",
      "leetcode": "https://leetcode.com/u/priyanshuthebest2"
    },
    "resumePdf": "/resume.pdf"
  },
  "sections": [
    { "id": "hero", "title": "Hero", "visible": true },
    { "id": "tryPolyo", "title": "Try PolyO", "visible": true },
    { "id": "featured", "title": "Featured work", "visible": true },
    { "id": "projects", "title": "More projects", "visible": true },
    { "id": "experience", "title": "Experience", "visible": true },
    { "id": "dsa", "title": "Problem solving", "visible": true },
    { "id": "skills", "title": "Skills", "visible": true },
    { "id": "achievements", "title": "Achievements", "visible": true },
    { "id": "education", "title": "Education", "visible": true },
    { "id": "contact", "title": "Contact", "visible": true }
  ],
  "projects": [
    {
      "id": "polyo",
      "slug": "polyo",
      "title": "PolyO",
      "oneLiner": "Static, multi-language time and space complexity prediction from source code. No LLM calls, no execution at inference time.",
      "stack": ["Python", "PyTorch", "tree-sitter", "LightGBM", "FastAPI", "Docker", "GitHub Actions"],
      "bullets": [
        "Built an **ML service that predicts worst-case time and space complexity** of source code in **six languages** (Python, C++, Java, JavaScript, C, Go) just by reading it, with **no code execution and no LLM calls** at inference.",
        "Normalised all six languages into **one shared representation** with **tree-sitter**, so a single model serves every language. Trained on **194,000 labelled programs** with problem-level splits **enforced by a CI test** to block data leakage.",
        "Built and benchmarked **four models** on one held-out set, from a rule baseline up to a **graph neural network**. The GNN reached **0.377 / 0.336 macro-F1**, matching a zero-shot LLM on time and **beating it on space** at zero API cost.",
        "Shipped it as a **FastAPI** service in **Docker** with **GitHub Actions CI**, rewriting the GNN forward pass in **NumPy** to drop PyTorch from the image, verified identical to the trained model **within 1e-4**."
      ],
      "links": { "github": "https://github.com/Halok600/polyo", "live": "https://polyo.vercel.app" },
      "featured": true,
      "visible": true
    },
    {
      "id": "aerial-guardian",
      "slug": "aerial-guardian",
      "title": "The Aerial Guardian",
      "oneLiner": "Real-time multi-object tracking for drone footage that runs fully client-side in the browser.",
      "stack": ["Python", "PyTorch", "YOLOv8", "OpenCV", "ONNX Runtime Web", "JavaScript"],
      "bullets": [
        "Built a **real-time multi-object tracking system** for drone video that runs **entirely client-side in the browser**, porting both detector and tracker to **ONNX Runtime Web** so the video never leaves the user's device.",
        "Stock YOLOv8 misses people in aerial footage because they are only **8 to 16 pixels tall**, so added a **high-resolution stride-4 detection head** to the network and retrained it on the **VisDrone** dataset on a single 6 GB laptop GPU.",
        "**Implemented ByteTrack from scratch**: a **Kalman filter** for motion prediction plus **three-stage Hungarian matching** to hold object identities through occlusion, with **OpenCV** cancelling the drone's own camera motion."
      ],
      "links": {
        "github": "https://github.com/Halok600/The-Aerial-Guardian",
        "live": "https://halok600.github.io/The-Aerial-Guardian/"
      },
      "featured": true,
      "visible": true
    },
    {
      "id": "enagram",
      "slug": "enagram",
      "title": "Enagram.io",
      "oneLiner": "Conversational AI agent over Gmail, Drive and Calendar.",
      "stack": ["Next.js", "TypeScript", "PostgreSQL", "pgvector", "Gemini", "OAuth 2.0"],
      "bullets": [
        "Built a **conversational AI agent** that answers one question across a user's **Gmail, Drive and Calendar** in a single reply, linking the same person, project or file across all three services.",
        "Designed a **hybrid RAG retrieval layer** on **PostgreSQL + pgvector**, combining vector embeddings with keyword search so exact strings such as an invoice number are still found.",
        "Added **agent tool-calling** that creates and updates Calendar events and drafts Gmail replies inside the correct thread, all behind **Google OAuth** with per-user access scoping."
      ],
      "links": { "github": "https://github.com/Halok600/Enagram.io", "live": "https://enagram-io.vercel.app" },
      "featured": true,
      "visible": true
    },
    {
      "id": "weaponshield",
      "slug": "weaponshield",
      "title": "WeaponShield AI",
      "oneLiner": "Real-time weapon detection (pistol, rifle, knife) for CCTV, images and webcam. Two-stage YOLOv8s fine-tune on 31.6k images, 0.833 mAP50, dual PyTorch/ONNX inference.",
      "stack": ["Python", "PyTorch", "YOLOv8", "ONNX Runtime", "FastAPI", "React"],
      "bullets": [
        "Built **real-time weapon detection** (pistol, rifle, knife) for CCTV, images and live webcam, fine-tuning **YOLOv8s** in two stages on **31,600 images** to reach **0.833 mAP50**.",
        "Served it through a **FastAPI** backend with **dual PyTorch / ONNX Runtime engines**, and cut false alarms with **K-of-N multi-frame confirmation** that alerts only when a detection persists across frames."
      ],
      "links": { "github": "https://github.com/Halok600/WeaponShield-AI" },
      "featured": false,
      "visible": true
    },
    {
      "id": "medfusion",
      "slug": "medfusion",
      "title": "MedFusionAI",
      "oneLiner": "CT-MRI medical image fusion with a hybrid Transformer-CNN and cross-attention, trained unsupervised. Sobel edge preservation, 4-term loss, 12+ evaluation metrics.",
      "stack": ["Python", "Transformer", "CNN", "Cross-attention"],
      "bullets": [],
      "links": { "github": "https://github.com/Halok600/MedFusionAI" },
      "featured": false,
      "visible": false
    },
    {
      "id": "drone-tilt-detection",
      "slug": "drone-tilt-detection",
      "title": "drone-tilt-detection",
      "oneLiner": "Embedded TinyML: a TFLite tilt classifier trained on MPU6050 IMU data and converted to a C byte array, with ESP32-S3 complementary-filter firmware for attitude estimation.",
      "stack": ["TFLite", "ESP32-S3", "MPU6050", "C"],
      "bullets": [],
      "links": { "github": "https://github.com/Halok600/drone-tilt-detection" },
      "featured": false,
      "visible": false
    },
    {
      "id": "leehint",
      "slug": "leehint",
      "title": "Leehint",
      "oneLiner": "Chrome extension giving progressive AI hints on LeetCode problems via Gemini. It nudges you toward the answer instead of spoiling it.",
      "stack": ["JavaScript", "Chrome Extension", "Gemini"],
      "bullets": [],
      "links": { "github": "https://github.com/Halok600/Leehint" },
      "featured": false,
      "visible": false
    },
    {
      "id": "reddit-insights",
      "slug": "reddit-insights",
      "title": "reddit-insights",
      "oneLiner": "Reddit discussion analysis: RoBERTa sentiment, DistilRoBERTa emotion detection, LDA topic modeling, GPT-2 summarisation.",
      "stack": ["RoBERTa", "DistilRoBERTa", "LDA", "GPT-2"],
      "bullets": [],
      "links": { "github": "https://github.com/Halok600/reddit-insights" },
      "featured": false,
      "visible": false
    }
  ],
  "experience": [
    {
      "id": "india-space-lab",
      "org": "India Space Lab",
      "role": "Embedded Systems Intern",
      "location": "New Delhi, India (Remote)",
      "start": "Jun 2025",
      "end": "Jul 2025",
      "bullets": [
        "Built a **real-time drone tilt detection system** on an **ESP32-S3** with an **MPU6050** IMU, sampling **6 axes at 100 Hz** and driving OLED, LED and buzzer alerts the moment tilt crosses a **45 degree** safety threshold.",
        "Wrote **C++ firmware** that fuses accelerometer and gyroscope readings through a tuned **complementary filter** (alpha 0.96) into one stable attitude estimate, removing gyro drift and vibration noise using a timestep measured with **micros()**.",
        "Trained a **TensorFlow / Keras** neural network on labelled IMU data to classify safe versus dangerous tilt, then compressed it to a **2.5 KB TensorFlow Lite** model exported as a C byte array that fits in microcontroller flash.",
        "Designed and simulated the full circuit in **Wokwi**, with the IMU and a 128x64 OLED sharing one **I2C** bus plus three GPIO alert outputs, and documented wiring and thresholds so the build is **reproducible from the repository alone**."
      ],
      "link": "https://github.com/Halok600/drone-tilt-detection",
      "visible": true
    }
  ],
  "education": [
    {
      "id": "jiit",
      "school": "Jaypee Institute of Information Technology",
      "degree": "Bachelor of Technology in Computer Science and Engineering",
      "start": "Sep 2022",
      "end": "Sep 2026",
      "location": "Noida, India",
      "visible": true
    }
  ],
  "skills": [
    { "id": "languages", "label": "Languages", "items": ["Python", "C++", "JavaScript", "SQL", "Java"] },
    {
      "id": "ai-ml",
      "label": "AI and ML",
      "items": [
        "PyTorch", "TensorFlow", "YOLOv8", "OpenCV", "scikit-learn", "LightGBM",
        "Graph Neural Networks", "Computer Vision", "Object Detection and Tracking",
        "RAG", "Vector Search", "LLM APIs (Gemini)"
      ]
    },
    {
      "id": "backend-data",
      "label": "Backend and Data",
      "items": ["REST APIs", "Node.js", "FastAPI", "PostgreSQL", "pgvector", "MongoDB", "NumPy", "Pandas"]
    },
    { "id": "frontend", "label": "Frontend", "items": ["Next.js", "React", "Tailwind CSS", "HTML5"] },
    {
      "id": "developer-tools",
      "label": "Developer Tools",
      "items": ["Docker", "Git", "GitHub Actions (CI/CD) basics", "Linux", "Postman"]
    },
    {
      "id": "cs-core",
      "label": "CS Core",
      "items": ["Data Structures and Algorithms", "DBMS", "Operating Systems", "OOP", "Computer Networks"]
    }
  ],
  "achievements": [
    {
      "id": "becon-24",
      "title": "Hackathon Finalist",
      "text": "Advanced to the Final Round of BEcon '24 at IIT Delhi among 30+ teams.",
      "visible": true
    }
  ],
  "dsa": {
    "show": {
      "solved": true,
      "byDifficulty": true,
      "hard": true,
      "activeDays": true,
      "streak": true,
      "contestRating": false,
      "topPercent": false
    },
    "streakMinimum": 7
  },
  "recentlyShipped": { "show": true, "hideIfOlderThanDays": 30 }
}
```

- [ ] **Step 5: Implement `lib/content.ts`**

```ts
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
```

- [ ] **Step 6: Replace `scripts/validate-content.ts`**

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { LeetcodeSchema, SiteSchema } from "../lib/schema";

function check(file: string, schema: { safeParse: (v: unknown) => { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } } }) {
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

const ok = [check("content/site.json", SiteSchema), check("data/leetcode.json", LeetcodeSchema)];
process.exit(ok.every(Boolean) ? 0 : 1);
```

- [ ] **Step 7: Run the tests and the script**

Run: `npx vitest run && npm run validate-content`
Expected: all tests pass; script prints `ok content/site.json` and `ok data/leetcode.json`, exit 0.
Also prove the script fails on bad data: temporarily change `"accent": "cyan"` to `"pink"`, run `npm run validate-content`, expect exit 1 with `settings.accent` listed, then restore the file (`git checkout content/site.json` is not available before commit, so edit it back by hand and re-run to confirm exit 0).

- [ ] **Step 8: Commit**

```bash
git add content data lib scripts
git commit -m "feat: seed content from main v2 resume, loader and validate script
```

---

### Task 4: Résumé PDF without the phone number

**Files:**
- Create: `public/resume.pdf`

The published PDF must not contain the phone number. The source is `D:\LINKEDIN\resume\main\v2\main-resume-v2.html`. **Do not edit that file** — it is the copy he sends to recruiters. Work on a copy in the scratchpad.

- [ ] **Step 1: Make the copy and strip the phone**

```bash
SP="/c/Users/priya/AppData/Local/Temp/claude/D--LINKEDIN/979b4f38-1a84-4761-a920-ba47778d714d/scratchpad/resume-web"
mkdir -p "$SP" && cp "/d/LINKEDIN/resume/main/v2/main-resume-v2.html" "$SP/resume-web.html"
python - <<'EOF'
import re, pathlib
p = pathlib.Path(r"C:\Users\priya\AppData\Local\Temp\claude\D--LINKEDIN\979b4f38-1a84-4761-a920-ba47778d714d\scratchpad\resume-web\resume-web.html")
s = p.read_text(encoding="utf-8")
before = s
s = s.replace('+91&nbsp;XXXXXXXXXX<span class="sep">|</span>', '')
s = s.replace('Devloper Tools', 'Developer Tools').replace('TensorFlow ,', 'TensorFlow,').replace('HTML5,</div>', 'HTML5</div>')
assert s != before and "XXXXXXXXXX" not in s
p.write_text(s, encoding="utf-8")
print("ok")
EOF
```

Expected: prints `ok`.

- [ ] **Step 2: Print it to PDF with headless Chrome**

```bash
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"; [ -x "$CH" ] || CH="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
WIN="C:\\Users\\priya\\AppData\\Local\\Temp\\claude\\D--LINKEDIN\\979b4f38-1a84-4761-a920-ba47778d714d\\scratchpad\\resume-web"
"$CH" --headless=new --disable-gpu --no-pdf-header-footer --run-all-compositor-stages-before-draw --virtual-time-budget=5000 --print-to-pdf="$WIN\\resume.pdf" "file:///${WIN//\\//}/resume-web.html"
mkdir -p /d/Projects/Portfolio/public && cp "$SP/resume.pdf" /d/Projects/Portfolio/public/resume.pdf
```

- [ ] **Step 3: Verify: one page, no phone, links kept**

```bash
cd /d/Projects/Portfolio
python -c "
import re
d=open('public/resume.pdf','rb').read()
print('pages:',len(re.findall(rb'/Type\s*/Page[^s]',d)))
print('links:',len(re.findall(rb'/URI\s*\(',d)))"
pdftotext -layout public/resume.pdf - | grep -ciE "XXXXXXXXXX|\+91"   # expect 0
pdftotext -layout public/resume.pdf - | grep -E "Developer Tools|polyo|@gmail"
```

Expected: `pages: 1`, links 11 (12 minus nothing: the phone was plain text, so the count equals the original 12 minus 0. Accept 12), the grep for phone prints `0`, and the second grep shows "Developer Tools" and the email line.

- [ ] **Step 4: Commit**

```bash
git add public/resume.pdf
git commit -m "feat: resume PDF for the site, without phone number
```

---

### Task 5: Design tokens, layout, theme, header, footer

**Files:**
- Modify: `app/globals.css`, `app/layout.tsx`, `next.config.ts` (only if the scaffold's config needs nothing, leave it)
- Create: `components/Header.tsx`, `components/ThemeToggle.tsx`, `app/not-found.tsx`

**Interfaces:**
- Consumes: `site`, `visibleSections` from `lib/content`.
- Produces: Tailwind color utilities `bg-bg`, `bg-surface`, `border-line`, `text-text`, `text-muted`, `text-accent`, `bg-accent`, `text-on-accent`; `<html data-theme data-accent>`; `ThemeToggle` stores the choice under `localStorage["theme"]`.

- [ ] **Step 1: Replace `app/globals.css`**

```css
@import "tailwindcss";

:root,
:root[data-theme="dark"] {
  --bg: #0a0a0b;
  --surface: #131316;
  --line: #26262b;
  --text: #ededf0;
  --muted: #a1a1aa;
  --accent-fg: var(--accent);
  --on-accent: #0a0a0b;
  color-scheme: dark;
}

:root[data-theme="light"] {
  --bg: #fafafa;
  --surface: #ffffff;
  --line: #e4e4e7;
  --text: #18181b;
  --muted: #52525b;
  --accent-fg: var(--accent-ink);
  --on-accent: #ffffff;
  color-scheme: light;
}

:root[data-accent="cyan"]   { --accent: #22d3ee; --accent-ink: #0e7490; }
:root[data-accent="violet"] { --accent: #a78bfa; --accent-ink: #6d28d9; }
:root[data-accent="green"]  { --accent: #4ade80; --accent-ink: #15803d; }
:root[data-accent="amber"]  { --accent: #fbbf24; --accent-ink: #b45309; }
:root[data-accent="rose"]   { --accent: #fb7185; --accent-ink: #be123c; }
:root[data-accent="blue"]   { --accent: #60a5fa; --accent-ink: #1d4ed8; }

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-line: var(--line);
  --color-text: var(--text);
  --color-muted: var(--muted);
  --color-accent: var(--accent-fg);
  --color-on-accent: var(--on-accent);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

html { scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--text);
}

:focus-visible {
  outline: 2px solid var(--accent-fg);
  outline-offset: 3px;
  border-radius: 4px;
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    transition: none !important;
    animation: none !important;
  }
}
```

- [ ] **Step 2: Create `components/ThemeToggle.tsx`**

```tsx
"use client";

import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

const getTheme = (): Theme | null =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";
const getServerTheme = (): Theme | null => null;

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);
  const next: Theme = theme === "light" ? "dark" : "light";

  function toggle() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private mode: the choice just won't persist */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme ? `Switch to ${next} theme` : "Toggle theme"}
      className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:text-text"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {theme === "light" ? (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        )}
      </svg>
    </button>
  );
}
```

- [ ] **Step 3: Create `components/Header.tsx`**

```tsx
import { site, visibleSections } from "@/lib/content";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_SKIP = new Set(["hero", "tryPolyo"]);

export function Header() {
  const nav = visibleSections().filter((s) => !NAV_SKIP.has(s.id));
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        <a href="#hero" className="font-mono text-sm font-medium">
          {site.profile.name}
        </a>
        <nav aria-label="Sections" className="hidden items-center gap-5 text-sm text-muted md:flex">
          {nav.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="transition-colors hover:text-text">
              {s.title}
            </a>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { site } from "@/lib/content";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${site.profile.name} — ${site.profile.headline}`,
  description: site.profile.tagline,
};

// Sets data-theme before first paint so there is no flash. defaultTheme is a
// schema-validated enum ("dark" | "light"), so interpolating it is safe.
const themeScript = `(function(){var d=document.documentElement;try{var s=localStorage.getItem("theme");var t=(s==="light"||s==="dark")?s:(matchMedia("(prefers-color-scheme: light)").matches?"light":(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"${site.settings.defaultTheme}"));d.dataset.theme=t}catch(e){d.dataset.theme="${site.settings.defaultTheme}"}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme={site.settings.defaultTheme}
      data-accent={site.settings.accent}
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-bg font-sans text-text">
        <Header />
        {children}
        <footer className="border-t border-line py-8 text-center text-sm text-muted">
          © {new Date(2026, 0, 1).getFullYear()} {site.profile.name}
        </footer>
      </body>
    </html>
  );
}
```

Note: the footer year is fixed through `new Date(2026, 0, 1)` on purpose. A bare `new Date()` counts as request-time data under Cache Components and breaks prerendering. If the build complains about anything else here, read the matching page under `node_modules/next/dist/docs/01-app/` before changing the approach.

- [ ] **Step 5: Create `app/not-found.tsx`**

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-32 text-center sm:px-6">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="mt-2 text-3xl font-semibold">That page doesn't exist.</h1>
      <Link href="/" className="mt-6 inline-block text-accent underline underline-offset-4">
        Back to the portfolio
      </Link>
    </main>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: exit 0. Then `npm run dev`, open `http://localhost:3000`: dark page, header with name and a theme button, clicking the button switches to light and a reload keeps it.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: design tokens, theme toggle, header and layout
```

---

### Task 6: Shared UI pieces and bold-markup parser (TDD)

**Files:**
- Create: `lib/rich.ts`, `components/RichText.tsx`, `components/ui.tsx`
- Test: `lib/rich.test.ts`

**Interfaces:**
- Produces:
  - `parseBold(input: string): { text: string; bold: boolean }[]`
  - `<RichText text={string} />`
  - `<SectionShell id={string} title={string}>`
  - `<ExtLink href={string} className?>`
  - `<StackTags stack={string[]} />`
  - `<ProjectLinks links={{ github?: string; live?: string }} />`

- [ ] **Step 1: Write the failing test** — `lib/rich.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { parseBold } from "@/lib/rich";

describe("parseBold", () => {
  it("returns an empty list for empty input", () => {
    expect(parseBold("")).toEqual([]);
  });

  it("returns one plain span when there are no markers", () => {
    expect(parseBold("plain text")).toEqual([{ text: "plain text", bold: false }]);
  });

  it("splits bold spans out of the text", () => {
    expect(parseBold("a **b** c")).toEqual([
      { text: "a ", bold: false },
      { text: "b", bold: true },
      { text: " c", bold: false },
    ]);
  });

  it("handles several bold spans and bold at the edges", () => {
    expect(parseBold("**x** and **y**")).toEqual([
      { text: "x", bold: true },
      { text: " and ", bold: false },
      { text: "y", bold: true },
    ]);
  });

  it("leaves an unmatched marker as plain text", () => {
    expect(parseBold("a **b")).toEqual([{ text: "a **b", bold: false }]);
  });

  it("never produces markup, only text spans", () => {
    expect(parseBold("**<script>x</script>**")).toEqual([
      { text: "<script>x</script>", bold: true },
    ]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/rich.test.ts`
Expected: FAIL — cannot resolve `@/lib/rich`.

- [ ] **Step 3: Implement `lib/rich.ts`**

```ts
export type Span = { text: string; bold: boolean };

export function parseBold(input: string): Span[] {
  const out: Span[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    if (m.index > last) out.push({ text: input.slice(last, m.index), bold: false });
    out.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < input.length) out.push({ text: input.slice(last), bold: false });
  return out;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/rich.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Create `components/RichText.tsx`**

```tsx
import { parseBold } from "@/lib/rich";

export function RichText({ text }: { text: string }) {
  return (
    <>
      {parseBold(text).map((s, i) =>
        s.bold ? (
          <strong key={i} className="font-semibold text-text">
            {s.text}
          </strong>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}
```

- [ ] **Step 6: Create `components/ui.tsx`**

```tsx
import type { ReactNode } from "react";

export function SectionShell({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 py-12 md:py-16">
      <h2 id={`${id}-title`} className="mb-8 font-mono text-sm uppercase tracking-widest text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ExtLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

export function StackTags({ stack }: { stack: string[] }) {
  if (stack.length === 0) return null;
  return (
    <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tech stack">
      {stack.map((t) => (
        <li key={t} className="rounded-md border border-line px-2 py-0.5 font-mono text-xs text-muted">
          {t}
        </li>
      ))}
    </ul>
  );
}

const linkClass =
  "text-sm text-muted underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent";

export function ProjectLinks({ links, title }: { links: { github?: string; live?: string }; title: string }) {
  return (
    <div className="flex gap-4">
      {links.github && (
        <ExtLink href={links.github} className={linkClass}>
          <span className="sr-only">{title} on </span>GitHub
        </ExtLink>
      )}
      {links.live && (
        <ExtLink href={links.live} className={linkClass}>
          <span className="sr-only">{title}: </span>Live
        </ExtLink>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Verify and commit**

Run: `npm run typecheck && npx vitest run`
Expected: exit 0, all tests pass.

```bash
git add -A
git commit -m "feat: bold-markup parser and shared UI pieces
```

---

### Task 7: Hero, Featured, ProjectGrid, Experience

**Files:**
- Create: `components/sections/Hero.tsx`, `Featured.tsx`, `ProjectGrid.tsx`, `Experience.tsx`

**Interfaces:**
- Consumes: `site`, `featuredProjects`, `gridProjects` from `lib/content`; `RichText`, `SectionShell`, `ExtLink`, `StackTags`, `ProjectLinks` from the earlier tasks.
- Produces: `Hero()`, `Featured({title})`, `ProjectGrid({title})`, `Experience({title})`. Each returns `null` when it has nothing to show.

- [ ] **Step 1: `components/sections/Hero.tsx`**

```tsx
import { site } from "@/lib/content";
import { ExtLink } from "@/components/ui";

export function Hero() {
  const { profile } = site;
  return (
    <section id="hero" aria-label="Introduction" className="scroll-mt-20 pb-12 pt-16 md:pb-16 md:pt-28">
      {profile.status.show && (
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm text-muted">
          <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
          {profile.status.text}
        </p>
      )}
      <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">{profile.name}</h1>
      <p className="mt-3 font-mono text-lg text-accent md:text-2xl">{profile.headline}</p>
      <p className="mt-6 max-w-2xl text-lg text-muted">{profile.tagline}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={profile.resumePdf}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
        >
          Résumé
        </a>
        <ExtLink
          href={profile.links.github}
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent"
        >
          GitHub
        </ExtLink>
        <a
          href={`mailto:${profile.email}`}
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent"
        >
          Email
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: `components/sections/Featured.tsx`**

```tsx
import { featuredProjects } from "@/lib/content";
import { RichText } from "@/components/RichText";
import { ProjectLinks, SectionShell, StackTags } from "@/components/ui";

export function Featured({ title }: { title: string }) {
  const items = featuredProjects();
  if (items.length === 0) return null;
  return (
    <SectionShell id="featured" title={title}>
      <div className="grid gap-6">
        {items.map((p) => (
          <article key={p.id} className="rounded-2xl border border-line bg-surface p-6 md:p-8">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <h3 className="text-2xl font-semibold">{p.title}</h3>
              <ProjectLinks links={p.links} title={p.title} />
            </header>
            <p className="mt-2 text-muted">{p.oneLiner}</p>
            <ul className="mt-5 space-y-3 text-[0.95rem] leading-relaxed text-muted">
              {p.bullets.map((b, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <span>
                    <RichText text={b} />
                  </span>
                </li>
              ))}
            </ul>
            <StackTags stack={p.stack} />
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 3: `components/sections/ProjectGrid.tsx`**

```tsx
import { gridProjects } from "@/lib/content";
import { ProjectLinks, SectionShell, StackTags } from "@/components/ui";

export function ProjectGrid({ title }: { title: string }) {
  const items = gridProjects();
  if (items.length === 0) return null;
  return (
    <SectionShell id="projects" title={title}>
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((p) => (
          <article key={p.id} className="flex flex-col rounded-2xl border border-line bg-surface p-6">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <ProjectLinks links={p.links} title={p.title} />
            </header>
            <p className="mt-2 text-sm leading-relaxed text-muted">{p.oneLiner}</p>
            <StackTags stack={p.stack} />
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 4: `components/sections/Experience.tsx`**

```tsx
import { site } from "@/lib/content";
import { RichText } from "@/components/RichText";
import { ExtLink, SectionShell } from "@/components/ui";

export function Experience({ title }: { title: string }) {
  const items = site.experience.filter((e) => e.visible);
  if (items.length === 0) return null;
  return (
    <SectionShell id="experience" title={title}>
      <div className="space-y-10">
        {items.map((e) => (
          <article key={e.id}>
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-xl font-semibold">{e.org}</h3>
              <p className="font-mono text-sm text-muted">
                {e.start} – {e.end}
              </p>
            </header>
            <p className="mt-1 flex flex-wrap justify-between gap-x-4 text-muted">
              <span>{e.role}</span>
              <span className="text-sm">{e.location}</span>
            </p>
            <ul className="mt-4 space-y-3 text-[0.95rem] leading-relaxed text-muted">
              {e.bullets.map((b, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <span>
                    <RichText text={b} />
                  </span>
                </li>
              ))}
            </ul>
            {e.link && (
              <ExtLink
                href={e.link}
                className="mt-4 inline-block text-sm text-muted underline decoration-line underline-offset-4 hover:text-accent"
              >
                View the project on GitHub
              </ExtLink>
            )}
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 5: Verify and commit**

Run: `npm run typecheck && npm run lint`
Expected: exit 0.

```bash
git add -A
git commit -m "feat: hero, featured projects, project grid and experience sections
```

---

### Task 8: Remaining sections, SectionRenderer and home page

**Files:**
- Create: `components/sections/Dsa.tsx`, `Skills.tsx`, `Achievements.tsx`, `Education.tsx`, `Contact.tsx`, `components/SectionRenderer.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `site`, `leetcode`, `visibleSections`, `formatDate`; `SectionShell`, `ExtLink`, `RichText`; section components from Task 7.
- Produces: `SectionRenderer()` — renders `visibleSections()` in file order through a registry. A section id with no registered component (`tryPolyo` in Phase 1) is skipped silently.

- [ ] **Step 1: `components/sections/Dsa.tsx`**

```tsx
import { formatDate, leetcode, site } from "@/lib/content";
import { ExtLink, SectionShell } from "@/components/ui";

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-accent" : "border-line"} bg-surface`}>
      <dd className={`font-mono text-3xl font-semibold ${highlight ? "text-accent" : ""}`}>{value}</dd>
      <dt className="mt-1 text-sm text-muted">{label}</dt>
    </div>
  );
}

export function Dsa({ title }: { title: string }) {
  const { show, streakMinimum } = site.dsa;
  const lc = leetcode;
  const parts = [
    { label: "Easy", n: lc.easy, opacity: "opacity-40" },
    { label: "Medium", n: lc.medium, opacity: "opacity-70" },
    { label: "Hard", n: lc.hard, opacity: "opacity-100" },
  ];
  const total = lc.easy + lc.medium + lc.hard || 1;

  return (
    <SectionShell id="dsa" title={title}>
      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {show.solved && <Stat label="problems solved" value={String(lc.solved)} />}
        {show.hard && <Stat label="Hard solved" value={String(lc.hard)} highlight />}
        {show.activeDays && <Stat label="active days" value={String(lc.activeDays)} />}
        {show.streak && lc.streak >= streakMinimum && (
          <Stat label="day streak" value={String(lc.streak)} />
        )}
        {show.contestRating && <Stat label="contest rating" value={String(Math.round(lc.rating))} />}
        {show.topPercent && <Stat label="contest percentile (top)" value={`${Math.round(lc.topPercent)}%`} />}
      </dl>

      {show.byDifficulty && (
        <div className="mt-6">
          <div
            role="img"
            aria-label={`${lc.easy} easy, ${lc.medium} medium, ${lc.hard} hard`}
            className="flex h-3 overflow-hidden rounded-full bg-line"
          >
            {parts.map((p) => (
              <div
                key={p.label}
                className={`bg-accent ${p.opacity}`}
                style={{ width: `${(p.n / total) * 100}%` }}
              />
            ))}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm text-muted">
            {parts.map((p) => (
              <li key={p.label}>
                {p.label} {p.n}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-6 text-sm text-muted">
        From{" "}
        <ExtLink href={site.profile.links.leetcode} className="underline decoration-line underline-offset-4 hover:text-accent">
          LeetCode
        </ExtLink>
        , updated {formatDate(lc.fetchedAt)}.
      </p>
    </SectionShell>
  );
}
```

- [ ] **Step 2: `components/sections/Skills.tsx`**

```tsx
import { site } from "@/lib/content";
import { SectionShell } from "@/components/ui";

export function Skills({ title }: { title: string }) {
  if (site.skills.length === 0) return null;
  return (
    <SectionShell id="skills" title={title}>
      <dl className="space-y-5">
        {site.skills.map((row) => (
          <div key={row.id} className="grid gap-2 md:grid-cols-[11rem_1fr] md:gap-6">
            <dt className="font-medium">{row.label}</dt>
            <dd>
              <ul className="flex flex-wrap gap-2">
                {row.items.map((item) => (
                  <li key={item} className="rounded-md border border-line px-2.5 py-1 text-sm text-muted">
                    {item}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </SectionShell>
  );
}
```

- [ ] **Step 3: `components/sections/Achievements.tsx`**

```tsx
import { site } from "@/lib/content";
import { ExtLink, SectionShell } from "@/components/ui";

export function Achievements({ title }: { title: string }) {
  const items = site.achievements.filter((a) => a.visible);
  if (items.length === 0) return null;
  return (
    <SectionShell id="achievements" title={title}>
      <ul className="space-y-4">
        {items.map((a) => (
          <li key={a.id}>
            <p className="font-semibold">{a.title}</p>
            <p className="text-muted">
              {a.text}
              {a.link && (
                <>
                  {" "}
                  <ExtLink href={a.link} className="underline decoration-line underline-offset-4 hover:text-accent">
                    Link
                  </ExtLink>
                </>
              )}
            </p>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
```

- [ ] **Step 4: `components/sections/Education.tsx`**

```tsx
import { site } from "@/lib/content";
import { SectionShell } from "@/components/ui";

export function Education({ title }: { title: string }) {
  const items = site.education.filter((e) => e.visible);
  if (items.length === 0) return null;
  return (
    <SectionShell id="education" title={title}>
      <div className="space-y-6">
        {items.map((e) => (
          <article key={e.id}>
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-xl font-semibold">{e.school}</h3>
              <p className="font-mono text-sm text-muted">
                {e.start} – {e.end}
              </p>
            </header>
            <p className="mt-1 flex flex-wrap justify-between gap-x-4 text-muted">
              <span>{e.degree}</span>
              <span className="text-sm">{e.location}</span>
            </p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 5: `components/sections/Contact.tsx`**

```tsx
import { site } from "@/lib/content";
import { ExtLink, SectionShell } from "@/components/ui";

const linkClass =
  "rounded-lg border border-line px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent";

export function Contact({ title }: { title: string }) {
  const { profile } = site;
  return (
    <SectionShell id="contact" title={title}>
      <p className="max-w-xl text-lg text-muted">
        Looking for an AI/ML or software engineer? The quickest way to reach me is email.
      </p>
      <p className="mt-4">
        <a
          href={`mailto:${profile.email}`}
          className="font-mono text-xl text-accent underline underline-offset-4"
        >
          {profile.email}
        </a>
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <ExtLink href={profile.links.linkedin} className={linkClass}>
          LinkedIn
        </ExtLink>
        <ExtLink href={profile.links.github} className={linkClass}>
          GitHub
        </ExtLink>
        <ExtLink href={profile.links.leetcode} className={linkClass}>
          LeetCode
        </ExtLink>
      </div>
    </SectionShell>
  );
}
```

- [ ] **Step 6: `components/SectionRenderer.tsx`**

```tsx
import type { ReactNode } from "react";
import { visibleSections } from "@/lib/content";
import type { SectionId } from "@/lib/schema";
import { Achievements } from "@/components/sections/Achievements";
import { Contact } from "@/components/sections/Contact";
import { Dsa } from "@/components/sections/Dsa";
import { Education } from "@/components/sections/Education";
import { Experience } from "@/components/sections/Experience";
import { Featured } from "@/components/sections/Featured";
import { Hero } from "@/components/sections/Hero";
import { ProjectGrid } from "@/components/sections/ProjectGrid";
import { Skills } from "@/components/sections/Skills";

type Render = (title: string) => ReactNode;

// Sections not listed here (tryPolyo, until Phase 2) are skipped.
const registry: Partial<Record<SectionId, Render>> = {
  hero: () => <Hero />,
  featured: (t) => <Featured title={t} />,
  projects: (t) => <ProjectGrid title={t} />,
  experience: (t) => <Experience title={t} />,
  dsa: (t) => <Dsa title={t} />,
  skills: (t) => <Skills title={t} />,
  achievements: (t) => <Achievements title={t} />,
  education: (t) => <Education title={t} />,
  contact: (t) => <Contact title={t} />,
};

export function SectionRenderer() {
  return (
    <>
      {visibleSections().map((s) => {
        const render = registry[s.id];
        return render ? <div key={s.id}>{render(s.title)}</div> : null;
      })}
    </>
  );
}
```

- [ ] **Step 7: Replace `app/page.tsx`**

```tsx
import { SectionRenderer } from "@/components/SectionRenderer";

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6">
      <SectionRenderer />
    </main>
  );
}
```

- [ ] **Step 8: Verify**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: exit 0; build output shows `/` as static (`○` or "Static"/"Prerendered"), not dynamic. If the build says a route is dynamic or complains about request-time data, a component used `new Date()`, `Math.random()` or a request API. Fix by removing that call (see Task 5 note). Do not turn off `cacheComponents`.
Then `npm run start` and open `http://localhost:3000`, scroll the whole page in dark and light.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: remaining sections, section registry and home page
```

---

### Task 9: End-to-end tests, viewports and Lighthouse

**Files:**
- Create: `tests/e2e/home.spec.ts`

- [ ] **Step 1: Write the tests** — `tests/e2e/home.spec.ts`

```ts
import { expect, test } from "@playwright/test";

test("renders the résumé content and logs no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Priyanshu Tiwari" })).toBeVisible();
  for (const name of [
    "PolyO", "The Aerial Guardian", "Enagram.io", "WeaponShield AI",
    "India Space Lab", "Jaypee Institute of Information Technology",
  ]) {
    await expect(page.getByRole("heading", { name })).toBeVisible();
  }
  await expect(page.getByText("Embedded Systems Intern")).toBeVisible();
  await expect(page.getByText("603", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("hidden projects do not appear", async ({ page }) => {
  await page.goto("/");
  for (const name of ["MedFusionAI", "Leehint", "reddit-insights", "drone-tilt-detection"]) {
    await expect(page.getByRole("heading", { name })).toHaveCount(0);
  }
});

test("shows no phone number and no ISRO claim", async ({ page }) => {
  await page.goto("/");
  const body = page.locator("body");
  await expect(body).not.toContainText("XXXXXXXXXX");
  await expect(body).not.toContainText("+91");
  await expect(body).not.toContainText("ISRO");
});

test("contest rating is hidden by default", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("1533")).toHaveCount(0);
});

test("theme toggle switches and persists across reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
});

test("first visit follows the system colour scheme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("résumé link serves a PDF", async ({ page, request }) => {
  await page.goto("/");
  const link = page.getByRole("link", { name: "Résumé" });
  await expect(link).toHaveAttribute("href", "/resume.pdf");
  const res = await request.get("/resume.pdf");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("pdf");
});

test("external links open safely", async ({ page }) => {
  await page.goto("/");
  const links = page.locator('a[target="_blank"]');
  expect(await links.count()).toBeGreaterThan(5);
  for (const rel of await links.evaluateAll((els) => els.map((e) => e.getAttribute("rel")))) {
    expect(rel).toContain("noopener");
  }
});

for (const width of [375, 768, 1440]) {
  test(`no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
}

test("unknown routes show the 404 page", async ({ page }) => {
  const res = await page.goto("/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("That page doesn't exist.")).toBeVisible();
});
```

- [ ] **Step 2: Run them**

Run: `npm run e2e`
Expected: build succeeds, 12 tests pass (the three viewport tests count separately). Fix real failures in the components. Do not weaken a test to make it pass. If a heading query is ambiguous (for example `PolyO` also matching text inside another heading), use `exact: true` on that query, not a weaker assertion.

- [ ] **Step 3: Visual check at three widths**

With `npm run start` running, use the Playwright MCP browser (or `npx playwright screenshot`) to take full-page screenshots at 375, 768 and 1440 px, in dark and light, and look at them. Fix anything clipped, misaligned or low-contrast.

- [ ] **Step 4: Lighthouse (mobile)**

```bash
npx --yes lighthouse http://localhost:3000 --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless=new" --output=json --output-path=./lighthouse.json --quiet
python -c "import json;c=json.load(open('lighthouse.json'))['categories'];print({k:round(v['score']*100) for k,v in c.items()})"
```

Expected: every score ≥ 95. If one is lower, read the failing audits in `lighthouse.json`, fix the cause, and re-run. Delete `lighthouse.json` afterwards and add it to `.gitignore` if it would otherwise be committed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: end-to-end coverage for the public site
```

---

### Task 10: CI, README, and publishing (needs his OK)

**Files:**
- Create: `.github/workflows/ci.yml`, `README.md`

- [ ] **Step 1: `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run validate-content
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
```

- [ ] **Step 2: `README.md`**

Write a README with: what this is (one paragraph), how to run it (`npm install`, `npm run dev`), the checks (`npm run typecheck`, `npm test`, `npm run validate-content`, `npm run e2e`), how content works (everything lives in `content/site.json`, checked by `lib/schema.ts`; LeetCode numbers live in `data/leetcode.json`), the project status ("Phase 1 of 6 done: read-only site; editing, login and live data come next"), and the link to the spec. No phone number, no secrets.

- [ ] **Step 3: Run the full check once more**

Run: `npm run typecheck && npm run lint && npm test && npm run validate-content && npm run e2e`
Expected: everything passes.

- [ ] **Step 4: Commit locally**

```bash
git add -A
git commit -m "ci: verify workflow and README
```

- [ ] **Step 5: STOP and ask him before anything goes online**

Creating a GitHub repo and pushing are outward-facing, so ask first, in plain words: "Phase 1 is built and tested locally. Shall I create `Halok600/portfolio` as a public repo and push it?" Only after his yes:

```bash
gh repo create Halok600/portfolio --public --source=. --remote=origin --description "Personal portfolio with a password-protected edit mode" --push
gh run watch
```

Expected: the CI run goes green.

- [ ] **Step 6: Give him the Vercel steps (his account, about 3 minutes)**

1. Go to vercel.com/new, sign in with GitHub, and import `Halok600/portfolio`.
2. Leave every setting at its default (framework: Next.js) and click **Deploy**.
3. When it finishes, copy the `*.vercel.app` address and send it to me.
4. Check it on his phone and send me anything that looks wrong.

---

## Self-Review (done while writing)

- **Spec coverage, Phase 1 (§16):** Next.js project ✓ T1 · schema ✓ T2 · seed from résumé ✓ T3 · every section except Try PolyO and Recently shipped (Phase 2 by §16) ✓ T7–8 · dark/light ✓ T5 · accent colours ✓ T5 (6 presets; switching them in the UI is Phase 4) · Vercel deploy ✓ T10 · Lighthouse 95+ ✓ T9. Spec §6 content, typo fixes, hidden projects, no CGPA, contest rating off ✓ T3 tests. Spec §13 answers (LinkedIn, no phone) ✓ constraints + tests.
- **Deliberately moved out of Phase 1:** case-study pages, Ctrl+K, OG image, `robots.ts` (spec puts them in Phases 3 and 6); hover video and the profile photo (they need image upload, Phase 5).
- **Found while planning:** the résumé PDF contains his phone number, so Task 4 publishes a phone-free copy and leaves the original untouched.
- **Placeholder scan:** none. Every code step has full code.
- **Type consistency:** `visibleSections`, `featuredProjects`, `gridProjects`, `formatDate`, `site`, `leetcode` (Task 3) are used with the same names in Tasks 5, 7, 8. Section components take `{ title }`, which `SectionRenderer` passes. `ProjectLinks` takes `{ links, title }` everywhere it is used.
