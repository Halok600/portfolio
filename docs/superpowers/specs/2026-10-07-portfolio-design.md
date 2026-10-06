# Portfolio with password-protected edit mode — design

**Owner:** Priyanshu Tiwari · **Written:** 7 Oct 2026 · **Status:** waiting for review

---

## 1. What we are building, in one paragraph

A personal portfolio website that anyone can visit. If Priyanshu opens `/edit` and types his
password, the same page switches into **edit mode**. He can then click any text to change it, add
or remove projects, drag sections into a new order, upload screenshots or a new résumé PDF, and
switch LeetCode numbers on or off. When he clicks **Save**, the change is stored as a commit in
the site's GitHub repo, Vercel rebuilds the site, and the change is live in about a minute. Every
save is in the history and can be undone.

## 2. Decisions already made (7 Oct 2026)

| Question | Decision | Why |
|---|---|---|
| How to edit | **Inline on the real page** (option A) | What he asked for: turn on edit mode and click things |
| Where saves go | **Commits to the GitHub repo**, live in ~1 min | Free history and undo, no database to keep alive, saves count on his contribution graph |
| LeetCode numbers | **Fetched automatically once a day**; edit mode only switches each number on or off | Numbers can't go stale or be typed wrong |
| Uploads | **Images and résumé PDF** from the browser; videos are **links only** | Videos would bloat the repo forever |
| Hosting | **Vercel** (free Hobby plan), not GitHub Pages | A password check needs a server; on a static site anyone could read and bypass it |
| Content source | **Main v2 résumé** (`D:/LINKEDIN/resume/main/v2/main-resume-v2.html`) | His instruction. India Space Lab appears as **"Embedded Systems Intern"** under Experience |

## 3. What is NOT in scope

Kept out on purpose, so the build stays finishable:

