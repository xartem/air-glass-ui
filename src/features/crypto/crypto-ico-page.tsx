import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rocket } from "lucide-react";

import { api, type Ico, type IcoStatus } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /crypto/ico — token-sale listings as a card grid with raised/goal progress and
 * a live countdown, plus a detail dialog. Reachable with crypto.view.
 */

const STATUS_KIND: Record<IcoStatus, StatusKind> = {
  upcoming: "pending",
  active: "success",
  ended: "archived",
};
const STATUSES: IcoStatus[] = ["upcoming", "active", "ended"];

function raisedPct(ico: Ico): number {
  return ico.goal > 0
    ? Math.min(100, Math.round((ico.raised / ico.goal) * 100))
    : 0;
}

export function CryptoIcoPage() {
  const locale = useLocale();
  const [status, setStatus] = useState<IcoStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const icosQuery = useQuery({
    queryKey: ["crypto", "icos", status],
    queryFn: () =>
      api.crypto.icos({ status: status === "all" ? undefined : status }),
    placeholderData: (previous) => previous,
  });
  const detailQuery = useQuery({
    queryKey: ["crypto", "icos", "detail", selectedId],
    queryFn: () => api.crypto.getIco(selectedId!),
    enabled: selectedId !== null,
  });

  const icos = icosQuery.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title={t("crypto.ico.title")} icon={Rocket} />

      <Panel
        icon={Rocket}
        title={t("crypto.ico.title")}
        description={t("crypto.ico.hint")}
        actions={
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as IcoStatus | "all")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("crypto.ico.filter.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("crypto.ico.filter.all")}</SelectItem>
              {STATUSES.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {t(`crypto.ico_status.${entry}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        contentClassName="p-4"
      >
        {icosQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-52 rounded-2xl" />
            ))}
          </div>
        ) : icosQuery.isError ? (
          <EmptyState
            icon={Rocket}
            title={t("table.error.title")}
            description={t("table.error.description")}
            action={{
              label: t("common.retry"),
              onClick: () => void icosQuery.refetch(),
            }}
          />
        ) : icos.length === 0 ? (
          <EmptyState
            icon={Rocket}
            title={t("crypto.ico.empty")}
            description={t("crypto.ico.empty_hint")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {icos.map((ico) => (
              <button
                key={ico.id}
                type="button"
                onClick={() => setSelectedId(ico.id)}
                className="glass-card flex flex-col gap-3 rounded-2xl p-4 text-start transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-foreground/70"
                      style={{ backgroundColor: ico.logo_color }}
                    >
                      {ico.symbol.slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{ico.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {ico.symbol}
                      </div>
                    </div>
                  </div>
                  <StatusBadge
                    status={STATUS_KIND[ico.status]}
                    label={t(`crypto.ico_status.${ico.status}`)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("crypto.ico.raised")}</span>
                    <span className="tabular-nums">{raisedPct(ico)}%</span>
                  </div>
                  <Progress value={raisedPct(ico)} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                    <span>{formatMoney(ico.raised, ico.currency, locale)}</span>
                    <span>{formatMoney(ico.goal, ico.currency, locale)}</span>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {t("crypto.ico.price")}:{" "}
                    <span className="tabular-nums text-foreground">
                      {formatMoney(ico.price, ico.currency, locale)}
                    </span>
                  </span>
                  <Countdown ico={ico} />
                </div>
              </button>
            ))}
          </div>
        )}
      </Panel>

      <Dialog
        open={selectedId !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <DialogContent>
          {detailQuery.data ? (
            <IcoDetail ico={detailQuery.data} locale={locale} />
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("common.loading")}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Countdown({ ico }: { ico: Ico }) {
  const target = ico.status === "upcoming" ? ico.start_at : ico.end_at;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (ico.status === "ended") {
    return (
      <span className="text-muted-foreground">{t("crypto.ico.closed")}</span>
    );
  }

  const diff = Math.max(0, new Date(target).getTime() - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  const label =
    ico.status === "upcoming"
      ? t("crypto.ico.starts_in")
      : t("crypto.ico.ends_in");

  return (
    <span aria-live="polite" className="tabular-nums text-muted-foreground">
      {label}{" "}
      <span className="text-foreground">
        {days}d {hours}h {minutes}m {seconds}s
      </span>
    </span>
  );
}

function IcoDetail({
  ico,
  locale,
}: {
  ico: Ico;
  locale: ReturnType<typeof useLocale>;
}) {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-foreground/70"
            style={{ backgroundColor: ico.logo_color }}
          >
            {ico.symbol.slice(0, 2)}
          </span>
          <div className="min-w-0">
            <DialogTitle className="truncate">{ico.name}</DialogTitle>
            <DialogDescription>{ico.symbol}</DialogDescription>
          </div>
          <StatusBadge
            status={STATUS_KIND[ico.status]}
            label={t(`crypto.ico_status.${ico.status}`)}
            className="ms-auto"
          />
        </div>
      </DialogHeader>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{ico.description}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatMoney(ico.raised, ico.currency, locale)}</span>
            <span>{formatMoney(ico.goal, ico.currency, locale)}</span>
          </div>
          <Progress value={raisedPct(ico)} />
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("crypto.ico.price")}
            </dt>
            <dd className="tabular-nums">
              {formatMoney(ico.price, ico.currency, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("crypto.ico.countdown")}
            </dt>
            <dd>
              <Countdown ico={ico} />
            </dd>
          </div>
        </dl>
      </div>
    </>
  );
}
