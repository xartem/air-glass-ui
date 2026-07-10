import { type ReactNode, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Badge } from "@/components/ui/badge";
import { createDndA11y } from "@/lib/dnd-a11y";
import { cn } from "@/lib/utils";

/*
 * Generic drag-and-drop board built on dnd-kit. Columns hold ordered card ids;
 * a card can be dragged within and across columns. The component is controlled:
 * the parent owns the columns/cards state, gets optimistic reorders through
 * `onColumnsChange` (during drag) and persists the final move via `onMove`.
 * Card content is a render prop so any domain (kanban, CRM deals, …) can reuse
 * the same interaction. Pointer, touch (long-press) and keyboard sensors keep
 * it accessible.
 */

export interface BoardColumn {
  id: string;
  title: ReactNode;
  cardIds: string[];
  /** Optional custom badge; defaults to the card count. */
  badge?: ReactNode;
}

export interface BoardProps<T> {
  columns: BoardColumn[];
  cards: Record<string, T>;
  onColumnsChange: (columns: BoardColumn[]) => void;
  onMove: (cardId: string, toColumn: string, toIndex: number) => void;
  renderCard: (card: T, options: { dragging: boolean }) => ReactNode;
  /** Localized noun for screen-reader announcements (e.g. "card", "deal"). */
  itemLabel: string;
  /** Copy shown in an empty column. */
  emptyColumnLabel?: string;
  /** Grid wrapper class; defaults to a responsive 1→4 column grid. */
  className?: string;
}

export function Board<T>({
  columns,
  cards,
  onColumnsChange,
  onMove,
  renderCard,
  itemLabel,
  emptyColumnLabel,
  className,
}: BoardProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columnOf = (itemId: string): string | undefined => {
    if (columns.some((column) => column.id === itemId)) return itemId;
    return columns.find((column) => column.cardIds.includes(itemId))?.id;
  };

  const onDragStart = (event: DragStartEvent) =>
    setActiveId(String(event.active.id));

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeCol = columnOf(String(active.id));
    const overCol = columnOf(String(over.id));
    if (!activeCol || !overCol || activeCol === overCol) return;
    const next = columns.map((column) => ({
      ...column,
      cardIds: [...column.cardIds],
    }));
    const from = next.find((column) => column.id === activeCol)!;
    const to = next.find((column) => column.id === overCol)!;
    from.cardIds = from.cardIds.filter((id) => id !== active.id);
    const overIndex = to.cardIds.indexOf(String(over.id));
    const insertAt = overIndex >= 0 ? overIndex : to.cardIds.length;
    to.cardIds.splice(insertAt, 0, String(active.id));
    onColumnsChange(next);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const activeCol = columnOf(String(active.id));
    const overCol = columnOf(String(over.id));
    if (!activeCol || !overCol) return;

    let finalColumns = columns;
    if (activeCol === overCol && active.id !== over.id) {
      finalColumns = columns.map((column) => {
        if (column.id !== activeCol) return column;
        const from = column.cardIds.indexOf(String(active.id));
        const to = column.cardIds.indexOf(String(over.id));
        if (from < 0 || to < 0) return column;
        return { ...column, cardIds: arrayMove(column.cardIds, from, to) };
      });
      onColumnsChange(finalColumns);
    }

    const target = finalColumns.find((column) => column.id === overCol)!;
    const index = target.cardIds.indexOf(String(active.id));
    onMove(String(active.id), overCol, Math.max(0, index));
  };

  const activeCard = activeId ? cards[activeId] : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={createDndA11y(itemLabel)}
    >
      <div
        className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-4", className)}
      >
        {columns.map((column) => (
          <BoardColumnView
            key={column.id}
            column={column}
            cards={cards}
            renderCard={renderCard}
            emptyColumnLabel={emptyColumnLabel}
          />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? renderCard(activeCard, { dragging: true }) : null}
      </DragOverlay>
    </DndContext>
  );
}

function BoardColumnView<T>({
  column,
  cards,
  renderCard,
  emptyColumnLabel,
}: {
  column: BoardColumn;
  cards: Record<string, T>;
  renderCard: (card: T, options: { dragging: boolean }) => ReactNode;
  emptyColumnLabel?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <section className="glass-card flex min-h-[8rem] flex-col rounded-2xl p-3">
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-semibold tracking-tight">{column.title}</h2>
        {column.badge ?? (
          <Badge variant="secondary" className="tabular-nums">
            {column.cardIds.length}
          </Badge>
        )}
      </div>
      <SortableContext
        items={column.cardIds}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-24 flex-1 flex-col gap-2 rounded-xl p-1 transition-colors",
            isOver && "bg-primary/5",
          )}
        >
          {column.cardIds.length === 0 ? (
            <p className="flex flex-1 items-center justify-center py-6 text-center text-xs text-muted-foreground">
              {emptyColumnLabel}
            </p>
          ) : (
            column.cardIds.map((cardId) => {
              const card = cards[cardId];
              if (!card) return null;
              return (
                <SortableCard key={cardId} id={cardId}>
                  {renderCard(card, { dragging: false })}
                </SortableCard>
              );
            })
          )}
        </div>
      </SortableContext>
    </section>
  );
}

function SortableCard({ id, children }: { id: string; children: ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
