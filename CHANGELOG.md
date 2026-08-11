# Changelog

All notable changes to Air Glass UI are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.1 — 2026-08-11

### Fixed

- Glass surfaces render again on Safari 17 and older: every `backdrop-filter` declaration is
  paired with its `-webkit-backdrop-filter` fallback (glass panel, header, card and overlay,
  cards, floating overlays, iOS-skin widgets and button tiles, and the two rules that switch
  the frost off).

### Internal

- Demo-only and customizer-only CSS is fenced by paired `@template-only` markers — the
  horizontal-nav underline, the notifications popover, the density / content-width knobs and
  the invoice print isolation. Projects that vendor `src/index.css` strip the fenced blocks and
  keep the portable layer.

## 1.0.0 — 2026-08-10

Initial release.

### Design system

- "Light Air Glass" visual identity — colors, blur, mesh gradients, glass layers and radii
  centralized as design tokens in `src/index.css`, with complete light and dark themes.
- Three appearance styles — `glass`, `liquid` and `flat` — as token recipes rather than separate
  stylesheets, so every component adapts automatically.
- Five shell layouts: vertical, horizontal, detached, two-column and hovered.
- Theme Customizer: a floating drawer for accent, design style, theme, content width, layout,
  direction, density, reset and copy-config, with live preview and revert-on-close.

### Components

- 64 accessible UI primitives in `src/components/ui` (shadcn/ui + Radix UI + Base UI).
- 67 composed application components — data table, page header, list/editor/settings layouts,
  widget cards, media picker, rich-text and code editors, command palette, and more.
- A 78-page component showcase that doubles as living documentation.

### Screens

- 196 screens: 166 reachable from the navigation map plus 30 authentication, utility and
  "create" screens, with 17 parameterized detail routes on top.
- 10 dashboards — the default customizable widget grid plus CRM, e-commerce, crypto, projects,
  NFT, jobs, blog, analytics and AI verticals.
- Application suites: e-commerce, CRM, projects, tasks, calendar, email, support desk, to-do and
  API keys.
- Mono-niche suites: crypto, NFT and jobs/recruitment.
- Authentication in basic and cover variants, a full set of utility and error pages, blog,
  pricing and three landing pages.

### Platform

- React 19, TypeScript (strict), Vite 8 and Tailwind CSS v4.
- Route-level code splitting: feature screens load lazily; only the shell, login, the MFA gate
  and the placeholder stay eager.
- In-repo mock API — a typed client plus fixtures, so every screen runs and demos with no
  backend.
- Permission-gated routing, guest-only guards and an MFA enrollment gate.
- 9 locale dictionaries (ar, de, en, es, fr, it, pl, ru, uk) at exact key parity, loaded on
  demand so unused languages never reach the initial bundle.
- Right-to-left support with Arabic shipped fully translated, a direction toggle, and a
  `lint:rtl` guard that keeps new markup on logical properties.
- A release pipeline (`npm run package`) that runs a nine-step quality gate — lint, format, RTL,
  tests, build, shipped-code cleanliness, locale parity, documentation freshness and bundle
  budget — and refuses to produce an archive unless every step is green.
