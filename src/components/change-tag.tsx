import { TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Signed-percent change indicator (24h coin/collection change, ranking delta).
 * `pill` — compact tag on a tinted status background; `plain` — inline text
 * with a trend arrow. Both consume the shared --status-* tokens.
 */
export function ChangeTag({
  value,
  variant = "pill",
  className,
}: {
  value: number;
  variant?: "pill" | "plain";
  className?: string;
}) {
  const up = value >= 0;
  const percent = `${up ? "+" : ""}${(value * 100).toFixed(1)}%`;
  if (variant === "plain") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-sm font-medium tabular-nums",
          className,
        )}
        style={{
          color: up ? "var(--status-success-fg)" : "var(--status-error-fg)",
        }}
      >
        {up ? (
          <TrendingUp className="size-3.5" />
        ) : (
          <TrendingDown className="size-3.5" />
        )}
        {percent}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
        !up && "bg-destructive/10 text-destructive",
        className,
      )}
      style={
        up
          ? {
              background: "var(--status-success-bg)",
              color: "var(--status-success-fg)",
            }
          : undefined
      }
    >
      {percent}
    </span>
  );
}
