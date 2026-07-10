import { ApiError, ValidationError } from "../client";
import { devDebug } from "../../lib/debug";
import type {
  CompanyDetail,
  CompanyFilters,
  CompanyListItem,
  CompanyPayload,
  CrmContactDetail,
  CrmContactFilters,
  CrmContactPayload,
  Deal,
  DealStage,
  Lead,
  LeadFilters,
  Paginated,
} from "../types";

/*
 * In-memory mock of the CRM module (contacts, companies, deals, leads). Shapes
 * mirror the API DTOs (../types). Persisted in localStorage.
 */

const CURRENCY = "USD";
const PER_PAGE = 12;

const OWNERS = ["Anna Adminson", "Evan Editor", "Olivia Parker", "David Fisher"];
const COMPANIES = [
  "Acme Inc.",
  "Globex",
  "Initech",
  "Umbrella Co.",
  "Soylent",
  "Hooli",
  "Vandelay",
  "Stark Industries",
  "Wayne Enterprises",
  "Cyberdyne",
];
const INDUSTRIES = ["Software", "Retail", "Finance", "Healthcare", "Manufacturing", "Media"];
const SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"];
const TAGS = ["vip", "prospect", "partner", "churned", "newsletter"];
const CONTACT_NAMES = [
  "Olivia Parker",
  "David Fisher",
  "Mary Cooper",
  "Ian Walker",
  "Natalie Smith",
  "Paul Morrison",
  "Ellen Novak",
  "Simon Cole",
  "Tara Lane",
  "Andrew Pope",
  "Julia Evans",
  "Max Oliver",
  "Irene Frost",
  "Roman Ziegler",
  "Stella Turner",
  "Aaron White",
];
const DEAL_STAGES: DealStage[] = ["new", "qualified", "proposal", "negotiation", "won"];
const LEAD_SOURCES = ["Website", "Referral", "Ad campaign", "Event", "Cold call"];
const SWATCHES = ["#bfdbfe", "#bbf7d0", "#fde68a", "#fecaca", "#ddd6fe", "#a5f3fc"];

function money(base: number): number {
  return Math.round(base * 100) / 100;
}

/* ---- contacts ---- */

let contactsCache: CrmContactDetail[] | null = null;
const CONTACTS_KEY = "mock.crm.contacts";

function buildContacts(): CrmContactDetail[] {
  const base = Date.now();
  return CONTACT_NAMES.map((name, index) => {
    const first = name.split(" ")[0]!.toLowerCase();
    return {
      id: 500 + index,
      name,
      company: COMPANIES[index % COMPANIES.length]!,
      email: `${first}@example.com`,
      phone: `+1 555 0${(100 + index).toString().slice(-3)}`,
      tags: TAGS.slice(index % 3, (index % 3) + 2),
      owner: OWNERS[index % OWNERS.length]!,
      last_activity: new Date(base - (index + 1) * 8 * 3600 * 1000).toISOString(),
      activity: Array.from({ length: 4 }, (_, a) => ({
        id: a + 1,
        at: new Date(base - (a + 1) * 20 * 3600 * 1000).toISOString(),
        text:
          a % 2 === 0 ? "Sent a follow-up email." : "Logged a call — left a voicemail.",
      })),
      deals: Array.from({ length: 1 + (index % 2) }, (_, d) => ({
        id: index * 10 + d,
        title: `${COMPANIES[index % COMPANIES.length]} renewal`,
        value: money(5000 + ((index * 7 + d) % 20) * 1500),
        stage: DEAL_STAGES[(index + d) % DEAL_STAGES.length]!,
      })),
    };
  });
}

function contactsStore(): CrmContactDetail[] {
  if (contactsCache) return contactsCache;
  const raw = localStorage.getItem(CONTACTS_KEY);
  contactsCache = raw ? (JSON.parse(raw) as CrmContactDetail[]) : buildContacts();
  persistContacts();
  return contactsCache;
}

function persistContacts(): void {
  if (contactsCache) localStorage.setItem(CONTACTS_KEY, JSON.stringify(contactsCache));
}

export function listCrmContacts(
  filters: CrmContactFilters,
): Paginated<CrmContactDetail> {
  devDebug("[mock:crm] contacts.list", filters);
  let rows = contactsStore().slice();
  const q = filters.q?.toLowerCase().trim();
  if (q)
    rows = rows.filter(
      (contact) =>
        contact.name.toLowerCase().includes(q) ||
        contact.email.toLowerCase().includes(q) ||
        contact.company.toLowerCase().includes(q),
    );
  if (filters.tag) rows = rows.filter((contact) => contact.tags.includes(filters.tag!));
  if (filters.owner) rows = rows.filter((contact) => contact.owner === filters.owner);
  const sort = filters.sort ?? "name";
  const dir = filters.dir === "desc" ? -1 : 1;
  rows.sort((a, b) => {
    if (sort === "company") return a.company.localeCompare(b.company) * dir;
    if (sort === "last_activity")
      return a.last_activity.localeCompare(b.last_activity) * dir;
    return a.name.localeCompare(b.name) * dir;
  });
  const page = Math.max(1, filters.page ?? 1);
  return {
    rows: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    total: rows.length,
    page,
    per_page: PER_PAGE,
  };
}

