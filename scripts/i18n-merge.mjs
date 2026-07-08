// Dev-only helper: merge new flat i18n keys into all 8 locale dictionaries.
// Usage: node scripts/i18n-merge.mjs <payload.json>
// payload shape: { "en": { "key": "value" }, "ru": {...}, ... } for every locale.
// Removed before the catalog work is committed — not part of the shipped template.
import { readFileSync, writeFileSync } from 'node:fs'

const LOCALES = ['en', 'ru', 'uk', 'de', 'fr', 'es', 'it', 'pl']
const payload = JSON.parse(readFileSync(process.argv[2], 'utf8'))

for (const loc of LOCALES) {
  const keys = payload[loc]
  if (!keys) {
    console.warn(`[i18n-merge] WARN: no keys for locale ${loc}`)
    continue
  }
  const file = new URL(`../src/locales/${loc}.json`, import.meta.url)
  const dict = JSON.parse(readFileSync(file, 'utf8'))
  let added = 0
  for (const [k, v] of Object.entries(keys)) {
    if (!(k in dict)) added++
    dict[k] = v
  }
  writeFileSync(file, JSON.stringify(dict, null, 2) + '\n')
  console.log(`[i18n-merge] ${loc}: +${added} keys (${Object.keys(keys).length} total in payload)`)
}
