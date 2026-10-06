# Priyanshu Tiwari — Portfolio

A fast, static portfolio built with Next.js 16, TypeScript and Tailwind CSS. Everything on the page
comes from one validated JSON file, so the content can be changed without touching any component.
A password-protected edit mode (click-to-edit, add and remove projects, drag to reorder, save to GitHub)
is being built on top of this, phase by phase.

## Status

| Phase | What | State |
|---|---|---|
| 1 | Read-only site: content schema, all sections, dark and light themes | **Done** |
| 2 | Live data: daily LeetCode numbers, recently shipped, "Try PolyO" box | Next |
| 3 | Login: `/edit`, signed session cookie, security checks | Planned |
| 4 | Edit mode: click-to-edit, add, delete, hide, reorder | Planned |
| 5 | Saving: commits to this repo, image and résumé upload, history and undo | Planned |
| 6 | Polish: Ctrl+K menu, link preview image, case-study pages | Planned |

The full design is in [`docs/superpowers/specs/2026-10-07-portfolio-design.md`](docs/superpowers/specs/2026-10-07-portfolio-design.md)
and the Phase 1 build plan is in [`docs/superpowers/plans/`](docs/superpowers/plans/2026-10-07-phase-1-read-only-site.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

## Checks

```bash
npm run typecheck        # TypeScript
npm run lint             # ESLint
npm test                 # unit tests (Vitest)
npm run validate-content # content files against the schema
npm run e2e              # builds, then runs the browser tests (Playwright)
```

`npm run build` runs `validate-content` first, so a broken content file can never be deployed.

## How the content works

- `content/site.json` holds everything that can be edited: profile, sections and their order,
  projects, experience, education, skills and achievements. `lib/schema.ts` is the single source
  of truth for what is allowed in it.
- `data/leetcode.json` holds the LeetCode numbers. It will be refreshed daily by a GitHub Action
  (Phase 2) and is never edited by hand.
- Short **bold** phrases inside bullets are written as `**bold**`. No HTML is accepted anywhere.
- Contact details are limited to email and profile links. There is deliberately no phone number
  field, and a test fails if one ever appears.
