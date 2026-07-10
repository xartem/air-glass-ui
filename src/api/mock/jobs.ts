import { ApiError, ValidationError } from "../client";
import { devDebug } from "../../lib/debug";
import type {
  Application,
  ApplicationPayload,
  Candidate,
  CandidateFilters,
  CandidateStage,
  Job,
  JobApplicant,
  JobCategory,
  JobCategoryPayload,
  JobCompany,
  JobCompanyDetail,
  JobCompanyFilters,
  JobCreatePayload,
  JobCreateResult,
  JobDepartment,
  JobDetail,
  JobFilters,
  JobGradient,
  JobStatus,
  JobType,
  JobsStats,
  Paginated,
} from "../types";

/*
 * In-memory mock of the Jobs / Recruitment niche (postings, candidates,
 * companies, categories, applications, stats). Shapes mirror the API DTOs
 * (../types). Created jobs and edited categories persist in localStorage so
 * they survive reloads. Company/candidate art is generated gradient SVG built
 * client-side from `gradient` (no external hosts).
 */

const CURRENCY = "USD";
const PER_PAGE = 9;

const GRADIENTS: JobGradient[] = [
  ["#c7d2fe", "#a5b4fc"],
  ["#bfdbfe", "#93c5fd"],
  ["#bbf7d0", "#86efac"],
  ["#fde68a", "#fcd34d"],
  ["#fecaca", "#fca5a5"],
  ["#ddd6fe", "#c4b5fd"],
  ["#a5f3fc", "#67e8f9"],
  ["#fbcfe8", "#f9a8d4"],
];

const DEPARTMENTS: JobDepartment[] = [
  "engineering",
  "sales",
  "marketing",
  "design",
  "support",
];
const JOB_TYPES: JobType[] = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "temporary",
];
const JOB_STATUSES: JobStatus[] = ["published", "draft", "closed", "archived"];
const STAGES: CandidateStage[] = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
];

const JOB_TITLES = [
  "Senior Frontend Engineer",
  "Backend Engineer",
  "Product Designer",
  "Account Executive",
  "Growth Marketer",
  "Customer Support Lead",
  "Data Analyst",
  "Engineering Manager",
  "UX Researcher",
  "Sales Development Rep",
  "Content Strategist",
  "Support Specialist",
  "Platform Engineer",
  "Brand Designer",
  "Solutions Consultant",
  "Marketing Analyst",
  "QA Engineer",
  "Talent Partner",
];

const COMPANY_NAMES = [
  "Northwind Labs",
  "Aurora Systems",
  "Quantica",
  "BlueOrbit",
  "Meridian Works",
  "Pulse Digital",
  "TerraCloud",
  "Vertex Studio",
];

const INDUSTRIES = [
  "Software",
  "Fintech",
  "Healthcare",
  "E-commerce",
  "Media",
  "Logistics",
  "Cloud",
  "Design",
];

const LOCATIONS = [
  "San Francisco, CA",
  "New York, NY",
  "Remote",
  "London, UK",
  "Berlin, DE",
  "Austin, TX",
  "Toronto, CA",
  "Amsterdam, NL",
];

const SIZES = ["11–50", "51–200", "201–500", "501–1000", "1000+"];

const CANDIDATE_NAMES = [
  "Ava Sterling",
  "Milo Chen",
  "Nadia Rahman",
  "Leo Marchetti",
  "Yuki Tanaka",
  "Priya Anand",
  "Diego Alvarez",
  "Freya Nilsson",
  "Omar Haddad",
  "Sofia Rossi",
  "Kai Andersen",
  "Lena Popova",
  "Noah Bennett",
  "Mei Lin",
  "Hugo Martin",
  "Isla Murphy",
  "Tariq Aziz",
  "Elena Costa",
];

const SKILLS = [
  "React",
  "TypeScript",
  "Node.js",
  "Figma",
  "SQL",
  "Python",
  "GraphQL",
  "CSS",
  "Product",
  "Analytics",
  "Go",
  "Design Systems",
];

