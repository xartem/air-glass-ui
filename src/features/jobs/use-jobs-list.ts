import type {
  CandidateFilters,
  CandidateStage,
  JobDepartment,
  JobFilters,
  JobStatus,
  JobType,
} from "@/api";
import type { ListParams } from "@/lib/list-params";

/*
 * Shared filter builder for the Job list ⇄ grid views so both hit the exact same
 * `api.jobs.list` query (and its cache) from one URL-param source.
 */
export function useJobsListFilters(params: ListParams): JobFilters {
  return {
    page: params.page,
    q: params.query || undefined,
    department:
      (params.filter("department") as JobDepartment | undefined) ?? undefined,
    type: (params.filter("type") as JobType | undefined) ?? undefined,
    status: (params.filter("status") as JobStatus | undefined) ?? undefined,
    sort: (params.sort?.column as JobFilters["sort"]) ?? "posted",
    dir: params.sort?.dir ?? "desc",
  };
}

/*
 * Shared filter builder for the Candidate list ⇄ grid views so both hit the same
 * `api.jobs.candidates` query and cache from one URL-param source.
 */
export function useCandidateFilters(params: ListParams): CandidateFilters {
  return {
    page: params.page,
    q: params.query || undefined,
    stage: (params.filter("stage") as CandidateStage | undefined) ?? undefined,
    sort: (params.sort?.column as CandidateFilters["sort"]) ?? "applied",
    dir: params.sort?.dir ?? "desc",
  };
}
