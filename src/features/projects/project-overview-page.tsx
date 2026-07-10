import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckSquare,
  CircleDollarSign,
  Clock,
  FileText,
  FolderKanban,
  Users,
} from "lucide-react";
import { useParams } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";

import {
  api,
  type ProjectStatus,
  type ProjectTaskRow,
  type TaskStatus,
} from "@/api";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineIndicator,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/ui/timeline";
import { useSiteDateTime } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /projects/:id — single-project workspace: header, KPI tiles and Overview /
 * Tasks / Files / Activity tabs with a team aside. Reachable with projects.view.
 */

const STATUS_KIND: Record<ProjectStatus, StatusKind> = {
  planning: "info",
  active: "success",
  on_hold: "pending",
  completed: "published",
};

const TASK_STATUS_KIND: Record<TaskStatus, StatusKind> = {
  todo: "pending",
  in_progress: "info",
  review: "pending",
  done: "success",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-card flex items-center gap-3 rounded-2xl p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <div className="text-lg font-semibold tabular-nums">{value}</div>
        <div className="truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectOverviewPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const locale = useLocale();
  const dt = useSiteDateTime();

  const projectQuery = useQuery({
    queryKey: ["projects", "detail", projectId],
    queryFn: () => api.projects.get(projectId),
  });
  const tasksQuery = useQuery({
    queryKey: ["projects", "tasks", projectId],
    queryFn: () => api.projects.tasks(projectId),
  });
  const filesQuery = useQuery({
    queryKey: ["projects", "files", projectId],
    queryFn: () => api.projects.files(projectId),
  });

  console.debug("[ProjectOverviewPage] load", { id: projectId });

  const taskColumns = useMemo<ColumnDef<ProjectTaskRow>[]>(
    () => [
      {
        id: "title",
        header: t("projects.detail.task.title"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.title}</span>
        ),
      },
      {
        id: "assignee",
        header: t("projects.detail.task.assignee"),
        meta: { className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.assignee}</span>
        ),
      },
      {
        id: "status",
        header: t("projects.detail.task.status"),
        cell: ({ row }) => (
          <StatusBadge
            status={TASK_STATUS_KIND[row.original.status]}
            label={t(`tasks.status.${row.original.status}`)}
          />
        ),
      },
    ],
    [],
  );

  if (projectQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={t("projects.detail.title")}
          icon={FolderKanban}
          breadcrumbs={[
            { label: t("nav.projects"), href: "/projects" },
            { label: t("projects.detail.title") },
          ]}
        />
        <Panel>
          <div className="py-10 text-center text-sm text-muted-foreground">
            {t("projects.detail.not_found")}
          </div>
        </Panel>
      </div>
    );
  }

  const project = projectQuery.data;
  const daysLeft = project
    ? Math.max(
        0,
        Math.round(
          (Date.parse(project.deadline) - Date.now()) / (24 * 3600 * 1000),
        ),
      )
    : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title={project?.name ?? t("projects.detail.title")}
        icon={FolderKanban}
        breadcrumbs={[
          { label: t("nav.projects"), href: "/projects" },
          { label: project?.name ?? "…" },
        ]}
        secondaryActions={[
          {
            label: t("common.back"),
            href: "/projects",
            icon: <ArrowLeft className="rtl:-scale-x-100" />,
          },
        ]}
      />

      {!project ? (
        <Skeleton className="h-72" />
      ) : (
        <>
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {project.name}
                  </h2>
                  <StatusBadge
                    status={STATUS_KIND[project.status]}
                    label={t(`projects.status.${project.status}`)}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {project.client}
                </div>
              </div>
              <div className="w-full max-w-xs space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("projects.col.progress")}</span>
                  <span className="tabular-nums">{project.progress}%</span>
                </div>
                <Progress value={project.progress} />
              </div>
            </div>
          </Panel>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              icon={CheckSquare}
              label={t("projects.detail.kpi.tasks")}
              value={`${project.tasks_done}/${project.tasks_total}`}
            />
            <StatTile
              icon={CircleDollarSign}
              label={t("projects.detail.kpi.budget")}
              value={formatMoney(project.budget_used, project.currency, locale)}
            />
            <StatTile
              icon={Clock}
              label={t("projects.detail.kpi.days_left")}
              value={String(daysLeft)}
            />
            <StatTile
              icon={Users}
              label={t("projects.detail.kpi.team")}
              value={String(project.team.length)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
            <Panel contentClassName="p-0">
              <Tabs defaultValue="overview">
                <TabsList className="m-4 mb-0 flex-wrap">
                  <TabsTrigger value="overview">
                    {t("projects.detail.tab.overview")}
                  </TabsTrigger>
                  <TabsTrigger value="tasks">
                    {t("projects.detail.tab.tasks")}
                  </TabsTrigger>
                  <TabsTrigger value="files">
                    {t("projects.detail.tab.files")}
                  </TabsTrigger>
                  <TabsTrigger value="activity">
                    {t("projects.detail.tab.activity")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 p-5">
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {project.description}
                  </p>
                  <div>
                    <h3 className="mb-3 text-sm font-semibold">
                      {t("projects.detail.milestones")}
                    </h3>
                    <Timeline>
                      {project.milestones.map((milestone) => (
                        <TimelineItem key={milestone.id}>
                          <TimelineIndicator
                            variant={milestone.done ? "success" : "default"}
                          />
                          <TimelineConnector />
                          <TimelineContent>
                            <TimelineTitle>{milestone.title}</TimelineTitle>
                            <TimelineTime>{dt.format(milestone.due)}</TimelineTime>
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  </div>
                </TabsContent>

                <TabsContent value="tasks" className="p-3">
                  <DataTable<ProjectTaskRow>
                    label={t("projects.detail.tab.tasks")}
                    columns={taskColumns}
                    data={tasksQuery.data ?? []}
                    state={
                      tasksQuery.isPending
                        ? "loading"
                        : tasksQuery.isError
                          ? "error"
                          : "ready"
                    }
                    getRowId={(row) => String(row.id)}
                    onRetry={() => void tasksQuery.refetch()}
                  />
                </TabsContent>

                <TabsContent value="files" className="p-5">
                  {filesQuery.isPending ? (
                    <Skeleton className="h-32" />
                  ) : (
                    <ul className="divide-y divide-border/50">
                      {(filesQuery.data ?? []).map((file) => (
                        <li
                          key={file.id}
                          className="flex items-center justify-between gap-3 py-2.5"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <FileText className="size-4 shrink-0 text-muted-foreground" />
                            <span className="truncate text-sm">{file.name}</span>
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                            {formatBytes(file.size)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>

                <TabsContent value="activity" className="p-5">
                  <Timeline>
                    {project.activity.map((entry) => (
                      <TimelineItem key={entry.id}>
                        <TimelineIndicator variant="info" />
                        <TimelineConnector />
                        <TimelineContent>
                          <TimelineTitle>{entry.text}</TimelineTitle>
                          <TimelineTime>{dt.format(entry.at)}</TimelineTime>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                </TabsContent>
              </Tabs>
            </Panel>

            <Panel title={t("projects.detail.team")} className="self-start">
              <ul className="space-y-3">
                {project.team.map((member) => (
                  <li key={member.id} className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">
                        {initials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.name}</span>
                  </li>
                ))}
              </ul>
              {project.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/50 pt-4">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
