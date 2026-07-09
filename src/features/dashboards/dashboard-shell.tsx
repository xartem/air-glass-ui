import { useState, type ComponentType, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChartLine } from "lucide-react";

import {
  api,
  type DashboardPayloadMap,
  type DashboardVertical,
  type Period,
} from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { devDebug } from "@/lib/debug";
import { t } from "@/lib/i18n";

/*
 * Shared shell for the vertical dashboards: title + subtitle + period picker,
 * one query per page keyed ["dashboards", vertical, period], and the
 * skeleton / whole-page-error (retry) states. Each vertical just renders its
 * widgets from the typed payload passed to children.
 */

const PERIODS: Period[] = ["week", "month", "quarter"];

export function DashboardShell<V extends DashboardVertical>({
  vertical,
  icon,
  title,
  subtitle,
  children,
}: {
  vertical: V;
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: (data: DashboardPayloadMap[V]) => ReactNode;
}) {
  const [period, setPeriod] = useState<Period>("month");

  devDebug(`[${vertical}Dashboard] period`, period);

  const query = useQuery({
    queryKey: ["dashboards", vertical, period],
    queryFn: () => api.dashboards.get(vertical, period),
    placeholderData: (previous) => previous,
  });

  const data = query.data;

  return (
    <div className="space-y-4">
      <PageHeader title={title} icon={icon} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : (
          <span />
        )}
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(value) => value && setPeriod(value as Period)}
          variant="outline"
          size="sm"
          aria-label={t("dashboard.period.label")}
        >
          {PERIODS.map((value) => (
            <ToggleGroupItem key={value} value={value}>
              {t(`dashboard.period.${value}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {query.isPending ? (
        <DashboardSkeleton />
      ) : query.isError || !data ? (
        <Panel contentClassName="py-10">
          <EmptyState
            icon={ChartLine}
            title={t("table.error.title")}
            description={t("table.error.description")}
            action={{
              label: t("common.retry"),
              onClick: () => void query.refetch(),
            }}
          />
        </Panel>
      ) : (
        children(data)
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl xl:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
