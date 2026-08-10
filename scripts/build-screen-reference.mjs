// Dev helper: enumerate every shipped screen from src/app/nav.ts — the single
// navigation map the sidebar and the ⌘K palette already share — so the buyer
// documentation "Screen Reference" stays close to the source and cannot
// silently drift as screens are added or removed.
//
// Usage:
//   node scripts/build-screen-reference.mjs           # print the grouped tree + drift report
//   node scripts/build-screen-reference.mjs --json    # emit JSON to stdout, nothing else
//
// It also cross-checks src/app/router.tsx and reports drift in BOTH directions:
// a nav entry pointing at no route, and a route reachable from no nav entry.
// The counts it emits are the ones the release gate's docs-freshness step
// consumes (scripts/package-release.mjs -> assertDocsFresh), so a documentation
// number taken from here is a number that gate will accept.
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const NAV_FILE = path.join(ROOT, "src/app/nav.ts");
const ROUTER_FILE = path.join(ROOT, "src/app/router.tsx");
const LOCALES_DIR = path.join(ROOT, "src/locales");
const UI_DIR = path.join(ROOT, "src/components/ui");
const COMPONENTS_DIR = path.join(ROOT, "src/components");

const JSON_MODE = process.argv.includes("--json");

/** Separators that carry t() interpolation vars through the literal as plain text. */
const VAR_SEP = "::";
const PAIR_SEP = ";";

/** Verbose progress goes to stderr in --json mode so stdout stays machine-readable. */
function log(message) {
  if (JSON_MODE) process.stderr.write(`${message}\n`);
  else process.stdout.write(`${message}\n`);
}

function fail(message) {
  process.stderr.write(`[screen-reference] ERROR: ${message}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Source extraction
// ---------------------------------------------------------------------------

/**
 * Strip line and block comments while respecting double-quoted strings, so a
 * comment containing a brace or a quote cannot corrupt the literal we evaluate.
 */
function stripComments(src) {
  let out = "";
  let i = 0;
  let inString = false;
  let inLine = false;
  let inBlock = false;
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];
    if (inLine) {
      if (c === "\n") {
        inLine = false;
        out += c;
      }
      i++;
    } else if (inBlock) {
      if (c === "*" && next === "/") {
        inBlock = false;
        i += 2;
      } else i++;
    } else if (inString) {
      out += c;
      if (c === "\\") {
        out += next ?? "";
        i += 2;
        continue;
      }
      if (c === '"') inString = false;
      i++;
    } else if (c === '"') {
      inString = true;
      out += c;
      i++;
    } else if (c === "/" && next === "/") {
      inLine = true;
      i += 2;
    } else if (c === "/" && next === "*") {
      inBlock = true;
      i += 2;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

/** Slice the array literal that `functionName` returns, by brace/bracket depth. */
function extractReturnedArray(src, functionName) {
  const fnAt = src.indexOf(`export function ${functionName}(`);
  if (fnAt === -1)
    fail(`${functionName}() not found in ${path.relative(ROOT, NAV_FILE)}`);
  const start = src.indexOf("return [", fnAt);
  if (start === -1) fail(`${functionName}() has no "return [" literal`);
  const open = src.indexOf("[", start);
  let depth = 0;
  let inString = false;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") {
      depth--;
      if (depth === 0) return src.slice(open, i + 1);
    }
  }
  return fail(`${functionName}() array literal is unbalanced`);
}

/**
 * Evaluate the nav literal. Three substitutions make it plain JS:
 *   t("nav.foo")            -> "nav.foo"          (keep the key; en.json resolves it)
 *   t("nav.foo", {n: "1"})  -> "nav.foo::n=1"     (carry the interpolation vars)
 *   icon: Users             -> icon: "Users"      (the only bare identifiers here)
 */
function parseNavGroups() {
  const raw = stripComments(readFileSync(NAV_FILE, "utf8"));
  const literal = extractReturnedArray(raw, "buildNavGroups")
    .replace(
      /\bt\(\s*("(?:[^"\\]|\\.)*")\s*,\s*\{([^{}]*)\}\s*\)/g,
      (_m, key, vars) => {
        const pairs = [...vars.matchAll(/([A-Za-z0-9_]+)\s*:\s*"([^"]*)"/g)]
          .map(([, name, value]) => `${name}=${value}`)
          .join(PAIR_SEP);
        return `${key.slice(0, -1)}${VAR_SEP}${pairs}"`;
      },
    )
    .replace(/\bt\(\s*("(?:[^"\\]|\\.)*")\s*\)/g, "$1")
    .replace(/\bicon:\s*([A-Z][A-Za-z0-9_]*)/g, 'icon: "$1"');

  const leftover = literal.match(/:\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*[,}\]]/g);
  if (leftover)
    fail(
      `unresolved identifiers in nav literal: ${[...new Set(leftover)].join(" ")}`,
    );

  try {
    return new Function(`return ${literal}`)();
  } catch (err) {
    return fail(`cannot evaluate the nav literal: ${err.message}`);
  }
}

