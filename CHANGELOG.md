# Changelog

All notable changes to Air Glass UI are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Fixed

- Dark theme: no more square patches trailing the cursor while the page repaints. The mesh
  grain (`.app-mesh-noise`) is a full-viewport element that was blended with
  `mix-blend-mode: overlay`, which makes Blink keep a composited copy of the whole scrollable
  document as its backdrop — an extra layer the height of the page (33 MB on the UI-kit
  showcase), re-blended tile by tile on every hover repaint on top of four
  `backdrop-filter: blur(28px)` surfaces. The grain now uses plain alpha, and its dark opacity
  is the overlay equivalent (0.05 overlay ≈ 0.012 alpha against a near-black backdrop), so the
  background looks unchanged (measured deviation ≤3/255 in both themes).
- `.app-mesh` no longer carries a permanent `will-change: transform`. The scroll parallax sets
  an inline transform, which promotes the layer only while it moves; the hint kept a
  rasterised 140vh gradient on the compositor on every screen. Together the two changes drop
  the compositor from 37 layers / 151 MB to 34 / 112 MB on the UI-kit showcase (dark, 1280).
- iOS skin: a `destructive` menu item (Delete in `DropdownMenu`, `ContextMenu`, `Menubar`)
  is a normal row with red text again. It carries `data-variant`, so the frosted-tile
  button recipe painted it with a fill, a hairline and a shadow — it read as a raised
  plate among flat neighbours, most visibly in dark, where that fill is opaque. Its own
  focus/hover tint is untouched.
- iOS skin, dark theme: the segmented control (`ToggleGroup`) and `ButtonGroup` no longer
  show a solid strip behind their buttons. The wrapper carries `data-variant="outline"` for
  its items, so `.skin-liquid.dark [data-variant="outline"]` painted it as a glass tile; the
  rule that keeps such wrappers transparent covered only `:hover` and `[aria-expanded]` in
  dark, not their resting state. In light both rules weigh the same and source order already
  hid the strip — which is why it only showed in dark.

## 1.0.2 — 2026-08-11

### Fixed

- MultiSelect looks like the other form fields again: it takes the Input recipe
  (`--field-bg` fill, `rounded-md`, `--control-h` minimum height) instead of a
  taller transparent tile, and still grows when the selected badges wrap.

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
