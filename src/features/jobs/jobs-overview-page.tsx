import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Check, MapPin } from "lucide-react";
import { Link, useParams } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";

import { api, type JobApplicant } from "@/api";
import { DataTable } from "@/components/data-table";
import { ErrorPage } from "@/components/error-page";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSiteDateTime } from "@/lib/datetime";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

import {
  CANDIDATE_STAGE_KIND,
  JOB_STATUS_KIND,
  formatSalaryRange,
} from "./jobs-shared";

/*
 * /jobs/:id — a single posting: header with company/location/type/salary, tabbed
 * description, requirements and applicants, plus an apply panel aside. Not-found
 * renders the 404 archetype. Reachable with jobs.view.
 */

export function JobsOverviewPage() {
  const params = useParams();
  const id = Number(params.id);
  const locale = useLocale();
  const dt = useSiteDateTime();

  console.debug("[JobsOverview] query", { id });
  const jobQuery = useQuery({
    queryKey: ["jobs", "detail", id],
    queryFn: () => api.jobs.get(id),
    enabled: Number.isFinite(id),
    retry: false,
  });
  const applicantsQuery = useQuery({
    queryKey: ["jobs", "applicants", id],
    queryFn: () => api.jobs.applicants(id),
    enabled: Number.isFinite(id),
  });

  const applicantColumns = useMemo<ColumnDef<JobApplicant>[]>(
    () => [
      {
        id: "name",
        header: t("jobs.detail.applicant.name"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "role",
        header: t("jobs.detail.applicant.role"),
        meta: { className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.role}</span>
        ),
      },
      {
        id: "rating",
        header: t("jobs.detail.applicant.rating"),
        meta: { className: "max-md:hidden" },
        cell: ({ row }) => (
          <Rating value={row.original.rating} readOnly size="sm" />
        ),
      },
      {
        id: "stage",
        header: t("jobs.detail.applicant.stage"),
        cell: ({ row }) => (
          <StatusBadge
            status={CANDIDATE_STAGE_KIND[row.original.stage]}
            label={t(`jobs.stage.${row.original.stage}`)}
          />
        ),
      },
      {
        id: "applied",
        header: t("jobs.detail.applicant.applied"),
        meta: { className: "max-lg:hidden" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {dt.format(row.original.applied_at)}
          </span>
        ),
      },
    ],
    [dt],
  );

  if (jobQuery.isError) return <ErrorPage code="404" />;

  if (jobQuery.isPending) {
    return (
      <div className="space-y-4">
        <PageHeader title={t("jobs.detail.title")} icon={Briefcase} />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const job = jobQuery.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title={job.title}
        icon={Briefcase}
        breadcrumbs={[
          { label: t("jobs.list.title"), href: "/jobs/list" },
          { label: job.title },
        ]}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">
                  {job.title}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span>{job.company}</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {job.location}
                  </span>
                  <Badge variant="outline">{t(`jobs.type.${job.type}`)}</Badge>
                </div>
                <div className="text-sm font-medium tabular-nums">
                  {formatSalaryRange(
                    job.salary_min,
                    job.salary_max,
                    job.currency,
                    locale,
                  )}
                </div>
              </div>
              <StatusBadge
                status={JOB_STATUS_KIND[job.status]}
                label={t(`jobs.status.${job.status}`)}
              />
            </div>
          </Panel>

          <Panel contentClassName="p-2 sm:p-4">
            <Tabs defaultValue="description">
              <TabsList>
                <TabsTrigger value="description">
                  {t("jobs.detail.tab.description")}
                </TabsTrigger>
                <TabsTrigger value="requirements">
                  {t("jobs.detail.tab.requirements")}
                </TabsTrigger>
                <TabsTrigger value="applicants">
                  {t("jobs.detail.tab.applicants")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="pt-4">
                <div
                  className="prose prose-sm max-w-none text-muted-foreground [&_strong]:text-foreground"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
                {job.benefits.length > 0 ? (
                  <div className="mt-6">
                    <h3 className="mb-2 text-sm font-semibold">
                      {t("jobs.detail.benefits")}
                    </h3>
                    <ul className="space-y-1.5">
                      {job.benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="requirements" className="pt-4">
                <ul className="space-y-2">
                  {job.requirements.map((requirement) => (
                    <li
                      key={requirement}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {requirement}
                    </li>
                  ))}
                </ul>
                {job.responsibilities.length > 0 ? (
                  <div className="mt-6">
                    <h3 className="mb-2 text-sm font-semibold">
                      {t("jobs.detail.responsibilities")}
                    </h3>
                    <ul className="space-y-2">
                      {job.responsibilities.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="applicants" className="pt-4">
                <DataTable<JobApplicant>
                  label={t("jobs.detail.tab.applicants")}
                  columns={applicantColumns}
                  data={applicantsQuery.data ?? []}
                  state={
                    applicantsQuery.isPending
                      ? "loading"
                      : applicantsQuery.isError
                        ? "error"
                        : (applicantsQuery.data?.length ?? 0) === 0
                          ? "empty"
                          : "ready"
                  }
                  getRowId={(row) => String(row.id)}
                  onRetry={() => void applicantsQuery.refetch()}
                  emptyState={{
                    title: t("jobs.detail.no_applicants"),
                    description: t("jobs.detail.no_applicants_hint"),
                  }}
                />
              </TabsContent>
            </Tabs>
          </Panel>
        </div>

        <Panel
          title={t("jobs.detail.apply_title")}
          description={t("jobs.detail.apply_hint")}
          className="lg:sticky lg:top-4"
        >
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">
                {t("jobs.list.col.department")}
              </dt>
              <dd>{t(`jobs.dept.${job.department}`)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">
                {t("jobs.list.col.applicants")}
              </dt>
              <dd className="tabular-nums">{job.applicants}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">
                {t("jobs.list.col.posted")}
              </dt>
              <dd>{dt.format(job.posted_at)}</dd>
            </div>
          </dl>
          <Button className="mt-4 w-full" asChild>
            <Link to="/jobs/application">{t("jobs.list.apply")}</Link>
          </Button>
        </Panel>
      </div>
    </div>
  );
}
