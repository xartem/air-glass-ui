// Render the buyer documentation (documentation/index.html) to a single
// documentation/documentation.pdf using a headless Chrome/Chromium you already
// have installed. This intentionally adds NO dependency to package.json — it
// shells out to a browser binary via --print-to-pdf.
//
// Usage:
//   node scripts/build-docs-pdf.mjs
//   CHROME_BIN="/path/to/chrome" node scripts/build-docs-pdf.mjs
//
// Resolution order for the browser binary:
//   1. $CHROME_BIN
//   2. a list of common macOS / Linux Chrome & Chromium paths
//
// If no binary is found, the script prints instructions (including a
// wkhtmltopdf and a "Print → Save as PDF" fallback) and exits non-zero.
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const INPUT = fileURLToPath(new URL('../documentation/index.html', import.meta.url))
const OUTPUT = fileURLToPath(new URL('../documentation/documentation.pdf', import.meta.url))

const CANDIDATES = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
].filter(Boolean)

function findBrowser() {
  return CANDIDATES.find((bin) => {
    try {
      return existsSync(bin)
    } catch {
      return false
    }
  })
}

function main() {
  console.log('[build-docs-pdf] input :', INPUT)
  console.log('[build-docs-pdf] output:', OUTPUT)

  if (!existsSync(INPUT)) {
    console.error(`[build-docs-pdf] ERROR: cannot find ${INPUT}`)
    process.exit(1)
  }

  const browser = findBrowser()
  if (!browser) {
    console.error('[build-docs-pdf] ERROR: no Chrome/Chromium binary found.')
    console.error('  Set CHROME_BIN to your browser, e.g.:')
    console.error('    CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \\')
    console.error('      node scripts/build-docs-pdf.mjs')
    console.error('  Or install wkhtmltopdf and run:')
    console.error('    wkhtmltopdf --enable-local-file-access documentation/index.html documentation/documentation.pdf')
    console.error('  Or simply open documentation/index.html and use Print → Save as PDF.')
    process.exit(1)
  }

  console.log('[build-docs-pdf] using browser:', browser)

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--no-pdf-header-footer',
    `--print-to-pdf=${OUTPUT}`,
    // file:// URL so relative CSS/JS/asset paths resolve offline
    `file://${INPUT}`,
  ]

  const result = spawnSync(browser, args, { cwd: ROOT, stdio: 'inherit' })

  if (result.error) {
    console.error('[build-docs-pdf] ERROR: failed to launch browser:', result.error.message)
    process.exit(1)
  }
  if (result.status !== 0 || !existsSync(OUTPUT)) {
    console.error(`[build-docs-pdf] ERROR: PDF was not produced (exit code ${result.status}).`)
    process.exit(1)
  }

  console.log('[build-docs-pdf] SUCCESS: wrote', OUTPUT)
}

main()
