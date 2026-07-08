# Project Base Rules — Air Glass UI

> Auto-detected conventions from codebase analysis. Edit as needed. These rules apply to all
> code generated or modified in this project. This is a commercial UI template destined for
> Envato ThemeForest — code quality, consistency and documentation are product features.

## Naming Conventions

- **Files:** kebab-case (`user-editor-page.tsx`, `list-params.ts`, `use-locale.ts`).
- **Components:** PascalCase, exported as **named exports** (`export function DashboardPage()`),
  not default exports. Route lazy-loaders map the named export to `{ default }`.
- **Functions / variables:** camelCase (`spaUrl`, `saveLayout`, `getDashboard`).
- **Types / interfaces:** PascalCase (`Me`, `WidgetSize`, `ActionLayoutOverride`).
- **Hooks:** `use-*` filename, `useX` export (`use-mobile.ts` → `useIsMobile`).
- **Test files:** colocated `*.test.ts` / `*.test.tsx` next to the unit under test.

## Module Structure

- `src/app/` — application shell, router, and the single navigation map (`nav.ts`). The nav
  map is the one source consumed by both the sidebar and the ⌘K palette; do not duplicate it.
- `src/features/<domain>/` — screen-level, domain-specific code (auth, dashboard, users,
  settings, activity, ai, help, ui-kit). New screens go here under a domain folder.
- `src/components/ui/` — reusable, presentation-only primitives (shadcn/ui + Radix + Base UI).
  Keep these generic and app-agnostic; do not hardwire domain logic here.
- `src/lib/` — cross-cutting helpers (auth, permissions, i18n, query, datetime, list-params,
  appearance). Pure, reusable, no screen coupling.
- `src/api/` — API client (`client.ts`, `types.ts`) + `src/api/mock/` fixtures. All data is
  mock-served; keep the client/mock boundary clean so a real backend can replace the mock.
- `src/locales/` — one JSON dictionary per locale (en, de, es, fr, it, pl, ru, uk).
- **Path alias:** import from `@/*` (→ `src/*`); do not use long relative paths.

## Design System (enforced)

- **All visual identity lives in `src/index.css`** — shadcn CSS variables + the `--glass-*`
  layer (colors, blur, mesh gradients, glass). Screens and components **must not** define
  their own colors, blur or mesh; they consume tokens/utility classes only.
- Use the `cn()` helper (`clsx` + `tailwind-merge`) for conditional class composition.
- Support **light and dark** themes for every new component/screen (`dark:` via the
  `.dark` custom variant). Respect RTL where the primitive supports it.
- Icons come from `lucide-react`.

## Data, Forms & Routing

- **Data fetching:** TanStack Query against the mock API in `src/api`. Do not fetch ad hoc.
- **Forms:** react-hook-form + Zod (`@hookform/resolvers`) for validation.
- **Tables:** TanStack Table for data grids.
- **Routing:** react-router v8. Feature screens are **lazy-loaded** (route-level
  code-splitting); only the shell, login, MFA gate and placeholder stay eager. Keep the login
  path free of heavy deps (charts, editor, markdown).
- **Permissions:** gate routes/UI via `src/lib/auth` (`RequirePermission`, `GuestOnly`) and
  `src/lib/permissions`. Do not invent parallel auth checks.
- Build in-SPA navigation URLs through `spaUrl()` so they respect the base path.

## Internationalization

- User-facing strings go through the `t()` helper (`src/lib/i18n`); **no hardcoded UI text**.
- When adding a key, add it to **all 8 locale dictionaries** to avoid drift (en is the source
  of truth for wording; others may be draft translations).

## Error Handling

- Route errors surface through `ErrorPage` / `RouteErrorPage`; use these instead of ad-hoc
  error UIs. Auth/session failures use the `ReloginDialog` flow.
- Prefer typed, structured returns from the API client over throwing bare values.

## Logging

- No logging framework; avoid stray `console.log` in shipped code (it fails ThemeForest
  review). Remove debug output before committing.

## Tooling & Quality Gates

- **Lint:** `npm run lint` (oxlint). **Format:** `npm run format` (Prettier).
- **Types:** strict TypeScript; `noUnusedLocals` / `noUnusedParameters` are on — no dead code.
- **Tests:** `npm run test` (Vitest). Add colocated tests for non-trivial lib logic.
- **Build:** `npm run build` (`tsc -b && vite build`) must pass clean before any release.
- **Marketplace bar:** responsive, accessible, no console errors, complete light/dark themes.
