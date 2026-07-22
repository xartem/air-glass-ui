/*
 * Admin API DTOs (B7). Shapes mirror the backend contracts from the module
 * specs (D:auth, D:search §4a, C8) — the mock layer and the future live API
 * must both satisfy these types.
 */

export type MaintenanceMode = "off" | "read_only" | "full";

export interface MeRole {
  key: string;
  label: string;
}

export interface MeUser {
  id: number;
  name: string;
  email: string;
  role: MeRole;
  ui_locale: string;
}

export interface ContentLocale {
  code: string;
  label: string;
  is_default: boolean;
}

export interface MeCollection {
  slug: string;
  label: string;
  has_categories: boolean;
  /** Menu placement (E5): 'channel' → under Posts, 'catalog' → under Catalog, 'custom' → top-level. */
  kind: "channel" | "catalog" | "custom";
}

export interface Impersonator {
  id: number;
  name: string;
}

export interface MeMfa {
  enabled: boolean;
  /** Role is in security.mfa_required_roles but 2FA is off — the SPA gates into enroll (D:auth §6). */
  enroll_required: boolean;
}

export interface Me {
  user: MeUser;
  permissions: string[];
  locales: ContentLocale[];
  collections: MeCollection[];
  impersonator: Impersonator | null;
  maintenance_mode: MaintenanceMode;
  mfa: MeMfa;
  /** False when no LLM key is configured — the panel button hides (UI:ai §1). */
  ai_available: boolean;
  /** Site timezone (C7 §4) — the admin renders absolute times in it, not the browser's. */
  timezone: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember: boolean;
}

/** 202 mfa_required: password is right, the session is pending the 2FA challenge (D:auth §6). */
export type LoginResult = { ok: true } | { mfa_required: true };

export interface MfaEnrollStart {
  secret: string;
  otpauth_uri: string;
}

export interface MfaRecoveryCodes {
  recovery_codes: string[];
}

export interface ResetPayload {
  token: string;
  password: string;
}

/** Sign-up (demo, mock — no real persistence). */
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

/** First-time password set from an invite link. */
export interface CreatePasswordPayload {
  token?: string;
  password: string;
}

export interface ActivityActor {
  id: number;
  name: string;
}

export interface ActivityChange {
  old: string | null;
  new: string | null;
}

export interface ActivityEntry {
  id: number;
  created_at: string;
  actor: ActivityActor | null;
  is_ai: boolean;
  impersonator: ActivityActor | null;
  action: string;
  entity_type: string;
  entity_id: number | string;
  description: string;
  changes: Record<string, ActivityChange> | null;
  /** SPA route of the entity editor, when resolvable. */
  url: string | null;
}

