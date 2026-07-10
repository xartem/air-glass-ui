import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Columns3 } from "lucide-react";
import { toast } from "sonner";

import { api, type KanbanBoard, type KanbanCard } from "@/api";
import { Board, type BoardColumn } from "@/components/board/board";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteDateTime } from "@/lib/datetime";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * /kanban (build-demo-screen-catalog): a drag-and-drop board built on the shared
 * Board component (dnd-kit). Cards drag within and across columns; the final
 * position is persisted via a mock mutation. Reachable with kanban.view.
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

  useEffect(() => {
    if (query.data) setBoard(query.data);
  }, [query.data]);

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

  const columns: BoardColumn[] = board.columns.map((column) => ({
    id: column.id,
    title: t(column.title_key),
    cardIds: column.card_ids,
  }));

  const setColumns = (next: BoardColumn[]) => {
    setBoard((current) =>
      current
        ? {
            ...current,
            columns: current.columns.map((column) => {
              const updated = next.find((item) => item.id === column.id);
              return updated
                ? { ...column, card_ids: updated.cardIds }
                : column;
            }),
          }
        : current,
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t("nav.kanban")} icon={Columns3} />
      <Board
        columns={columns}
        cards={board.cards}
        onColumnsChange={setColumns}
        onMove={(cardId, toColumn, toIndex) =>
          moveMutation.mutate({ cardId, toColumn, toIndex })
        }
        renderCard={(card, { dragging }) => (
          <CardBody card={card} dragging={dragging} />
        )}
        itemLabel={t("dnd.item.card")}
        emptyColumnLabel={t("kanban.empty_column")}
      />
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
