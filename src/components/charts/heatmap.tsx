import { useMemo } from "react";

/*
 * Grid heatmap (W5 charts showcase). A lightweight, dependency-free matrix whose
 * cell intensity maps a value onto a single --chart-* token via color-mix — so
 * it stays on-palette in both light and dark skins. No Recharts primitive covers
 * a categorical heatmap, so this is a custom composition built on CSS grid.
 */

export interface HeatmapProps {
  /** Column (x) axis labels, left → right. */
  xLabels: readonly string[];
  /** Row (y) axis labels, top → bottom. */
  yLabels: readonly string[];
  /** Matrix of values: values[row][col], row aligned to yLabels, col to xLabels. */
  values: readonly (readonly number[])[];
  /** --chart-* token the intensity ramps toward. */
  colorToken?: string;
  /** Accessible name for the whole grid (WCAG 1.1.1). */
  ariaLabel: string;
  /** Optional value formatter for cell titles + legend bounds. */
  formatValue?: (value: number) => string;
}

/** Lowest cell mix % so a zero-ish cell is still faintly visible. */
const MIN_MIX = 6;
const MAX_MIX = 100;

export function Heatmap({
  xLabels,
  yLabels,
  values,
  colorToken = "var(--chart-1)",
  ariaLabel,
  formatValue,
}: HeatmapProps) {
  const { max, min } = useMemo(() => {
    let hi = -Infinity;
    let lo = Infinity;
    for (const row of values) {
      for (const v of row) {
        if (v > hi) hi = v;
        if (v < lo) lo = v;
      }
    }
    if (hi === -Infinity) hi = 1;
    if (lo === Infinity) lo = 0;
    return { max: hi, min: lo };
  }, [values]);

  const span = Math.max(1, max - min);
  const fmt = (v: number) => (formatValue ? formatValue(v) : String(v));

  const mixFor = (value: number) => {
    const ratio = (value - min) / span;
    return MIN_MIX + ratio * (MAX_MIX - MIN_MIX);
  };

  return (
    <figure className="w-full" role="group" aria-label={ariaLabel}>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-xs">
          <caption className="sr-only">{ariaLabel}</caption>
          <thead>
            <tr>
              <th className="w-16" aria-hidden />
              {xLabels.map((label) => (
                <th
                  key={label}
                  scope="col"
                  className="px-1 pb-1 text-center font-medium text-muted-foreground"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yLabels.map((yLabel, row) => (
              <tr key={yLabel}>
                <th
                  scope="row"
                  className="pr-2 text-right font-medium text-muted-foreground whitespace-nowrap"
                >
                  {yLabel}
                </th>
                {xLabels.map((xLabel, col) => {
                  const value = values[row]?.[col] ?? 0;
                  const mix = mixFor(value);
                  return (
                    <td key={xLabel} className="p-0">
                      <div
                        className="flex h-9 min-w-9 items-center justify-center rounded-md tabular-nums"
                        title={`${yLabel} · ${xLabel}: ${fmt(value)}`}
                        style={{
                          background: `color-mix(in srgb, ${colorToken} ${mix}%, transparent)`,
                          color:
                            mix > 55
                              ? "var(--background)"
                              : "var(--muted-foreground)",
                        }}
                      >
                        {value}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <figcaption className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>{fmt(min)}</span>
        <span
          aria-hidden
          className="h-2.5 w-28 rounded-full"
          style={{
            background: `linear-gradient(to right, color-mix(in srgb, ${colorToken} ${MIN_MIX}%, transparent), ${colorToken})`,
          }}
        />
        <span>{fmt(max)}</span>
      </figcaption>
    </figure>
  );
}
