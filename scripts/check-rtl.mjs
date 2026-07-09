// RTL guard: flags NEW physical directional Tailwind utilities in changed .tsx files,
// turning the logical-properties rule (.ai-factory/rules/base.md) from documentation
// into a check. It intentionally does NOT scan the whole tree — the ~425 legacy physical
// utilities are owned by the Style-completion milestone — so it only inspects lines added
// versus a base ref (default: main) plus any new untracked screens. Wire as `npm run
// lint:rtl`; keep it out of the release-blocking build until the legacy backlog clears.
//
// Usage: node scripts/check-rtl.mjs [baseRef]   (baseRef defaults to "main")

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const base = process.argv[2] || 'main'

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

// Run git with an explicit argv array (never a shell string) so an attacker-controlled
// `base` can't inject commands — the value reaches git as a single opaque argument.
function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return ''
  }
}

/** Findings = [{ file, line, label, text }]. `line` is best-effort from the diff hunk. */
const findings = []

function scanLine(file, line, text) {
  for (const { label, re } of RULES) {
    if (re.test(text)) findings.push({ file, line, label, text: text.trim() })
  }
}

// 1) Added lines versus the base ref (covers committed + uncommitted changes to tracked
//    files). --unified=0 keeps hunks tight; we track the new-file line counter per hunk.
const diff = git(['diff', '--unified=0', '--no-color', base, '--', 'src'])
let file = null
let newLine = 0
for (const raw of diff.split('\n')) {
  if (raw.startsWith('+++ b/')) {
    const path = raw.slice(6)
    file = path.endsWith('.tsx') ? path : null
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
const untracked = git(['ls-files', '--others', '--exclude-standard', '--', 'src'])
for (const path of untracked.split('\n').filter((p) => p.endsWith('.tsx'))) {
  let content = ''
  try {
    content = readFileSync(path, 'utf8')
  } catch {
    continue
  }
  content.split('\n').forEach((text, i) => scanLine(path, i + 1, text))
}

if (findings.length === 0) {
  console.log(`✓ RTL guard: no new physical directional utilities (base: ${base}).`)
  process.exit(0)
}

console.error(`✗ RTL guard: ${findings.length} new physical utility usage(s) found.`)
console.error('  Use logical utilities instead (ms/me, ps/pe, start/end, text-start/end,')
console.error('  border-s/e, rounded-s/e) — see .ai-factory/rules/base.md.\n')
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  [${f.label}]`)
  console.error(`    ${f.text}`)
}
process.exit(1)
