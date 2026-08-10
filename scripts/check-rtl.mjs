// RTL guard: enforces the logical-properties rule (.ai-factory/rules/base.md) by flagging
// physical directional Tailwind utilities, turning documentation into a check.
//
// Two modes:
//   delta (default) — only lines ADDED versus a base ref, plus new untracked screens.
//                     Cheap, and what you want during day-to-day work: "no NEW violations".
//   absolute (--all) — every .tsx under src/. This is the release-blocking mode; passing
//                     delta proves nothing about the tree as a whole.
//
// Genuinely direction-locked geometry (a drawer pinned to the physical right edge, a
// carousel's prev/next affordances) is exempted with an annotation carrying a reason:
//   // LTR-locked: vaul anchors side drawers to the physical edge
//   {/* LTR-locked: … */}      /* LTR-locked: … */
// placed on the offending line or the line directly above it. A bare `LTR-locked` with no
// reason does NOT suppress — the reason is the whole point of the escape hatch.
//
// Usage:
//   node scripts/check-rtl.mjs [baseRef]   delta mode (baseRef defaults to "main")
//   node scripts/check-rtl.mjs --all       absolute mode, whole tree

import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const argv = process.argv.slice(2)
const absolute = argv.includes('--all')
const base = argv.find((a) => !a.startsWith('--')) || 'main'
const SRC = 'src'

// The banned physical utilities, mirroring .ai-factory/rules/base.md lines 46–52. Each
// regex matches a whole Tailwind token (optional variant prefix / negative sign handled
// by the boundary lookarounds) so we don't flag substrings inside unrelated identifiers.
const RULES = [
  { label: 'ml-*', re: /(?<![\w-])-?ml-[a-z0-9[]/ },
  { label: 'mr-*', re: /(?<![\w-])-?mr-[a-z0-9[]/ },
  { label: 'pl-*', re: /(?<![\w-])-?pl-[a-z0-9[]/ },
  { label: 'pr-*', re: /(?<![\w-])-?pr-[a-z0-9[]/ },
  { label: 'left-*', re: /(?<![\w-])-?left-(?:\d|\[|full|auto|px)/ },
  { label: 'right-*', re: /(?<![\w-])-?right-(?:\d|\[|full|auto|px)/ },
  { label: 'text-left', re: /(?<![\w-])text-left(?![\w-])/ },
  { label: 'text-right', re: /(?<![\w-])text-right(?![\w-])/ },
  { label: 'border-l*', re: /(?<![\w-])border-l(?:-[a-z0-9[]|(?![\w-]))/ },
  { label: 'border-r*', re: /(?<![\w-])border-r(?:-[a-z0-9[]|(?![\w-]))/ },
  { label: 'rounded-l*', re: /(?<![\w-])rounded-l(?:-[a-z0-9[]|(?![\w-]))/ },
  { label: 'rounded-r*', re: /(?<![\w-])rounded-r(?:-[a-z0-9[]|(?![\w-]))/ },
]

// Requires the colon AND a non-space reason after it, so a bare marker can't silence a
// finding. Matches `//`, `/* */` and JSX `{/* */}` comment forms.
const EXEMPT = /LTR-locked:\s*\S/

// Run git with an explicit argv array (never a shell string) so an attacker-controlled
// `base` can't inject commands — the value reaches git as a single opaque argument.
function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return ''
  }
}

const fileCache = new Map()
function lines(file) {
  if (!fileCache.has(file)) {
    try {
      fileCache.set(file, readFileSync(file, 'utf8').split('\n'))
    } catch {
      fileCache.set(file, [])
    }
  }
  return fileCache.get(file)
}

/** The finding line itself, or the line directly above it, may carry the exemption. */
function isExempt(file, lineNo, text) {
  if (EXEMPT.test(text)) return true
  const above = lines(file)[lineNo - 2]
  return above !== undefined && EXEMPT.test(above)
}

/** Findings = [{ file, line, label, text }]; exempted ones are counted, not reported. */
const findings = []
let exempted = 0

function scanLine(file, line, text) {
  for (const { label, re } of RULES) {
    if (!re.test(text)) continue
    if (isExempt(file, line, text)) exempted++
    else findings.push({ file, line, label, text: text.trim() })
  }
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith('.tsx')) out.push(p)
  }
  return out
}

if (absolute) {
  // Whole-tree scan. No git involved, so this also works from an extracted archive.
  for (const file of walk(SRC)) {
    lines(file).forEach((text, i) => scanLine(file, i + 1, text))
  }
} else {
  // 1) Added lines versus the base ref (covers committed + uncommitted changes to tracked
  //    files). --unified=0 keeps hunks tight; we track the new-file line counter per hunk.
  const diff = git(['diff', '--unified=0', '--no-color', base, '--', SRC])
  let file = null
  let newLine = 0
  for (const raw of diff.split('\n')) {
    if (raw.startsWith('+++ b/')) {
      const p = raw.slice(6)
      file = p.endsWith('.tsx') ? p : null
      continue
    }
    const hunk = raw.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
    if (hunk) {
      newLine = Number(hunk[1])
      continue
    }
    if (raw.startsWith('+') && !raw.startsWith('+++')) {
      if (file) scanLine(file, newLine, raw.slice(1))
      newLine++
    } else if (!raw.startsWith('-') && !raw.startsWith('\\')) {
      newLine++
    }
  }

  // 2) Brand-new untracked screens never appear in a diff — scan them in full.
  const untracked = git(['ls-files', '--others', '--exclude-standard', '--', SRC])
  for (const p of untracked.split('\n').filter((f) => f.endsWith('.tsx'))) {
    lines(p).forEach((text, i) => scanLine(p, i + 1, text))
  }
}

const scope = absolute ? 'whole tree' : `base: ${base}`
const exemptNote = exempted ? ` (${exempted} exempted via LTR-locked)` : ''

if (findings.length === 0) {
  console.log(`✓ RTL guard: no physical directional utilities — ${scope}${exemptNote}.`)
  process.exit(0)
}

console.error(`✗ RTL guard: ${findings.length} physical utility usage(s) — ${scope}${exemptNote}.`)
console.error('  Use logical utilities instead (ms/me, ps/pe, start/end, text-start/end,')
console.error('  border-s/e, rounded-s/e) — see .ai-factory/rules/base.md.')
console.error('  Genuinely direction-locked? Annotate the line: // LTR-locked: <reason>\n')

for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  [${f.label}]`)
  console.error(`    ${f.text}`)
}

const perRule = new Map()
const perFile = new Map()
for (const f of findings) {
  perRule.set(f.label, (perRule.get(f.label) || 0) + 1)
  perFile.set(f.file, (perFile.get(f.file) || 0) + 1)
}

const byCount = (a, b) => b[1] - a[1]
console.error('\n  By rule:')
for (const [label, n] of [...perRule].sort(byCount)) {
  console.error(`    ${String(n).padStart(4)}  ${label}`)
}
console.error('\n  By file:')
for (const [file, n] of [...perFile].sort(byCount)) {
  console.error(`    ${String(n).padStart(4)}  ${file}`)
}
console.error(`\n  Total: ${findings.length} in ${perFile.size} file(s)${exemptNote}.`)

process.exit(1)
