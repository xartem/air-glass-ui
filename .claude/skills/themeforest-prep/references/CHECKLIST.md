# Air Glass UI — ThemeForest Submission Checklist

Copy this into a tracking issue/PR when preparing a release. Adapted for a React 19 + Vite SPA.

## Pre-flight (automated gates)
- [ ] `npm run build` passes (`tsc -b && vite build`)
- [ ] `npm run lint` (oxlint) — 0 errors
- [ ] `npm run format:check` — clean
- [ ] `npm run test` (Vitest) — green
- [ ] Bundle sanity: login route does not pull charts/editor/markdown chunks

## Manual QA — per route (DevTools open)
Routes: `/login`, `/forgot`, `/reset`, MFA gate, `/` (dashboard), users list, user editor,
roles, profile, settings, appearance, activity, ai, ai-settings, help, ui-kit, error pages.

For each route:
- [ ] No console errors
- [ ] No 404 / failed network requests
- [ ] Renders correctly in **light** theme
- [ ] Renders correctly in **dark** theme
- [ ] Responsive at ~375px, ~768px, ~1280px
- [ ] Keyboard: tab order sane, focus visible, dialogs trap focus, Esc closes
- [ ] Text contrast passes WCAG AA

## Cross-browser
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Content & data
- [ ] Only mock-API data; no real/private/copyrighted content
- [ ] Placeholder imagery is generic/licensed; noted in item description
- [ ] i18n: all 8 dictionaries populated for shipped strings (en, de, es, fr, it, pl, ru, uk)
- [ ] No hardcoded UI strings bypassing `t()`

## Licensing
- [ ] Every `package.json` dependency license reviewed (flag any GPL/AGPL)
- [ ] Geist Variable font license included and redistribution-safe
- [ ] lucide-react (ISC) noted
- [ ] All images/illustrations owned or resale-licensed
- [ ] `LICENSE.md` / third-party-licenses file written and included

## Documentation (HTML or PDF, English)
- [ ] Prerequisites + install
- [ ] Dev / build / preview commands
- [ ] Project structure (link `AGENTS.md`)
- [ ] Theming via `src/index.css`
- [ ] Adding a screen (feature-sliced pattern)
- [ ] Mock API + swapping a real backend (`src/api/client.ts`)
- [ ] i18n usage
- [ ] Component / screen catalog
- [ ] Support + changelog pointer

## Preview assets (re-verify live Envato specs)
- [ ] Main preview `590 × 300` JPG, named `01_<name>.jpg`
- [ ] Thumbnail `80 × 80` PNG/JPG
- [ ] Additional screenshots, same aspect ratio, max `900px` each side
- [ ] Screenshots reflect the actual current UI

## Package
- [ ] Main ZIP excludes `node_modules/`, `dist/` (unless intended), `.git/`, `.idea/`,
      `.ai-factory/`, editor/tooling dot-configs not needed by buyers
- [ ] `CHANGELOG.md` present (start `1.0.0`)
- [ ] Live demo deployed and matches submitted files

## Final
- [ ] Re-read current Envato "Site Template Requirements" + "File Preparation Guidelines"
- [ ] Submit
