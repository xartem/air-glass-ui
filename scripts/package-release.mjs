// Release packager: gate, then assemble the ThemeForest main-files archive.
//
// One command, deterministic, and it refuses to produce an archive when
// anything is red — so "I forgot to re-check X after that change" stops being a
// way to ship. Run it after every set of edits or new screens.
//
//   npm run package                 gate + build the archive
//   npm run package -- --dry-run    gate + report, write nothing
//   npm run package -- --skip-gate --i-know-what-im-doing
//
// Deliberately dependency-free (Node + the system `zip`), matching the other
// scripts here. Contents come from an explicit WHITELIST, never a blacklist:
// a new stray file at the repo root must be admitted on purpose, because the
// alternative has already shipped junk once.

import { execFileSync } from 'node:child_process'
import { gzipSync } from 'node:zlib'
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, rmSync, statSync, writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolved lazily: under a test runner `import.meta.url` is not a file: URL, and
// the pure path helpers below must stay importable without touching the disk.
let cachedRoot
export function repoRoot() {
  if (!cachedRoot) {
    cachedRoot = import.meta.url.startsWith('file:')
      ? fileURLToPath(new URL('..', import.meta.url))
      : process.cwd()
  }
  return cachedRoot
}

// ---------------------------------------------------------------------------
// Whitelist
// ---------------------------------------------------------------------------

/** Goes into `source/` — the buyer's working copy of the template. */
export const SOURCE_INCLUDE = [
  'src/**',
  'public/**',
  'scripts/**',
  'index.html',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'vitest.config.ts',
  'components.json',
  '.oxlintrc.json',
  '.gitignore',
  'README.md',
]

/** Carved out of the includes above. Belt and braces: these were removed from
 *  the repo, and this is what stops them creeping back into a buyer's archive. */
export const SOURCE_EXCLUDE = [
  '**/changelog.txt',
  '**/.DS_Store',
]

/** Top level of the archive, alongside `source/`. */
export const ROOT_INCLUDE = [
  'LICENSE.md',
  'THIRD-PARTY-LICENSES.md',
  'CHANGELOG.md',
]

/** Must never appear inside the archive. Verified after assembly, so a mistake
 *  in the include patterns is caught rather than trusted away. */
export const FORBIDDEN = [
  'node_modules', '.git', '.claude', '.ai-factory', '.agents', '.idea',
  '.playwright-mcp', 'audit', 'screenshots', 'preview',
  'AGENTS.md', '.mcp.json', 'skills-lock.json', '.ai-factory.json',
]