export function getCrmContact(id: number): CrmContactDetail {
  devDebug("[mock:crm] contacts.get", id);
  const contact = contactsStore().find((entry) => entry.id === id);
  if (!contact) throw new ApiError(404, "Contact not found");
  return structuredClone(contact);
}

export function createCrmContact(payload: CrmContactPayload): CrmContactDetail {
  devDebug("[mock:crm] contacts.create", payload);
  if (!payload.name?.trim())
    throw new ValidationError("Validation failed", { name: "required" });
  const store = contactsStore();
  const id = Math.max(0, ...store.map((entry) => entry.id)) + 1;
  const created: CrmContactDetail = {
    id,
    name: payload.name,
    company: payload.company,
    email: payload.email,
    phone: payload.phone,
    tags: payload.tags,
    owner: payload.owner || OWNERS[0]!,
    last_activity: new Date().toISOString(),
    activity: [{ id: 1, at: new Date().toISOString(), text: "Contact created." }],
    deals: [],
  };
  store.unshift(created);
  persistContacts();
  return structuredClone(created);
}

/* ---- companies ---- */

let companiesCache: CompanyDetail[] | null = null;
const COMPANIES_KEY = "mock.crm.companies";

function buildCompanies(): CompanyDetail[] {
  return COMPANIES.map((name, index) => ({
    id: 600 + index,
    name,
    industry: INDUSTRIES[index % INDUSTRIES.length]!,
    size: SIZES[index % SIZES.length]!,
    logo_color: SWATCHES[index % SWATCHES.length]!,
    contacts_count: 2 + (index % 8),
    deals_value: money(20000 + ((index * 53) % 60) * 3500),
    currency: CURRENCY,
    owner: OWNERS[index % OWNERS.length]!,
    notes: "A demo account used to showcase the companies directory and profile drawer.",
    contacts: CONTACT_NAMES.slice(index % 6, (index % 6) + 3).map((name, c) => ({
      id: index * 10 + c,
      name,
    })),
    deals: Array.from({ length: 2 }, (_, d) => ({
      id: index * 20 + d,
      title: `${name} deal ${d + 1}`,
      value: money(8000 + ((index + d) % 12) * 2200),
    })),
  }));
}

function companiesStore(): CompanyDetail[] {
  if (companiesCache) return companiesCache;
  const raw = localStorage.getItem(COMPANIES_KEY);
  companiesCache = raw ? (JSON.parse(raw) as CompanyDetail[]) : buildCompanies();
  persistCompanies();
  return companiesCache;
}

function persistCompanies(): void {
  if (companiesCache) localStorage.setItem(COMPANIES_KEY, JSON.stringify(companiesCache));
}

function toCompanyListItem(company: CompanyDetail): CompanyListItem {
  return {
    id: company.id,
    name: company.name,
    industry: company.industry,
    size: company.size,
    logo_color: company.logo_color,
    contacts_count: company.contacts_count,
    deals_value: company.deals_value,
    currency: company.currency,
    owner: company.owner,
  };
}

export function listCompanies(filters: CompanyFilters): Paginated<CompanyListItem> {
  devDebug("[mock:crm] companies.list", filters);
  let rows = companiesStore().slice();
  const q = filters.q?.toLowerCase().trim();
  if (q) rows = rows.filter((company) => company.name.toLowerCase().includes(q));
  const sort = filters.sort ?? "name";
  const dir = filters.dir === "desc" ? -1 : 1;
  rows.sort((a, b) => {
    if (sort === "deals_value") return (a.deals_value - b.deals_value) * dir;
    if (sort === "contacts_count") return (a.contacts_count - b.contacts_count) * dir;
    return a.name.localeCompare(b.name) * dir;
  });
  const page = Math.max(1, filters.page ?? 1);
  return {
    rows: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(toCompanyListItem),
    total: rows.length,
    page,
    per_page: PER_PAGE,
  };
}

export function getCompany(id: number): CompanyDetail {
  devDebug("[mock:crm] companies.get", id);
  const company = companiesStore().find((entry) => entry.id === id);
  if (!company) throw new ApiError(404, "Company not found");
  return structuredClone(company);
}

export function createCompany(payload: CompanyPayload): CompanyDetail {
  devDebug("[mock:crm] companies.create", payload);
  if (!payload.name?.trim())
    throw new ValidationError("Validation failed", { name: "required" });
  const store = companiesStore();
  const id = Math.max(0, ...store.map((entry) => entry.id)) + 1;
  const created: CompanyDetail = {
    id,
    name: payload.name,
    industry: payload.industry || INDUSTRIES[0]!,
    size: payload.size || SIZES[0]!,
    logo_color: SWATCHES[id % SWATCHES.length]!,
    contacts_count: 0,
    deals_value: 0,
    currency: CURRENCY,
    owner: payload.owner || OWNERS[0]!,
    notes: "",
    contacts: [],
    deals: [],
  };
  store.unshift(created);
  persistCompanies();
  return structuredClone(created);
}

