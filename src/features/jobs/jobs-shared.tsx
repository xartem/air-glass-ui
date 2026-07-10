import type {
  CandidateStage,
  JobDepartment,
  JobGradient,
  JobStatus,
  JobType,
} from "@/api";
import { type StatusKind } from "@/components/status-badge";
import { formatMoney } from "@/lib/money";
import type { AdminLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * Shared Jobs helpers: status/stage tone maps, filter option lists, and a
 * generated gradient avatar (initials over a two-stop gradient, no external
 * hosts) reused for company logos and candidate photos.
 */

export const JOB_DEPARTMENTS: JobDepartment[] = [
  "engineering",
  "sales",
  "marketing",
  "design",
  "support",
];

export const JOB_TYPES: JobType[] = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "temporary",
];

export const JOB_STATUSES: JobStatus[] = [
  "published",
  "draft",
  "closed",
  "archived",
];

export const CANDIDATE_STAGES: CandidateStage[] = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
];

export const JOB_STATUS_KIND: Record<JobStatus, StatusKind> = {
  published: "success",
  draft: "draft",
  closed: "error",
  archived: "archived",
};

export const CANDIDATE_STAGE_KIND: Record<CandidateStage, StatusKind> = {
  applied: "pending",
  screening: "info",
  interview: "info",
  offer: "draft",
  hired: "success",
  rejected: "error",
};

/** `$60,000 – $90,000` — a salary band with the shared money formatter. */
export function formatSalaryRange(
  min: number,
  max: number,
  currency: string,
  locale: AdminLocale,
): string {
  return `${formatMoney(min, currency, locale)} – ${formatMoney(max, currency, locale)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/** Initials over a deterministic two-stop gradient (placeholder logo/avatar). */
export function GradientAvatar({
  gradient,
  name,
  className,
  rounded = "rounded-xl",
}: {
  gradient: JobGradient;
  name: string;
  className?: string;
  rounded?: string;
}) {
  const [from, to] = gradient;
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center text-xs font-semibold text-foreground/70",
        rounded,
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {initials(name)}
    </span>
  );
}
