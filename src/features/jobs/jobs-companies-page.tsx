import { useQuery } from "@tanstack/react-query";
import { Briefcase, Building2, ExternalLink, MapPin } from "lucide-react";
import { useNavigate } from "react-router";

import { api, type JobCompanyDetail } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { Panel } from "@/components/panel";
import { SearchInput } from "@/components/toolbar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { t } from "@/lib/i18n";
import { useListParams } from "@/lib/list-params";

import { GradientAvatar } from "./jobs-shared";

/*
 * /jobs/companies — employers directory as searchable cards with a detail drawer
 * (about + open roles). Reachable with jobs.view.
 */

export function JobsCompaniesPage() {
  const params = useListParams();
  const navigate = useNavigate();

  const filters = { page: params.page, q: params.query || undefined };
  console.debug("[JobsCompanies] query", filters);

  const listQuery = useQuery({
    queryKey: ["jobs", "companies", filters],
    queryFn: () => api.jobs.companies(filters),
    placeholderData: (previous) => previous,
  });

  const selectedId = params.filter("company");
  const detailQuery = useQuery({
    queryKey: ["jobs", "companies", "detail", selectedId],
    queryFn: () => api.jobs.company(Number(selectedId)),
    enabled: selectedId !== undefined,
  });

  const data = listQuery.data;
  const state = listQuery.isPending
    ? "loading"
    : listQuery.isError
      ? "error"
      : (data?.rows.length ?? 0) === 0
        ? "empty"
        : "ready";

  return (
    <div className="space-y-4">
      <PageHeader title={t("jobs.companies.title")} icon={Building2} />

      <Panel
        icon={Building2}
        title={t("jobs.companies.title")}
        description={t("jobs.companies.hint")}
        actions={
          <SearchInput
            value={params.search}
            onChange={params.setSearch}
            placeholder={t("jobs.companies.search")}
            className="w-56"
          />
        }
        contentClassName="p-4"
      >
        {state === "loading" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : state === "error" ? (
          <EmptyState
            icon={Building2}
            title={t("table.error.title")}
            description={t("table.error.description")}
            action={{
              label: t("common.retry"),
              onClick: () => void listQuery.refetch(),
            }}
          />
        ) : state === "empty" ? (
          <EmptyState
            icon={Building2}
            title={t("jobs.companies.empty")}
            description={t("jobs.companies.empty_hint")}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data?.rows.map((company) => (
                <button
                  key={company.id}
                  type="button"
                  onClick={() =>
                    params.setFilter("company", String(company.id))
                  }
                  className="glass-card flex flex-col gap-3 rounded-2xl p-4 text-start transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <GradientAvatar
                      gradient={company.gradient}
                      name={company.name}
                      className="size-11 rounded-2xl text-sm"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{company.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {company.industry}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {company.location}
                    </span>
                    <span>·</span>
                    <span>{company.size}</span>
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    {t("jobs.companies.open_roles", {
                      count: company.open_roles,
                    })}
                  </Badge>
                </button>
              ))}
            </div>
            {data ? (
              <PaginationBar
                pagination={{
                  page: data.page,
                  perPage: data.per_page,
                  total: data.total,
                  pages: Math.max(1, Math.ceil(data.total / data.per_page)),
                }}
                shown={data.rows.length}
                onPage={(page) => params.setPage(page)}
              />
            ) : null}
          </div>
        )}
      </Panel>

      <Sheet
        open={selectedId !== undefined}
        onOpenChange={(open) => !open && params.setFilter("company", undefined)}
      >
        <SheetContent
          side="right"
          className="w-full gap-0 overflow-y-auto sm:max-w-md"
        >
          {detailQuery.data ? (
            <CompanyDetailBody
              company={detailQuery.data}
              onOpenRole={(roleId) => {
                params.setFilter("company", undefined);
                navigate(`/jobs/${roleId}`);
              }}
            />
          ) : (
            <div className="p-6 text-sm text-muted-foreground">
              {t("common.loading")}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CompanyDetailBody({
  company,
  onOpenRole,
}: {
  company: JobCompanyDetail;
  onOpenRole: (roleId: number) => void;
}) {
  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <GradientAvatar
            gradient={company.gradient}
            name={company.name}
            className="size-11 rounded-2xl text-sm"
          />
          <div className="min-w-0">
            <SheetTitle className="truncate">{company.name}</SheetTitle>
            <SheetDescription className="truncate">
              {company.industry} · {company.size}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="space-y-6 px-4 pb-6">
        <p className="text-sm text-muted-foreground">{company.about}</p>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">
              {t("jobs.companies.location")}
            </dt>
            <dd>{company.location}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">
              {t("jobs.companies.website")}
            </dt>
            <dd>
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                {t("jobs.companies.visit")}
                <ExternalLink className="size-3.5" />
              </a>
            </dd>
          </div>
        </dl>

        {company.roles.length > 0 ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              {t("jobs.companies.open_positions")}
            </h3>
            <ul className="space-y-2">
              {company.roles.map((role) => (
                <li key={role.id}>
                  <button
                    type="button"
                    onClick={() => onOpenRole(role.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2 text-start text-sm transition-colors hover:bg-accent/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {role.title}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        {role.location}
                      </span>
                    </span>
                    <Badge variant="outline" className="shrink-0">
                      {t(`jobs.type.${role.type}`)}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title={t("jobs.companies.no_roles")}
            description={t("jobs.companies.no_roles_hint")}
          />
        )}
      </div>
    </>
  );
}
