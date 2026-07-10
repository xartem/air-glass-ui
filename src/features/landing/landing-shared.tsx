/*
 * Shared landing helpers (W6) used by the One Page, NFT and Job landings — a common
 * section-heading rhythm and a stats band. Purely presentational, token-styled.
 */

/** Centered section heading + optional subtitle — the shared band rhythm across landings. */
export function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-2 text-center">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="text-sm text-muted-foreground sm:text-base">{subtitle}</p>
      ) : null}
    </div>
  );
}

/** A glass band of headline figures (volume / items / creators …). */
export function StatBand({
  stats,
}: {
  stats: { value: string; label: string }[];
}) {
  return (
    <div className="glass-card grid grid-cols-2 gap-6 rounded-3xl p-8 sm:grid-cols-4 sm:p-10">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <div className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {stat.value}
          </div>
          <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
