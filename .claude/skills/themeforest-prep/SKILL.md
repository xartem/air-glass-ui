---
name: themeforest-prep
description: >-
  Envato ThemeForest readiness guide for the Air Glass UI admin dashboard template.
  Use when preparing the template for sale — reviewing quality against Envato/ThemeForest
  requirements, building the submission package (main files, demo, documentation, preview
  images), auditing dependency/font/asset licensing for resale, or answering "is this ready
  for ThemeForest?". Covers the reviewer quality checklist, hard/soft rejection avoidance,
  deliverables, image dimensions, and packaging — adapted for a React 19 + Vite SPA.
metadata:
  author: air-glass-ui
  version: "1.0"
  category: publishing
---

# ThemeForest Preparation — Air Glass UI

Guide the template toward an **approvable ThemeForest submission** (Site Templates → Admin
Templates). This skill adapts Envato's requirements — many of which are written for static
HTML/jQuery templates — to a **React 19 + TypeScript + Vite + Tailwind v4 SPA** shipped as
source code.

> **Sources studied:** Envato Author Help (Site Template Requirements, File Preparation
> Guidelines — gated), plus published reviewer soft/hard-reject collections and Envato Tuts+
> production-pack guidance. Numeric specs below (image sizes, doc format) are current Envato
> conventions; **re-verify against the live Envato Author Help before each submission** since
> exact numbers change.

## When to use

- "Is Air Glass UI ready for ThemeForest?" → run the **Quality Checklist** below.
- "Prepare the submission package" → follow **Deliverables & Packaging**.
- "Can we bundle this dependency/font/image?" → follow **Licensing Audit**.
- Before any resubmission after a soft reject → re-run the whole checklist.

## Rejection types (know the stakes)

- **Hard reject** — item cannot be resold and **cannot be resubmitted**. Caused by weak
  concept/design quality, non-original work, or fundamental quality failures. Avoid by hitting
  a high visual + code bar before first submission.
- **Soft reject** — reviewer lists fixable issues; you correct and resubmit. Most items get at
  least one. The checklist below front-loads the common soft-reject causes.

## Quality Checklist (reviewer bar)

Run each group; every item must pass before submission.

### 1. Code quality
- [ ] Clean, consistently formatted TypeScript/TSX; no dead code (`noUnusedLocals`/
      `noUnusedParameters` already enforce this — keep `npm run build` green).
