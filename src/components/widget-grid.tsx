import { createContext, type ReactNode } from 'react'

import type { WidgetSize } from '@/api'
import { cn } from '@/lib/utils'

/*
 * WidgetGrid (UI:dashboard §2): 12-column CSS grid on xl, 6 on tablet, 1 on
 * mobile. Size is a CONTENT TIER (D:dashboard §4) that also maps to a span:
 * sm = 3/12 (half on tablet), md = 6/12, lg = 9/12, xl = full row.
 *
 * `masonry` mode (D:dashboard §4): cards are content-height and rows do NOT
 * stretch to the tallest neighbor. A tiny `grid-auto-rows` track + a per-card
 * `grid-row: span N` (measured in WidgetCardFrame) + `grid-auto-flow: dense`
 * pack uneven-height cards tightly — no empty tails under a sparse widget.
 * Off for the customize screen so dnd stays predictable (DOM order).
 */

export const WIDGET_SPAN: Record<WidgetSize, string> = {
  sm: 'md:col-span-3 xl:col-span-3',
  md: 'md:col-span-6 xl:col-span-6',
  lg: 'md:col-span-6 xl:col-span-9',
  xl: 'md:col-span-6 xl:col-span-12',
}

/** Masonry granularity: 8px row track, 16px reserved as the inter-card vertical gap. */
export const MASONRY_ROW = 8
export const MASONRY_GAP = 16

/** True inside a masonry grid → WidgetCardFrame self-measures its row span. */
export const MasonryContext = createContext(false)

export function WidgetGrid({
  children,
  className,
  masonry = false,
}: {
  children: ReactNode
  className?: string
  masonry?: boolean
}) {
  return (
    <MasonryContext.Provider value={masonry}>
      <div
        data-slot="widget-grid"
        className={cn(
          'grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12',
          // Masonry drives row spacing through the span math (rowGap 0); a plain grid uses gap-4.
          masonry ? 'gap-x-4' : 'gap-4',
          className,
        )}
        style={
          masonry
            ? { gridAutoRows: `${MASONRY_ROW}px`, gridAutoFlow: 'row dense', rowGap: 0 }
            : undefined
        }
      >
        {children}
      </div>
    </MasonryContext.Provider>
  )
}