function parseRouterPaths() {
  const raw = stripComments(readFileSync(ROUTER_FILE, "utf8"));
  return new Set([...raw.matchAll(/\bpath:\s*"([^"]+)"/g)].map((m) => m[1]));
}

// ---------------------------------------------------------------------------
// Walk
// ---------------------------------------------------------------------------

const isParent = (entry) => Array.isArray(entry?.children);

/** Depth-first walk producing one flat record per leaf, carrying its parent trail. */
function collectScreens(groups, dict) {
  const label = (encoded) => {
    const [key, packed] = encoded.split(VAR_SEP);
    const raw = dict[key] ?? key;
    if (!packed) return raw;
    const vars = Object.fromEntries(
      packed.split(PAIR_SEP).map((pair) => pair.split("=")),
    );
    return raw.replace(/\{(\w+)\}/g, (m, name) => vars[name] ?? m);
  };

  const screens = [];
  const walk = (entry, groupLabel, trail) => {
    if (isParent(entry)) {
      const next = [...trail, label(entry.label)];
      for (const child of entry.children) walk(child, groupLabel, next);
      return;
    }
    screens.push({
      route: entry.to,
      label: label(entry.label),
      labelKey: entry.label.split(VAR_SEP)[0],
      group: groupLabel,
      parents: trail,
      permission: entry.perm ?? null,
    });
  };

  for (const group of groups) {
    const groupLabel = label(group.label);
    for (const entry of group.items) walk(entry, groupLabel, []);
  }
  return screens;
}

// ---------------------------------------------------------------------------
// Metrics — must stay aligned with productMetrics() in package-release.mjs
// ---------------------------------------------------------------------------

/** Count .tsx files, optionally recursing; `skip` excludes a subdirectory by name. */
function tsxIn(dir, { recurse = false, skip = [] } = {}) {
  return readdirSync(dir, { withFileTypes: true }).reduce((n, e) => {
    if (e.isDirectory()) {
      if (!recurse || skip.includes(e.name)) return n;
      return n + tsxIn(path.join(dir, e.name), { recurse, skip });
    }
    const counts = e.name.endsWith(".tsx") && !e.name.endsWith(".test.tsx");
    return counts ? n + 1 : n;
  }, 0);
}

function collectMetrics(screens, groups) {
  const localeCodes = readdirSync(LOCALES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.basename(f, ".json"))
    .sort();

  // The gate counts every `to: "` in nav.ts, which also sweeps up buildQuickActions()
  // — hence navLinks sits one above `screens`. Reproduce it verbatim so a
  // documentation number sourced here cannot disagree with the gate.
  const navLinks = (readFileSync(NAV_FILE, "utf8").match(/\bto:\s*"/g) ?? [])
    .length;

  return {
    screens: screens.length,
    uniqueRoutes: new Set(screens.map((s) => s.route)).size,
    navLinks,
    navGroups: groups.length,
    uiPrimitives: tsxIn(UI_DIR),
    // Everything under src/components except the ui/ primitives — including the
    // charts/ and board/ subfolders, which a top-level-only count would miss.
    composedComponents: tsxIn(COMPONENTS_DIR, { recurse: true, skip: ["ui"] }),
    locales: localeCodes.length,
    localeCodes,
  };
}

// ---------------------------------------------------------------------------
// Drift
// ---------------------------------------------------------------------------

/**
 * Compile a react-router path pattern to a regex. `/settings/:tab?` must be
 * recognized as serving the nav entry `/settings/site`, so a plain string
 * comparison is not enough. The `*` catch-all is excluded by the caller — it
 * matches everything and would hide every real orphan.
 */
function patternToRegex(pattern) {
  const body = pattern
    .split("/")
    .filter(Boolean)
    .map((seg) => {
      if (seg.endsWith("?")) return `(?:/[^/]+)?`;
      if (seg.startsWith(":")) return `/[^/]+`;
      return `/${seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`;
    })
    .join("");
  return new RegExp(`^${body || "/"}$`);
}

function findDrift(screens, routerPaths) {
  const navRoutes = new Set(screens.map((s) => s.route));
  const patterns = [...routerPaths]
    .filter((p) => p !== "*" && /[:*]/.test(p))
    .map(patternToRegex);

  const served = (route) =>
    routerPaths.has(route) || patterns.some((re) => re.test(route));

  const navWithoutRoute = screens
    .filter((s) => !served(s.route))
    .map((s) => ({ route: s.route, label: s.label, group: s.group }));

  // A parameterized route (/users/:id) is an editor reached from its list screen,
  // never a sidebar entry — expected, so it is reported apart from real orphans.
  const unreachable = [];
  const parameterized = [];
  const catchAll = [];
  for (const route of [...routerPaths].sort()) {
    if (navRoutes.has(route)) continue;
    if (route === "*") catchAll.push(route);
    else if (route.includes(":")) parameterized.push(route);
    else unreachable.push(route);
  }

  return { navWithoutRoute, unreachable, parameterized, catchAll };
}

// ---------------------------------------------------------------------------

function main() {
  log("[screen-reference] reading src/app/nav.ts");
  const groups = parseNavGroups();
  log(`[screen-reference] parsed ${groups.length} nav groups`);

  let dict = {};
  try {
    dict = JSON.parse(readFileSync(path.join(LOCALES_DIR, "en.json"), "utf8"));
  } catch (err) {
    log(
      `[screen-reference] WARN: cannot read en.json (${err.message}) — falling back to raw keys`,
    );
  }

  const screens = collectScreens(groups, dict);
  log(`[screen-reference] collected ${screens.length} screens`);

  log("[screen-reference] reading src/app/router.tsx");
  const routerPaths = parseRouterPaths();
  log(`[screen-reference] parsed ${routerPaths.size} route paths`);

  const metrics = collectMetrics(screens, groups);
  const drift = findDrift(screens, routerPaths);

  if (JSON_MODE) {
    process.stdout.write(
      `${JSON.stringify({ metrics, screens, drift }, null, 2)}\n`,
    );
    return;
  }

  const out = (line) => process.stdout.write(`${line}\n`);

  let currentGroup = null;
  let currentTrail = null;
  for (const screen of screens) {
    if (screen.group !== currentGroup) {
      currentGroup = screen.group;
      currentTrail = null;
      out("");
      out(currentGroup.toUpperCase());
    }
    const trail = screen.parents.join(" > ");
    if (trail !== currentTrail) {
      currentTrail = trail;
      if (trail) out(`  ${trail}`);
    }
    const indent = screen.parents.length ? "    " : "  ";
    const perm = screen.permission ? `  [${screen.permission}]` : "";
    out(`${indent}${screen.route.padEnd(46)}${screen.label}${perm}`);
  }

  out("");
  out("Counts");
  out(`  screens (nav leaves)    ${metrics.screens}`);
  out(`  unique routes           ${metrics.uniqueRoutes}`);
  out(`  nav links (gate count)  ${metrics.navLinks}`);
  out(`  nav groups              ${metrics.navGroups}`);
  out(`  ui/ primitives          ${metrics.uiPrimitives}`);
  out(`  composed components     ${metrics.composedComponents}`);
  out(
    `  locales                 ${metrics.locales} (${metrics.localeCodes.join(", ")})`,
  );

  out("");
  out("Drift");
  if (drift.navWithoutRoute.length) {
    out(`  nav entries with no route (${drift.navWithoutRoute.length}):`);
    for (const e of drift.navWithoutRoute)
      out(`    ${e.route}  — ${e.group} / ${e.label}`);
  } else {
    out("  nav entries with no route: none");
  }
  if (drift.unreachable.length) {
    out(`  routes with no nav entry (${drift.unreachable.length}):`);
    for (const r of drift.unreachable) out(`    ${r}`);
  } else {
    out("  routes with no nav entry: none");
  }
  out(
    `  parameterized routes (reached from a list screen): ${drift.parameterized.length}`,
  );

  if (drift.navWithoutRoute.length) {
    process.stderr.write(
      `[screen-reference] WARN: ${drift.navWithoutRoute.length} nav entr(ies) point at no route — ` +
        "the sidebar would 404.\n",
    );
  }
}

main();