- [ ] **No stray `console.log`/debug output** in shipped code (a classic soft reject).
- [ ] No commented-out blocks left behind; meaningful comments only.
- [ ] `npm run lint` (oxlint) clean; `npm run format:check` clean.
- [ ] Sensible, documented structure — buyers must be able to find and edit things
      (this repo's feature-sliced layout + `AGENTS.md` already helps; keep it accurate).
- [ ] Design tokens centralized in `src/index.css` — no ad-hoc colors/blur/mesh in
      components (see `.ai-factory/rules/base.md`). This reads as "well-organized CSS" to
      reviewers.

### 2. Browser console must be clean
- [ ] **Zero console errors and zero 404s** on every screen (reviewers open DevTools).
      Check all routes: auth, dashboard, users/roles, settings, activity, ai, help, ui-kit.
- [ ] No missing assets, no broken image links, no failed network requests in the demo.

### 3. Responsiveness
- [ ] Every screen works at mobile / tablet / desktop breakpoints — no overflow, no broken
      layout, sidebar collapses correctly (`use-mobile` hook exists — verify it).
- [ ] Data table, charts, dashboard masonry grid, and dialogs all adapt.

### 4. Themes & visual completeness
- [ ] **Light AND dark themes complete** on every screen and component — no unstyled or
      contrast-broken elements in either mode.
- [ ] Adequate color contrast throughout (WCAG AA) — a documented soft-reject cause.
- [ ] Consistent spacing rhythm; no awkward gaps. Visual polish is what separates approval
      from hard reject in a crowded admin-template category.

### 5. Accessibility (a11y)
- [ ] Keyboard navigable (Radix/Base UI give this — verify focus rings, focus traps in
      dialogs/drawers, ⌘K palette).
- [ ] Semantic landmarks (`<nav>`, `<main>`, headings order); ARIA correct where used.
- [ ] Run the installed `accessibility` skill for a WCAG 2.2 pass on key screens.

### 6. Cross-browser
- [ ] Verify latest Chrome, Firefox, Safari, Edge. No layout or JS breakage.

### 7. Demo content & placeholders
- [ ] All data is the in-repo **mock API** — no real/private data, no copyrighted logos.
- [ ] Any placeholder imagery is clearly generic/licensed; note placeholder usage in the item
      description.

## Deliverables & Packaging

ThemeForest expects a **main files ZIP** plus a **live demo** and **preview images**.

### Main download structure (recommended)
```
air-glass-ui/
├── source/            # the React source (this repo, minus node_modules/dist/.git)
├── dist/              # optional pre-built demo output (npm run build)
├── documentation/     # buyer docs — HTML or PDF (REQUIRED)
│   └── index.html
├── LICENSE.md         # your item license note + third-party licenses
└── CHANGELOG.md       # version history (start at 1.0.0)
```

### Documentation (REQUIRED — no docs = soft reject)
Written **in English**, delivered as **HTML or PDF**. Must cover, at minimum:
- Prerequisites (Node version) and **install** (`npm install`).
- **Run / build** (`npm run dev`, `npm run build`, `npm run preview`).
- Project structure overview (reference `AGENTS.md`).
- **Theming** — how to change colors/tokens in `src/index.css`.
- **Adding a screen** — the feature-sliced pattern (or point to the `air-glass-screen` skill).
- **Mock API** — where data comes from and how to swap in a real backend (`src/api/client.ts`).
- **i18n** — the 8 locale dictionaries and the `t()` helper.
- Component/screen reference or credits list.
- Support/contact and changelog pointer.

### Preview images (verify live numbers before upload)
- **Main preview:** `590 × 300 px`, JPG, named `01_<name>.jpg`.
- **Thumbnail:** `80 × 80 px`, PNG or JPG.
- **Additional screenshots:** same aspect ratio as main; **max 900 px** each side.
- Use real screenshots of the actual screens (the `screenshots/` folder is a starting point).

### Live demo
- A publicly reachable, fast-loading build of the template, matching the submitted files.
- Route-level code-splitting is already in place — confirm the login route stays light.

## Licensing Audit (resale compliance)

Everything you ship must be **redistribution-safe** under Envato's rules. Audit before submit:

- [ ] Enumerate all runtime dependencies (`package.json`) and confirm each license permits
      redistribution in a sold template (MIT/BSD/Apache/ISC are safe; **GPL/AGPL needs care**).
- [ ] **Fonts:** Geist Variable is OFL/permissive — confirm and include its license. Any other
      font must be self-hosted with a redistribution-permitting license.
- [ ] **Icons:** lucide-react is ISC — safe; keep the license note.
- [ ] **Images/illustrations:** only assets you own or that are licensed for resale/redistribution.
      No stock imagery that forbids inclusion in a template.
- [ ] Produce a `LICENSE.md` (or third-party-licenses file) listing each bundled library and
      its license — reviewers and buyers expect this.
- [ ] If the template derives from another author's work, follow Envato's partnership/ticket
      process (not applicable if fully original).

## Workflow: full readiness pass

1. `npm run lint && npm run format:check && npm run build && npm run test` — all green.
2. Manually walk every route in the browser with DevTools open — **zero console errors/404s**.
3. Toggle light/dark on every screen; resize through breakpoints.
4. Run the `accessibility` skill on the top screens; fix contrast/keyboard issues.
5. Run the **Licensing Audit**; write `LICENSE.md`.
6. Write/refresh buyer **documentation** (HTML/PDF) and `CHANGELOG.md`.
7. Capture preview + thumbnail images at the required dimensions.
8. Assemble the main files ZIP (exclude `node_modules/`, `.git/`, editor configs).
9. Re-verify current Envato numeric specs on the live Author Help pages, then submit.

## References

- `references/CHECKLIST.md` — the full, copy-pasteable submission checklist.
- Envato Author Help → "Site Template Requirements" and "File Preparation Guidelines"
  (authoritative; re-check before every submission — some pages are login-gated).
