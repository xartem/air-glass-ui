# Air Glass UI — Admin Dashboard Template

## Overview

**Air Glass UI** is a premium, production-grade admin dashboard **UI template** built with
React 19, TypeScript, Vite and Tailwind CSS v4. It started life as the front-end of a CMS
admin panel and is now being repackaged as a standalone commercial template for sale on
**Envato ThemeForest**.

The product a buyer receives is a polished, self-contained front-end: a cohesive design
system ("Light Air Glass"), a large library of accessible UI components, a set of ready-made
application screens (auth, dashboard, users & roles, settings, activity log, AI, help), full
theming, dark mode, RTL awareness and internationalization. All data is served by an
in-repo **mock API layer** so the template runs and demos with zero backend.

> **Product goal:** ship a ThemeForest-ready template — complete component library, a broad
> catalog of the most in-demand admin screens, and end-user documentation that satisfies
> Envato's quality and submission requirements.

## Product Type & Distribution

- **Category:** Site Templates → Admin Templates (Envato ThemeForest).
- **Delivered as:** source code (React + TypeScript) + built demo + documentation.
- **Audience:** developers/agencies building admin panels, SaaS back-offices, CMS/e-commerce
  dashboards who want a designed, componentized starting point.
- **Licensing note:** every bundled dependency, font and asset must be redistribution-safe
  under Envato's licensing rules.

## Core Features

- **Design system "Light Air Glass"** — a locked visual identity (colors, blur, mesh
  gradients, glass layers) centralized in `src/index.css`. Screens never define their own
  colors/blur/mesh; they consume tokens. Light + dark themes.
- **Component library** — 60+ accessible components in `src/components/ui` (shadcn/ui +
  Radix + Base UI): forms, data table, charts, command palette, drawers, dialogs, editor,
  calendar, OTP, resizable panels, sidebar, and more.
- **Application screens** — auth (login/forgot/reset/MFA enroll), customizable widget
  dashboard, users list & editor, roles/RBAC, profile, settings, appearance, activity log,
  AI pages, help, and a UI-kit showcase.
- **Customizable dashboard** — 12-column masonry widget grid, per-role layouts, drag-and-drop
  ordering, size tiers (sm/md/lg/xl), hide/restore, quick actions, global period picker.
  Widget archetypes: Stat, Chart, List, Status (Recharts).
- **Auth & permissions** — permission-gated routes, guest-only guards, MFA enrollment gate,
  re-login dialog. Purely client-side against the mock API.
- **Internationalization** — 8 locale dictionaries (en, de, es, fr, it, pl, ru, uk) via a
  lightweight `t()` helper; navigation and screens localized. RTL-aware components.
- **Mock API** — `src/api` client + `src/api/mock` fixtures make the whole template runnable
  and demoable without any server.
- **DX** — route-level code-splitting, TanStack Query data layer, react-hook-form + Zod
  validation, TanStack Table, typed navigation map shared by the sidebar and ⌘K palette.

## Tech Stack

- **Language:** TypeScript (strict), target ES2023
- **UI runtime:** React 19
- **Build tool:** Vite 8
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`), `tw-animate-css`, Geist Variable font
- **Component primitives:** shadcn/ui, Radix UI, Base UI (`@base-ui/react`)
- **Routing:** react-router v8 (browser router, lazy routes)
- **Data layer:** TanStack Query (mock-backed), TanStack Table
- **Forms & validation:** react-hook-form + Zod (`@hookform/resolvers`)
- **Charts:** Recharts
- **Editor:** TipTap, CodeMirror (HTML)
- **Drag & drop:** dnd-kit
- **Utilities:** date-fns, clsx, tailwind-merge, cmdk, sonner, vaul, input-otp, qrcode.react
- **Tooling:** oxlint (lint), Prettier (format), Vitest + Testing Library + jsdom (tests)
- **Data:** none — in-repo mock API only (no database, no backend)

## Architecture

See `.ai-factory/ARCHITECTURE.md` for detailed architecture guidelines.
Pattern: Feature-Sliced Modules (Structured Modules — Vertical Slices).

## Architecture Notes

- **Feature-sliced layout.** `src/features/<domain>/` holds screen-level code per domain;
  `src/components/ui/` holds the reusable primitives; `src/app/` holds the shell, router and
  the single navigation map; `src/lib/` holds cross-cutting helpers (auth, i18n, query,
  permissions, datetime, list-params); `src/api/` holds the client + mock fixtures.
- **Single navigation source.** `src/app/nav.ts` is consumed by both the sidebar and the ⌘K
  command palette — no drift.
- **Design tokens are centralized.** All visual identity lives in `src/index.css`
  (shadcn CSS variables + `--glass-*` layer). This is an enforced project rule.
- **Conventions.** Files are kebab-case; components are PascalCase named exports; helpers are
  camelCase. Path alias `@/*` → `src/*`. Tests are colocated `*.test.ts(x)` (Vitest).
- **Design specs (external).** The codebase references a detailed spec system (E1–E6,
  D:dashboard, UI:dashboard) inherited from the CMS project; those spec documents are **not**
  in this repository and will need to be reconstructed as buyer-facing documentation.

## Non-Functional Requirements

- **Quality bar:** ThemeForest reviewer standards — clean, consistent, well-documented code;
  responsive across breakpoints; accessible (keyboard, ARIA via Radix/Base UI); no console
  errors; light and dark themes complete.
- **Documentation:** end-user docs (install, run, build, customize theme, add a screen, use
  the mock API, i18n) plus a component/screen reference — a hard Envato requirement.
- **Licensing:** all dependencies and assets must be license-cleared for resale.
- **Performance:** code-split routes, no oversized shared chunks, fast first paint on the
  login screen.
- **Zero-backend demo:** the template must run end-to-end on mock data out of the box.

## Roadmap Themes (high level)

1. **Component completion & polish** — audit the 60+ components for consistency, states,
   docs and edge cases.
2. **Screen catalog** — build the most in-demand admin screens (e.g. e-commerce orders/products,
   analytics, CRM, inbox/chat, tables/CRUD, kanban, file manager, invoices, pricing, error
   pages, empty/onboarding states, profile/settings variations).
3. **Documentation** — buyer-facing docs + component reference for ThemeForest submission.
4. **Packaging & compliance** — licensing audit, demo build, Envato submission checklist.