const CATEGORY_SEED: Array<{ name: string; slug: string }> = [
  { name: "Engineering", slug: "engineering" },
  { name: "Design", slug: "design" },
  { name: "Sales", slug: "sales" },
  { name: "Marketing", slug: "marketing" },
  { name: "Customer Support", slug: "customer-support" },
  { name: "Operations", slug: "operations" },
];

const JOB_COUNT = 24;
const CANDIDATE_COUNT = 30;

function gradientFor(seed: number): JobGradient {
  return GRADIENTS[seed % GRADIENTS.length]!;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/* ---- jobs (persisted; created jobs prepend) ---- */

let jobsCache: Job[] | null = null;
const JOBS_KEY = "mock.jobs.postings";

function buildJobs(): Job[] {
  const base = Date.now();
  return Array.from({ length: JOB_COUNT }, (_, index) => {
    const companyIndex = index % COMPANY_NAMES.length;
    const department = DEPARTMENTS[index % DEPARTMENTS.length]!;
    const type = JOB_TYPES[index % JOB_TYPES.length]!;
    const location = LOCATIONS[index % LOCATIONS.length]!;
    const salaryMin = 60_000 + ((index * 7) % 9) * 10_000;
    return {
      id: 6000 + index,
      title: JOB_TITLES[index % JOB_TITLES.length]!,
      department,
      company: COMPANY_NAMES[companyIndex]!,
      company_id: 6100 + companyIndex,
      type,
      location,
      remote: location === "Remote",
      salary_min: salaryMin,
      salary_max: salaryMin + 30_000 + ((index * 5) % 4) * 10_000,
      currency: CURRENCY,
      applicants: 8 + ((index * 37) % 240),
      status: JOB_STATUSES[index % JOB_STATUSES.length]!,
      posted_at: new Date(base - (index + 1) * 30 * 3600 * 1000).toISOString(),
      gradient: gradientFor(companyIndex),
    };
  });
}

function jobsStore(): Job[] {
  if (jobsCache) return jobsCache;
  const raw = localStorage.getItem(JOBS_KEY);
  jobsCache = raw ? (JSON.parse(raw) as Job[]) : buildJobs();
  persistJobs();
  return jobsCache;
}

function persistJobs(): void {
  if (jobsCache) localStorage.setItem(JOBS_KEY, JSON.stringify(jobsCache));
}

export function jobsList(filters: JobFilters): Paginated<Job> {
  devDebug("[mock:jobs] list", filters);
  let rows = jobsStore().slice();
  const q = filters.q?.toLowerCase().trim();
  if (q)
    rows = rows.filter(
      (job) =>
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q),
    );
  if (filters.department)
    rows = rows.filter((job) => job.department === filters.department);
  if (filters.type) rows = rows.filter((job) => job.type === filters.type);
  if (filters.status)
    rows = rows.filter((job) => job.status === filters.status);
  const sort = filters.sort ?? "posted";
  const dir = filters.dir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    if (sort === "applicants") return (a.applicants - b.applicants) * dir;
    if (sort === "title") return a.title.localeCompare(b.title) * dir;
    return a.posted_at.localeCompare(b.posted_at) * dir;
  });
  const page = Math.max(1, filters.page ?? 1);
  return {
    rows: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    total: rows.length,
    page,
    per_page: PER_PAGE,
  };
}

/**
 * Escape HTML-special characters so user-controlled values (job title, company)
 * cannot inject markup/script when the demo description is rendered via
 * `dangerouslySetInnerHTML` on the overview screen.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function jobsGet(id: number): JobDetail {
  devDebug("[mock:jobs] get", id);
  const job = jobsStore().find((entry) => entry.id === id);
  if (!job) throw new ApiError(404, "Job not found");
  const safeTitle = escapeHtml(job.title);
  const safeCompany = escapeHtml(job.company);
  return {
    ...job,
    description:
      `<p>We are looking for a <strong>${safeTitle}</strong> to join the ` +
      `${safeCompany} team. This is a demo posting that showcases the job ` +
      `overview workspace — description, requirements and applicants.</p>` +
      `<p>You will collaborate across product, design and engineering to ship ` +
      `work that reaches millions of people.</p>`,
    requirements: [
      "3+ years of relevant professional experience",
      "Strong written and verbal communication",
      "Comfortable working in a fast-paced, remote-friendly team",
      "A portfolio or track record of shipped work",
    ],
    responsibilities: [
      "Own features end to end, from scoping to launch",
      "Partner with cross-functional peers to define the roadmap",
      "Raise the quality bar through reviews and mentorship",
    ],
    benefits: [
      "Competitive salary and equity",
      "Flexible, remote-first schedule",
      "Learning and wellness stipend",
    ],
  };
}

/* ---- applicants for a job ---- */

