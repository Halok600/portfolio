# Portfolio Phase 2 — Live Data Implementation Plan

**Goal:** Make the portfolio show things that are demonstrably live: a working "Try PolyO" box, a "Recently shipped" strip from GitHub, and LeetCode data that refreshes by itself.

**Spec:** `docs/superpowers/specs/2026-10-07-portfolio-design.md` §11 (this plan changes one decision, see Decisions).

## Global constraints

- Priyanshu is the sole contributor: every commit and every automated commit is authored and committed as `Priyanshu Kumar Tiwari <143282195+Halok600@users.noreply.github.com>`; no co-author or tool attribution anywhere. Run the three pre-push gates from the Phase 1b plan before every push.
- Never write his phone number anywhere (see memory `never-write-phone-number`); guard tests use patterns.
- Public pages stay static. Server data goes through `use cache` + `cacheLife`, never `cookies()`/`headers()`.
- No new third-party services or API keys. Everything must degrade silently (strip hidden, box shows a clear message) if an upstream is down.
- Lighthouse mobile stays at about 95 or better in all four categories.

## Decisions

1. **PolyO is called through our own route (`/api/polyo`), not directly from the browser.** The spec wanted a CORS change in the polyo repo. A same-site proxy needs no change to that repo, hides the upstream URL, lets us cap input, rate-limit, validate the reply and handle cold starts. Cost: one small server route.
2. **The LeetCode job commits only when data changed.** A daily timestamp-only commit would paint his GitHub contribution graph green with automated noise.
3. **"Recently shipped" shows only repos that appear on the site** (visible projects plus this portfolio), newest push per repo, skipping `chore/docs/ci/merge` commits.
4. A static **sample result** is shown in the PolyO box before anything is run, so the card is never empty and a recruiter sees the output without waiting for a cold server. It is labelled as a sample.

## Tasks

| # | Task | Verification |
|---|---|---|
| 1 | Bump CI action majors (`checkout@v7`, `setup-node@v7`) | CI green, no Node 20 notice |
| 2 | `.github/workflows/leetcode.yml` daily refresh, commits as him, only on change | Dispatch on a throwaway branch with stale data; commit appears authored by `Halok600`; branch deleted |
| 3 | `shipped` section id; `lib/github-activity.ts` pure helpers (TDD); `Shipped` server component with `use cache` | Unit tests; strip renders; hidden when empty or older than 30 days |
| 4 | `lib/polyo.ts` (schemas, languages, examples, `formatBigO`), `lib/rate-limit.ts`, `lib/polyo-proxy.ts` handler + `app/api/polyo/route.ts` (TDD) | Unit tests incl. 403/429/400/502/504 paths |
| 5 | `TryPolyo` client component, growth chart, sample result, warm-up ping, CSS | Browser tests with the API mocked: success, slow, error, keyboard |
| 6 | Visual QA at 3 widths x 2 themes, Lighthouse, docs, push, CI and deploy check | Screenshots reviewed; scores recorded |