export interface ActivityFilters {
  page?: number;
  actor_id?: number;
  entity_type?: string;
  action?: string;
  only_ai?: boolean;
  from?: string;
  to?: string;
  /** Only `date` is sortable (UI:shell-auth §2); default desc. */
  sort?: "date";
  dir?: "asc" | "desc";
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface AdminSearchItem {
  title: string;
  hint?: string;
  status?: "draft";
  url: string;
}

export interface AdminSearchGroup {
  key: string;
  label: string;
  items: AdminSearchItem[];
}

export interface UnreadCount {
  count: number;
}

/* ---- media (minimal list for pickers; full module lands in stage 4) ---- */

export interface MediaListItem {
  path: string;
  name: string;
  preview_url?: string;
  /** File size in bytes (file-manager details panel); optional for older callers. */
  size?: number;
  /** ISO timestamp of the last modification (file-manager details panel). */
  modified_at?: string;
}

/* Image presets (D:media §3): declared by module code / active theme; operator
 * overrides live in the `media.preset_sizes` setting (UI:media §2). */

export type MediaPresetMode = "cover" | "contain" | "crop";

export interface MediaPreset {
  key: string;
  owner: string;
  is_theme: boolean;
  format: string;
  mode: MediaPresetMode;
  width: number;
  height: number;
  /** null → inherits the global media.quality. */
  quality: number | null;
  retina: boolean;
}

export type MediaPresetOverride = Partial<
  Pick<MediaPreset, "mode" | "width" | "height" | "quality" | "retina">
>;

export interface MediaPresetsPayload {
  presets: MediaPreset[];
  overrides: Record<string, MediaPresetOverride>;
}

/** Progress of a manual variant-regeneration job (D:media §4/§11, C10 queue). */
export interface MediaRegenStatus {
  processed: number;
  total: number;
  percent: number;
  state: "running" | "done";
}

/* ---- settings (D:settings §6, C7 §3) ---- */

export type SettingType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "media"
  | "url"
  | "json"
  | "code";

export type SettingValue = string | number | boolean | null;

export interface SettingSchemaEntry {
  key: string;
  type: SettingType;
  /** Server never returns the real value for sensitive keys — '***' (set) or '' (unset). */
  sensitive?: boolean;
  options?: string[];
  default?: SettingValue;
  /** UI translates labels/help by convention: settings.field.{key} / settings.help.{key}. */
  has_help?: boolean;
  /** Sub-section within the group (default 'main') — each renders as its own Panel (UI:settings §2). */
  section?: string;
  /** Field width override; default derives from type (short types → half). */
  span?: "half" | "full";
}

export interface SettingsGroup {
  group: string;
  entries: SettingSchemaEntry[];
  /** Current values keyed by setting key (defaults already applied server-side). */
  values: Record<string, SettingValue>;
}

export interface SettingsPayload {
  groups: SettingsGroup[];
}

/* ---- appearance (E1 §2.2.1 · UI:settings appearance) — site-wide admin look ---- */

/** Surface recipe: glass (default air), liquid (heavy iOS frost), flat (opaque). */
export type AppearanceStyle = "glass" | "liquid" | "flat";
/** Background preset per theme; 'custom' pairs with a customLight/customDark image path. */
export type AppearanceBg = "air" | "aurora" | "calm" | "plain" | "custom";
/** Reading direction reflected onto `<html dir>`; drives RTL mirroring of logical layouts. */
export type AppearanceDir = "ltr" | "rtl";
/** UI spacing scale: comfortable (default) or compact (denser tables/cards). */
export type AppearanceDensity = "comfortable" | "compact";
/** Main content sizing: fluid (full width, default) or boxed (centered, max-width). */
export type AppearanceContentWidth = "fluid" | "boxed";
/**
 * Shell chrome arrangement, reflected onto `<html data-layout>`. The single `nav.ts`
 * stays the source — only `app-shell.tsx` rendering changes. `vertical` (default) is the
 * current sidebar shell; below `lg` every variant collapses to the burger drawer.
 */
export type AppearanceLayout =
  "vertical" | "horizontal" | "detached" | "two-column" | "hovered";

/** Theme-agnostic fine-tune knobs injected as CSS-var overrides on :root. */
export interface AppearanceTokens {
  /** Surface backdrop blur, px (0–48). */
  blur: number;
  /** Corner radius, px (6–24). */
  radius: number;
  /** Backdrop saturation, % (100–220). */
  saturate: number;
  /** Accent colour, hex (#rrggbb). */
  accent: string;
}

export interface AppearanceSettings {
  style: AppearanceStyle;
  /** Reading direction; reflected onto `<html dir>` so logical layouts mirror in RTL. */
  dir: AppearanceDir;
  bgLight: AppearanceBg;
  bgDark: AppearanceBg;
  /** Media path for the custom light background (used when bgLight === 'custom'). */
  customLight: string | null;
  customDark: string | null;
  /** UI spacing scale; reflected onto `<html data-density>` so spacing tightens app-wide. */
  density: AppearanceDensity;
  /** Main content sizing; reflected onto `<html data-content-width>` (boxed = centered). */
  contentWidth: AppearanceContentWidth;
  /** Shell chrome arrangement; reflected onto `<html data-layout>` and branched in app-shell. */
  layout: AppearanceLayout;
  tokens: AppearanceTokens;
}

/* ---- users & roles (D:users §3,6 · UI:users-roles) ---- */

export interface UserListItem {
  id: number;
  name: string;
  email: string;
  role: MeRole;
  is_active: boolean;
  last_login_at: string | null;
  /** Server-decided impersonation eligibility (C3 §10): false for self, inactive, and impersonator roles. */
  impersonatable: boolean;
  /** The acting user's own row — role/active are locked in the editor (D:users §4). */
  is_self: boolean;
  /** The only active user on the admin role — "Deactivate" is disabled with a hint (D:users §4). */
  is_last_admin: boolean;
}

export interface UserDetail {
  id: number;
  name: string;
  email: string;
  role_id: number;
  ui_locale: string;
  is_active: boolean;
  is_self: boolean;
  /** Shows the «Reset 2FA» action in the editor (D:auth §6, users.manage). */
  mfa_enabled: boolean;
}

export interface UserFilters {
  page?: number;
  q?: string;
  role?: string;
  active?: "active" | "inactive";
  /** Sortable columns per UI:users-roles §2; default last_login desc. */
  sort?: "name" | "role" | "last_login";
  dir?: "asc" | "desc";
}

/** Create sends `password`; update omits it (password change is a dedicated dialog). */
export interface UserPayload {
  name: string;
  email: string;
  role_id: number;
  ui_locale: string;
  is_active?: boolean;
  password?: string;
}

/** One permission key, grouped by owning module (group = key prefix). */
export interface Permission {
  key: string;
  group: string;
}

export interface RoleDetail {
  id: number;
  key: string;
  label: string;
  is_system: boolean;
  users_count: number;
  permissions: string[];
}

export interface CreateRolePayload {
  key: string;
  label: string;
  /** Optional: copy the permission set from this role id on create (UI convenience). */
  copy_from_id?: number;
}

export interface ProfilePayload {
  name: string;
  ui_locale: string;
}

export interface ProfilePasswordPayload {
  current_password: string;
  password: string;
}

/* ---- dashboard (D:dashboard §4/§6 · UI:dashboard §2–3) ---- */

export type WidgetType = "stat" | "chart" | "list" | "status";

/** Size is a CONTENT TIER (D:dashboard §4), not a scale: sm = glance, md = base, lg = expanded (75%), xl = fullest (100%). */
export type WidgetSize = "sm" | "md" | "lg" | "xl";

/**
 * Dashboard period presets (D:dashboard §4). The window sets the aggregation
 * range, never the row/point budget. Free date range is deferred to v2.
 */
export type Period = "week" | "month" | "quarter";

export interface DashboardWidgetMeta {
  key: string;
  /** Translation key owned by the widget's module (D:dashboard §12). */
  title_key: string;
  type: WidgetType;
  size: WidgetSize;
  sort: number;
  /** Where the title links to; null → plain title. */
  route: string | null;
  /** Lucide icon slug registered by the owning module; unknown/absent → no icon chip. */
  icon?: string;
  /** True → the widget re-queries on the global period switch; state widgets omit it (no-op). */
  period_aware?: boolean;
  /** Only present in the customize payload (?role=): effective hidden flag of the role layout. */
  hidden?: boolean;
}

/** Quick action: either an SPA `route` or a client-mapped `api` call (cache.clear). */
export interface DashboardAction {
  key: string;
  label_key: string;
  icon: string;
  route?: string;
  api?: string;
  confirm?: boolean;
  /** Only present in the customize payload (?role=): effective hidden flag of the role layout. */
  hidden?: boolean;
}

export interface DashboardPayload {
  widgets: DashboardWidgetMeta[];
  actions: DashboardAction[];
}

/* Widget data shapes are fixed per archetype (D:dashboard §4) — no free markup. */

/* Enriched archetype fields are OPTIONAL (D:dashboard §4) — a widget that
 * returns only the base form still renders as before (backward compatible). */

export interface StatData {
  value: number | string;
  /** Signed percent; the module decides what "good" means by the sign. */
  delta?: number;
  series?: number[];
  /** "from → to" baseline shown under the number; does not replace `delta`. */
  compare?: { from: number | string; to: number | string; unit?: string };
  /** Progress toward a target (ring/bar); `value` must be numeric. */
  goal?: { target: number; label_key?: string };
  /** Point labels (dates) aligned to `series` for the sparkline tooltip; same length as `series`. */
  series_labels?: string[];
}

export interface ChartSeries {
  label_key: string;
  points: { x: string; y: number }[];
  /** Render this series as the "previous period" — dashed / muted. */
  dashed?: boolean;
}

export interface ChartData {
  kind: "line" | "bar";
  series: ChartSeries[];
  /** Headline number above the chart (period total + delta). */
  summary?: { total: number | string; delta?: number };
  /** Horizontal reference line (goal / average). */
  reference?: { y: number; label_key?: string };
}

export interface ListItem {
  title: string;
  hint?: string;
  url?: string;
  badge?: string;
  /** Leading visual, mutually exclusive, priority thumb → avatar → leadIcon. */
  thumb?: string;
  avatar?: string;
  /** Lucide slug for the leading icon chip. */
  leadIcon?: string;
  /** Right-aligned metric column. */
  metric?: { value: number | string; delta?: number };
  /** Star rating (0–5) rendered as a site-style amber star + number (reviews). */
  rating?: number;
  /**
   * Magnitude bar share (0–1), used only by the `ranked` list variant (e.g.
   * "Top pages"). Typically value ÷ max, so the leader fills the track. Ignored
   * by the default list layout.
   */
  share?: number;
}

/** ≤ 10 items (D:dashboard §4). */
export interface ListData {
  items: ListItem[];
  /**
   * `ranked` renders a structured leaderboard — position number + magnitude bar
   * per row (analytics "top X" lists). Absent = the default single-line list.
   */
  variant?: "ranked";
}

export interface StatusRow {
  label_key: string;
  value: string;
  state: "ok" | "warn" | "error";
  /** SPA route — the row becomes a link. */
  url?: string;
  /** Signed mini-percent shown next to the value. */
  trend?: number;
}

export interface StatusData {
  rows: StatusRow[];
}

export type WidgetData = StatData | ChartData | ListData | StatusData;

export interface WidgetLayoutOverride {
  size?: WidgetSize;
  sort?: number;
  hidden?: boolean;
}

/** Quick actions have no size tier — only order + visibility (D:dashboard §3). */
export interface ActionLayoutOverride {
  sort?: number;
  hidden?: boolean;
}

/**
 * Role layout overrides on top of registration defaults (D:dashboard §3).
 * Nested by kind so widget/action keys never collide and actions can't carry `size`.
 */
export interface LayoutOverrides {
  widgets: Record<string, WidgetLayoutOverride>;
  actions?: Record<string, ActionLayoutOverride>;
}

/* Help (D:help, C11): user docs of enabled modules, read-only. */

export interface HelpArticleRef {
  module: string;
  page: string;
  title: string;
}

export interface HelpGroup {
  key: string;
  label: string;
  articles: HelpArticleRef[];
}

export interface HelpArticle {
  module: string;
  page: string;
  title: string;
  section: string;
  /** True when ui_locale had no translation and source_locale text is shown (C11 §4). */
  is_fallback: boolean;
  markdown: string;
  prev: HelpArticleRef | null;
  next: HelpArticleRef | null;
}

export interface HelpSearchHit extends HelpArticleRef {
  section: string;
  snippet: string;
}

/* ---- ai (D:ai §3–5 · UI:ai §2–4) ---- */

export interface AiUsageSummary {
  tokens: number;
  /** Dollars; the server aggregates ai_usage.cost_minor per conversation. */
  cost: number;
  /** Models that actually answered (ai_usage.model per call, D:ai §3). */
  models: string[];
}

export interface AiConversationListItem {
  id: number;
  /** Null until the first user message names the conversation. */
  title: string | null;
  updated_at: string;
  tokens: number;
  cost: number;
}

export interface AiTurnUsage {
  tokens: number;
  cost: number;
  model: string;
}

export interface AiToolCall {
  tool: string;
  status: "running" | "done" | "error";
  params: Record<string, unknown>;
  result?: unknown;
}

/** Server-hydrated entity card (ChatPresenters, D:ai §4a) — data fields absent on a stub. */
export interface AiCardView {
  entity_type: string;
  id: number;
  stub?: "no_access" | "deleted";
  title?: string;
  subtitle?: string;
  preview_url?: string;
  badges?: string[];
  route?: string;
  /** Public page of the published entity, provided by the presenter — never guessed by the LLM. */
  public_url?: string;
}

export interface AiBlockButton {
  label: string;
  kind: "route" | "tool" | "url";
  style: "primary" | "secondary" | "danger";
  route?: string;
  url?: string;
  /** Foreign domain — rendered with an external-link icon (D:ai §4a). */
  external?: boolean;
  tool?: string;
  args?: Record<string, unknown>;
}

/** Fixed chat-block set (D:ai §4a) — rendered by fixed SPA components, never free markup. */
export type AiBlock =
  | {
      type: "link";
      label: string;
      route?: string;
      url?: string;
      external?: boolean;
    }
  | { type: "buttons"; items: AiBlockButton[] }
  | { type: "card"; card: AiCardView }
  | { type: "card_list"; items: AiCardView[] }
  | { type: "image"; media_id: number; alt?: string; preview_url?: string }
  | { type: "video"; media_id: number; label?: string; poster_url?: string }
  | {
      type: "file";
      media_id: number;
      label?: string;
      name: string;
      size: number;
    }
  | { type: "table"; columns: string[]; rows: string[][] }
  | { type: "progress"; job_id: number; label: string; percent: number };

export interface AiPlanStep {
  tool: string;
  summary: string;
}

export type AiPlanStatus = "pending" | "approved" | "rejected" | "superseded";

/** Mutation gate (D:ai §4b): shown before the first write/destructive call of a turn. */
export interface AiPlan {
  id: number;
  description: string;
  steps: AiPlanStep[];
  /** ≈ dollars (UsageMeter::estimatePlan); null for all-read/cheap plans — no estimate shown. */
  estimated_cost: number | null;
  status: AiPlanStatus;
  /** Actual series cost after execution — «≈ $0.03 → $0.04» (D:ai §4b). */
  actual_cost: number | null;
}

export type AiConfirmStatus = "pending" | "confirmed" | "cancelled";

/** Destructive-tool confirmation card (B8 §4) — nothing runs until the user answers. */
export interface AiConfirm {
  id: number;
  tool: string;
  /** Human-readable target params (id, title…) for the yellow card's table. */
  params: Record<string, string>;
  status: AiConfirmStatus;
}

export type AiMessagePart =
  | { kind: "text"; text: string }
  | { kind: "tool"; call: AiToolCall }
  | { kind: "block"; block: AiBlock }
  | { kind: "plan"; plan: AiPlan }
  | { kind: "confirm"; confirm: AiConfirm };

export interface AiMessage {
  id: number;
  role: "user" | "assistant";
  created_at: string;
  parts: AiMessagePart[];
  /** Files the user attached (D:ai §4d): each already uploaded to the media library. */
  attachments?: AiAttachment[];
  /** Final usage of the assistant turn (SSE `done`, D:ai §5). */
  usage?: AiTurnUsage | null;
  /** Daily cost cap hit — soft message + settings link for ai.manage (UI:ai §2). */
  cost_limited?: boolean;
}

/**
 * A chat attachment (D:ai §4d): the file goes through the normal MediaService
 * upload (media.manage gated), so the message stores a `media_id`, never a raw
 * blob. `preview_url` is the media preset URL (an object URL in the mock).
 */
export interface AiAttachment {
  media_id: number;
  name: string;
  size: number;
  is_image: boolean;
  preview_url?: string;
}

export interface AiConversationDetail {
  id: number;
  title: string | null;
  updated_at: string;
  usage: AiUsageSummary;
  messages: AiMessage[];
}

/** Route + current entity of the screen under the panel (D:ai §5 screen_context). */
export interface AiScreenContext {
  route: string;
  label: string;
  type?: string;
  id?: number;
  title?: string;
}

/** SSE events of POST …/messages and …/plans/{id}/approve (D:ai §5). */
export type AiStreamEvent =
  | { type: "created"; conversation_id: number }
  | { type: "delta"; text: string }
  | { type: "tool_call"; tool: string; params: Record<string, unknown> }
  | {
      type: "tool_result";
      tool: string;
      status: "done" | "error";
      result?: unknown;
    }
  | { type: "block"; block: AiBlock }
  | { type: "plan_required"; plan: AiPlan }
  | { type: "confirm_required"; confirm: AiConfirm }
  | { type: "done"; usage: AiTurnUsage; cost_limited?: boolean };

export type AiFindingSeverity = "error" | "critical";

export type AiFindingStatus = "new" | "acknowledged" | "resolved";

/** Nightly log-triage finding (D:ai §4c, ai_log_findings). */
export interface AiFinding {
  id: number;
  severity: AiFindingSeverity;
  title: string;
  /** AI summary; null when the LLM was unavailable during triage. */
  summary: string | null;
  sample: string;
  context: Record<string, string>;
  count: number;
  first_seen: string;
  last_seen: string;
  status: AiFindingStatus;
  resolved_note: string | null;
}

export interface AiSpendPoint {
  /** Day label (site timezone, C7 §4). */
  date: string;
  cost: number;
}

/** UsageMeter::spend() aggregates for the /system/ai chart (D:ai §4). */
export interface AiSpend {
  today: number;
  week: number;
  month: number;
  series: AiSpendPoint[];
}

/* ---- shop: demo commerce catalog (orders, products, customers, payments, invoices, discounts, delivery) ----
 * Amounts are major units (not cents) with an ISO `currency` code — the same shape a
 * real store API returns; screens format via src/lib/money.ts. */

export type OrderStatus =
  "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
export type PaymentState = "paid" | "unpaid" | "partial" | "refunded";

export interface OrderListItem {
  id: number;
  number: string;
  customer_name: string;
  created_at: string;
  status: OrderStatus;
  payment_status: PaymentState;
  total: number;
  currency: string;
  items_count: number;
}

export interface OrderLineItem {
  id: number;
  name: string;
  sku: string;
  qty: number;
  price: number;
}

/** A named block on the order (customer / shipping / billing) — free-form address text. */
export interface OrderParty {
  name: string;
  email?: string;
  phone?: string;
  address: string;
}

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
}