function buildApplicant(seed: number): JobApplicant {
  const stage = STAGES[seed % STAGES.length]!;
  return {
    id: 6300 + seed,
    name: CANDIDATE_NAMES[seed % CANDIDATE_NAMES.length]!,
    role: JOB_TITLES[seed % JOB_TITLES.length]!,
    stage,
    rating: 1 + (seed % 5),
    experience: 1 + (seed % 12),
    applied_at: new Date(
      Date.now() - (seed + 1) * 20 * 3600 * 1000,
    ).toISOString(),
    gradient: gradientFor(seed + 1),
  };
}

export function jobsApplicants(id: number): JobApplicant[] {
  devDebug("[mock:jobs] applicants", id);
  const job = jobsStore().find((entry) => entry.id === id);
  if (!job) throw new ApiError(404, "Job not found");
  const count = 4 + (id % 5);
  return Array.from({ length: count }, (_, index) =>
    buildApplicant(id + index),
  );
}

/* ---- candidates ---- */

function buildCandidates(): Candidate[] {
  return Array.from({ length: CANDIDATE_COUNT }, (_, index) => {
    const stage = STAGES[index % STAGES.length]!;
    const skillA = SKILLS[index % SKILLS.length]!;
    const skillB = SKILLS[(index * 3 + 1) % SKILLS.length]!;
    const skillC = SKILLS[(index * 5 + 2) % SKILLS.length]!;
    return {
      id: 6400 + index,
      name: CANDIDATE_NAMES[index % CANDIDATE_NAMES.length]!,
      role: JOB_TITLES[index % JOB_TITLES.length]!,
      experience: 1 + ((index * 3) % 14),
      stage,
      rating: 1 + (index % 5),
      applied_at: new Date(
        Date.now() - (index + 1) * 14 * 3600 * 1000,
      ).toISOString(),
      skills: Array.from(new Set([skillA, skillB, skillC])),
      location: LOCATIONS[index % LOCATIONS.length]!,
      gradient: gradientFor(index + 2),
    };
  });
}

export function jobsCandidates(
  filters: CandidateFilters,
): Paginated<Candidate> {
  devDebug("[mock:jobs] candidates", filters);
  let rows = buildCandidates();
  const q = filters.q?.toLowerCase().trim();
  if (q)
    rows = rows.filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(q) ||
        candidate.role.toLowerCase().includes(q) ||
        candidate.skills.some((skill) => skill.toLowerCase().includes(q)),
    );
  if (filters.stage)
    rows = rows.filter((candidate) => candidate.stage === filters.stage);
  const sort = filters.sort ?? "applied";
  const dir = filters.dir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    if (sort === "rating") return (a.rating - b.rating) * dir;
    if (sort === "experience") return (a.experience - b.experience) * dir;
    if (sort === "name") return a.name.localeCompare(b.name) * dir;
    return a.applied_at.localeCompare(b.applied_at) * dir;
  });
  const page = Math.max(1, filters.page ?? 1);
  return {
    rows: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    total: rows.length,
    page,
    per_page: PER_PAGE,
  };
}

/* ---- companies ---- */

