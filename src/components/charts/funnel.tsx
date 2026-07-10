/*
 * Shared horizontal-bar funnel (crm deal stages, jobs candidate pipeline).
 * Extracted from the analytics funnel markup — each step is a token-filled bar
 * scaled to the first (widest) step; no heavy chart dependency.
 */

export function Funnel({
  steps,
  formatValue,
}: {
  steps: ReadonlyArray<{ label: string; value: number }>;
  formatValue?: (value: number) => string;
}) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <ol className="space-y-2.5">
      {steps.map((step, index) => {
        const pct = Math.round((step.value / top) * 100);
        return (
          <li key={step.label}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate">{step.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatValue ? formatValue(step.value) : step.value} · {pct}%
              </span>
            </div>
            <div className="mt-1 h-6 w-full overflow-hidden rounded-lg bg-muted">
              <div
                className="flex h-full items-center rounded-lg transition-[width] duration-500"
                style={{
                  width: `${pct}%`,
                  background: `var(--chart-${(index % 5) + 1})`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
