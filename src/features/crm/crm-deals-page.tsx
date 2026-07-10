import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, Rows3, Target } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { api, type Deal, type DealStage } from "@/api";
import { Board, type BoardColumn } from "@/components/board/board";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /crm/deals — sales pipeline as a drag-and-drop board (shared Board) with a
 * table toggle and header KPIs. Moving a card persists the deal stage
 * optimistically. Reachable with crm.deals.
 */

const STAGES: DealStage[] = ["new", "qualified", "proposal", "negotiation", "won"];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export function CrmDealsPage() {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"board" | "table">("board");
  const [deals, setDeals] = useState<Deal[]>([]);

  const query = useQuery({ queryKey: ["crm", "deals"], queryFn: api.crm.deals.list });

  useEffect(() => {
    if (query.data) setDeals(query.data);
  }, [query.data]);

  const moveMutation = useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: DealStage }) => {
      console.debug("[CrmDealsPage] move", { id, stage });
      return api.crm.deals.move(id, stage);
    },
    onError: () => {
      toast.error(t("common.request_failed"));
      void queryClient.invalidateQueries({ queryKey: ["crm", "deals"] });
    },
  });

  const currency = deals[0]?.currency ?? "USD";
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const weighted = deals.reduce(
    (sum, deal) => sum + (deal.value * deal.probability) / 100,
    0,
  );
  const won = deals
    .filter((deal) => deal.stage === "won")
    .reduce((sum, deal) => sum + deal.value, 0);

  const cards = useMemo<Record<string, Deal>>(
    () => Object.fromEntries(deals.map((deal) => [String(deal.id), deal])),
    [deals],
  );
  const columns: BoardColumn[] = STAGES.map((stage) => ({
    id: stage,
    title: t(`crm.deals.stage.${stage}`),
    cardIds: deals.filter((deal) => deal.stage === stage).map((deal) => String(deal.id)),
  }));

  const setColumns = (next: BoardColumn[]) => {
    const byId = new Map(deals.map((deal) => [String(deal.id), deal]));
    const reordered: Deal[] = [];
    next.forEach((column) =>
      column.cardIds.forEach((cardId) => {
        const deal = byId.get(cardId);
        if (deal) reordered.push({ ...deal, stage: column.id as DealStage });
      }),
    );
    setDeals(reordered);
  };

  const tableColumns = useMemo<ColumnDef<Deal>[]>(
    () => [
      {
        id: "title",
        header: t("crm.deals.col.title"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.title}</span>
        ),
      },
      {
        id: "company",
        header: t("crm.deals.col.company"),
        meta: { className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.company}</span>
        ),
      },
      {
        id: "stage",
        header: t("crm.deals.col.stage"),
        cell: ({ row }) => t(`crm.deals.stage.${row.original.stage}`),
      },
      {
        id: "value",
        header: t("crm.deals.col.value"),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatMoney(row.original.value, row.original.currency, locale)}
          </span>
        ),
      },
    ],
    [locale],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("crm.deals.title")}
        icon={Target}
        secondaryActions={[
          {
            label: view === "board" ? t("crm.deals.table_view") : t("crm.deals.board_view"),
            onClick: () => setView(view === "board" ? "table" : "board"),
            icon: view === "board" ? <Rows3 /> : <LayoutGrid />,
          },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label={t("crm.deals.kpi.total")}
          value={formatMoney(totalValue, currency, locale)}
        />
        <StatTile
          label={t("crm.deals.kpi.weighted")}
          value={formatMoney(weighted, currency, locale)}
        />
        <StatTile
          label={t("crm.deals.kpi.won")}
          value={formatMoney(won, currency, locale)}
        />
      </div>

      {query.isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-80 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <Panel>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {t("table.error.description")}
            </p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        </Panel>
      ) : view === "board" ? (
        <Board
          columns={columns}
          cards={cards}
          onColumnsChange={setColumns}
          onMove={(cardId, toColumn) =>
            moveMutation.mutate({
              id: Number(cardId),
              stage: toColumn as DealStage,
            })
          }
          renderCard={(deal) => <DealCard deal={deal} />}
          itemLabel={t("crm.deals.item")}
          emptyColumnLabel={t("crm.deals.empty_stage")}
          className="xl:grid-cols-5"
        />
      ) : (
        <Panel contentClassName="p-2 sm:p-3">
          <DataTable<Deal>
            label={t("crm.deals.title")}
            columns={tableColumns}
            data={deals}
            state="ready"
            getRowId={(row) => String(row.id)}
          />
        </Panel>
      )}
    </div>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  const locale = useLocale();
  return (
    <div className="cursor-grab rounded-xl border border-border/50 bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing">
      <p className="text-sm font-medium">{deal.title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{deal.company}</p>
      <p className="mt-2 text-sm font-semibold tabular-nums">
        {formatMoney(deal.value, deal.currency, locale)}
      </p>
      <div className="mt-2 space-y-1">
        <Progress value={deal.probability} />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {deal.probability}%
          </span>
          <Avatar className="size-6" title={deal.owner}>
            <AvatarFallback className="text-[10px]">
              {initials(deal.owner)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