function buildCompanies(): JobCompany[] {
  return COMPANY_NAMES.map((name, index) => ({
    id: 6100 + index,
    name,
    industry: INDUSTRIES[index % INDUSTRIES.length]!,
    location: LOCATIONS[index % LOCATIONS.length]!,
    size: SIZES[index % SIZES.length]!,
    open_roles: 2 + ((index * 5) % 14),
    gradient: gradientFor(index),
  }));
}

export function jobsCompanies(
  filters: JobCompanyFilters,
): Paginated<JobCompany> {
  devDebug("[mock:jobs] companies", filters);
  let rows = buildCompanies();
  const q = filters.q?.toLowerCase().trim();
  if (q)
    rows = rows.filter(
      (company) =>
        company.name.toLowerCase().includes(q) ||
        company.industry.toLowerCase().includes(q) ||
        company.location.toLowerCase().includes(q),
    );
  const page = Math.max(1, filters.page ?? 1);
  return {
    rows: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    total: rows.length,
    page,
    per_page: PER_PAGE,
  };
}

export function jobsCompany(id: number): JobCompanyDetail {
  devDebug("[mock:jobs] company", id);
  const company = buildCompanies().find((entry) => entry.id === id);
  if (!company) throw new ApiError(404, "Company not found");
  const roles = jobsStore()
    .filter((job) => job.company_id === id && job.status === "published")
    .slice(0, 6)
    .map((job) => ({
      id: job.id,
      title: job.title,
      location: job.location,
      type: job.type,
    }));
  return {
    ...company,
    about:
      `${company.name} is a demo employer in the ${company.industry} space, ` +
      `used to showcase the companies directory and its detail drawer. The team ` +
      `is ${company.size} people and hiring across multiple functions.`,
    website: `https://${company.name.toLowerCase().replace(/\s+/g, "")}.example`,
    roles,
  };
}

/* ---- categories (persisted CRUD) ---- */

let categoriesCache: JobCategory[] | null = null;
const CATEGORIES_KEY = "mock.jobs.categories";

function buildCategories(): JobCategory[] {
  return CATEGORY_SEED.map((entry, index) => ({
    id: 6200 + index,
    name: entry.name,
    slug: entry.slug,
    jobs_count: 2 + ((index * 7) % 18),
  }));
}

function categoriesStore(): JobCategory[] {
  if (categoriesCache) return categoriesCache;
  const raw = localStorage.getItem(CATEGORIES_KEY);
  categoriesCache = raw
    ? (JSON.parse(raw) as JobCategory[])
    : buildCategories();
  persistCategories();
  return categoriesCache;
}

function persistCategories(): void {
  if (categoriesCache)
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categoriesCache));
}

export function jobsCategories(): JobCategory[] {
  devDebug("[mock:jobs] categories");
  return structuredClone(
    categoriesStore()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
}

export function jobsSaveCategory(payload: JobCategoryPayload): JobCategory {
  devDebug("[mock:jobs] saveCategory", payload);
  const fields: Record<string, string> = {};
  if (!payload.name?.trim()) fields.name = "required";
  if (!payload.slug?.trim()) fields.slug = "required";
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug))
    fields.slug = "invalid";
  if (Object.keys(fields).length > 0)
    throw new ValidationError("Validation failed", fields);
  const store = categoriesStore();
  const duplicate = store.find(
    (entry) => entry.slug === payload.slug && entry.id !== payload.id,
  );
  if (duplicate)
    throw new ValidationError("Validation failed", { slug: "duplicate" });
  if (payload.id) {
    const existing = store.find((entry) => entry.id === payload.id);
    if (!existing) throw new ApiError(404, "Category not found");
    existing.name = payload.name.trim();
    existing.slug = payload.slug.trim();
    persistCategories();
    return structuredClone(existing);
  }
  const category: JobCategory = {
    id: Math.max(6200, ...store.map((entry) => entry.id)) + 1,
    name: payload.name.trim(),
    slug: payload.slug.trim(),
    jobs_count: 0,
  };
  store.push(category);
  persistCategories();
  return structuredClone(category);
}

