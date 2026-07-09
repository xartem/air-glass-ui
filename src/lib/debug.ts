/** Dev-only diagnostic logger. Stripped from production builds so the template
 * ships console-clean (the ThemeForest bar), while keeping verbose data-flow
 * traces during development. Use at data-flow boundaries only — never for
 * user-facing messaging. Mirrors the `if (import.meta.env.DEV) console.debug`
 * convention already used in query.ts / auth.tsx. */
export function devDebug(...args: unknown[]): void {
  if (import.meta.env.DEV) console.debug(...args);
}
