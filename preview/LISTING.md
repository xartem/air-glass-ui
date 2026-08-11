# ThemeForest listing — draft copy

Not shipped to buyers. `preview/` is on the packager's forbidden list, so this file
never enters the main-files ZIP. Every number below is the measured value reported by
`node scripts/build-screen-reference.mjs` and `npm run package` — re-run both before
submitting if anything changed.

## Item setup

| Field | Value |
|-------|-------|
| Name | Air Glass UI — React Admin Dashboard Template |
| Category | Site Templates → Admin Templates |
| Demo URL | https://air-glass.on-forge.com/ |
| Files included | HTML, CSS, JS (React/TypeScript source + prebuilt demo) |
| Documentation | Well documented (HTML + PDF) |
| Layout | Responsive |

## Tags (choose up to 15)

react, admin dashboard, admin template, typescript, tailwind, vite, dashboard,
shadcn, rtl, dark mode, ecommerce dashboard, crm, saas, analytics, glassmorphism

## Short description

A premium React 19 admin dashboard template with a cohesive "Light Air Glass" design
system — 196 ready-made screens, 64 accessible UI primitives, three appearance styles,
five shell layouts and 9 languages including right-to-left Arabic. Runs entirely on an
in-repo mock API, so it demos with zero backend.

## Long description (outline)

**Opening.** What it is, who it is for (developers shipping an admin panel, SaaS
dashboard or internal tool), and the one-line hook: a locked design system where every
colour, blur and radius is a token in a single file.

**Highlights** — lead with these, they are the differentiators:

- 196 screens, not a handful of demos: 10 dashboards, full e-commerce, CRM, projects,
  tasks, calendar, email, support desk, to-do and API keys; crypto, NFT and jobs
  verticals; auth in basic and cover variants; utility and error pages; blog, pricing
  and three landing pages.
- Three appearance styles — glass, liquid, flat — as token recipes, not forks.
- Five shell layouts: vertical, horizontal, detached, two-column, hovered.
- A live Theme Customizer for accent, style, theme, width, layout, direction, density.
- 9 languages at exact key parity, loaded on demand. Arabic ships fully translated with
  the layout mirrored.
- 64 accessible primitives plus 67 composed components; a 78-page component showcase
  doubles as living documentation.
- Zero-backend mock API — every screen runs and demos with no server.
- Light and dark complete on every screen; WCAG 2.2 pass; keyboard navigable.

**Tech stack.** React 19, TypeScript (strict), Vite 8, Tailwind CSS v4, shadcn/ui +
Radix + Base UI, react-router v8, TanStack Query + Table, react-hook-form + Zod,
Recharts, Leaflet, TipTap, CodeMirror, dnd-kit, date-fns.

**What is included.** Full source, a prebuilt runnable demo, HTML + PDF documentation,
`LICENSE.md`, `THIRD-PARTY-LICENSES.md`, `CHANGELOG.md`.

**Requirements.** Node.js 20.19+ or 22.12+. Modern evergreen browsers; no IE.

**Honest notes** — say these plainly, they prevent refunds and bad ratings:

- This is a front-end template. Data comes from an in-repo mock API; there is no
  backend, database or server code.
- Demo imagery is generated placeholder content, not licensed stock.

## Verified numbers (do not restate from memory)

| Metric | Value |
|--------|-------|
| Screens | 196 (166 in the nav map + 30 auth/utility/create) |
| Parameterized detail routes | 17 |
| UI primitives | 64 |
| Composed components | 67 |
| Locales | 9 — ar, de, en, es, fr, it, pl, ru, uk |
| Locale keys, each dictionary | 3399 |
| Bundle | 275 KB gzip over 28 entry chunks |
| Archive | air-glass-ui-1.0.0.zip, 5.3 MB, 923 entries |

## Preview assets — which file goes in which slot

Cut to the spec confirmed by the author on 2026-08-11. All shot against the local
production demo build (`VITE_DEMO=1`), English UI, no browser chrome.

| Envato slot | File | Size |
|-------------|------|------|
| Theme search preview image | `theme-search-590x300.jpg` | 590 × 300 |
| Video / multiclip preview image | `video-preview-2560x1440.jpg` | 2560 × 1440 |
| Standard preview images (optional) | `01_dashboard.jpg` … `06_crm.jpg` | 1170 × 658 |

Standard previews are 1170px wide — the stated width — and 658px tall, well inside the
1500px ceiling; each is far below the 20 MB limit. Screens covered: default dashboard,
e-commerce orders, crypto dashboard in dark, the components showcase, analytics, and the
CRM dashboard in liquid dark.

`thumbnail.jpg` (80 × 80) is left over from the older spec, which listed an 80×80
thumbnail slot; the current spec does not. Harmless to keep, ignore it at upload.

To recut after a UI change: capture with the shoot script, then rebuild — both live in
the session scratchpad, and the whole set regenerates in under a minute.

## Before upload

1. Confirm the demo matches the submitted files (redeploy if the branch moved).
2. Re-run `npm run package` and upload that archive, not a hand-assembled one.
3. Re-check the preview spec if a submission is more than a few weeks after 2026-08-11 —
   Envato changes these numbers without notice.