export function jobsDeleteCategory(id: number): { id: number } {
  devDebug("[mock:jobs] deleteCategory", id);
  const store = categoriesStore();
  const index = store.findIndex((entry) => entry.id === id);
  if (index === -1) throw new ApiError(404, "Category not found");
  store.splice(index, 1);
  persistCategories();
  return { id };
}

/* ---- create job (persisted) ---- */

export function jobsCreate(payload: JobCreatePayload): JobCreateResult {
  devDebug("[mock:jobs] create", payload);
  const fields: Record<string, string> = {};
  if (!payload.title?.trim()) fields.title = "required";
  if (!payload.location?.trim()) fields.location = "required";
  if (!(Number(payload.salary_min) >= 0)) fields.salary_min = "invalid";
  if (!(Number(payload.salary_max) >= Number(payload.salary_min)))
    fields.salary_max = "invalid";
  if (Object.keys(fields).length > 0)
    throw new ValidationError("Validation failed", fields);
  const store = jobsStore();
  const companyIndex = store.length % COMPANY_NAMES.length;
  const job: Job = {
    id: Math.max(6000, ...store.map((entry) => entry.id)) + 1,
    title: payload.title.trim(),
    department: payload.department,
    company: COMPANY_NAMES[companyIndex]!,
    company_id: 6100 + companyIndex,
    type: payload.type,
    location: payload.location.trim(),
    remote: /remote/i.test(payload.location),
    salary_min: round(Number(payload.salary_min)),
    salary_max: round(Number(payload.salary_max)),
    currency: CURRENCY,
    applicants: 0,
    status: payload.status,
    posted_at: new Date().toISOString(),
    gradient: gradientFor(companyIndex),
  };
  store.unshift(job);
  persistJobs();
  return { id: job.id, title: job.title, status: job.status };
}

/* ---- application ---- */

export function jobsApply(payload: ApplicationPayload): Application {
  devDebug("[mock:jobs] apply", {
    email: payload.email,
    job_id: payload.job_id,
  });
  const fields: Record<string, string> = {};
  if (!payload.first_name?.trim()) fields.first_name = "required";
  if (!payload.last_name?.trim()) fields.last_name = "required";
  if (
    !payload.email?.trim() ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)
  )
    fields.email = "invalid";
  if (!payload.phone?.trim()) fields.phone = "required";
  if (!payload.resume?.trim()) fields.resume = "required";
  if (Object.keys(fields).length > 0)
    throw new ValidationError("Validation failed", fields);
  return {
    id: Date.now(),
    status: "submitted",
    submitted_at: new Date().toISOString(),
  };
}

/* ---- stats ---- */

function kpi(value: number, delta: number) {
  return { value, delta };
}

export function jobsStats(): JobsStats {
  devDebug("[mock:jobs] stats");
  const store = jobsStore();
  const openRoles = store.filter((job) => job.status === "published").length;
  const applicants = store.reduce((sum, job) => sum + job.applicants, 0);
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  const applications = months.slice(0, 8).map((label, index) => ({
    label,
    value: 120 + Math.round(Math.sin(index / 1.7) * 40) + index * 14,
  }));
  const departments = DEPARTMENTS.map((label, index) => ({
    label,
    value:
      store
        .filter((job) => job.department === label)
        .reduce((sum, job) => sum + job.applicants, 0) || 80 + index * 25,
  }));
  const stageCounts: Array<{ label: CandidateStage; value: number }> = [
    { label: "applied", value: applicants },
    { label: "screening", value: Math.round(applicants * 0.52) },
    { label: "interview", value: Math.round(applicants * 0.28) },
    { label: "offer", value: Math.round(applicants * 0.12) },
    { label: "hired", value: Math.round(applicants * 0.05) },
  ];
  return {
    kpis: {
      openRoles: kpi(openRoles, 0.08),
      applicants: kpi(applicants, 0.124),
      interviews: kpi(stageCounts[2]!.value, 0.061),
      hires: kpi(stageCounts[4]!.value, 0.033),
    },
    applications,
    departments,
    pipeline: stageCounts,
    recent: Array.from({ length: 6 }, (_, index) => buildApplicant(index + 3)),
  };
}