- More than one editor account, or user sign-ups
- A blog, comments, or a contact form (email link is enough)
- Video uploads
- Real-time collaborative editing
- Translations
- An analytics dashboard (Vercel's free Web Analytics can be switched on later with one click)

---

## 4. How the pieces fit

```
                         ┌──────────────────────────────┐
  Visitor ─────────────▶ │  Vercel: Next.js site        │ ◀── rebuilds on every push to main
                         │  - public pages (static)     │
  Priyanshu ─ /edit ───▶ │  - /api/login, /api/save ... │
   (password)            │    (server only, has secrets)│
                         └──────┬──────────────▲────────┘
                                │ commit        │ "which commit is live?"
                                ▼               │
                         ┌──────────────────────┴───────┐
                         │ GitHub repo Halok600/portfolio│
                         │  content/site.json  ◀── all text, projects, toggles
                         │  data/leetcode.json ◀── written daily by a GitHub Action
                         │  public/uploads/*   ◀── images
                         │  public/resume.pdf                                    │
                         └──────────────────────────────┘

  Browser ── direct ──▶ polyo-api.onrender.com/v1/predict   (the "Try PolyO" box)
  Server  ── hourly ──▶ GitHub API (recent public pushes)    (the "Recently shipped" strip)
```

**Main rule:** the website reads everything from files in the repo. Editing means changing those
files. Nothing lives in a database, so the repo *is* the backup.

### Tech stack

| Part | Choice | Notes |
|---|---|---|
| Framework | **Next.js** (latest stable, App Router, TypeScript) | He already uses it (Enagram.io) |
| Styling | **Tailwind CSS** | |
| Content checking | **Zod** | One schema, used by the editor, the server and the build |
| Login session | **jose** (signed cookie) + **scrypt** from `node:crypto` | No native packages, works on Vercel |
| GitHub writes | **Octokit** | |
| Drag to reorder | **dnd-kit** | Works with keyboard too |
| Ctrl+K menu | **cmdk** | |
| Case-study text | **react-markdown**, no raw HTML allowed | |
| Tests | **Vitest** (unit/API), **Playwright** (browser) | |

### Folder layout

```
app/
  page.tsx                    home page (every section)
  projects/[slug]/page.tsx    case-study page for a project
  edit/page.tsx               password screen
  api/login|logout|me|save|history|restore|version/route.ts
  opengraph-image.tsx         link-preview image
  not-found.tsx
components/
  sections/                   Hero, TryPolyO, Featured, ProjectGrid, Experience,
                              Dsa, RecentlyShipped, Skills, Achievements, Education, Contact
  editor/                     loaded ONLY after login, so visitors never download it
  CommandMenu.tsx, ThemeToggle.tsx
content/site.json             everything he can edit
data/leetcode.json            written by the daily Action, never by hand
public/uploads/               uploaded images
public/resume.pdf
lib/
  schema.ts                   the Zod schema (single source of truth)
  auth.ts                     password check + session cookie
  github.ts                   commit, history, restore
  change-summary.ts           turns a diff into a commit message
scripts/
  hash-password.ts            makes the password hash for Vercel settings
  fetch-leetcode.ts           used by the daily Action
  validate-content.ts         runs in CI and in every Vercel build
.github/workflows/ci.yml, leetcode.yml
```

---

## 5. The content file (`content/site.json`)

Everything editable lives in one JSON file, checked by `lib/schema.ts`. Every list item has a
stable `id`, so reordering and deleting never mix items up.

```ts
Site = {
  version: 1,
  settings: { accent: "cyan"|"violet"|"green"|"amber"|"rose"|"blue", defaultTheme: "dark"|"light" },
  profile: {
    name, headline, tagline,
    status: { show: boolean, text },          // "Open to AI/ML & SDE roles · Noida / Remote"
    location, email,
    links: { github, linkedin, leetcode },
    photo?: "/uploads/....webp",
    resumePdf: "/resume.pdf"
  },
  sections: [{ id: SectionId, title, visible }],   // array order = page order
  projects: [{
    id, slug, title, oneLiner,
    stack: string[], bullets: string[],
    links: { github?, live? },
    image?, videoUrl?,                         // videoUrl: YouTube or a direct .mp4 link
    featured: boolean, visible: boolean,
    caseStudy?: string                         // markdown; if empty, no case-study page
  }],
  experience:  [{ id, org, role, location, start, end, bullets[], link?, visible }],
  education:   [{ id, school, degree, start, end, location, visible }],
  skills:      [{ id, label, items: string[] }],
  achievements:[{ id, title, text, link?, visible }],
  dsa: {
    show: { solved, byDifficulty, hard, activeDays, streak, contestRating, topPercent },
    streakMinimum: 7                           // streak is hidden automatically below this
  },
  recentlyShipped: { show: boolean, hideIfOlderThanDays: 30 }
}
```

**Checks the schema enforces:** every link must start with `http://` or `https://` (this blocks
`javascript:` links); text fields have length limits; slugs are unique; image paths must sit under
`/uploads/`. The **same** schema runs in the editor (so mistakes show before saving), on the server
(so a bad save is refused), and in the build (so a broken file can never go live).

`data/leetcode.json` is separate and read-only to the editor:
`{ fetchedAt, solved, easy, medium, hard, activeDays, streak, rating, topPercent, contests }`.

---

## 6. Starting content (copied from the main v2 résumé)

Copied word for word. The only changes are the three typo fixes marked ✱, which go into the
résumé too if he agrees (see §13).

- **Profile:** Priyanshu Tiwari · headline "AI/ML Engineer" · email `pkt.codes@gmail.com` ·
  GitHub `Halok600` · LeetCode `priyanshuthebest2` · LinkedIn `priyanshu0604` ·
  **no phone number anywhere in the data, the code or the repo** (his decision, 7 Oct).
- **Featured projects (shown):** PolyO (GitHub + Live `polyo.vercel.app`), The Aerial Guardian
  (GitHub + Live), Enagram.io (GitHub + Live). Résumé bullets as written.
- **More projects (shown):** WeaponShield AI, **GitHub link only** (its live site is an empty page).
- **More projects (added, but hidden):** MedFusionAI (GitHub only, its demo is behind a login wall),
  drone-tilt-detection, Leehint, reddit-insights. Descriptions come from the GitHub repo
  descriptions. He turns any of them on with one click.
- **Experience:** India Space Lab · **Embedded Systems Intern** · Jun 2025 – Jul 2025 · New Delhi,
  India (Remote) · the four résumé bullets · link to `Halok600/drone-tilt-detection`.
- **Education:** Jaypee Institute of Information Technology · B.Tech CSE · Sep 2022 – Sep 2026 ·
  Noida. No CGPA field.
- **Skills:** the six résumé rows. ✱ "Devloper Tools" → "Developer Tools", ✱ "TensorFlow ," →
  "TensorFlow", ✱ trailing comma after "HTML5" removed.
- **Achievements:** BEcon '24 IIT Delhi finalist (résumé wording). The LeetCode line becomes the
  DSA card instead of a sentence.
- **DSA card switches:** solved ✓, by difficulty ✓, Hard highlighted ✓, active days ✓, streak ✓
  (auto-hidden under 7 days), contest rating ✗, top % ✗.

---

## 7. Pages and design

### Home page, top to bottom (order and visibility editable)

1. **Hero:** name, headline, one-line tagline, status line, buttons for Résumé / GitHub / Email.
2. **Try PolyO:** code box, language picker, Analyse button, result card (§9).
3. **Featured work:** three large cards with an image, or a muted video that plays on hover.
4. **More projects:** a small grid.
5. **Experience**
6. **DSA + Recently shipped:** side by side on desktop, stacked on mobile.
7. **Skills**
8. **Achievements**
9. **Education**
10. **Contact:** email (with copy button), LinkedIn, GitHub, LeetCode.

### Other pages

- `/projects/<slug>`: a case study, created only when the project has case-study text. Layout:
  problem → what I built → a decision I'm proud of → result → links.
- `/edit`: the password screen.
- `/resume.pdf`
- A custom 404 page.

### Visual design

- **Dark by default**, with a light-mode toggle. The choice is remembered, and the visitor's system
  setting is used on the first visit.
- **One accent colour**, chosen from 6 presets in edit mode.
- Fonts: **Geist Sans** for text and **Geist Mono** for numbers and code, self-hosted through
  `next/font`, so no Google Fonts request.
- **Ctrl+K / ⌘K menu:** jump to a section, open a project, copy email, download résumé, switch theme.
- **Hover video** only for direct `.mp4` links. YouTube links show a thumbnail and play on click.
  No motion at all when the visitor has "reduce motion" turned on.
- **Link preview image** for LinkedIn and WhatsApp, made automatically from his name, headline
  and accent colour.
- **Avoid:** skill % bars, typing animations, 3D or particle backgrounds.

### Performance targets

- Lighthouse on mobile: **95+** for Performance, Accessibility, Best Practices and SEO.
- Visitors never download the editor code. It loads with `dynamic import` only after
  `/api/me` confirms a login.
- Public pages are pre-built static pages. Only the "Recently shipped" strip refreshes hourly.

---

## 8. Edit mode — what it feels like

**Getting in:** go to `/edit` → type password → land on the home page with a slim **edit toolbar**
pinned at the top:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ✎ EDIT MODE   3 unsaved changes   [Preview] [History] [Settings] [Save] [Log out] │
└──────────────────────────────────────────────────────────────────────────┘
```

| Action | How |
|---|---|
| Change any text | Click it and type. A dashed outline shows what can be edited. Enter or click-away to finish, Esc to cancel |
| Add an item (project, bullet, skill, experience…) | **+ Add** button at the end of each list |
| Delete | 🗑 on hover, with a 5-second **Undo** toast. Nothing is lost until Save anyway |
| Reorder | Drag handle ⋮⋮ on items and on whole sections (also works with the keyboard) |
| Hide without deleting | 👁 switch on every item and section. Hidden things show faded in edit mode and disappear for visitors |
| Edit a project fully | Click its card → **side panel** with every field: title, slug, one-liner, stack tags, bullets, GitHub/Live links, image upload, video link, featured, visible, case-study text with a live preview |
| LeetCode / GitHub strip | Switches on the card itself, one per number |
| Accent colour, default theme, section titles | **Settings** panel |
| New résumé | Settings → **Replace résumé PDF** |
| See it as a visitor | **Preview** hides every editing control until clicked again |

**Unsaved work is never lost.** Changes are copied to the browser's local storage every few
seconds. If the tab closes, the next visit to `/edit` offers **Restore unsaved changes?**

**Mistakes show before saving.** A bad link or empty title gets a red outline with a plain message
("Live link must start with https://"), and **Save** stays disabled until it's fixed.

---

## 9. Saving, going live, and undo

### One click on Save does this

1. The browser checks the whole file with the Zod schema and shrinks any new image (longest side
   1600 px, WebP, about 300 KB).
2. It sends `POST /api/save { baseSha, site, uploads[] }`. `baseSha` is the commit the editor
   started from.
3. The server checks the login cookie and the request's Origin, then checks the content again with
   the same schema and checks file sizes and types.
4. The server reads the latest commit on `main`:
   - If **`content/site.json` changed** since `baseSha` (someone else saved, for example from his
     phone), it answers **409**. The editor says "The site changed since you opened the editor —
     reload to get the latest, your edits are kept" and keeps the draft.
   - If only **other files** changed (for example the daily LeetCode update), it continues. The new
     commit sits on top of the latest one, so the bot never blocks him.
5. In **one commit** it writes `site.json` and any images. The author is
   `Priyanshu Kumar Tiwari <143282195+Halok600@users.noreply.github.com>`, so the commit counts on
   his graph. The message is generated from the change, for example
   `content: edit PolyO bullets, add project "LeetCoach"`. It never force-pushes.
6. It returns the new commit SHA. The toolbar shows **Publishing… (about 1 min)**.
7. The browser asks `GET /api/version` every 5 seconds. That returns the commit the live site was
   built from (`VERCEL_GIT_COMMIT_SHA`). When it matches → **✓ Live**.
8. If it hasn't matched after 4 minutes: "Taking longer than usual — check the Vercel dashboard."
   The old version stays live and nothing breaks.

**Size limit:** Vercel accepts at most about 4.5 MB per request. After shrinking, about ten new
images fit in one save. If more are added, the editor splits them over several saves
automatically.

**Résumé PDF:** must start with `%PDF` and be 3 MB or less. It replaces `public/resume.pdf`, and the
old one stays in history.

### A broken file can never go live

`npm run validate-content` runs in every Vercel build and in CI. If `site.json` were somehow
invalid, the build fails and **Vercel keeps the previous version live**.

### History and undo

**History** lists the last 20 saves (date, message, commit link). **Restore** puts back
`site.json` from that save **as a new commit**. Nothing is ever deleted or rewritten, so a restore
can itself be undone.

Uploaded images are **never** deleted automatically, even when a project is removed. Otherwise
restoring an old version would show broken images. They are small, so this is fine.

---

## 10. Login and security

| Threat | Defence |
|---|---|
| Guessing the password | Only a **scrypt hash** is stored, in the `ADMIN_PASSWORD_HASH` env var on Vercel. The password must be **at least 20 characters** (a 4–5 word passphrase), and the hash script refuses shorter ones. Every wrong attempt waits a fixed **1 second**, and comparisons are constant-time. Add Vercel's firewall rate-limit rule on `/api/login` **if his plan includes it**; the passphrase length is the main defence either way |
| Stealing the session | The cookie is signed with `SESSION_SECRET`, and is `httpOnly`, `Secure` and `SameSite=Strict`. It expires after **8 hours**. **Log out** clears it. Changing `SESSION_SECRET` logs out every device |
| Another site forcing a save (CSRF) | `SameSite=Strict`, **plus** every POST checks that `Origin` equals the site's own address |
| Skipping the login check | **Every** API route checks the session itself. We don't rely on middleware alone (a 2025 Next.js bug, CVE-2025-29927, let attackers skip middleware) |
| Leaking the GitHub key | The **fine-grained token** works only on the `portfolio` repo, with only *Contents: read/write*. It lives only in Vercel's server env vars and **never** in a `NEXT_PUBLIC_` variable, so it can't reach the browser |
| Script injection through content | Text is shown through React, which escapes it. Markdown is shown with **no raw HTML**. Links must be `http(s)`. Images are re-encoded in the browser, and the server checks the file signature (PNG/JPEG/WebP/PDF) |
| `/edit` showing up on Google | `noindex`, plus `robots.txt` disallows `/edit` and `/api` |
| Forgotten password | Run `npm run hash-password` → paste the new hash into Vercel → redeploy. Documented in the README |

**Secrets (Vercel → Settings → Environment Variables):**
`ADMIN_PASSWORD_HASH`, `SESSION_SECRET` (32 random bytes), `GITHUB_TOKEN`, `GITHUB_REPO=Halok600/portfolio`.

**Note on "hidden" items:** if the repo is public (§13), a hidden item is hidden **on the site**,
but anyone reading `site.json` on GitHub can still see it. Hide things you're not ready to show,
not things that are secret.

---

## 11. Live data

### LeetCode (daily GitHub Action)

- `.github/workflows/leetcode.yml` runs every day at **03:00 IST** (`30 21 * * *` UTC), and can also
  be run by hand.
- `scripts/fetch-leetcode.ts` makes the same GraphQL request that was tested on 6 Oct (it returned
  603 / 216 / 317 / 70, rating 1533, 164 active days).
- **Commits only when a number changed**, so there's no daily commit noise. Each change triggers one
  rebuild.
- **If LeetCode blocks the request:** the old file stays, the site keeps showing the last good
  numbers with "updated <date>", and the Action fails, so GitHub emails him.

### Recently shipped (GitHub)

- The server fetches his **public** push events once an hour (Next.js `revalidate: 3600`) using the
  same token, and shows the last 3–5 as "PolyO · 4 days ago".
- Only public, non-archived repos. Repo names map to project titles where they match.
- **Hidden automatically if the newest push is older than 30 days**, so the strip can never show
  inactivity. Can also be switched off by hand.
- If the API fails, the strip simply doesn't render.

### Try PolyO box

- The browser calls `https://polyo-api.onrender.com/v1/predict` directly with `{ code, language }`.
  Tested working on 6 Oct.
- **Needs one change in the PolyO API:** add the portfolio's address to its CORS allow-list. Today
  it only allows `https://polyo.vercel.app`, so calls from any other site are blocked.
- 3 example snippets are preloaded (nested loop, binary search, recursive Fibonacci). Input is
  capped at 5,000 characters.
- Shows the **time** and **space** class plus confidence. It also shows **how it got the answer**
  ("static analysis" or "learned model", from the API's `engine` field). This is honest, and it's an
  interview talking point rather than a surprise.
- If there's no answer after 5 seconds: "Waking up the server (free hosting sleeps)…". It gives up
  at 60 seconds with a link to `polyo.vercel.app`.

---

## 12. Errors, in plain words

| What goes wrong | What he sees |
|---|---|
| Wrong password | "Wrong password." (after the 1 s wait). Nothing more specific |
| Session expired mid-edit | "You've been logged out. Your changes are kept — log in again to save." Draft stays in local storage |
| Someone else saved first | The 409 message from §9, with draft kept |
| GitHub key expired or revoked | "Saving failed: the GitHub key has expired. Create a new one (README §Setup) and update it in Vercel." |
| GitHub down / network error | "Couldn't reach GitHub. Nothing was saved — try again." The draft is kept |
| Build failed | Toolbar times out after 4 minutes with the Vercel hint. The previous version stays live |
| Image too big or wrong type | Refused in the browser before upload, with the limit stated |

---

## 13. Questions and answers

| # | Question | Answer |
|---|---|---|
| 1 | Repo public or private? | **Public** (default taken: not answered 7 Oct, can be flipped later). Hidden items are readable in `site.json`, see §10 |
| 2 | Site address | Free `*.vercel.app` name first (default taken: not answered); custom domain later |
| 3 | LinkedIn handle | **`priyanshu0604`** (his answer, 7 Oct) |
| 4 | Fix the three typos | Fixed in the site's seed content. The résumé fix is still waiting for his OK |
| 5 | Phone number | **None on the site.** Removed from the data model entirely, because a hidden field in a public repo would still publish it |

---

## 14. Things only he can do

These need his accounts. Each one comes with exact click-by-click steps at the right phase.

| Step | When | Time |
|---|---|---|
| OK me to create the GitHub repo `Halok600/portfolio` with `gh` | Phase 1 | 0 min |
| Import the repo in Vercel (free Hobby plan) | Phase 1 | 3 min |
| Create the fine-grained GitHub token (UI only: no API exists). Needed from Phase 2, because the Recently-shipped strip reads GitHub with it | Phase 2 | 3 min |
| Choose a 20+ character passphrase, run `npm run hash-password`, paste 4 env vars into Vercel | Phase 3 | 5 min |
| OK the one-line CORS change in the PolyO repo | Phase 2 | 0 min |
| Upload a profile photo (optional) | any time, via edit mode | — |

---

## 15. Testing

**Unit (Vitest)**
- Schema: the seed content passes. It rejects `javascript:` links, duplicate slugs, too-long text,
  and image paths outside `/uploads/`.
- Auth: right/wrong password, constant-time compare, cookie sign → verify → expire, a tampered
  cookie is rejected, hash script refuses passwords under 20 characters.
- Save logic (GitHub mocked): normal save makes one commit with the correct author; another file
  changed → still saves on top; `site.json` changed → 409; never force-pushes.
- Commit message summary for add / edit / delete / reorder / hide.
- LeetCode script: parses the real response shape, keeps the old file when the request fails,
  doesn't write when nothing changed.

**API routes**
Each write route returns 401 with no cookie, 403 with a wrong Origin, 400 with invalid content,
413 when too large, and 200 on the happy path.

**Browser (Playwright)**
- **Public:** every section renders from the seed; hidden items don't appear; theme toggle; Ctrl+K;
  PolyO box with a mocked API (normal, slow, failure); visitors download no editor code.
- **Edit flow:**
  - Wrong password → error; right password (test hash) → toolbar.
  - Edit a bullet, add a project, drag a section, hide an item, upload an image.
  - Save → the mocked GitHub receives exactly the expected `site.json`.
  - Draft is restored after closing the tab.
  - Log out.
- Three viewports: 375 px, 768 px, 1440 px.

**CI** (GitHub Actions on every push): type-check, lint, unit + API tests, `validate-content`.

**By hand before calling it done:** Lighthouse on mobile (targets in §7), a keyboard-only pass
through edit mode, and a first real save from his own browser shown going live.

---

## 16. Build order: each phase ends with something he can see

| Phase | What gets built | Done when |
|---|---|---|
| **1. Read-only site** | Next.js project, schema, seed `site.json` from the résumé, every section, dark/light, accent colours, Vercel deploy | The portfolio is live at its address, matches the résumé, and scores 95+ on Lighthouse mobile |
| **2. Live data** | LeetCode Action, Recently-shipped strip, Try PolyO box + PolyO CORS change | Real LeetCode numbers show, and PolyO answers from the portfolio |
| **3. Login** | `/edit`, `/api/login/logout/me`, cookie, Origin checks, hash script, robots | He can log in and out on the live site. All security tests pass |
| **4. Edit mode** | Toolbar, click-to-edit, add/delete/hide/reorder, project side panel, settings, switches, draft autosave, validation messages | He can change anything on the page (not saved yet) |
| **5. Saving** | `/api/save`, image + PDF upload, live-status polling, conflict handling, History + Restore | He edits on the live site, clicks Save, and sees ✓ Live about a minute later |
| **6. Polish** | Ctrl+K, link-preview image, case-study pages, accessibility pass, README with a GIF of edit mode | Everything in §15 passes, and the README itself shows off the edit system |

Phases 1–2 already give him a working portfolio to share, even before editing exists.

---

## 17. Risks

| Risk | Plan |
|---|---|
| LeetCode blocks the daily Action | Last good numbers stay up with a date. He gets the failure email. Fallback: run the script from his PC (`npm run fetch-leetcode`) and push |
| PolyO's Render server sleeps | The waking-up message, the 60 s limit and the link to the full app (§11) |
| Vercel free plan allows 100 deploys a day | About 10 saves a day is normal use. Batching edits into one Save is the default anyway |
| Fine-grained token expires | Clear save error (§12). Set the longest expiry and a calendar reminder |
| "Hidden" mistaken for "secret" | The note in §10, plus a one-line hint in the edit toolbar's hide tooltip |
