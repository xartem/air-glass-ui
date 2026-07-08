# Architecture: Feature-Sliced Modules (Structured Modules — Vertical Slices)

## Overview

Air Glass UI is a client-side React SPA organized as **feature slices**. Each screen domain
lives in its own module under `src/features/<domain>/`, while genuinely reusable code sits in
shared layers (`src/components/ui`, `src/components`, `src/lib`, `src/api`, `src/locales`).
This is the frontend expression of **Structured Modules with vertical slices**: soft module
boundaries, features grouped by domain, and a shared core that features depend on — never the
other way around.

The pattern was chosen because it matches how the template is actually built and how buyers
will extend it: adding a new admin screen means adding one slice, not threading changes across
the whole tree. It keeps initial velocity high (no ceremony), keeps the login path light via
lazy slices, and makes the component library reusable and app-agnostic.

## Decision Rationale

- **Project type:** commercial admin dashboard **UI template** (React SPA, no backend).
- **Tech stack:** React 19, TypeScript (strict), Vite 8, Tailwind v4, react-router v8,
  TanStack Query/Table, react-hook-form + Zod. Data comes from an in-repo mock API.
- **Key factor:** screens are largely independent and must be added/removed easily by buyers;
  the UI primitive library must stay generic and reusable. Feature slices + a shared core fit
  this exactly, with soft boundaries that avoid over-engineering a presentation-only product.

## Folder Structure

```
src/
├── app/                    # ── COMPOSITION ROOT ──
│   ├── app-shell.tsx       #   authenticated layout (sidebar, header, ⌘K palette)
│   ├── router.tsx          #   route table; feature slices are lazy-loaded
│   └── nav.ts              #   THE single navigation map (sidebar + palette)
│
├── features/               # ── FEATURE SLICES (vertical, by domain) ──
│   ├── auth/               #   login, forgot, reset, MFA gate, guest layout
│   ├── dashboard/          #   customizable widget dashboard
│   ├── users/              #   list, editor, roles/RBAC, profile
│   ├── settings/           #   settings, appearance
│   ├── activity/  ai/  help/  ui-kit/  placeholder/
│   └── <new-domain>/       #   new screens go here (see air-glass-screen skill)
│                           #   each slice: *-page.tsx + local parts + changelog.txt
│
├── components/             # ── SHARED PRESENTATION ──
│   ├── ui/                 #   60+ generic primitives (shadcn/Radix/Base UI) — app-agnostic
│   └── *.tsx               #   app-level shared blocks (PageHeader, Panel, DataTable, …)
│
├── lib/                    # ── SHARED LOGIC (cross-cutting) ──
│   │                       #   auth, permissions, i18n, query, datetime, list-params,
│   └── ...                 #   appearance, utils (cn, spaUrl) — pure, no screen coupling
│
├── api/                    # ── DATA BOUNDARY ──
│   ├── client.ts  types.ts #   typed client + types (swap point for a real backend)
│   └── mock/               #   mock fixtures — the whole app runs on these
│
├── hooks/                  # shared hooks (use-mobile)
├── locales/                # 8 locale dictionaries (source of truth: en.json)
└── index.css               # ── DESIGN SYSTEM ── all colors/blur/mesh/glass tokens (locked)
```

## Dependency Rules

Direction of allowed imports (outer composition → inner shared core):

```
app  ──►  features  ──►  components(ui), lib, api, hooks, locales
                    └──►  index.css tokens (via className only)
```

- ✅ A feature slice may import from `components/*`, `components/ui/*`, `lib/*`, `api`,
  `hooks/*`, and `locales` (via `t()`).
- ✅ `app/*` composes features (router, shell) and owns the single nav map.
- ✅ Shared layers (`lib`, `api`, `components/ui`) are self-contained and reusable.
- ❌ **No feature → feature imports.** If two slices need the same thing, promote it to
  `components/`, `lib/`, or `api`.
- ❌ `components/ui/*` must **not** import from `features/*` or hold domain logic — primitives
  stay generic and template-portable.
- ❌ **No colors/blur/mesh defined outside `src/index.css`.** Components consume tokens only.
- ❌ No component imports the mock directly — always go through `src/api` (`client.ts`).

## Layer/Module Communication

- **Routing & lazy loading:** `app/router.tsx` maps each slice through `lazyPage(...)`; only
  the shell, login, MFA gate and placeholder are eager. This keeps the login bundle small.
- **Navigation:** features are surfaced through the single `app/nav.ts` map — consumed by both
  the sidebar and the ⌘K palette. Never duplicate nav data inside a feature.
- **Data:** slices call the mock API through `src/api` using **TanStack Query**
  (cache/loading/error handled by the query layer). The `client.ts`/`mock` seam is the single
  place a real backend replaces the mock.
- **Cross-cutting concerns:** auth guards (`RequirePermission`, `GuestOnly`), i18n (`t`,
  `useLocale`), permissions, and formatting live in `lib/` and are imported by any slice.
- **Shared UI:** slices compose screens from `components/` (PageHeader, Panel, DataTable,
  ConfirmDialog, StatusBadge) and `components/ui/` primitives.

## Key Principles

1. **One slice per screen domain.** New functionality is a new folder under `features/`, not
   edits scattered across the tree.
2. **Shared core is reusable and pure.** `components/ui`, `lib`, and `api` know nothing about
   any specific screen.
3. **Single sources of truth.** One nav map (`app/nav.ts`); one design-token file
   (`src/index.css`); one data boundary (`src/api`).
4. **Localize everything.** No hardcoded UI text — `t()` keys across all 8 dictionaries.
5. **Lazy by default.** Feature slices code-split so the login path stays light.
6. **Marketplace bar is architectural.** Light/dark, responsive, accessible, zero console
   errors are constraints every slice must satisfy (see `themeforest-prep`).

## Code Examples

### A feature slice registers itself (router + nav)
```tsx
// src/app/router.tsx — lazy slice
const ordersPage = () =>
  lazyPage(() => import('@/features/orders/orders-page').then((m) => ({ default: m.OrdersPage })))

// route object (permission-gated) under the authenticated shell
{ path: 'orders', element: <RequirePermission perm="orders.view">{ordersPage()}</RequirePermission> }

// src/app/nav.ts — the single nav map (sidebar + ⌘K)
{ to: '/orders', label: t('nav.orders'), icon: ShoppingCart, perm: 'orders.view' }
```

### Data through the boundary, tokens through className
```tsx
// ✅ feature slice: data via TanStack Query + api boundary, copy via t(), styling via tokens
export function OrdersPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['orders'], queryFn: api.orders.list })
  return (
    <Panel className="bg-card text-card-foreground">   {/* tokens, never raw colors */}
      <PageHeader title={t('orders.title')} />
      {/* DataTable / skeletons / error surface … */}
    </Panel>
  )
}
```

## Anti-Patterns

- ❌ Importing one feature's file from another feature (couples slices — promote to shared).
- ❌ Putting domain/business logic inside `components/ui/*` primitives.
- ❌ Hardcoding hex colors, blur, or mesh gradients in a component instead of `src/index.css`.
- ❌ Fetching data by touching `src/api/mock` directly instead of the `src/api` client.
- ❌ Adding a route without a matching `app/nav.ts` entry (screen becomes unreachable/drifts).
- ❌ Hardcoded UI strings, or adding a key to only some of the 8 locale dictionaries.
- ❌ Eagerly importing a heavy screen (charts/editor) into the login path.
