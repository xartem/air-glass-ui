# AGENTS.md

> Structural map for AI agents and new developers. Keep it factual and current — update it
> when the project structure changes significantly. Detailed product spec lives in
> `.ai-factory/DESCRIPTION.md`; architecture rules live in `.ai-factory/ARCHITECTURE.md`.

## Project Overview

**Air Glass UI** — a premium React 19 + TypeScript admin dashboard **UI template** being
repackaged from a CMS admin front-end into a commercial product for Envato ThemeForest. Runs
fully on an in-repo mock API (no backend). See `.ai-factory/DESCRIPTION.md`.

## Tech Stack

- **Programming language:** TypeScript (strict, ES2023)
- **UI runtime / framework:** React 19, react-router v8
- **Build tool:** Vite 8
- **Styling:** Tailwind CSS v4, shadcn/ui + Radix UI + Base UI, Geist Variable font
- **Data / state:** TanStack Query (mock-backed), TanStack Table; react-hook-form + Zod
- **Database:** none — in-repo mock API only

## Project Structure

```
src/
├── app/              # Shell, router, single navigation map
│   ├── app-shell.tsx #   Authenticated layout (sidebar, header, ⌘K palette)
│   ├── router.tsx    #   react-router config, lazy feature routes
│   └── nav.ts        #   ONE navigation map (sidebar + command palette)
├── features/         # Screen-level code, one folder per domain
│   ├── auth/         #   login, forgot, reset, MFA enroll gate, guest layout
│   ├── dashboard/    #   customizable widget dashboard (grid, widgets, customize)
│   ├── users/        #   users list, editor, roles/RBAC, profile, MFA
│   ├── settings/     #   settings + appearance
│   ├── activity/     #   activity log
│   ├── ai/           #   AI pages + settings + findings panel
│   ├── help/         #   help page
│   ├── ui-kit/       #   component showcase
│   └── placeholder/  #   fallback screen for un-built routes
├── components/
│   └── ui/           # 60+ reusable primitives (shadcn/ui + Radix + Base UI)
├── lib/              # Cross-cutting helpers (auth, i18n, permissions, query,
│                     #   datetime, list-params, appearance, password, progress)
├── hooks/            # Shared hooks (use-mobile)
├── api/              # API client + types
│   └── mock/         #   mock fixtures (ai, appearance, dashboard, data)
├── locales/          # 8 locale dictionaries (en, de, es, fr, it, pl, ru, uk)
├── assets/           # Static assets
└── index.css         # ALL visual identity: shadcn vars + --glass-* design tokens
```

## Key Entry Points

| File | Purpose |
|------|---------|
| `index.html` | Vite HTML entry |
| `src/app/router.tsx` | Route table; feature screens are lazy-loaded |
| `src/app/nav.ts` | Single navigation map (sidebar + ⌘K palette) |
| `src/index.css` | Design system — colors, blur, mesh, glass tokens (locked) |
| `src/api/client.ts` | API client; swaps mock ↔ real backend |
| `vite.config.ts` | Build/dev config |
| `components.json` | shadcn/ui registry config |
| `package.json` | Scripts: `dev`, `build`, `lint`, `format`, `test`, `preview` |

## Documentation

| Document | Path | Description |
|----------|------|-------------|
| README | README.md | Landing page (currently the Vite starter README — to be rewritten for buyers) |
| Product spec | .ai-factory/DESCRIPTION.md | What the template is and the ThemeForest goal |

## AI Context Files

| File | Purpose |
|------|---------|
| AGENTS.md | This structural map |
| .ai-factory/DESCRIPTION.md | Product specification & tech stack |
| .ai-factory/ARCHITECTURE.md | Architecture pattern, folder rules, examples |
| .ai-factory/rules/base.md | Project coding conventions (enforced) |
| .ai-factory/config.yaml | AI Factory config (languages, git, paths) |

## Agent Rules

- Decompose combined shell commands that mix branch switching with network operations.
  - Incorrect (combined): `git checkout main && git pull`
  - Correct (decomposed): first `git checkout main`, then `git pull origin main`
- **Design tokens are centralized:** never add colors/blur/mesh in a component or screen —
  only in `src/index.css`. See `.ai-factory/rules/base.md`.
- **One nav source:** add navigation entries in `src/app/nav.ts`, never duplicate them.
- **i18n:** no hardcoded UI text; add keys to all 8 locale dictionaries.
- **Marketplace bar:** responsive, accessible, no console errors, complete light/dark themes.
