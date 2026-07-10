import { useQuery } from "@tanstack/react-query";
import { Mail, Rows3, Star, LayoutGrid, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { api } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { SearchInput } from "@/components/toolbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { t } from "@/lib/i18n";
import { useListParams } from "@/lib/list-params";

import { useCandidateFilters } from "./use-jobs-list";
import {
  CANDIDATE_STAGES,
  CANDIDATE_STAGE_KIND,
  initials,
} from "./jobs-shared";

/*
 * /jobs/candidates/grid — candidate cards (avatar, role, skills, rating, stage,
 * quick actions) sharing the `api.jobs.candidates` query with the table view.
 * Reachable with jobs.view.
 */

export function JobsCandidatesGridPage() {
  const navigate = useNavigate();
  const params = useListParams();
  const filters = useCandidateFilters(params);

  const listQuery = useQuery({
    queryKey: ["jobs", "candidates", filters],
    queryFn: () => api.jobs.candidates(filters),
    placeholderData: (previous) => previous,
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
      <PageHeader title={t("jobs.candidates.title")} icon={Users} />

      <Panel
        icon={Users}
        title={t("jobs.candidates.title")}
        description={t("jobs.candidates.hint")}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              value={params.search}
              onChange={params.setSearch}
              placeholder={t("jobs.candidates.search")}
              className="w-52"
            />
            <Select
              value={filters.stage ?? "all"}
              onValueChange={(value) =>
                params.setFilter("stage", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t("jobs.candidates.filter.stage")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("jobs.candidates.filter.all")}
                </SelectItem>
                {CANDIDATE_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {t(`jobs.stage.${stage}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 rounded-lg border p-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("jobs.list.view.table")}
                onClick={() => navigate("/jobs/candidates")}
              >
                <Rows3 />
              </Button>
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label={t("jobs.list.view.grid")}
              >
                <LayoutGrid />
              </Button>
            </div>
          </div>
        }
        contentClassName="p-4"
      >
        {state === "loading" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : state === "error" ? (
          <EmptyState
            icon={Users}
            title={t("table.error.title")}
            description={t("table.error.description")}
            action={{
              label: t("common.retry"),
              onClick: () => void listQuery.refetch(),
            }}
          />
        ) : state === "empty" ? (
          <EmptyState
            icon={Users}
            title={t("jobs.candidates.empty")}
            description={t("jobs.candidates.empty_hint")}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data?.rows.map((candidate) => (
                <div
                  key={candidate.id}
                  className="glass-card flex flex-col gap-3 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {initials(candidate.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {candidate.name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {candidate.role}
                      </div>
                    </div>
                    <StatusBadge
                      status={CANDIDATE_STAGE_KIND[candidate.stage]}
                      label={t(`jobs.stage.${candidate.stage}`)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <Rating value={candidate.rating} readOnly size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {t("jobs.candidates.years", {
                        count: candidate.experience,
                      })}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        toast.success(t("jobs.candidates.shortlisted"))
                      }
                    >
                      <Star className="size-4" />
                      {t("jobs.candidates.shortlist")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={t("jobs.candidates.message")}
                      onClick={() =>
                        toast.success(t("jobs.candidates.messaged"))
                      }
                    >
                      <Mail className="size-4" />
                    </Button>
                  </div>
                </div>
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
    </div>
  );
}
