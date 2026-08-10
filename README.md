# Air Glass UI — Admin Dashboard Template

A premium **React 19 + TypeScript + Vite + Tailwind CSS v4** admin dashboard UI template.
Cohesive "Light Air Glass" design system, 64 accessible UI primitives, 196 ready-made screens,
three appearance styles, nine languages including right-to-left Arabic, and an in-repo mock API
so the whole template runs and demos with **zero backend**.

> Sold as a Site Template on Envato ThemeForest. This package is the polished, self-contained
> front-end — bring your own API when you are ready to go live.

📖 **[Full documentation](documentation/index.html)** — install, theming, adding a screen, the
mock API, i18n, and a complete component & screen reference.
🗒️ **[Changelog](CHANGELOG.md)** — version history.

## Features

- **"Light Air Glass" design system** — a locked visual identity (colors, blur, mesh gradients,
  glass layers) with complete **light and dark** themes. All tokens are centralized in
  `src/index.css`, so screens consume the palette instead of redefining it — rebrand the whole
  template by editing one file.
- **Three appearance styles** — `glass`, `liquid` and `flat`. Each is a recipe of token values,
  not a separate stylesheet, so every component adapts automatically.
- **Five shell layouts** — vertical sidebar, horizontal menu bar, detached, two-column and
  hovered. All five read the same navigation map.
- **Theme Customizer** — a floating drawer on every screen for accent, design style, light/dark,
  content width, layout, direction, density, reset and copy-config, with live preview.
- **64 accessible UI primitives** — forms, data table, charts, command palette, drawers, dialogs,
  rich-text & code editors, calendar, OTP, resizable panels, sidebar, and more (shadcn/ui + Radix
  + Base UI) — plus 67 composed application components built on top of them.
- **196 ready-made screens**, including:
  - **10 dashboards** — default customizable grid plus CRM, e-commerce, crypto, projects, NFT,
    jobs, blog, analytics and AI verticals.
  - **App suites** — e-commerce (orders, products, customers, sellers, payments, invoices,
    discounts, delivery, cart, checkout), CRM, projects, tasks, calendar, email, support desk,
    to-do and API keys.
  - **Mono-niches** — crypto (wallet, trading, orders, ICO, KYC), NFT (marketplace, auctions,
    collections) and jobs/recruitment.
  - **Authentication** — sign-in, sign-up, forgot/reset, create password, verify, lock, logout
    and success, each in a basic **and** a cover variant.
  - **Utility & error pages** — 404 (three treatments), 500, offline, maintenance, coming soon,
    privacy, terms and search results.
  - **Content & marketing** — blog, pricing, and three landing pages (one-page, NFT, jobs).
  - **78-page component showcase** — living documentation for every component family.
- **Customizable dashboard** — 12-column masonry widget grid with drag-and-drop ordering, size
  tiers, hide/restore, per-role layouts, and a global period picker.
- **Auth & permissions** — permission-gated routes, guest-only guards, and an MFA enrollment
  gate, all client-side against the mock API.
- **Internationalization** — 9 locale dictionaries (ar, de, en, es, fr, it, pl, ru, uk) at exact
  key parity, loaded on demand so unused languages never reach the bundle.
- **Right-to-left ready** — Arabic ships fully translated; direction toggles from the customizer,
  and a lint guard (`npm run lint:rtl`) keeps new markup on logical properties so layouts keep
  mirroring.
- **Mock API** — a typed client plus fixtures under `src/api` make every screen runnable and
  demoable without a server.

## Tech Stack

- **React 19** + **TypeScript** (strict)
- **Vite 8** build tooling
- **Tailwind CSS v4** (`@tailwindcss/vite`) + Geist Variable font
- **shadcn/ui**, **Radix UI**, **Base UI** component primitives
- **react-router v8** (browser router, lazy routes)
- **TanStack Query** + **TanStack Table** data layer
- **react-hook-form** + **Zod** validation
- **Recharts** charts
- **Leaflet** maps (used directly, OpenStreetMap tiles)
- **TipTap** / **CodeMirror** editors
- **dnd-kit** drag & drop
- **date-fns** locale-aware dates

## Getting Started

Requires **Node.js 20.19+ or 22.12+** (Vite 8 minimum).

```bash
npm install         # install dependencies
npm run dev         # start the dev server with HMR
npm run build       # type-check and build for production
npm run preview     # preview the production build locally
npm run lint        # run the linter (oxlint)
npm run lint:rtl    # guard against RTL-breaking physical utilities
npm run format      # format sources with Prettier
npm run test        # run the test suite (Vitest)
npm run package     # run the full quality gate and build the release archive
```

The dev server serves the app under the Vite `base` of `/admin-assets/`; set it to `/` in
`vite.config.ts` to serve from the domain root.

> **Deploying a backend-free demo?** Build it with `VITE_DEMO=1 npm run build`. A plain
> `npm run build` leaves the mock layer out of the bundle on purpose (you don't want fixtures in
> a production build once you have a real API), so that `dist/` has nothing to answer
> `/console/api/*`. The prebuilt `dist/` in your download already includes the mock.

## Project Structure

```
src/
  app/            App shell, router, and the single navigation map (nav.ts)
  features/       Screen-level code per domain — 31 slices
  components/ui/  Reusable UI primitives (64 components)
  components/     Composed application components (67)
  lib/            Cross-cutting helpers (auth, i18n, query, permissions, appearance, …)
  api/            Mock API client + fixtures (api/mock)
  locales/        9 locale dictionaries
  index.css       Centralized design tokens ("Light Air Glass" system)
```

The navigation map in `src/app/nav.ts` is the single source consumed by both the sidebar and
the ⌘K command palette, and all visual identity lives in `src/index.css` — customize the theme
in one place.

## License & Support

Licensed under the Envato Market license you purchased (Regular or Extended) — see the license
terms included with your download for what each permits. Third-party dependency, font and asset
licenses are listed in [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md). For support, please
use the channel listed on the item's ThemeForest page.
