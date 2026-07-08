# Air Glass UI — Admin Dashboard Template

A premium **React 19 + TypeScript + Vite + Tailwind CSS v4** admin dashboard UI template.
Cohesive "Light Air Glass" design system, 60+ accessible components, ready-made application
screens, and an in-repo mock API so the whole template runs and demos with **zero backend**.

> Sold as a Site Template on Envato ThemeForest. This package is the polished, self-contained
> front-end — bring your own API when you are ready to go live.

## Features

- **"Light Air Glass" design system** — a locked visual identity (colors, blur, mesh gradients,
  glass layers) with complete **light and dark** themes. All tokens are centralized, so screens
  consume the palette instead of redefining it.
- **60+ accessible components** — forms, data table, charts, command palette, drawers, dialogs,
  rich-text & code editors, calendar, OTP, resizable panels, sidebar, and more (shadcn/ui + Radix
  + Base UI).
- **Ready-made screens** — authentication (login / forgot / reset / MFA enroll), a customizable
  widget dashboard, users list & editor, roles & permissions (RBAC), profile, settings,
  appearance, activity log, AI pages, help, and a UI-kit showcase.
- **Customizable dashboard** — 12-column masonry widget grid with drag-and-drop ordering, size
  tiers, hide/restore, per-role layouts, and a global period picker.
- **Auth & permissions** — permission-gated routes, guest-only guards, and an MFA enrollment gate,
  all client-side against the mock API.
- **Internationalization** — 8 locale dictionaries (en, de, es, fr, it, pl, ru, uk) via a
  lightweight `t()` helper, with RTL-aware components.
- **Mock API** — a client plus fixtures under `src/api` make every screen runnable and demoable
  without a server.

## Tech Stack

- **React 19** + **TypeScript** (strict)
- **Vite 8** build tooling
- **Tailwind CSS v4** (`@tailwindcss/vite`) + Geist Variable font
- **shadcn/ui**, **Radix UI**, **Base UI** component primitives
- **react-router v8** (browser router, lazy routes)
- **TanStack Query** + **TanStack Table** data layer
- **react-hook-form** + **Zod** validation
- **Recharts** charts
- **TipTap** / **CodeMirror** editors
- **dnd-kit** drag & drop

## Getting Started

Requires a recent Node.js LTS (18+).

```bash
npm install       # install dependencies
npm run dev       # start the dev server with HMR
npm run build     # type-check and build for production
npm run preview   # preview the production build locally
npm run lint      # run the linter (oxlint)
npm run format    # format sources with Prettier
npm run test      # run the test suite (Vitest)
```

## Project Structure

```
src/
  app/            App shell, router, and the single navigation map (nav.ts)
  features/       Screen-level code per domain (auth, dashboard, users, settings, …)
  components/ui/  Reusable UI primitives (60+ components)
  lib/            Cross-cutting helpers (auth, i18n, query, permissions, …)
  api/            Mock API client + fixtures (api/mock)
  locales/        8 locale dictionaries
  index.css       Centralized design tokens ("Light Air Glass" system)
```

The navigation map in `src/app/nav.ts` is the single source consumed by both the sidebar and
the ⌘K command palette, and all visual identity lives in `src/index.css` — customize the theme
in one place.

## License & Support

Licensed under the Envato Market license you purchased (Regular or Extended) — see the license
terms included with your download for what each permits. For support, please use the channel
listed on the item's ThemeForest page.