export interface OrderTimelineEvent {
  id: number;
  at: string;
  kind: OrderStatus | "created" | "note";
  label: string;
}

export interface OrderDetail extends OrderListItem {
  customer: OrderParty;
  shipping: OrderParty;
  billing: OrderParty;
  items: OrderLineItem[];
  totals: OrderTotals;
  timeline: OrderTimelineEvent[];
  shipping_method: string;
  payment_method: string;
}

export interface OrderFilters {
  page?: number;
  q?: string;
  status?: OrderStatus;
  from?: string;
  to?: string;
  sort?: "number" | "created_at" | "total";
  dir?: "asc" | "desc";
}

export type ProductStatus = "active" | "draft" | "archived";

export interface ProductListItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  currency: string;
  stock: number;
  status: ProductStatus;
  image?: string;
}

export interface Product extends ProductListItem {
  description: string;
  category: string;
  cost: number;
  compare_at_price: number | null;
  weight: number;
}

export interface ProductFilters {
  page?: number;
  q?: string;
  status?: ProductStatus;
  sort?: "name" | "price" | "stock";
  dir?: "asc" | "desc";
}

/** Editor payload — id absent on create. */
export interface ProductPayload {
  name: string;
  sku: string;
  description: string;
  status: ProductStatus;
  price: number;
  compare_at_price: number | null;
  cost: number;
  stock: number;
  category: string;
  weight: number;
  image?: string;
}

