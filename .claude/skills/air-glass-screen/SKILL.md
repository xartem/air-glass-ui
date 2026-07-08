---
name: air-glass-screen
description: >-
  Scaffold a new admin screen in the Air Glass UI template following its exact conventions.
  Use when adding a page/screen to this project — e.g. "add an orders screen", "create a
  new settings tab", "build a CRUD list page". Wires up the feature-sliced file, the lazy
  route, the single navigation map entry, i18n keys across all 8 locales, mock-API data,
  permissions, and the shared page components — so a new screen matches the existing ones
  and passes the ThemeForest quality bar (light/dark, responsive, accessible).
argument-hint: "<domain>/<screen-name> [list|detail|form|dashboard]"
metadata:
  author: air-glass-ui
  version: "1.0"
  category: scaffolding
---

# Add a Screen — Air Glass UI

Create a new admin screen that is indistinguishable from the existing ones. Follow **every**
step — a screen that skips the nav map, i18n, or design tokens is inconsistent and fails
review. Conventions are the enforced ones from `.ai-factory/rules/base.md`.

## Inputs

- **Domain** — existing folder under `src/features/` (auth, dashboard, users, settings,
  activity, ai, help) or a new one (e.g. `orders`, `catalog`, `inbox`).
- **Screen name** — kebab-case, becomes `<name>-page.tsx` and `PascalCasePage` export.
- **Archetype** — `list` (table + filters), `detail`, `form` (react-hook-form + Zod),
  or `dashboard` (widget grid). Default: `list`.

## Project conventions (recap)

- Files kebab-case; components PascalCase **named exports** (`export function OrdersPage()`).
- Path alias `@/*` → `src/*`. Import from `@/...`, never long relative paths.
- **No colors/blur/mesh in the component** — only design tokens / Tailwind utility classes
  from `src/index.css`. Use `cn()` for conditional classes.
- **No hardcoded UI text** — everything through `t('...')`; keys added to all 8 locales.
- Data via **TanStack Query** against the mock API in `src/api`. Forms via
  **react-hook-form + Zod**. Tables via **TanStack Table** (`DataTable` wrapper).
- Feature screens are **lazy-loaded**; keep heavy deps off the login path.

## Shared building blocks (reuse — do not reinvent)

From `src/components/` (app-level):
- `PageHeader` — screen title + actions row.
- `Panel` — glass card container for content sections.
- `DataTable` (+ `RowAction`) — the standard table with row `⋯` actions.
- `ConfirmDialog` — destructive-action confirmation.
- `StatusBadge` — status pills.
- `SearchInput` / toolbar — filter controls.
- Error surfaces: `ErrorPage` / `RouteErrorPage`; auth: `ReloginDialog`.

From `src/components/ui/` — the 60+ primitives (button, select, dialog, drawer, card, tabs,
form field, etc.). From `src/lib/`: `t`/`AdminLocale` (i18n), `useLocale`, `cn`, `spaUrl`,
auth guards (`RequirePermission`, `GuestOnly`), `permissions`, `list-params`, `datetime`.

## Steps

### 1. Create the feature file
`src/features/<domain>/<name>-page.tsx`:
- Named export `export function <PascalName>Page() { … }`.
- A short top comment describing the screen (match the house style — see existing pages).
- Compose from `PageHeader` + `Panel` + primitives. Use `useQuery` for data, `useLocale`
  for date/number locale, `t()` for all copy.
- Loading → skeletons; error → the shared error surface / retry; empty → empty state
  (`table.empty.*` keys already exist).
- Support light/dark and mobile out of the box (rely on tokens + responsive utilities).

### 2. Register the lazy route
In `src/app/router.tsx`, add a loader next to the others:
```ts
const ordersPage = () =>
  lazyPage(() => import('@/features/orders/orders-page').then((m) => ({ default: m.OrdersPage })))
```
Then add the route object under the authenticated shell, wrapped in `RequirePermission`
when the screen is permission-gated (mirror the existing routes).

### 3. Add the navigation entry (single source)
In `src/app/nav.ts` — the ONE map consumed by the sidebar **and** the ⌘K palette:
- Import a `lucide-react` icon.
- Add a `NavItem { to, label: t('nav.<key>'), icon, perm? }` to the correct `NavGroup`
  (or a `NavParent.children` for a sub-tree). Never duplicate the entry elsewhere.

### 4. i18n across all 8 locales
Add every new key to **all** dictionaries in `src/locales/`:
`en.json` (source of truth), `de.json`, `es.json`, `fr.json`, `it.json`, `pl.json`,
`ru.json`, `uk.json`. Reuse existing `common.*` / `table.*` keys where possible. Keys are
flat dotted strings (e.g. `"nav.orders": "Orders"`, `"orders.title": "Orders"`).

### 5. Mock data (if the screen shows data)
Add fixtures/handlers in `src/api/mock/` and expose typed access through `src/api`
(`client.ts` + `types.ts`). Keep the client/mock boundary clean so a real backend can drop
in later. The screen must work fully on mock data.

### 6. Permissions (if gated)
Define/reuse a permission key; gate the route with `RequirePermission` and hide ineligible
row actions. Follow `src/lib/permissions` and the users/roles screens as the reference.

### 7. changelog note
Append a dated one-line entry to `src/features/<domain>/changelog.txt` (create it for a new
domain) describing what was added — matches the existing per-feature changelog convention.

## Verify before done

- [ ] `npm run build` green; `npm run lint` clean; `npm run format` applied.
- [ ] Screen reachable via sidebar and ⌘K; permission gating works.
- [ ] Light + dark themes complete; responsive at mobile/tablet/desktop.
- [ ] No console errors/404s; keyboard-navigable; contrast AA.
- [ ] All strings localized in all 8 dictionaries; no hardcoded text.
- [ ] No new colors/blur/mesh outside `src/index.css`.
- [ ] Works entirely on mock data.

For the marketplace-readiness bar this screen must meet, see the `themeforest-prep` skill.
