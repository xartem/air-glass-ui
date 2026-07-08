// Dev helper: enumerate the UI primitives in src/components/ui so the buyer
// documentation "Component Reference" stays close to the source and cannot
// silently drift as components are added or removed.
//
// Usage:
//   node scripts/build-component-reference.mjs            # print a grouped list
//   node scripts/build-component-reference.mjs --json     # emit JSON to stdout
//
// It reads the file names only (no parsing of component internals) and maps
// each to the curated category used in documentation/index.html. New files that
// are not yet categorized are reported under "uncategorized" so a maintainer
// knows the reference needs a one-line entry.
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const UI_DIR = fileURLToPath(new URL('../src/components/ui', import.meta.url))

// Curated category map (kebab component name -> group). Mirrors the section
// order in the documentation Component Reference. Keep in sync when adding a
// primitive; uncategorized files are flagged below.
const CATEGORIES = {
  'Forms & inputs': [
    'button', 'button-group', 'input', 'input-group', 'input-otp', 'textarea',
    'label', 'field', 'checkbox', 'radio-group', 'switch', 'select',
    'native-select', 'combobox', 'multi-select', 'number-field', 'slider',
    'toggle', 'toggle-group', 'calendar', 'rating', 'form-field',
  ],
  'Data display': [
    'table', 'data-table', 'card', 'item', 'badge', 'avatar', 'aspect-ratio',
    'chart', 'timeline', 'stepper', 'kbd', 'marker', 'separator', 'progress',
  ],
  'Overlays & dialogs': [
    'dialog', 'alert-dialog', 'sheet', 'drawer', 'popover', 'hover-card',
    'tooltip', 'dropdown-menu', 'context-menu', 'menubar', 'command',
  ],
  'Navigation': [
    'sidebar', 'navigation-menu', 'breadcrumb', 'pagination', 'tabs',
    'accordion', 'collapsible', 'scroll-area', 'resizable', 'carousel',
    'direction',
  ],
  'Feedback': [
    'alert', 'sonner', 'skeleton', 'spinner', 'empty',
  ],
  'Chat & messaging': [
    'message', 'message-scroller', 'bubble', 'attachment',
  ],
}

function main() {
  let files
  try {
    files = readdirSync(UI_DIR)
      .filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
      .map((f) => path.basename(f, '.tsx'))
      .sort()
  } catch (err) {
    console.error(`[component-reference] ERROR: cannot read ${UI_DIR}:`, err.message)
    process.exit(1)
  }

  const known = new Set(Object.values(CATEGORIES).flat())
  const uncategorized = files.filter((name) => !known.has(name))

  const grouped = {}
  for (const [group, names] of Object.entries(CATEGORIES)) {
    grouped[group] = names.filter((name) => files.includes(name))
  }
  if (uncategorized.length) grouped['Uncategorized'] = uncategorized

  if (process.argv.includes('--json')) {
    process.stdout.write(JSON.stringify({ total: files.length, grouped }, null, 2) + '\n')
    return
  }

  console.log(`[component-reference] found ${files.length} UI primitives in src/components/ui\n`)
  for (const [group, names] of Object.entries(grouped)) {
    console.log(`${group} (${names.length})`)
    for (const name of names) console.log(`  @/components/ui/${name}`)
    console.log('')
  }
  if (uncategorized.length) {
    console.error(
      `[component-reference] WARN: ${uncategorized.length} file(s) not categorized — ` +
        `add them to documentation/index.html: ${uncategorized.join(', ')}`,
    )
  }
}

main()