export type CustomerStatus = "active" | "vip" | "blocked";

export interface CustomerListItem {
  id: number;
  name: string;
  email: string;
  orders_count: number;
  ltv: number;
  currency: string;
  status: CustomerStatus;
  joined_at: string;
}

export interface CustomerNote {
  id: number;
  at: string;
  author: string;
  text: string;
}

export interface CustomerDetail extends CustomerListItem {
  phone: string;
  address: string;
  aov: number;
  recent_orders: OrderListItem[];
  notes: CustomerNote[];
}

export interface CustomerFilters {
  page?: number;
  q?: string;
  status?: CustomerStatus;
  sort?: "name" | "orders_count" | "ltv" | "joined_at";
  dir?: "asc" | "desc";
}

export type PaymentTxnStatus = "captured" | "pending" | "refunded" | "failed";
export type PaymentMethod = "card" | "paypal" | "transfer" | "cash";

export interface Payment {
  id: number;
  txn: string;
  order_number: string;
  customer_name: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: PaymentTxnStatus;
  created_at: string;
}

/** KPI row above the payments table (all figures in `currency`). */
export interface PaymentStats {
  captured: number;
  refunded: number;
  pending: number;
  currency: string;
}

export interface PaymentFilters {
  page?: number;
  q?: string;
  status?: PaymentTxnStatus;
  method?: PaymentMethod;
  from?: string;
  to?: string;
  sort?: "created_at" | "amount";
  dir?: "asc" | "desc";
}

export type InvoiceStatus = "paid" | "overdue" | "draft" | "sent";

export interface InvoiceListItem {
  id: number;
  number: string;
  customer_name: string;
  issued_at: string;
  due_at: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
}

export interface InvoiceDetail extends InvoiceListItem {
  issuer: OrderParty;
  recipient: OrderParty;
  items: OrderLineItem[];
  totals: OrderTotals;
  notes: string;
}

export interface InvoiceFilters {
  page?: number;
  q?: string;
  status?: InvoiceStatus;
  sort?: "number" | "issued_at" | "amount";
  dir?: "asc" | "desc";
}

export type DiscountType = "percent" | "fixed";
export type DiscountStatus = "active" | "scheduled" | "expired" | "disabled";

export interface Discount {
  id: number;
  code: string;
  type: DiscountType;
  value: number;
  currency: string;
  used: number;
  usage_limit: number | null;
  status: DiscountStatus;
  expires_at: string | null;
}

export interface DiscountPayload {
  code: string;
  type: DiscountType;
  value: number;
  usage_limit: number | null;
  status: DiscountStatus;
  expires_at: string | null;
}

export interface DeliveryMethod {
  id: number;
  name: string;
  zone: string;
  rate: number;
  currency: string;
  eta_days: number;
  active: boolean;
}

export interface DeliveryPayload {
  name: string;
  zone: string;
  rate: number;
  eta_days: number;
  active: boolean;
}

/* ---- ecommerce extension (W3): cart, checkout, sellers, reviews ---- */