/** Minimal glob: `**` spans separators, `*` does not. */
export function globToRegExp(pattern) {
  let out = ''
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]
    if (c === '*') {
      if (pattern[i + 1] === '*') {
        // `**/` should also match zero directories, so the slash is optional.
        if (pattern[i + 2] === '/') { out += '(?:.*/)?'; i += 2 } else { out += '.*'; i += 1 }
      } else out += '[^/]*'
    } else if (c === '?') out += '[^/]'
    else out += c.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${out}$`)
}

const matchesAny = (rel, patterns) => patterns.some((p) => globToRegExp(p).test(rel))

/**
 * Is this repo-relative path admitted into `source/`?
 * Pure — no filesystem access — so it can be unit-tested directly.
 */
export function isSourceIncluded(rel) {
  if (matchesAny(rel, SOURCE_EXCLUDE)) return false
  return matchesAny(rel, SOURCE_INCLUDE)
}

/** Every file under `dir`, as repo-relative POSIX paths. */
export function listFiles(dir, base = dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const abs = path.join(dir, entry)
    if (statSync(abs).isDirectory()) listFiles(abs, base, out)
    else out.push(path.relative(base, abs).split(path.sep).join('/'))
  }
  return out
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

const tty = process.stdout.isTTY
const paint = (code, s) => (tty ? `[${code}m${s}[0m` : s)
const bold = (s) => paint('1', s)
const green = (s) => paint('32', s)
const red = (s) => paint('31', s)
const yellow = (s) => paint('33', s)
const dim = (s) => paint('2', s)

const failures = []
let stepNo = 0

function heading(title) {
  console.log(`\n${bold(title)}\n${dim('─'.repeat(title.length))}`)
}

/** Run one gate step; collect the failure instead of throwing so the whole
 *  gate reports in a single pass rather than one problem per run. */
function gateStep(name, fn, { hint } = {}) {
  stepNo++
  const label = `${String(stepNo).padStart(2)}. ${name}`
  const started = Date.now()
  try {
    const note = fn()
    console.log(`  ${green('✓')} ${label} ${dim(`${Date.now() - started}ms`)}${note ? dim(` — ${note}`) : ''}`)
    return true
  } catch (error) {
    console.log(`  ${red('✗')} ${label}`)
    const detail = String(error.message || error).trimEnd()
    for (const line of detail.split('\n').slice(0, 12)) console.log(`      ${red(line)}`)
    failures.push({ name, detail, hint })
    return false
  }
}

function npmRun(script) {
  try {
    execFileSync('npm', ['run', script], { cwd: repoRoot(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (error) {
    const out = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim()
    throw new Error(out || `npm run ${script} exited ${error.status}`)
  }
}

// ---------------------------------------------------------------------------
// Product metrics — what the documentation is checked against
// ---------------------------------------------------------------------------

export function productMetrics() {
  const locales = readdirSync(path.join(repoRoot(), 'src/locales')).filter((f) => f.endsWith('.json'))
  const uiPrimitives = readdirSync(path.join(repoRoot(), 'src/components/ui')).filter((f) => f.endsWith('.tsx'))
  const nav = readFileSync(path.join(repoRoot(), 'src/app/nav.ts'), 'utf8')
  const navLinks = (nav.match(/^\s*to:\s*"/gm) ?? []).length
  return {
    locales: locales.length,
    localeCodes: locales.map((f) => f.replace('.json', '')).sort(),
    uiPrimitives: uiPrimitives.length,
    screens: navLinks,
  }
}

// ---------------------------------------------------------------------------
// Gate
// ---------------------------------------------------------------------------

function assertCleanShippedCode() {
  const offenders = []
  const files = listFiles(path.join(repoRoot(), 'src')).filter((f) => /\.(ts|tsx)$/.test(f))
  for (const rel of files) {
    if (rel === 'lib/debug.ts' || /\.test\.tsx?$/.test(rel)) continue
    const text = readFileSync(path.join(repoRoot(), 'src', rel), 'utf8')
    text.split('\n').forEach((line, i) => {
      const at = `src/${rel}:${i + 1}`
      if (/(?<![\w.])console\.\w+\(/.test(line)) offenders.push(`${at}  console.* in shipped code`)
      if (/\b(TODO|FIXME|XXX|HACK)\b/.test(line)) offenders.push(`${at}  ${line.trim().slice(0, 60)}`)
      // CMS-era spec pointers: meaningless to a buyer reading the source.
      if (/(?:^|\s)(?:E[1-6]|D:|UI:)\s*§|§\s*\d/.test(line)) offenders.push(`${at}  spec reference`)
    })
  }
  if (offenders.length) {
    throw new Error(`${offenders.length} offending line(s):\n${offenders.slice(0, 10).join('\n')}`)
  }
  return `${files.length} files clean`
}

function assertLocaleParity() {
  const dir = path.join(repoRoot(), 'src/locales')
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
  const read = (f) => JSON.parse(readFileSync(path.join(dir, f), 'utf8'))
  const en = read('en.json')
  const enKeys = Object.keys(en).sort()
  const problems = []
  for (const f of files) {
    if (f === 'en.json') continue
    const keys = Object.keys(read(f)).sort()
    const missing = enKeys.filter((k) => !keys.includes(k))
    const extra = keys.filter((k) => !enKeys.includes(k))
    if (missing.length || extra.length) {
      problems.push(`${f}: ${missing.length} missing, ${extra.length} extra`)
    }
  }
  if (problems.length) throw new Error(problems.join('\n'))
  return `${files.length} locales × ${enKeys.length} keys`
}

/** The check that makes stale buyer documentation impossible to ship again —
 *  it is exactly how the pre-submission audit found the docs describing a
 *  year-old snapshot. */
function assertDocsFresh() {
  const m = productMetrics()
  const problems = []

  const docs = [
    ['README.md', path.join(repoRoot(), 'README.md')],
    ['documentation/index.html', path.join(repoRoot(), 'documentation/index.html')],
  ]

  for (const [label, file] of docs) {
    if (!existsSync(file)) { problems.push(`${label}: missing`); continue }
    const text = readFileSync(file, 'utf8')

    for (const match of text.matchAll(/(\d+)\s+locale/gi)) {
      if (Number(match[1]) !== m.locales) {
        problems.push(`${label}: claims "${match[0]}", actual ${m.locales}`)
      }
    }
    // The explicit language list must not silently omit a shipped locale.
    if (/\(en,\s*de/.test(text)) {
      const missing = m.localeCodes.filter((c) => !new RegExp(`[(,]\\s*${c}\\b`).test(text))
      if (missing.length) problems.push(`${label}: locale list omits ${missing.join(', ')}`)
    }
    for (const match of text.matchAll(/(\d+)\+?\s+(?:accessible\s+)?(?:UI\s+)?components/gi)) {
      const stated = Number(match[1])
      if (stated > m.uiPrimitives) {
        problems.push(`${label}: claims "${match[0]}", only ${m.uiPrimitives} primitives exist`)
      }
    }
  }

  if (problems.length) throw new Error(problems.join('\n'))
  return `${m.screens} screens · ${m.uiPrimitives} primitives · ${m.locales} locales`
}

/** Entry-graph transfer size. Seeded from the post-lazy-load measurement; this
 *  is what stops a 450 KB eager locale bundle quietly coming back. */
const BUDGET = { entryTotalKb: 330, singleChunkKb: 200 }

function assertBundleBudget() {
  const dist = path.join(repoRoot(), 'dist')
  const html = readFileSync(path.join(dist, 'index.html'), 'utf8')
  const refs = [...html.matchAll(/(?:src|href)="([^"]+\.js)"/g)].map((m) => m[1])
  if (!refs.length) throw new Error('no scripts referenced by dist/index.html')

  let total = 0
  const heavy = []
  for (const ref of refs) {
    const rel = ref.replace(/^\//, '').replace(/^admin-assets\//, '')
    const file = path.join(dist, rel)
    if (!existsSync(file)) continue
    const size = gzipSync(readFileSync(file)).length
    total += size
    if (size / 1024 > BUDGET.singleChunkKb) heavy.push(`${path.basename(file)} ${(size / 1024).toFixed(0)} KB`)
  }

  const totalKb = total / 1024
  const problems = []
  if (totalKb > BUDGET.entryTotalKb) {
    problems.push(`entry graph ${totalKb.toFixed(0)} KB gzip exceeds ${BUDGET.entryTotalKb} KB`)
  }
  if (heavy.length) problems.push(`eager chunk over ${BUDGET.singleChunkKb} KB: ${heavy.join(', ')}`)
  if (problems.length) throw new Error(problems.join('\n'))
  return `${totalKb.toFixed(0)} KB gzip over ${refs.length} entry chunks`
}

function runGate() {
  heading('Stage A — quality gate')
  gateStep('lint (oxlint)', () => npmRun('lint'), { hint: 'npm run lint' })
  gateStep('format (prettier)', () => npmRun('format:check'), { hint: 'npm run format' })
  gateStep('RTL logical properties', () => npmRun('lint:rtl:all'), { hint: 'npm run lint:rtl:all' })
  gateStep('tests (vitest)', () => npmRun('test'), { hint: 'npm test' })
  gateStep('production build', () => npmRun('build'), { hint: 'npm run build' })
  gateStep('shipped code is clean', assertCleanShippedCode, {
    hint: 'Route debug traces through devDebug(); drop TODO/FIXME and spec pointers.',
  })
  gateStep('locale key parity', assertLocaleParity, { hint: 'Add the new keys to every locale.' })
  gateStep('documentation matches the product', assertDocsFresh, {
    hint: 'Update README.md and documentation/index.html to the real counts.',
  })
  gateStep('bundle budget', assertBundleBudget, {
    hint: 'Something large became eagerly loaded — check the entry graph.',
  })
  return failures.length === 0
}

// ---------------------------------------------------------------------------
// Assemble
// ---------------------------------------------------------------------------

function assemble(version) {
  heading('Stage B — assemble')

  const name = `air-glass-ui-${version}`
  const staging = mkdtempSync(path.join(tmpdir(), 'air-glass-pack-'))
  const rootDir = path.join(staging, name)
  mkdirSync(path.join(rootDir, 'source'), { recursive: true })

  const included = []
  const unmatched = []

  for (const pattern of SOURCE_INCLUDE) {
    const before = included.length
    if (pattern.endsWith('/**')) {
      const dir = pattern.slice(0, -3)
      const abs = path.join(repoRoot(), dir)
      if (!existsSync(abs)) { unmatched.push(pattern); continue }
      for (const rel of listFiles(abs)) {
        const full = `${dir}/${rel}`
        if (!isSourceIncluded(full)) continue
        const dest = path.join(rootDir, 'source', full)
        mkdirSync(path.dirname(dest), { recursive: true })
        cpSync(path.join(abs, rel), dest)
        included.push(full)
      }
    } else {
      const abs = path.join(repoRoot(), pattern)
      if (!existsSync(abs)) { unmatched.push(pattern); continue }
      cpSync(abs, path.join(rootDir, 'source', pattern))
      included.push(pattern)
    }
    if (included.length === before) unmatched.push(pattern)
  }

  // Pre-built demo output and the buyer documentation ship as-is.
  for (const dir of ['dist', 'documentation']) {
    const abs = path.join(repoRoot(), dir)
    if (!existsSync(abs)) { unmatched.push(`${dir}/`); continue }
    cpSync(abs, path.join(rootDir, dir), { recursive: true })
    included.push(`${dir}/ (${listFiles(abs).length} files)`)
  }

  for (const file of ROOT_INCLUDE) {
    const abs = path.join(repoRoot(), file)
    if (!existsSync(abs)) { unmatched.push(file); continue }
    cpSync(abs, path.join(rootDir, file))
    included.push(file)
  }

  const archive = path.join(repoRoot(), `${name}.zip`)
  rmSync(archive, { force: true })
  try {
    execFileSync('zip', ['-rq', archive, name], { cwd: staging, stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (error) {
    rmSync(staging, { recursive: true, force: true })
    throw new Error(
      `could not create the archive with \`zip\`: ${error.message}\n` +
      'Install Info-ZIP (macOS and most Linux ship it) or archive the staging tree by hand.',
    )
  }

  const contents = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).split('\n').filter(Boolean)
  rmSync(staging, { recursive: true, force: true })

  return { archive, contents, included, unmatched }
}

