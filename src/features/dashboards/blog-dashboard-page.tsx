import { Link } from "react-router";
import {
  FileText,
  Grid3x3,
  MessageSquare,
  Newspaper,
  TrendingUp,
  Trophy,
} from "lucide-react";

import type { BlogDashboardPayload } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { Panel } from "@/components/panel";
import { devDebug } from "@/lib/debug";
import { t } from "@/lib/i18n";
import { formatNumber } from "@/lib/money";
import { useLocale } from "@/lib/use-locale";
import { DashboardShell } from "./dashboard-shell";
import { Donut } from "@/components/charts/donut";
import { Heatmap } from "@/components/charts/heatmap";
import { TrendChart } from "@/components/charts/trend-chart";
import { KpiTile, Leaderboard, MonogramThumb } from "./widgets";

/** Weekday column labels for the engagement heatmap, Mon → Sun (reuses calendar keys). */
const WEEKDAY_KEYS = [1, 2, 3, 4, 5, 6, 0];

/*
 * Blog dashboard: content performance for a period. KPI row + views trend +
 * category split, then top posts, recent comments and an author leaderboard.
 */

export function BlogDashboardPage() {
  const locale = useLocale();

  return (
    <DashboardShell
      vertical="blog"
      icon={Newspaper}
      title={t("dash.blog.title")}
      subtitle={t("dash.blog.subtitle")}
    >
      {(data: BlogDashboardPayload) => {
        const maxViews = Math.max(
          1,
          ...data.topPosts.map((post) => post.views),
        );
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiTile
                label={t("dash.blog.kpi.posts")}
                kpi={data.kpis.posts}
                format="count"
              />
              <KpiTile
                label={t("dash.blog.kpi.views")}
                kpi={data.kpis.views}
                format="count"
              />
              <KpiTile
                label={t("dash.blog.kpi.subscribers")}
                kpi={data.kpis.subscribers}
                format="count"
              />
              <KpiTile
                label={t("dash.blog.kpi.comments")}
                kpi={data.kpis.comments}
                format="count"
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <Panel
                  icon={TrendingUp}
                  title={t("dash.blog.views.title")}
                  description={t("dash.blog.views.hint")}
                >
                  {data.views.length === 0 ? (
                    <EmptyState title={t("table.empty.title")} />
                  ) : (
                    <TrendChart
                      data={data.views}
                      variant="line"
                      seriesList={[
                        {
                          key: "value",
                          label: t("dash.blog.views.title"),
                          color: "var(--chart-1)",
                        },
                      ]}
                      ariaLabel={t("dash.blog.views.title")}
                      formatValue={(value) => formatNumber(value, locale)}
                    />
                  )}
                </Panel>
              </div>
              <Panel
                title={t("dash.blog.categories.title")}
                description={t("dash.blog.categories.hint")}
              >
                {data.categories.length === 0 ? (
                  <EmptyState title={t("table.empty.title")} />
                ) : (
                  <Donut
                    data={data.categories.map((row) => ({
                      label: t(`dash.blog.category.${row.label}`),
                      value: row.value,
                    }))}
                    ariaLabel={t("dash.blog.categories.title")}
                    formatValue={(value) => formatNumber(value, locale)}
                  />
                )}
              </Panel>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <Panel
                icon={FileText}
                title={t("dash.blog.topPosts.title")}
                description={t("dash.blog.topPosts.hint")}
              >
                {data.topPosts.length === 0 ? (
                  <EmptyState title={t("table.empty.title")} />
                ) : (
                  <ul className="space-y-3">
                    {data.topPosts.map((post) => (
                      <li key={post.id} className="flex items-center gap-3">
                        <MonogramThumb seed={post.title} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2 text-sm">
                            <Link
                              to={`/blog/${post.id}`}
                              onClick={() =>
                                devDebug("[blogDashboard] open post", post.id)
                              }
                              className="min-w-0 truncate font-medium hover:underline"
                            >
                              {post.title}
                            </Link>
                            <span className="shrink-0 tabular-nums">
                              {formatNumber(post.views, locale)}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-[width] duration-500"
                              style={{
                                width: `${Math.round((post.views / maxViews) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
              <Panel
                icon={MessageSquare}
                title={t("dash.blog.comments.title")}
                description={t("dash.blog.comments.hint")}
              >
                {data.comments.length === 0 ? (
                  <EmptyState title={t("table.empty.title")} />
                ) : (
                  <ul className="divide-y divide-[var(--glass-border)]">
                    {data.comments.map((comment) => (
                      <li
                        key={comment.id}
                        className="py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-medium">
                            {comment.author}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                            {new Date(comment.at).toLocaleDateString(locale)}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {comment.excerpt}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
              <Panel
                icon={Trophy}
                title={t("dash.blog.authors.title")}
                description={t("dash.blog.authors.hint")}
              >
                {data.authors.length === 0 ? (
                  <EmptyState title={t("table.empty.title")} />
                ) : (
                  <Leaderboard
                    rows={data.authors}
                    format="count"
                    unit={t("dash.blog.authors.viewsUnit")}
                  />
                )}
              </Panel>
            </div>

            <Panel
              icon={Grid3x3}
              title={t("dash.blog.engagement.title")}
              description={t("dash.blog.engagement.hint")}
            >
              <Heatmap
                xLabels={WEEKDAY_KEYS.map((day) =>
                  t(`calendar.weekday.${day}`),
                )}
                yLabels={data.engagement.weeks}
                values={data.engagement.values}
                ariaLabel={t("dash.blog.engagement.title")}
              />
            </Panel>
          </>
        );
      }}
    </DashboardShell>
  );
}