export interface ProductReview {
  id: number;
  author: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  name: string;
  variant: string | null;
  image?: string;
  price: number;
  qty: number;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Cart {
  items: CartItem[];
  currency: string;
  promo: string | null;
  totals: CartTotals;
}

export interface ShippingMethod {
  id: string;
  name: string;
  eta: string;
  price: number;
  currency: string;
}

/** Address block collected in checkout / used as the order recipient. */
export interface CheckoutAddress {
  name: string;
  phone: string;
  country: string;
  address: string;
  city: string;
  zip: string;
}

export interface PlaceOrderPayload {
  address: CheckoutAddress;
  shipping_method: string;
  /** Price of the selected shipping method; the order total is recomputed with it. */
  shipping_price?: number;
  payment_method: string;
}

export type SellerStatus = "active" | "pending" | "suspended";

export interface SellerListItem {
  id: number;
  name: string;
  logo_color: string;
  products_count: number;
  revenue: number;
  currency: string;
  rating: number;
  status: SellerStatus;
  joined_at: string;
}

export interface SellerDetail extends SellerListItem {
  email: string;
  phone: string;
  location: string;
  about: string;
  sales_count: number;
}

export interface SellerFilters {
  page?: number;
  q?: string;
  status?: SellerStatus;
  sort?: "name" | "products_count" | "revenue" | "rating" | "joined_at";
  dir?: "asc" | "desc";
}

/** Create Invoice draft payload (W3). */
export interface InvoiceDraftLine {
  description: string;
  qty: number;
  price: number;
}

export interface InvoiceDraft {
  issuer: OrderParty;
  recipient: OrderParty;
  items: InvoiceDraftLine[];
  tax_rate: number;
  discount: number;
  notes: string;
}

/* ---- analytics dashboard (build-demo-screen-catalog) ---- */

export interface AnalyticsKpi {
  /** Latest value in its natural unit; `format` tells the screen how to render it. */
  value: number;
  /** Period-over-period change as a fraction (0.12 = +12%). */
  delta: number;
}

export interface AnalyticsKpis {
  sessions: AnalyticsKpi;
  revenue: AnalyticsKpi;
  conversion: AnalyticsKpi;
  aov: AnalyticsKpi;
}

export interface AnalyticsPoint {
  label: string;
  revenue: number;
  sessions: number;
}

export interface AnalyticsNamedValue {
  name: string;
  value: number;
}

export interface AnalyticsFunnelStep {
  key: string;
  value: number;
}

export interface AnalyticsPayload {
  period: Period;
  currency: string;
  kpis: AnalyticsKpis;
  revenue_series: AnalyticsPoint[];
  channels: AnalyticsNamedValue[];
  top_products: AnalyticsNamedValue[];
  funnel: AnalyticsFunnelStep[];
}

/* ---- dashboard verticals (build-w2-screens-dashboard-verticals) ---- */

/** The seven period-scoped vertical dashboards under /dashboards/*. */
export type DashboardVertical =
  "crm" | "ecommerce" | "crypto" | "projects" | "nft" | "jobs" | "blog" | "ai";

/** KPI tile value + period-over-period change as a fraction (0.12 = +12%). */
export interface DashKpi {
  value: number;
  delta: number;
  /** Optional axis-less trend series rendered as a mini sparkline in the tile. */
  spark?: number[];
}

/** Ranked-list / category-bar / funnel-step row: a label and a magnitude. */
export interface RankedRow {
  label: string;
  value: number;
  /** Optional secondary hint rendered muted (e.g. a 24h % or a category). */
  hint?: string;
}

/** Leaderboard row: a person, a headline metric and an optional quota target. */
export interface LeaderRow {
  name: string;
  avatar?: string;
  metric: number;
  /** Target the metric is measured against; renders a quota progress bar. */
  quota?: number;
}

/** Generic single-series time point (trend / sparkline / volume). */
export interface SeriesPoint {
  label: string;
  value: number;
}

/** Five-number summary for a box-and-whisker distribution (structurally matches the BoxPlot chart). */
export interface BoxPlotDatum {
  label: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

/** Open/high/low/close candle for the crypto candlestick. */
export interface OhlcPoint {
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CrmActivityRow {
  id: number;
  task: string;
  contact: string;
  /** ISO date the task is due. */
  due: string;
}

/** Touch-activity heatmap: interaction counts per channel × weekday. */
export interface CrmTouchHeatmap {
  /** i18n leaf keys for the touch channels (heatmap rows, top → bottom). */
  channels: string[];
  /** Counts: values[channel][weekday], weekday 0=Mon … 6=Sun. */
  values: number[][];
}

export interface CrmDashboardPayload {
  period: Period;
  currency: string;
  kpis: {
    leads: DashKpi;
    dealsWon: DashKpi;
    revenue: DashKpi;
    conversion: DashKpi;
  };
  /** Closed revenue over the period (hero trend). */
  trend: SeriesPoint[];
  /** Interaction intensity by channel and weekday. */
  touches: CrmTouchHeatmap;
  /** Deal stages by count. */
  funnel: RankedRow[];
  /** Open pipeline value by stage/owner (money). */
  pipeline: RankedRow[];
  activities: CrmActivityRow[];
  /** Top salespeople: metric = amount closed, quota = target. */
  leaders: LeaderRow[];
}

export interface DashOrderRow {
  id: number;
  code: string;
  customer: string;
  total: number;
  status: OrderStatus;
}

/** Sales-intensity heatmap: order counts per weekday × hour-of-day bucket. */
export interface SalesHeatmap {
  /** Hour-of-day bucket labels (x axis), e.g. "00", "03". */
  hours: string[];
  /** Order counts: values[weekday 0=Mon … 6=Sun][hour bucket]. */
  values: number[][];
}

export interface EcommerceDashboardPayload {
  period: Period;
  currency: string;
  kpis: {
    revenue: DashKpi;
    orders: DashKpi;
    aov: DashKpi;
    refunds: DashKpi;
  };
  revenue: SeriesPoint[];
  /** Order intensity by weekday and hour. */
  salesHeatmap: SalesHeatmap;
  categories: RankedRow[];
  recentOrders: DashOrderRow[];
  topProducts: RankedRow[];
  sources: RankedRow[];
}

export interface CryptoCoinRow {
  id: string;
  name: string;
  symbol: string;
  price: number;
  /** 24h price change as a fraction. */
  change24h: number;
  /** Axis-less sparkline series. */
  spark: number[];
}

export interface CryptoActivityRow {
  id: number;
  side: "buy" | "sell";
  asset: string;
  amount: number;
  /** ISO timestamp. */
  at: string;
}

export interface CryptoWatchRow {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

export interface CryptoDashboardPayload {
  period: Period;
  currency: string;
  portfolio: {
    value: number;
    /** 24h change as a fraction. */
    delta: number;
  };
  coins: CryptoCoinRow[];
  /** Market-cap treemap slices (value = market cap in currency). */
  marketCap: RankedRow[];
  /** Selected pair label, e.g. "BTC/USD". */
  pair: string;
  ohlc: OhlcPoint[];
  /** Trade volume per candle, aligned to `ohlc` labels. */
  volumes: SeriesPoint[];
  activity: CryptoActivityRow[];
  watchlist: CryptoWatchRow[];
}

export interface BurndownPoint {
  label: string;
  remaining: number;
  ideal: number;
}

export interface ProjectProgressRow {
  id: number;
  name: string;
  /** Completion as a fraction. */
  progress: number;
  /** ISO deadline date. */
  deadline: string;
}

export interface ProjectActivityRow {
  id: number;
  title: string;
  meta: string;
  at: string;
  kind: "success" | "info" | "warning" | "default";
}

export interface ProjectsDashboardPayload {
  period: Period;
  currency: string;
  kpis: {
    active: DashKpi;
    completed: DashKpi;
    overdue: DashKpi;
    teamLoad: DashKpi;
  };
  burndown: BurndownPoint[];
  /** Tasks by status (donut). */
  statusSplit: RankedRow[];
  /** Task-duration distribution per workflow stage (box-and-whisker, in days). */
  durations: BoxPlotDatum[];
  projects: ProjectProgressRow[];
  /** Assigned tasks per team member. */
  workload: RankedRow[];
  activity: ProjectActivityRow[];
}

export interface NftCollectionRow {
  id: number;
  name: string;
  floor: number;
  change24h: number;
}

export interface NftAuctionRow {
  id: number;
  name: string;
  bid: number;
  /** ISO timestamp the auction ends. */
  endsAt: string;
}

export interface NftDashboardPayload {
  period: Period;
  /** Native token label used for floor/volume amounts (e.g. "ETH"). */
  token: string;
  currency: string;
  kpis: {
    floor: DashKpi;
    volume: DashKpi;
    sales: DashKpi;
    wallets: DashKpi;
  };
  volume: SeriesPoint[];
  /** Market-share treemap slices (value = share of trading volume). */
  marketShare: RankedRow[];
  collections: NftCollectionRow[];
  auctions: NftAuctionRow[];
  /** Top creators: metric = trading volume (token). */
  creators: LeaderRow[];
}

export type JobApplicantStage =
  "applied" | "screening" | "interview" | "offer" | "hired";

export interface JobApplicantRow {
  id: number;
  name: string;
  role: string;
  stage: JobApplicantStage;
}

export interface JobsDashboardPayload {
  period: Period;
  kpis: {
    openRoles: DashKpi;
    applicants: DashKpi;
    hires: DashKpi;
    timeToFill: DashKpi;
  };
  applications: SeriesPoint[];
  departments: RankedRow[];
  /** Salary-range distribution per department (box-and-whisker, annual money). */
  salaries: BoxPlotDatum[];
  /** Candidate pipeline stages by count (funnel). */
  pipeline: RankedRow[];
  applicants: JobApplicantRow[];
}

export interface BlogTopPostRow {
  id: number;
  title: string;
  views: number;
}

export interface BlogCommentRow {
  id: number;
  author: string;
  excerpt: string;
  at: string;
}

/** Publishing/engagement heatmap: intensity per week × weekday. */
export interface BlogEngagement {
  /** Week bucket labels (y axis, rows), e.g. "1" … "6". */
  weeks: string[];
  /** Engagement intensity: values[week][weekday 0=Mon … 6=Sun]. */
  values: number[][];
}

export interface BlogDashboardPayload {
  period: Period;
  kpis: {
    posts: DashKpi;
    views: DashKpi;
    subscribers: DashKpi;
    comments: DashKpi;
  };
  views: SeriesPoint[];
  /** Engagement intensity by week and weekday. */
  engagement: BlogEngagement;
  categories: RankedRow[];
  topPosts: BlogTopPostRow[];
  comments: BlogCommentRow[];
  /** Top authors: metric = total views. */
  authors: LeaderRow[];
}

/** LLM latency / request-volume trends + a requests-by-weekday×hour heatmap. */
export interface AiPerformance {
  /** Average response latency per day, in milliseconds. */
  latency: SeriesPoint[];
  /** Request volume per day. */
  requests: SeriesPoint[];
  /** Request intensity: hour-bucket labels + values[weekday 0=Mon … 6=Sun][hour bucket]. */
  heatmap: { hours: string[]; values: number[][] };
}

export interface AiDashboardPayload {
  period: Period;
  currency: string;
  kpis: {
    tokens: DashKpi;
    cost: DashKpi;
    conversations: DashKpi;
    /** Average cost per conversation. */
    avgCost: DashKpi;
  };
  /** Daily spend over the period (hero trend), from ai spend. */
  spend: SeriesPoint[];
  /** Cost share by model (donut). */
  modelSplit: RankedRow[];
  /** Top conversations by cost. */
  topConversations: RankedRow[];
  /** Tool-call counts by tool. */
  toolUsage: RankedRow[];
  /** Open AI findings (error/critical) surfaced from the assistant. */
  findings: AiFinding[];
  performance: AiPerformance;
}

/** Per-vertical payload lookup so api.dashboards.get is typed by vertical. */
export interface DashboardPayloadMap {
  crm: CrmDashboardPayload;
  ecommerce: EcommerceDashboardPayload;
  crypto: CryptoDashboardPayload;
  projects: ProjectsDashboardPayload;
  nft: NftDashboardPayload;
  jobs: JobsDashboardPayload;
  blog: BlogDashboardPayload;
  ai: AiDashboardPayload;
}

/* ---- inbox / chat (build-demo-screen-catalog) ---- */

export type InboxFolder = "inbox" | "starred" | "sent" | "archived";

export interface InboxThreadListItem {
  id: number;
  subject: string;
  /** Display name of the other participant. */
  participant: string;
  /** Snippet of the most recent message. */
  preview: string;
  last_at: string;
  unread: boolean;
  folder: InboxFolder;
  /** i18n leaf keys under inbox.label.* */
  labels: string[];
}

export interface InboxMessage {
  id: number;
  author: string;
  /** True when the message was sent by the current operator (right-aligned bubble). */
  from_me: boolean;
  body: string;
  at: string;
}

export interface InboxThread {
  id: number;
  subject: string;
  participant: string;
  email: string;
  folder: InboxFolder;
  labels: string[];
  messages: InboxMessage[];
}

/** List payload: the visible threads for a folder + unread counts for every folder rail badge. */
export interface InboxListPayload {
  threads: InboxThreadListItem[];
  counts: Record<InboxFolder, number>;
}

/* ---- kanban board (build-demo-screen-catalog) ---- */

export interface KanbanCard {
  id: string;
  title: string;
  /** Assignee display name; null → unassigned. */
  assignee: string | null;
  /** i18n leaf keys under kanban.label.* */
  labels: string[];
  due_at: string | null;
}

export interface KanbanColumn {
  id: string;
  /** i18n leaf key under kanban.column.* */
  title_key: string;
  card_ids: string[];
}

export interface KanbanBoard {
  columns: KanbanColumn[];
  cards: Record<string, KanbanCard>;
}

/* ---- W1 utility pages (team, timeline, FAQ) ---- */

export interface TeamMemberSocials {
  twitter?: string;
  github?: string;
  linkedin?: string;
  dribbble?: string;
}

export interface TeamMember {
  id: number;
  name: string;
  initials: string;
  title: string;
  /** Filter key under team.department.* */
  department: string;
  email: string;
  /** Avatar fallback swatch (token-safe demo color). */
  color: string;
  socials: TeamMemberSocials;
}

export type TimelineCategory = "release" | "update" | "meeting" | "note";

export interface TimelineEvent {
  id: number;
  date: string;
  title: string;
  description: string;
  category: TimelineCategory;
  actor: string | null;
}

export interface FaqEntry {
  id: number;
  /** Category key under faq.category.* */
  category: string;
  question: string;
  answer: string;
}

export type SearchResultType = "page" | "user" | "media";

export interface SearchResultItem {
  id: number;
  type: SearchResultType;
  title: string;
  hint: string;
  url: string;
}

export type GalleryCategory = "nature" | "city" | "abstract" | "people";

export interface GalleryPhoto {
  id: number;
  category: GalleryCategory;
  /** Gradient stops for the generated placeholder artwork (data, not UI chrome). */
  from: string;
  to: string;
  /** Width / height aspect ratio of the placeholder. */
  ratio: number;
}

/* ---- W1 blog ---- */

export interface BlogAuthor {
  name: string;
  initials: string;
}

export interface BlogListItem {
  id: number;
  title: string;
  excerpt: string;
  coverColor: string;
  /** Category key under blog.category.* */
  category: string;
  author: BlogAuthor;
  date: string;
  tags: string[];
  readMinutes: number;
}

export interface BlogComment {
  id: number;
  author: string;
  initials: string;
  date: string;
  body: string;
}

export interface BlogPost extends BlogListItem {
  /** Article body as ordered paragraphs. */
  body: string[];
  related: BlogListItem[];
  comments: BlogComment[];
}

export interface BlogListParams {
  page?: number;
  q?: string;
  category?: string;
}

/* ---- projects (W3) ---- */

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";

export interface ProjectTeamMember {
  id: number;
  name: string;
}

export interface ProjectListItem {
  id: number;
  name: string;
  client: string;
  status: ProjectStatus;
  /** Completion percentage 0–100. */
  progress: number;
  deadline: string;
  team: ProjectTeamMember[];
}

export interface Milestone {
  id: number;
  title: string;
  due: string;
  done: boolean;
}

export interface ProjectTaskRow {
  id: number;
  title: string;
  assignee: string;
  status: TaskStatus;
  due: string;
}

export interface ProjectFile {
  id: number;
  name: string;
  size: number;
  uploaded_at: string;
}

export interface ProjectActivityEntry {
  id: number;
  at: string;
  text: string;
}

export interface ProjectDetail extends ProjectListItem {
  description: string;
  start_date: string;
  budget: number;
  budget_used: number;
  currency: string;
  tasks_total: number;
  tasks_done: number;
  tags: string[];
  milestones: Milestone[];
  activity: ProjectActivityEntry[];
}

export interface ProjectFilters {
  page?: number;
  q?: string;
  status?: ProjectStatus;
  sort?: "name" | "deadline" | "progress";
  dir?: "asc" | "desc";
}

export interface ProjectPayload {
  name: string;
  client: string;
  description: string;
  start_date: string;
  end_date: string;
  budget: number;
  team: number[];
  status: ProjectStatus;
  tags: string[];
}

/* ---- tasks (W3) ---- */

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskListItem {
  id: number;
  title: string;
  project: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  due: string;
}

export interface Subtask {
  id: number;
  title: string;
  done: boolean;
}

export interface TaskComment {
  id: number;
  author: string;
  at: string;
  body: string;
}

export interface TaskDetail extends TaskListItem {
  description: string;
  labels: string[];
  subtasks: Subtask[];
  comments: TaskComment[];
  created_at: string;
}

export interface TaskFilters {
  page?: number;
  q?: string;
  project?: string;
  assignee?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  sort?: "title" | "due" | "priority";
  dir?: "asc" | "desc";
}

/* ---- CRM (W3) ---- */

export type DealStage =
  "new" | "qualified" | "proposal" | "negotiation" | "won";

export interface CrmActivity {
  id: number;
  at: string;
  text: string;
}

export interface CrmContact {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  tags: string[];
  owner: string;
  last_activity: string;
}

export interface CrmContactDeal {
  id: number;
  title: string;
  value: number;
  stage: DealStage;
}

export interface CrmContactDetail extends CrmContact {
  activity: CrmActivity[];
  deals: CrmContactDeal[];
}

export interface CrmContactPayload {
  name: string;
  company: string;
  email: string;
  phone: string;
  owner: string;
  tags: string[];
}

export interface CrmContactFilters {
  page?: number;
  q?: string;
  tag?: string;
  owner?: string;
  sort?: "name" | "company" | "last_activity";
  dir?: "asc" | "desc";
}

export interface CompanyListItem {
  id: number;
  name: string;
  industry: string;
  size: string;
  logo_color: string;
  contacts_count: number;
  deals_value: number;
  currency: string;
  owner: string;
}

export interface CompanyContact {
  id: number;
  name: string;
}

export interface CompanyDeal {
  id: number;
  title: string;
  value: number;
}

export interface CompanyDetail extends CompanyListItem {
  notes: string;
  contacts: CompanyContact[];
  deals: CompanyDeal[];
}

export interface CompanyPayload {
  name: string;
  industry: string;
  size: string;
  owner: string;
}

export interface CompanyFilters {
  page?: number;
  q?: string;
  sort?: "name" | "deals_value" | "contacts_count";
  dir?: "asc" | "desc";
}

export interface Deal {
  id: number;
  title: string;
  value: number;
  currency: string;
  company: string;
  owner: string;
  probability: number;
  stage: DealStage;
}

export type LeadStatus = "new" | "contacted" | "qualified" | "unqualified";

export interface Lead {
  id: number;
  name: string;
  source: string;
  score: number;
  status: LeadStatus;
  owner: string;
  created_at: string;
}

export interface LeadFilters {
  page?: number;
  q?: string;
  status?: LeadStatus;
  source?: string;
  sort?: "name" | "score" | "created_at";
  dir?: "asc" | "desc";
}

/* ---- calendar (W3) ---- */

export type EventCategory =
  "work" | "personal" | "meeting" | "reminder" | "holiday";

export interface CalendarEvent {
  id: number;
  title: string;
  /** ISO datetime. */
  start: string;
  end: string;
  category: EventCategory;
  all_day: boolean;
  description: string;
}

export interface CalendarEventPayload {
  id?: number;
  title: string;
  start: string;
  end: string;
  category: EventCategory;
  all_day: boolean;
  description: string;
}

/* ---- email / mailbox (W3) ---- */

export type MailFolder = "inbox" | "sent" | "drafts" | "spam" | "trash";

export interface MailMessage {
  id: number;
  folder: MailFolder;
  from_name: string;
  from_email: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  unread: boolean;
  starred: boolean;
  labels: string[];
  attachments: string[];
}

export interface MailListPayload {
  messages: MailMessage[];
  counts: Record<MailFolder, number>;
}

export interface MailSendPayload {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
}

/* ---- support tickets (W3) ---- */

export type TicketStatus = "open" | "pending" | "solved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface TicketListItem {
  id: number;
  subject: string;
  requester: string;
  priority: TicketPriority;
  status: TicketStatus;
  agent: string;
  updated_at: string;
}

export interface TicketMessage {
  id: number;
  author: string;
  role: "agent" | "customer";
  at: string;
  body: string;
}

export interface TicketActivity {
  id: number;
  at: string;
  text: string;
}

export interface TicketDetail extends TicketListItem {
  requester_email: string;
  created_at: string;
  tags: string[];
  messages: TicketMessage[];
  activity: TicketActivity[];
}

export interface TicketPayload {
  subject: string;
  requester: string;
  priority: TicketPriority;
  message: string;
}

export interface TicketFilters {
  page?: number;
  q?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  agent?: string;
  sort?: "subject" | "updated_at";
  dir?: "asc" | "desc";
}

export interface TicketStats {
  open: number;
  pending: number;
  avg_response: string;
}

/* ---- to-do (W3) ---- */

export type TodoPriority = "low" | "medium" | "high";

export interface TodoItem {
  id: number;
  title: string;
  done: boolean;
  priority: TodoPriority;
  due: string | null;
}

export interface TodoStats {
  total: number;
  done: number;
  overdue: number;
}

/* ---- api keys (W3) ---- */

export type ApiKeyStatus = "active" | "revoked";
export type ApiKeyScope = "read" | "write" | "admin" | "billing";

export interface ApiKey {
  id: number;
  name: string;
  masked_key: string;
  scopes: ApiKeyScope[];
  created_at: string;
  last_used_at: string | null;
  status: ApiKeyStatus;
}

export interface ApiKeyCreatePayload {
  name: string;
  scopes: ApiKeyScope[];
}

export interface ApiKeyCreated {
  key: ApiKey;
  /** Shown exactly once; never persisted. */
  secret: string;
}

/* ---- crypto (W4 mono-niche) ---- */

export type CryptoTxType = "buy" | "sell" | "transfer";
export type CryptoTxStatus = "completed" | "pending" | "failed";

export interface CryptoTx {
  id: number;
  date: string;
  type: CryptoTxType;
  coin: string;
  amount: number;
  value: number;
  currency: string;
  status: CryptoTxStatus;
  hash: string;
}

export interface CryptoTxFilters {
  page?: number;
  q?: string;
  coin?: string;
  type?: CryptoTxType;
  from?: string;
  to?: string;
  sort?: "date" | "value";
  dir?: "asc" | "desc";
}

export interface CryptoMarket {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  currency: string;
  spark: number[];
}

export interface CryptoQuote {
  pair: string;
  amount: number;
  price: number;
  subtotal: number;
  fee: number;
  total: number;
  currency: string;
}

export interface CryptoTradePayload {
  pair: string;
  side: "buy" | "sell";
  amount: number;
}

export type CryptoOrderSide = "buy" | "sell";
export type CryptoOrderStatus = "open" | "filled" | "cancelled";

export interface CryptoOrder {
  id: number;
  pair: string;
  side: CryptoOrderSide;
  price: number;
  amount: number;
  filled: number;
  status: CryptoOrderStatus;
  created_at: string;
  currency: string;
}

export interface Holding {
  symbol: string;
  name: string;
  amount: number;
  price: number;
  value: number;
  change24h: number;
  spark: number[];
  address: string;
}

export interface Wallet {
  total_value: number;
  change_24h: number;
  currency: string;
  holdings: Holding[];
  allocation: Array<{ label: string; value: number }>;
}

export interface CryptoDepositPayload {
  coin: string;
  amount: number;
}

export interface CryptoWithdrawPayload {
  coin: string;
  amount: number;
  address: string;
}

export type IcoStatus = "upcoming" | "active" | "ended";

export interface Ico {
  id: number;
  name: string;
  symbol: string;
  logo_color: string;
  description: string;
  price: number;
  currency: string;
  raised: number;
  goal: number;
  start_at: string;
  end_at: string;
  status: IcoStatus;
}

export interface IcoFilters {
  status?: IcoStatus;
}

export type KycStatus = "unverified" | "pending" | "approved" | "rejected";

export interface KycPayload {
  full_name: string;
  dob: string;
  country: string;
  id_number: string;
  documents: { front: string; back: string; selfie: string };
}

export interface KycApplication {
  status: KycStatus;
  submitted_at: string | null;
}

/* ---- nft (W4 niche) — own image-heavy data model; art is generated gradient
 * SVG (no external hosts). Token amounts (ETH) carry a fiat estimate in `currency`. */

export type NftCategory =
  "art" | "collectibles" | "music" | "photography" | "gaming" | "sports";
export type NftChain = "ethereum" | "polygon" | "solana" | "binance";
export type NftItemStatus = "buy_now" | "on_auction" | "new" | "has_offers";

/** Deterministic two-stop gradient (placeholder art), generated per item id. */
export type NftGradient = [string, string];

export interface NftItem {
  id: number;
  name: string;
  collection: string;
  collection_id: number;
  creator: string;
  creator_id: number;
  /** Price in the native token (ETH). */
  price: number;
  token: string;
  /** Fiat estimate of `price` in `currency`. */
  fiat: number;
  currency: string;
  likes: number;
  category: NftCategory;
  chain: NftChain;
  status: NftItemStatus;
  gradient: NftGradient;
}

export interface NftItemFilters {
  page?: number;
  q?: string;
  category?: NftCategory;
  chain?: NftChain;
  status?: NftItemStatus;
  collection?: number;
  /** Price range in token units. */
  min?: number;
  max?: number;
  sort?: "recent" | "price_asc" | "price_desc" | "likes";
}

export interface NftTrait {
  type: string;
  value: string;
  /** Share of items with this trait, 0–100. */
  rarity: number;
}

export interface NftBid {
  id: number;
  bidder: string;
  amount: number;
  token: string;
  at: string;
}

export interface NftAuction {
  id: number;
  item_id: number;
  name: string;
  collection: string;
  creator: string;
  current_bid: number;
  token: string;
  fiat: number;
  currency: string;
  ends_at: string;
  bids_count: number;
  gradient: NftGradient;
}

export interface NftItemDetail extends NftItem {
  description: string;
  owner: string;
  token_id: string;
  traits: NftTrait[];
  bids: NftBid[];
  auction: NftAuction | null;
}

export interface NftCollection {
  id: number;
  name: string;
  creator: string;
  floor: number;
  volume: number;
  items_count: number;
  owners_count: number;
  token: string;
  currency: string;
  verified: boolean;
  category: NftCategory;
  gradient: NftGradient;
  avatar_gradient: NftGradient;
}

export interface NftCollectionFilters {
  q?: string;
  sort?: "volume" | "floor" | "name" | "items";
}

export interface NftCreator {
  id: number;
  name: string;
  handle: string;
  followers: number;
  items_count: number;
  volume: number;
  token: string;
  verified: boolean;
  following: boolean;
  gradient: NftGradient;
}

export interface NftCreatorFilters {
  q?: string;
  sort?: "followers" | "volume" | "items" | "name";
}

export type NftRankingPeriod = "24h" | "7d" | "30d" | "all";

export interface RankingRow {
  rank: number;
  collection_id: number;
  collection: string;
  floor: number;
  volume: number;
  /** 24h change as a fraction (0.12 = +12%). */
  change24h: number;
  owners: number;
  items: number;
  token: string;
  currency: string;
  verified: boolean;
  gradient: NftGradient;
}

export interface NftProperty {
  type: string;
  value: string;
}

export interface NftCreatePayload {
  name: string;
  description: string;
  collection_id: number;
  price: number;
  /** Royalty percentage 0–20. */
  royalties: number;
  chain: NftChain;
  category: NftCategory;
  properties: NftProperty[];
  /** File name of the uploaded art (mock — no real upload). */
  art: string;
}

export interface NftMintResult {
  id: number;
  name: string;
  status: "minted";
  token_id: string;
}

/* ---- jobs (W4 recruitment niche) — postings, candidates, companies, categories,
 * applications. Company/candidate avatars are generated gradient SVG (no external
 * hosts). Salaries carry an ISO currency code as elsewhere in the demo. */

export type JobDepartment =
  "engineering" | "sales" | "marketing" | "design" | "support";
export type JobType =
  "full_time" | "part_time" | "contract" | "internship" | "temporary";
export type JobStatus = "published" | "draft" | "closed" | "archived";
export type CandidateStage =
  "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";

/** Deterministic two-stop gradient (placeholder logo/avatar), per entity id. */
export type JobGradient = [string, string];

export interface Job {
  id: number;
  title: string;
  department: JobDepartment;
  company: string;
  company_id: number;
  type: JobType;
  location: string;
  remote: boolean;
  salary_min: number;
  salary_max: number;
  currency: string;
  applicants: number;
  status: JobStatus;
  posted_at: string;
  gradient: JobGradient;
}

export interface JobFilters {
  page?: number;
  q?: string;
  department?: JobDepartment;
  type?: JobType;
  status?: JobStatus;
  sort?: "posted" | "applicants" | "title";
  dir?: "asc" | "desc";
}

export interface JobApplicant {
  id: number;
  name: string;
  role: string;
  stage: CandidateStage;
  rating: number;
  experience: number;
  applied_at: string;
  gradient: JobGradient;
}

export interface JobDetail extends Job {
  /** HTML description (sanitized server-side on save, C3). */
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
}

export interface Candidate {
  id: number;
  name: string;
  /** Role the candidate applied for. */
  role: string;
  /** Years of experience. */
  experience: number;
  stage: CandidateStage;
  rating: number;
  applied_at: string;
  skills: string[];
  location: string;
  gradient: JobGradient;
}

export interface CandidateFilters {
  page?: number;
  q?: string;
  stage?: CandidateStage;
  sort?: "applied" | "rating" | "experience" | "name";
  dir?: "asc" | "desc";
}

export interface JobCompany {
  id: number;
  name: string;
  industry: string;
  location: string;
  size: string;
  open_roles: number;
  gradient: JobGradient;
}

export interface JobCompanyRole {
  id: number;
  title: string;
  location: string;
  type: JobType;
}

export interface JobCompanyDetail extends JobCompany {
  about: string;
  website: string;
  roles: JobCompanyRole[];
}

export interface JobCompanyFilters {
  page?: number;
  q?: string;
}

export interface JobCategory {
  id: number;
  name: string;
  slug: string;
  jobs_count: number;
}

export interface JobCategoryPayload {
  id?: number;
  name: string;
  slug: string;
}

export interface JobCreatePayload {
  title: string;
  department: JobDepartment;
  type: JobType;
  location: string;
  salary_min: number;
  salary_max: number;
  /** HTML description (sanitized server-side on save, C3). */
  description: string;
  requirements: string[];
  status: JobStatus;
}

export interface JobCreateResult {
  id: number;
  title: string;
  status: JobStatus;
}

export interface ApplicationQuestion {
  question: string;
  answer: string;
}

export interface ApplicationPayload {
  job_id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  portfolio: string;
  linkedin: string;
  /** File name of the uploaded resume (mock — no real upload). */
  resume: string;
  /** HTML cover letter (sanitized server-side on save, C3). */
  cover_letter: string;
  answers: ApplicationQuestion[];
}

export interface Application {
  id: number;
  status: "submitted";
  submitted_at: string;
}

export interface JobsStats {
  kpis: {
    openRoles: DashKpi;
    applicants: DashKpi;
    interviews: DashKpi;
    hires: DashKpi;
  };
  /** Applications trend across the period (label = bucket). */
  applications: Array<{ label: string; value: number }>;
  /** By department (label = department key). */
  departments: Array<{ label: JobDepartment; value: number }>;
  /** Candidate pipeline (label = stage key). */
  pipeline: Array<{ label: CandidateStage; value: number }>;
  recent: JobApplicant[];
}
