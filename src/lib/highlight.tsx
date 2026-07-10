import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * Highlight (W5 gap util): wraps every case-insensitive match of `query` inside
 * `text` in a token-styled <mark>. Operates purely on React text nodes (never
 * dangerouslySetInnerHTML), so it is inherently safe against HTML injection.
 * The regex source is escaped so user queries can't break the pattern.
 */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function Highlight({
  text,
  query,
  className,
}: {
  text: string;
  query: string;
  /** Extra classes on the <mark> (defaults to a token-styled highlight). */
  className?: string;
}): ReactNode {
  const needle = query.trim();
  if (!needle) return text;

  // Capturing split → even indices are non-matches, odd indices are matches.
  const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, "ig"));
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark
        key={index}
        className={cn(
          "rounded-[3px] bg-primary/20 px-0.5 text-inherit",
          className,
        )}
      >
        {part}
      </mark>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}