/* ---- deals (pipeline) ---- */

let dealsCache: Deal[] | null = null;
const DEALS_KEY = "mock.crm.deals";

function buildDeals(): Deal[] {
  return Array.from({ length: 16 }, (_, index) => {
    const stage = DEAL_STAGES[index % DEAL_STAGES.length]!;
    return {
      id: 700 + index,
      title: `${COMPANIES[index % COMPANIES.length]} deal`,
      value: money(6000 + ((index * 17) % 40) * 1800),
      currency: CURRENCY,
      company: COMPANIES[index % COMPANIES.length]!,
      owner: OWNERS[index % OWNERS.length]!,
      probability:
        stage === "won" ? 100 : stage === "new" ? 15 : 25 + ((index * 11) % 60),
      stage,
    };
  });
}

function dealsStore(): Deal[] {
  if (dealsCache) return dealsCache;
  const raw = localStorage.getItem(DEALS_KEY);
  dealsCache = raw ? (JSON.parse(raw) as Deal[]) : buildDeals();
  persistDeals();
  return dealsCache;
}

function persistDeals(): void {
  if (dealsCache) localStorage.setItem(DEALS_KEY, JSON.stringify(dealsCache));
}

export function listDeals(): Deal[] {
  devDebug("[mock:crm] deals.list");
  return structuredClone(dealsStore());
}

export function moveDeal(id: number, stage: DealStage): Deal {
  devDebug("[mock:crm] deals.move", { id, stage });
  const deal = dealsStore().find((entry) => entry.id === id);
  if (!deal) throw new ApiError(404, "Deal not found");
  deal.stage = stage;
  if (stage === "won") deal.probability = 100;
  persistDeals();
  return structuredClone(deal);
}

/* ---- leads ---- */

let leadsCache: Lead[] | null = null;
const LEADS_KEY = "mock.crm.leads";

function buildLeads(): Lead[] {
  const base = Date.now();
  const statuses: Lead["status"][] = ["new", "contacted", "qualified", "unqualified"];
  return CONTACT_NAMES.map((name, index) => ({
    id: 800 + index,
    name,
    source: LEAD_SOURCES[index % LEAD_SOURCES.length]!,
    score: 20 + ((index * 13) % 78),
    status: statuses[index % statuses.length]!,
    owner: OWNERS[index % OWNERS.length]!,
    created_at: new Date(base - (index + 1) * 14 * 3600 * 1000).toISOString(),
  }));
}

function leadsStore(): Lead[] {
  if (leadsCache) return leadsCache;
  const raw = localStorage.getItem(LEADS_KEY);
  leadsCache = raw ? (JSON.parse(raw) as Lead[]) : buildLeads();
  persistLeads();
  return leadsCache;
}

function persistLeads(): void {
  if (leadsCache) localStorage.setItem(LEADS_KEY, JSON.stringify(leadsCache));
}

export function listLeads(filters: LeadFilters): Paginated<Lead> {
  devDebug("[mock:crm] leads.list", filters);
  let rows = leadsStore().slice();
  const q = filters.q?.toLowerCase().trim();
  if (q) rows = rows.filter((lead) => lead.name.toLowerCase().includes(q));
  if (filters.status) rows = rows.filter((lead) => lead.status === filters.status);
  if (filters.source) rows = rows.filter((lead) => lead.source === filters.source);
  const sort = filters.sort ?? "created_at";
  const dir = filters.dir === "desc" ? -1 : 1;
  rows.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name) * dir;
    if (sort === "score") return (a.score - b.score) * dir;
    return a.created_at.localeCompare(b.created_at) * dir;
  });
  const page = Math.max(1, filters.page ?? 1);
  return {
    rows: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    total: rows.length,
    page,
    per_page: PER_PAGE,
  };
}

/** Convert a lead to a deal (mock): removes the lead, appends a new pipeline deal. */
export function convertLead(id: number): Deal {
  devDebug("[mock:crm] leads.convert", id);
  const leads = leadsStore();
  const at = leads.findIndex((lead) => lead.id === id);
  if (at < 0) throw new ApiError(404, "Lead not found");
  const [lead] = leads.splice(at, 1);
  persistLeads();
  const deals = dealsStore();
  const deal: Deal = {
    id: Math.max(0, ...deals.map((entry) => entry.id)) + 1,
    title: `${lead!.name} — new deal`,
    value: money(5000),
    currency: CURRENCY,
    company: "—",
    owner: lead!.owner,
    probability: 20,
    stage: "new",
  };
  deals.unshift(deal);
  persistDeals();
  return structuredClone(deal);
}
