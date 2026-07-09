import { useMemo, useState } from "react";
import { devDebug } from "@/lib/debug";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";

import { api, type TimelineCategory, type TimelineEvent } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineIndicator,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/ui/timeline";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /timeline: an activity timeline demo grouped by day. Uses the shared Timeline
 * primitive; a load-more control reveals earlier events. Mock-driven.
 */

const PAGE_SIZE = 5;

const INDICATOR: Record<
  TimelineCategory,
  "success" | "info" | "warning" | "default"
> = {
  release: "success",
  update: "info",
  meeting: "default",
  note: "warning",
};

export function TimelinePage() {
  const locale = useLocale();
  const [visible, setVisible] = useState(PAGE_SIZE);

  const timelineQuery = useQuery({
    queryKey: ["pages", "timeline"],
    queryFn: api.pages.timeline,
  });
  devDebug("[TimelinePage] query", { status: timelineQuery.status });

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "long" }),
    [locale],
  );
  const timeFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { timeStyle: "short" }),
    [locale],
  );

  const groups = useMemo(() => {
    const rows = (timelineQuery.data ?? []).slice(0, visible);
    const map = new Map<string, TimelineEvent[]>();
    for (const event of rows) {
      const day = event.date.slice(0, 10);
      map.set(day, [...(map.get(day) ?? []), event]);
    }
    return [...map.entries()];
  }, [timelineQuery.data, visible]);

  const total = timelineQuery.data?.length ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title={t("timeline.title")}
        icon={History}
        breadcrumbs={[{ label: t("timeline.title") }]}
      />
      <Panel>
        {timelineQuery.isPending ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : timelineQuery.isError ? (
          <EmptyState
            title={t("table.error.title")}
            description={t("table.error.description")}
          />
        ) : total === 0 ? (
          <EmptyState
            icon={History}
            title={t("timeline.empty.title")}
            description={t("timeline.empty.description")}
          />
        ) : (
          <div className="space-y-6">
            {groups.map(([day, events]) => (
              <div key={day} className="space-y-3">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {dateFormat.format(new Date(day))}
                </h2>
                <Timeline>
                  {events.map((event) => (
                    <TimelineItem key={event.id}>
                      <TimelineIndicator variant={INDICATOR[event.category]} />
                      <TimelineConnector />
                      <TimelineContent>
                        <div className="flex flex-wrap items-center gap-2">
                          <TimelineTitle>{event.title}</TimelineTitle>
                          <Badge variant="outline">
                            {t(`timeline.category.${event.category}`)}
                          </Badge>
                        </div>
                        <TimelineDescription>
                          {event.description}
                        </TimelineDescription>
                        <TimelineTime>
                          {timeFormat.format(new Date(event.date))}
                          {event.actor ? ` · ${event.actor}` : ""}
                        </TimelineTime>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </div>
            ))}
            {visible < total ? (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setVisible((value) => value + PAGE_SIZE)}
                >
                  {t("timeline.loadMore")}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </Panel>
    </div>
  );
}
