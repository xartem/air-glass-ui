import { useEffect, useState } from "react";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Columns3 } from "lucide-react";
import { toast } from "sonner";

import { api, type KanbanBoard, type KanbanCard } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteDateTime } from "@/lib/datetime";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * /kanban (build-demo-screen-catalog): a drag-and-drop board built on dnd-kit.
 * Cards drag within and across columns; the final position is persisted via a
 * mock mutation. Pointer, touch (long-press) and keyboard sensors make it
 * accessible (focus a card, Space to pick up, arrows to move, Space to drop).
 * Reachable with kanban.view.
 */

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function KanbanPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["kanban"], queryFn: api.kanban.get });

  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (query.data) setBoard(query.data);
  }, [query.data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const moveMutation = useMutation({
    mutationFn: ({
      cardId,
      toColumn,
      toIndex,
    }: {
      cardId: string;
      toColumn: string;
      toIndex: number;
    }) => {
      console.debug("[KanbanPage] moveCard", {
        cardId,
        to: toColumn,
        index: toIndex,
      });
      return api.kanban.move(cardId, toColumn, toIndex);
    },
    onSuccess: (data) => {
      setBoard(data);
      queryClient.setQueryData(["kanban"], data);
    },
    onError: () => {
      toast.error(t("common.request_failed"));
      void queryClient.invalidateQueries({ queryKey: ["kanban"] });
    },
  });

  const columnOf = (itemId: string): string | undefined => {
    if (!board) return undefined;
    if (board.columns.some((column) => column.id === itemId)) return itemId;
    return board.columns.find((column) => column.card_ids.includes(itemId))?.id;
  };

  const onDragStart = (event: DragStartEvent) =>
    setActiveId(String(event.active.id));

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !board) return;
    const activeCol = columnOf(String(active.id));
    const overCol = columnOf(String(over.id));
    if (!activeCol || !overCol || activeCol === overCol) return;
    setBoard((current) => {
      if (!current) return current;
      const columns = current.columns.map((column) => ({
        ...column,
        card_ids: [...column.card_ids],
      }));
      const from = columns.find((column) => column.id === activeCol)!;
      const to = columns.find((column) => column.id === overCol)!;
      from.card_ids = from.card_ids.filter((id) => id !== active.id);
      const overIndex = to.card_ids.indexOf(String(over.id));
      const insertAt = overIndex >= 0 ? overIndex : to.card_ids.length;
      to.card_ids.splice(insertAt, 0, String(active.id));
      return { ...current, columns };
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || !board) return;
    const activeCol = columnOf(String(active.id));
    const overCol = columnOf(String(over.id));
    if (!activeCol || !overCol) return;

    let finalBoard = board;
    if (activeCol === overCol && active.id !== over.id) {
      finalBoard = {
        ...board,
        columns: board.columns.map((column) => {
          if (column.id !== activeCol) return column;
          const from = column.card_ids.indexOf(String(active.id));
          const to = column.card_ids.indexOf(String(over.id));
          if (from < 0 || to < 0) return column;
          return { ...column, card_ids: arrayMove(column.card_ids, from, to) };
        }),
      };
      setBoard(finalBoard);
    }

    const target = finalBoard.columns.find((column) => column.id === overCol)!;
    const index = target.card_ids.indexOf(String(active.id));
    moveMutation.mutate({
      cardId: String(active.id),
      toColumn: overCol,
      toIndex: Math.max(0, index),
    });
  };

  const activeCard = activeId && board ? board.cards[activeId] : null;

  if (query.isPending || !board) {
    return (
      <div className="space-y-4">
        <PageHeader title={t("nav.kanban")} icon={Columns3} />
        {query.isError ? (
          <EmptyState
            icon={Columns3}
            title={t("table.error.title")}
            description={t("table.error.description")}
            action={{
              label: t("common.retry"),
              onClick: () => void query.refetch(),
            }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-96 rounded-2xl" />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("nav.kanban")} icon={Columns3} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {board.columns.map((column) => (
            <BoardColumn
              key={column.id}
              id={column.id}
              title={t(column.title_key)}
              cardIds={column.card_ids}
              cards={board.cards}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCard ? <CardBody card={activeCard} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function BoardColumn({
  id,
  title,
  cardIds,
  cards,
}: {
  id: string;
  title: string;
  cardIds: string[];
  cards: Record<string, KanbanCard>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section className="glass-card flex min-h-[8rem] flex-col rounded-2xl p-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <Badge variant="secondary" className="tabular-nums">
          {cardIds.length}
        </Badge>
      </div>
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-24 flex-1 flex-col gap-2 rounded-xl p-1 transition-colors",
            isOver && "bg-primary/5",
          )}
        >
          {cardIds.length === 0 ? (
            <p className="flex flex-1 items-center justify-center py-6 text-center text-xs text-muted-foreground">
              {t("kanban.empty_column")}
            </p>
          ) : (
            cardIds.map((cardId) => (
              <SortableCard key={cardId} card={cards[cardId]!} />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}

function SortableCard({ card }: { card: KanbanCard }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <CardBody card={card} />
    </div>
  );
}

function CardBody({
  card,
  dragging = false,
}: {
  card: KanbanCard;
  dragging?: boolean;
}) {
  const dt = useSiteDateTime();
  return (
    <div
      className={cn(
        "cursor-grab rounded-xl border border-border/50 bg-card p-3 shadow-sm transition-shadow active:cursor-grabbing",
        dragging ? "shadow-xl ring-2 ring-primary" : "hover:shadow-md",
      )}
    >
      <p className="text-sm font-medium">{card.title}</p>
      {card.labels.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {card.labels.map((label) => (
            <Badge key={label} variant="secondary" className="text-[10px]">
              {t(`kanban.label.${label}`)}
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        {card.due_at ? (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <CalendarClock className="size-3.5" />
            {dt.format(card.due_at)}
          </span>
        ) : (
          <span />
        )}
        {card.assignee ? (
          <Avatar className="size-6" title={card.assignee}>
            <AvatarFallback className="text-[10px]">
              {initials(card.assignee)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            {t("kanban.unassigned")}
          </span>
        )}
      </div>
    </div>
  );
}