function verifyArchive(contents) {
  heading('Stage C — verify')
  const strays = []
  for (const entry of contents) {
    const rel = entry.split('/').slice(1).join('/')
    if (!rel) continue
    for (const bad of FORBIDDEN) {
      if (rel === bad || rel.startsWith(`${bad}/`) || rel.includes(`/${bad}/`) || rel.endsWith(`/${bad}`)) {
        strays.push(`${entry}  (matched "${bad}")`)
      }
    }
    if (/(?:^|\/)changelog\.txt$/.test(rel)) strays.push(`${entry}  (dev changelog)`)
    if (/^[^/]+\.(png|jpe?g)$/.test(rel)) strays.push(`${entry}  (root-level capture)`)
  }
  if (strays.length) {
    console.log(`  ${red('✗')} forbidden entries found in the archive`)
    for (const s of strays.slice(0, 20)) console.log(`      ${red(s)}`)
    failures.push({ name: 'archive contents', detail: strays.join('\n') })
    return false
  }
  console.log(`  ${green('✓')} no forbidden entries ${dim(`(${contents.length} entries checked)`)}`)
  return true
}

// ---------------------------------------------------------------------------

function main() {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')
  const skipGate = argv.includes('--skip-gate')
  const override = argv.includes('--i-know-what-im-doing')

  if (skipGate && !override) {
    console.error(red('\n--skip-gate produces an archive nobody has checked.'))
    console.error('If that is genuinely what you want, add --i-know-what-im-doing.\n')
    process.exit(2)
  }

  const pkg = JSON.parse(readFileSync(path.join(repoRoot(), 'package.json'), 'utf8'))
  console.log(bold(`\nAir Glass UI — release packager`))
  console.log(dim(`${pkg.name} ${pkg.version}${dryRun ? '  ·  dry run' : ''}`))

  if (skipGate) {
    console.log(yellow('\n⚠  Gate skipped by explicit override.'))
  } else if (!runGate() ) {
    heading('Result')
    console.log(`${red('✗')} ${failures.length} gate failure(s) — no archive was produced.\n`)
    for (const f of failures) {
      console.log(`  ${bold(f.name)}`)
      if (f.hint) console.log(`    ${dim(`fix: ${f.hint}`)}`)
    }
    console.log('')
    process.exit(1)
  }

  if (dryRun) {
    heading('Result')
    console.log(`${green('✓')} gate passed. ${dim('Dry run — no archive written.')}\n`)
    return
  }

  const { archive, contents, included, unmatched } = assemble(pkg.version)
  console.log(`  ${green('✓')} staged ${included.length} include rule(s)`)
  for (const rule of included) console.log(`      ${dim(rule)}`)

  if (unmatched.length) {
    console.log(`\n  ${yellow('!')} ${unmatched.length} include rule(s) matched nothing:`)
    for (const rule of unmatched) console.log(`      ${yellow(rule)}`)
    console.log(dim('      A rule that matches nothing usually means a renamed or deleted path.'))
  }

  const ok = verifyArchive(contents)

  // What the whitelist deliberately left behind, so filtering is visible.
  const excluded = readdirSync(repoRoot())
    .filter((e) => !['node_modules', 'dist', 'documentation'].includes(e))
    .filter((e) => !SOURCE_INCLUDE.includes(e) && !ROOT_INCLUDE.includes(e))
    .filter((e) => !SOURCE_INCLUDE.some((p) => p === `${e}/**`))
    .filter((e) => !e.endsWith('.zip'))

  heading('Result')
  if (!ok) {
    console.log(`${red('✗')} archive rejected — ${archive} was written but must not be shipped.\n`)
    process.exit(1)
  }

  const bytes = statSync(archive).size
  console.log(`${green('✓')} ${path.basename(archive)}  ${dim(`${(bytes / 1024 / 1024).toFixed(1)} MB · ${contents.length} entries`)}`)
  console.log(`\n  ${dim('excluded from the archive:')}`)
  console.log(`      ${dim(excluded.join('  '))}`)
  console.log(`\n  ${dim('Next: walk the demo with DevTools open, then check preview image sizes')}`)
  console.log(`  ${dim('against Envato Author Help before uploading — they change.')}\n`)
}

// Only run when invoked as a script, so the pure helpers above stay importable.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
