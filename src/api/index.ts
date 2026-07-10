import { apiFetch, apiStream } from "./client";
import type {
  AnalyticsPayload,
  BlogComment,
  BlogListItem,
  BlogListParams,
  BlogPost,
  FaqEntry,
  GalleryPhoto,
  TeamMember,
  TimelineEvent,
  InboxFolder,
  InboxListPayload,
  InboxThread,
  KanbanBoard,
  AppearanceSettings,
  ActivityEntry,
  AiConversationDetail,
  AiConversationListItem,
  AiAttachment,
  AiFinding,
  AiFindingStatus,
  AiScreenContext,
  AiSpend,
  AiStreamEvent,
  HelpArticle,
  HelpGroup,
  HelpSearchHit,
  ProjectDetail,
  ProjectFile,
  ProjectFilters,
  ProjectListItem,
  ProjectPayload,
  ProjectTaskRow,
  TaskComment,
  TaskDetail,
  TaskFilters,
  TaskListItem,
  TaskStatus,
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
  CalendarEvent,
  CalendarEventPayload,
  MailFolder,
  MailListPayload,
  MailMessage,
  MailSendPayload,
  TicketDetail,
  TicketFilters,
  TicketListItem,
  TicketPayload,
  TicketStats,
  TicketStatus,
  TodoItem,
  TodoPriority,
  ApiKey,
  ApiKeyCreatePayload,
  ApiKeyCreated,
  CryptoTx,
  CryptoTxFilters,
  CryptoMarket,
  CryptoQuote,
  CryptoTradePayload,
  CryptoOrder,
  Wallet,
  CryptoDepositPayload,
  CryptoWithdrawPayload,
  Ico,
  IcoFilters,
  KycApplication,
  KycPayload,
  NftAuction,
  NftCollection,
  NftCollectionFilters,
  NftCreatePayload,
  NftCreator,
  NftCreatorFilters,
  NftItem,
  NftItemDetail,
  NftItemFilters,
  NftMintResult,
  NftRankingPeriod,
  RankingRow,
  Application,
  ApplicationPayload,
  Candidate,
  CandidateFilters,
  Job,
  JobApplicant,
  JobCategory,
  JobCategoryPayload,
  JobCompany,
  JobCompanyDetail,
  JobCompanyFilters,
  JobCreatePayload,
  JobCreateResult,
  JobDetail,
  JobFilters,
  JobsStats,
  ActivityFilters,
  AdminSearchGroup,
  CreatePasswordPayload,
  CreateRolePayload,
  DashboardPayload,
  DashboardPayloadMap,
  DashboardVertical,
  LayoutOverrides,
  LoginPayload,
  LoginResult,
  Me,
  MfaEnrollStart,
  MfaRecoveryCodes,
  CustomerDetail,
  CustomerFilters,
  CustomerListItem,
  DeliveryMethod,
  DeliveryPayload,
  Discount,
  DiscountPayload,
  InvoiceDetail,
  InvoiceFilters,
  InvoiceListItem,
  OrderDetail,
  OrderFilters,
  OrderListItem,
  OrderStatus,
  Payment,
  PaymentFilters,
  PaymentStats,
  Period,
  Product,
  ProductFilters,
  ProductListItem,
  ProductPayload,
  ProductReview,
  Cart,
  ShippingMethod,
  PlaceOrderPayload,
  SellerDetail,
  SellerFilters,
  SellerListItem,
  InvoiceDraft,
  MediaListItem,
  MediaPresetsPayload,
  MediaRegenStatus,
  Paginated,
  Permission,
  ProfilePasswordPayload,
  ProfilePayload,
  RegisterPayload,
  ResetPayload,
  RoleDetail,
  SettingsPayload,
  SettingValue,
  UnreadCount,
  UserDetail,
  UserFilters,
  UserListItem,
  UserPayload,
  WidgetData,
} from "./types";

export {
  ApiError,
  ConflictError,
  ValidationError,
  onReloginRequired,
  resumeAfterRelogin,
} from "./client";
export type * from "./types";

export const api = {
  /** Initial-load 401 means "not logged in" (redirect), not a lost session — hence guest. */
  me: () => apiFetch<Me>("/me", { guest: true }),

  auth: {
    login: (payload: LoginPayload) =>
      apiFetch<LoginResult>("/auth/login", {
        method: "POST",
        body: payload,
        guest: true,
      }),
    /** Second step after 202 mfa_required: TOTP or a one-time recovery code (D:auth §6). */
    challenge2fa: (code: string) =>
      apiFetch<{ ok: true }>("/auth/2fa/challenge", {
        method: "POST",
        body: { code },
        guest: true,
      }),
    logout: () => apiFetch<{ ok: true }>("/auth/logout", { method: "POST" }),
    /** Sign-up (demo): creates nothing, exercises the success/validation flow. */
    register: (payload: RegisterPayload) =>
      apiFetch<{ ok: true }>("/auth/register", {
        method: "POST",
        body: payload,
        guest: true,
      }),
    /** First-time password set from an invite link. */
    createPassword: (payload: CreatePasswordPayload) =>
      apiFetch<{ ok: true }>("/auth/password/create", {
        method: "POST",
        body: payload,
        guest: true,
      }),
    /** Standalone 2-step verification (distinct from the login MFA challenge). */
    verifyOtp: (code: string) =>
      apiFetch<{ ok: true }>("/auth/verify", {
        method: "POST",
        body: { code },
        guest: true,
      }),
    /** Lock-screen re-auth: keeps the session, only re-checks the password. */
    reauth: (password: string) =>
      apiFetch<{ ok: true }>("/auth/reauth", {
        method: "POST",
        body: { password },
      }),
    forgot: (email: string) =>
      apiFetch<{ ok: true }>("/auth/forgot", {
        method: "POST",
        body: { email },
        guest: true,
      }),
    reset: (payload: ResetPayload) =>
      apiFetch<{ ok: true }>("/auth/reset", {
        method: "POST",
        body: payload,
        guest: true,
      }),
    /** Re-login keeps the session context: not a guest call, but 401 must not re-park. */
    relogin: (payload: LoginPayload) =>
      apiFetch<{ ok: true }>("/auth/login", {
        method: "POST",
        body: payload,
        guest: true,
      }),
    /** Start impersonating a user (D:auth §6, C3 §10) — eligibility is server-enforced. */
    impersonate: (id: number) =>
      apiFetch<{ ok: true }>(`/auth/impersonate/${id}`, { method: "POST" }),
    stopImpersonation: () =>
      apiFetch<{ ok: true }>("/auth/impersonate/stop", { method: "POST" }),
  },

  /* 2FA self-service (D:auth §6): no special permission, any authenticated user. */
  mfa: {
    enroll: () => apiFetch<MfaEnrollStart>("/mfa/enroll", { method: "POST" }),
    /** Returns the 10 recovery codes exactly once (D:auth §4 MfaService). */
    confirmEnroll: (code: string) =>
      apiFetch<MfaRecoveryCodes>("/mfa/enroll/confirm", {
        method: "POST",
        body: { code },
      }),
    /** Disabling requires a fresh TOTP/recovery code (D:auth §6). */
    disable: (code: string) =>
      apiFetch<{ ok: true }>("/mfa/disable", {
        method: "POST",
        body: { code },
      }),
    regenerateRecoveryCodes: () =>
      apiFetch<MfaRecoveryCodes>("/mfa/recovery-codes", { method: "POST" }),
  },

  /* Dashboard (D:dashboard §6): meta list + per-widget data + per-role layouts. */
  dashboard: {
    /** `role` is the customize-mode payload (dashboard.manage): that role's effective set incl. hidden. */
    get: (role?: string) =>
      apiFetch<DashboardPayload>("/dashboard", { query: { role } }),
    /** `period` (D:dashboard §4) is sent only for period-aware widgets; the server clamps unknown values. */
    widget: (key: string, period?: Period) =>
      apiFetch<WidgetData>(`/dashboard/widgets/${key}`, { query: { period } }),
    saveLayout: (roleKey: string, overrides: LayoutOverrides) =>
      apiFetch<{ ok: true }>(`/dashboard/layout/${roleKey}`, {
        method: "PUT",
        body: overrides,
      }),
    resetLayout: (roleKey: string) =>
      apiFetch<{ ok: true }>(`/dashboard/layout/${roleKey}`, {
        method: "DELETE",
      }),
  },

  /* Quick action «Clear cache» (UI:dashboard §3) — the only cache endpoint the SPA needs today. */
  cache: {
    clear: () => apiFetch<{ ok: true }>("/cache/clear", { method: "POST" }),
  },

  activity: {
    list: (filters: ActivityFilters = {}) =>
      apiFetch<Paginated<ActivityEntry>>("/activity", {
        query: {
          page: filters.page,
          actor_id: filters.actor_id,
          entity_type: filters.entity_type,
          action: filters.action,
          only_ai: filters.only_ai ? 1 : undefined,
          from: filters.from,
          to: filters.to,
          sort: filters.sort,
          dir: filters.dir,
        },
      }),
    restore: (id: number) =>
      apiFetch<{ ok: true }>(`/activity/${id}/restore`, { method: "POST" }),
  },

  adminSearch: (q: string) =>
    apiFetch<{ groups: AdminSearchGroup[] }>("/admin-search", { query: { q } }),

  notifications: {
    unreadCount: () => apiFetch<UnreadCount>("/notifications/unread-count"),
  },

  media: {
    list: (q: string, page: number) =>
      apiFetch<Paginated<MediaListItem>>("/media", { query: { q, page } }),
    /** Declared image presets + operator overrides for the /settings/media table (D:media §3). */
    presets: () => apiFetch<MediaPresetsPayload>("/media/presets"),
    /** Manual variant regeneration (D:media §4/§11) — start returns a job, then poll status. */
    regenerate: {
      /** Optional owner group — omit to rebuild every preset (D:media §11). */
      start: (group?: string) =>
        apiFetch<{ job_id: number; total: number }>("/media/regenerate", {
          method: "POST",
          body: group ? { group } : undefined,
        }),
      status: (jobId: number) =>
        apiFetch<MediaRegenStatus>(`/media/regenerate/${jobId}`),
    },
  },

  settings: {
    all: () => apiFetch<SettingsPayload>("/settings"),
    /** Batch of CHANGED keys only; sending '***' for a sensitive key means "keep". */
    save: (group: string, changed: Record<string, SettingValue>) =>
      apiFetch<{ ok: true }>(`/settings/${group}`, {
        method: "PUT",
        body: changed,
      }),
  },

  /** Site-wide admin appearance (E1 §2.2.1): style, backgrounds, fine-tune tokens. */
  appearance: {
    get: () => apiFetch<AppearanceSettings>("/appearance"),
    save: (payload: AppearanceSettings) =>
      apiFetch<{ ok: true }>("/appearance", { method: "PUT", body: payload }),
  },

  users: {
    list: (filters: UserFilters = {}) =>
      apiFetch<Paginated<UserListItem>>("/users", {
        query: {
          page: filters.page,
          q: filters.q,
          role: filters.role,
          active: filters.active,
          sort: filters.sort,
          dir: filters.dir,
        },
      }),
    get: (id: number) => apiFetch<UserDetail>(`/users/${id}`),
    create: (payload: UserPayload) =>
      apiFetch<UserDetail>("/users", { method: "POST", body: payload }),
    update: (id: number, payload: Partial<UserPayload>) =>
      apiFetch<UserDetail>(`/users/${id}`, { method: "PUT", body: payload }),
    deactivate: (id: number) =>
      apiFetch<{ ok: true }>(`/users/${id}/deactivate`, { method: "POST" }),
    activate: (id: number) =>
      apiFetch<{ ok: true }>(`/users/${id}/activate`, { method: "POST" }),
    /** Reset a lost 2FA device (D:auth §6): drops the secret + recovery codes; audited. */
    resetMfa: (id: number) =>
      apiFetch<{ ok: true }>(`/users/${id}/mfa/reset`, { method: "POST" }),
  },

  roles: {
    all: () => apiFetch<RoleDetail[]>("/roles"),
    /** All permission keys of enabled modules, grouped (D:users §6). */
    permissions: () => apiFetch<Permission[]>("/roles/permissions"),
    create: (payload: CreateRolePayload) =>
      apiFetch<RoleDetail>("/roles", { method: "POST", body: payload }),
    rename: (id: number, label: string) =>
      apiFetch<{ ok: true }>(`/roles/${id}`, {
        method: "PUT",
        body: { label },
      }),
    remove: (id: number) =>
      apiFetch<{ ok: true }>(`/roles/${id}`, { method: "DELETE" }),
    /** Idempotent overwrite of a role's permission set (D:users §4 syncPermissions). */
    savePermissions: (id: number, keys: string[]) =>
      apiFetch<{ ok: true }>(`/roles/${id}/permissions`, {
        method: "PUT",
        body: { permissions: keys },
      }),
  },

  profile: {
    update: (payload: ProfilePayload) =>
      apiFetch<{ ok: true }>("/profile", { method: "PUT", body: payload }),
    changePassword: (payload: ProfilePasswordPayload) =>
      apiFetch<{ ok: true }>("/profile/password", {
        method: "POST",
        body: payload,
      }),
  },

  /* AI assistant (D:ai §5): conversations, SSE streaming, plan/confirm gates, settings extras. */
  ai: {
    conversations: () =>
      apiFetch<AiConversationListItem[]>("/ai/conversations"),
    conversation: (id: number) =>
      apiFetch<AiConversationDetail>(`/ai/conversations/${id}`),
    createConversation: () =>
      apiFetch<AiConversationDetail>("/ai/conversations", { method: "POST" }),
    deleteConversation: (id: number) =>
      apiFetch<{ ok: true }>(`/ai/conversations/${id}`, { method: "DELETE" }),
    /**
     * The agent reply streams on the POST (SSE, D:ai §5). `conversationId: null`
     * opens a new conversation server-side — the `created` event carries its id.
     */
    sendMessage: (
      conversationId: number | null,
      message: string,
      screenContext: AiScreenContext | null,
      handlers: {
        onEvent: (event: AiStreamEvent) => void;
        signal?: AbortSignal;
      },
      // Already uploaded to the media library (D:ai §4d) — the message carries media_id[].
      attachments?: AiAttachment[],
    ) =>
      apiStream(`/ai/conversations/${conversationId ?? "new"}/messages`, {
        body: {
          message,
          screen_context: screenContext ?? undefined,
          attachments: attachments?.length ? attachments : undefined,
        },
        onEvent: handlers.onEvent as (event: unknown) => void,
        signal: handlers.signal,
      }),
    /** Approve streams the execution of the plan's write series (D:ai §4b/§5). */
    approvePlan: (
      planId: number,
      handlers: {
        onEvent: (event: AiStreamEvent) => void;
        signal?: AbortSignal;
      },
    ) =>
      apiStream(`/ai/plans/${planId}/approve`, {
        onEvent: handlers.onEvent as (event: unknown) => void,
        signal: handlers.signal,
      }),
    rejectPlan: (planId: number) =>
      apiFetch<{ ok: true }>(`/ai/plans/${planId}/reject`, { method: "POST" }),
    confirmAction: (id: number) =>
      apiFetch<{ ok: true }>(`/ai/actions/${id}/confirm`, { method: "POST" }),
    cancelAction: (id: number) =>
      apiFetch<{ ok: true }>(`/ai/actions/${id}/cancel`, { method: "POST" }),
    /** Suggested-tool button click (D:ai §4a kind=tool); D:ai §5 names no endpoint yet — see spec note. */
    runTool: (
      conversationId: number,
      tool: string,
      args: Record<string, unknown>,
    ) =>
      apiFetch<{ ok: true }>(`/ai/conversations/${conversationId}/tools`, {
        method: "POST",
        body: { tool, args },
      }),
    /** Test call with the saved provider/key (UI:ai §4) — toast with the result. */
    test: () => apiFetch<{ ok: boolean }>("/ai/test", { method: "POST" }),
    spend: () => apiFetch<AiSpend>("/ai/spend"),
    findings: () => apiFetch<AiFinding[]>("/ai/findings"),
    setFindingStatus: (id: number, status: AiFindingStatus, note?: string) =>
      apiFetch<{ ok: true }>(`/ai/findings/${id}/status`, {
        method: "POST",
        body: { status, note },
      }),
  },

  /* Demo commerce (build-demo-screen-catalog): orders + products catalog. */
  orders: {
    list: (filters: OrderFilters = {}) =>
      apiFetch<Paginated<OrderListItem>>("/shop/orders", {
        query: {
          page: filters.page,
          q: filters.q,
          status: filters.status,
          from: filters.from,
          to: filters.to,
          sort: filters.sort,
          dir: filters.dir,
        },
      }),
    get: (id: number) => apiFetch<OrderDetail>(`/shop/orders/${id}`),
    setStatus: (id: number, status: OrderStatus) =>
      apiFetch<OrderDetail>(`/shop/orders/${id}/status`, {
        method: "POST",
        body: { status },
      }),
    place: (payload: PlaceOrderPayload) =>
      apiFetch<OrderDetail>("/shop/orders", { method: "POST", body: payload }),
  },

  products: {
    list: (filters: ProductFilters = {}) =>
      apiFetch<Paginated<ProductListItem>>("/shop/products", {
        query: {
          page: filters.page,
          q: filters.q,
          status: filters.status,
          sort: filters.sort,
          dir: filters.dir,
        },
      }),
    get: (id: number) => apiFetch<Product>(`/shop/products/${id}`),
    create: (payload: ProductPayload) =>
      apiFetch<Product>("/shop/products", { method: "POST", body: payload }),
    update: (id: number, payload: ProductPayload) =>
      apiFetch<Product>(`/shop/products/${id}`, {
        method: "PUT",
        body: payload,
      }),
    reviews: (id: number) =>
      apiFetch<ProductReview[]>(`/shop/products/${id}/reviews`),
  },

  /* Shop cart / checkout (W3): mock session-persisted cart + order placement. */
  cart: {
    get: () => apiFetch<Cart>("/shop/cart"),
    update: (itemId: number, qty: number) =>
      apiFetch<Cart>(`/shop/cart/items/${itemId}`, {
        method: "PUT",
        body: { qty },
      }),
    remove: (itemId: number) =>
      apiFetch<Cart>(`/shop/cart/items/${itemId}`, { method: "DELETE" }),
    applyPromo: (code: string) =>
      apiFetch<Cart>("/shop/cart/promo", { method: "POST", body: { code } }),
  },

  shipping: {
    methods: () => apiFetch<ShippingMethod[]>("/shop/shipping"),
  },

  /* Marketplace vendors (W3). */
  sellers: {
    list: (filters: SellerFilters = {}) =>
      apiFetch<Paginated<SellerListItem>>("/shop/sellers", {
        query: {
          page: filters.page,
          q: filters.q,
          status: filters.status,
          sort: filters.sort,
          dir: filters.dir,
        },
      }),
    get: (id: number) => apiFetch<SellerDetail>(`/shop/sellers/${id}`),
    products: (id: number) =>
      apiFetch<ProductListItem[]>(`/shop/sellers/${id}/products`),
  },

  customers: {
    list: (filters: CustomerFilters = {}) =>
      apiFetch<Paginated<CustomerListItem>>("/shop/customers", {
        query: {
          page: filters.page,
          q: filters.q,
          status: filters.status,
          sort: filters.sort,
          dir: filters.dir,
        },
      }),
    get: (id: number) => apiFetch<CustomerDetail>(`/shop/customers/${id}`),
  },

  payments: {
    list: (filters: PaymentFilters = {}) =>
      apiFetch<Paginated<Payment>>("/shop/payments", {
        query: {
          page: filters.page,
          q: filters.q,
          status: filters.status,
          method: filters.method,
          from: filters.from,
          to: filters.to,
          sort: filters.sort,
          dir: filters.dir,
        },
      }),
    stats: () => apiFetch<PaymentStats>("/shop/payments/stats"),
    refund: (id: number) =>
      apiFetch<Payment>(`/shop/payments/${id}/refund`, { method: "POST" }),
  },

  invoices: {
    list: (filters: InvoiceFilters = {}) =>
      apiFetch<Paginated<InvoiceListItem>>("/shop/invoices", {
        query: {
          page: filters.page,
          q: filters.q,
          status: filters.status,
          sort: filters.sort,
          dir: filters.dir,
        },
      }),
    get: (id: number) => apiFetch<InvoiceDetail>(`/shop/invoices/${id}`),
    create: (payload: InvoiceDraft) =>
      apiFetch<InvoiceDetail>("/shop/invoices", {
        method: "POST",
        body: payload,
      }),
  },

  /* Analytics dashboard (build-demo-screen-catalog): a single period-scoped payload. */
  analytics: {
    get: (period: Period) =>
      apiFetch<AnalyticsPayload>("/analytics", { query: { period } }),
  },

  /* Dashboard verticals (W2): one typed period-scoped payload per vertical. */
  dashboards: {
    get: <V extends DashboardVertical>(vertical: V, period: Period) =>
      apiFetch<DashboardPayloadMap[V]>(`/dashboards/${vertical}`, {
        query: { period },
      }),
  },

  /* Inbox / chat (build-demo-screen-catalog): folders, threads, send + mark-read. */
  inbox: {
    list: (folder: InboxFolder, q?: string) =>
      apiFetch<InboxListPayload>("/inbox", { query: { folder, q } }),
    get: (id: number) => apiFetch<InboxThread>(`/inbox/threads/${id}`),
    send: (id: number, body: string) =>
      apiFetch<InboxThread>(`/inbox/threads/${id}/messages`, {
        method: "POST",
        body: { body },
      }),
    markRead: (id: number) =>
      apiFetch<{ ok: true }>(`/inbox/threads/${id}/read`, { method: "POST" }),
  },

  /* Shop discounts (build-demo-screen-catalog): simple CRUD over the mock store. */
  discounts: {
    list: () => apiFetch<Discount[]>("/shop/discounts"),
    create: (payload: DiscountPayload) =>
      apiFetch<Discount>("/shop/discounts", { method: "POST", body: payload }),
    update: (id: number, payload: DiscountPayload) =>
      apiFetch<Discount>(`/shop/discounts/${id}`, {
        method: "PUT",
        body: payload,
      }),
    remove: (id: number) =>
      apiFetch<{ ok: true }>(`/shop/discounts/${id}`, { method: "DELETE" }),
  },

  /* Shop delivery methods (build-demo-screen-catalog): simple CRUD over the mock store. */
  delivery: {
    list: () => apiFetch<DeliveryMethod[]>("/shop/delivery"),
    create: (payload: DeliveryPayload) =>
      apiFetch<DeliveryMethod>("/shop/delivery", {
        method: "POST",
        body: payload,
      }),
    update: (id: number, payload: DeliveryPayload) =>
      apiFetch<DeliveryMethod>(`/shop/delivery/${id}`, {
        method: "PUT",
        body: payload,
      }),
    remove: (id: number) =>
      apiFetch<{ ok: true }>(`/shop/delivery/${id}`, { method: "DELETE" }),
  },

  /* Kanban board (build-demo-screen-catalog): fetch the board + persist card moves. */
  kanban: {
    get: () => apiFetch<KanbanBoard>("/kanban"),
    move: (cardId: string, toColumn: string, toIndex: number) =>
      apiFetch<KanbanBoard>("/kanban/move", {
        method: "POST",
        body: { card_id: cardId, to_column: toColumn, to_index: toIndex },
      }),
  },

  /* W1 utility pages (any authenticated): team directory, activity timeline, FAQ. */
  pages: {
    team: () => apiFetch<TeamMember[]>("/pages/team"),
    timeline: () => apiFetch<TimelineEvent[]>("/pages/timeline"),
    faq: () => apiFetch<FaqEntry[]>("/pages/faq"),
    gallery: () => apiFetch<GalleryPhoto[]>("/pages/gallery"),
  },

  /* W1 blog (any authenticated): list/grid share the query; article + comments. */
  blog: {
    list: (params: BlogListParams = {}) =>
      apiFetch<Paginated<BlogListItem>>("/blog", {
        query: {
          page: params.page,
          q: params.q,
          category: params.category,
        },
      }),
    get: (id: number) => apiFetch<BlogPost>(`/blog/${id}`),
    comment: (id: number, body: string) =>
      apiFetch<BlogComment>(`/blog/${id}/comments`, {
        method: "POST",
        body: { body },
      }),
  },

  /* Projects (W3): list/detail with tasks + files, and create. */
  projects: {
    list: (filters: ProjectFilters = {}) =>
      apiFetch<Paginated<ProjectListItem>>("/projects", {
        query: {
          page: filters.page,
          q: filters.q,
          status: filters.status,
          sort: filters.sort,
          dir: filters.dir,
        },
      }),
    get: (id: number) => apiFetch<ProjectDetail>(`/projects/${id}`),
    tasks: (id: number) => apiFetch<ProjectTaskRow[]>(`/projects/${id}/tasks`),
    files: (id: number) => apiFetch<ProjectFile[]>(`/projects/${id}/files`),
    create: (payload: ProjectPayload) =>
      apiFetch<ProjectDetail>("/projects", { method: "POST", body: payload }),
  },

  /* Tasks (W3): flat task list + details with optimistic status/subtasks. */
  tasks: {
    list: (filters: TaskFilters = {}) =>
      apiFetch<Paginated<TaskListItem>>("/tasks", {
        query: {
          page: filters.page,
          q: filters.q,
          project: filters.project,
          assignee: filters.assignee,
          priority: filters.priority,
          status: filters.status,
          sort: filters.sort,
          dir: filters.dir,
        },
      }),
    get: (id: number) => apiFetch<TaskDetail>(`/tasks/${id}`),
    setStatus: (id: number, status: TaskStatus) =>
      apiFetch<TaskListItem>(`/tasks/${id}/status`, {
        method: "POST",
        body: { status },
      }),
    comment: (id: number, body: string) =>
      apiFetch<TaskComment>(`/tasks/${id}/comments`, {
        method: "POST",
        body: { body },
      }),
    toggleSubtask: (id: number, subtaskId: number) =>
      apiFetch<TaskDetail>(`/tasks/${id}/subtasks/${subtaskId}`, {
        method: "POST",
      }),
  },

  /* CRM (W3): contacts, companies, deals pipeline and leads. */
  crm: {
    contacts: {
      list: (filters: CrmContactFilters = {}) =>
        apiFetch<Paginated<CrmContactDetail>>("/crm/contacts", {
          query: {
            page: filters.page,
            q: filters.q,
            tag: filters.tag,
            owner: filters.owner,
            sort: filters.sort,
            dir: filters.dir,
          },
        }),
      get: (id: number) => apiFetch<CrmContactDetail>(`/crm/contacts/${id}`),
      create: (payload: CrmContactPayload) =>
        apiFetch<CrmContactDetail>("/crm/contacts", {
          method: "POST",
          body: payload,
        }),
    },
    companies: {
      list: (filters: CompanyFilters = {}) =>
        apiFetch<Paginated<CompanyListItem>>("/crm/companies", {
          query: {
            page: filters.page,
            q: filters.q,
            sort: filters.sort,
            dir: filters.dir,
          },
        }),
      get: (id: number) => apiFetch<CompanyDetail>(`/crm/companies/${id}`),
      create: (payload: CompanyPayload) =>
        apiFetch<CompanyDetail>("/crm/companies", {
          method: "POST",
          body: payload,
        }),
    },
    deals: {
      list: () => apiFetch<Deal[]>("/crm/deals"),
      move: (id: number, stage: DealStage) =>
        apiFetch<Deal>(`/crm/deals/${id}/move`, {
          method: "POST",
          body: { stage },
        }),
    },
    leads: {
      list: (filters: LeadFilters = {}) =>
        apiFetch<Paginated<Lead>>("/crm/leads", {
          query: {
            page: filters.page,
            q: filters.q,
            status: filters.status,
            source: filters.source,
            sort: filters.sort,
            dir: filters.dir,
          },
        }),
      convert: (id: number) =>
        apiFetch<Deal>(`/crm/leads/${id}/convert`, { method: "POST" }),
    },
  },

  /* Calendar (W3): events CRUD + optimistic move. */
  calendar: {
    events: () => apiFetch<CalendarEvent[]>("/calendar/events"),
    save: (payload: CalendarEventPayload) =>
      apiFetch<CalendarEvent>("/calendar/events", {
        method: "POST",
        body: payload,
      }),
    move: (id: number, start: string, end: string) =>
      apiFetch<CalendarEvent>(`/calendar/events/${id}/move`, {
        method: "POST",
        body: { start, end },
      }),
    delete: (id: number) =>
      apiFetch<{ ok: true }>(`/calendar/events/${id}`, { method: "DELETE" }),
  },

  /* Email / mailbox (W3): folders, message read, send, star, mark-read, move. */
  email: {
    list: (folder: MailFolder, q?: string) =>
      apiFetch<MailListPayload>("/email", { query: { folder, q } }),
    get: (id: number) => apiFetch<MailMessage>(`/email/${id}`),
    send: (payload: MailSendPayload) =>
      apiFetch<MailMessage>("/email/send", { method: "POST", body: payload }),
    star: (id: number) =>
      apiFetch<MailMessage>(`/email/${id}/star`, { method: "POST" }),
    markRead: (id: number) =>
      apiFetch<MailMessage>(`/email/${id}/read`, { method: "POST" }),
    move: (id: number, folder: MailFolder) =>
      apiFetch<MailMessage>(`/email/${id}/move`, {
        method: "POST",
        body: { folder },
      }),
  },

  /* Support tickets (W3): helpdesk queue, conversation, status and assignment. */
  support: {
    list: (filters: TicketFilters = {}) =>
      apiFetch<Paginated<TicketListItem>>("/support/tickets", {
        query: {
          page: filters.page,
          q: filters.q,
          status: filters.status,
          priority: filters.priority,
          agent: filters.agent,
          sort: filters.sort,
          dir: filters.dir,
        },
      }),
    stats: () => apiFetch<TicketStats>("/support/tickets/stats"),
    create: (payload: TicketPayload) =>
      apiFetch<TicketDetail>("/support/tickets", {
        method: "POST",
        body: payload,
      }),
    get: (id: number) => apiFetch<TicketDetail>(`/support/tickets/${id}`),
    reply: (id: number, body: string) =>
      apiFetch<TicketDetail>(`/support/tickets/${id}/reply`, {
        method: "POST",
        body: { body },
      }),
    setStatus: (id: number, status: TicketStatus) =>
      apiFetch<TicketDetail>(`/support/tickets/${id}/status`, {
        method: "POST",
        body: { status },
      }),
    assign: (id: number, agent: string) =>
      apiFetch<TicketDetail>(`/support/tickets/${id}/assign`, {
        method: "POST",
        body: { agent },
      }),
  },

  /* To-do (W3): personal list; every mutation is optimistic in the UI. */
  todo: {
    list: () => apiFetch<TodoItem[]>("/todo"),
    add: (title: string, priority: TodoPriority) =>
      apiFetch<TodoItem>("/todo", {
        method: "POST",
        body: { title, priority },
      }),
    toggle: (id: number) =>
      apiFetch<TodoItem>(`/todo/${id}/toggle`, { method: "POST" }),
    reorder: (ids: number[]) =>
      apiFetch<TodoItem[]>("/todo/reorder", { method: "POST", body: { ids } }),
    remove: (id: number) =>
      apiFetch<{ ok: true }>(`/todo/${id}`, { method: "DELETE" }),
  },

  /* API keys (W3): masked list; the secret is returned once on create. */
  apikeys: {
    list: () => apiFetch<ApiKey[]>("/api-keys"),
    create: (payload: ApiKeyCreatePayload) =>
      apiFetch<ApiKeyCreated>("/api-keys", { method: "POST", body: payload }),
    revoke: (id: number) =>
      apiFetch<ApiKey>(`/api-keys/${id}/revoke`, { method: "POST" }),
  },

  /* Crypto (W4 mono-niche): transactions, trading, orders, wallet, ICOs, KYC. */
  crypto: {
    transactions: (filters: CryptoTxFilters = {}) =>
      apiFetch<Paginated<CryptoTx>>("/crypto/transactions", {
        query: {
          page: filters.page,
          q: filters.q,
          coin: filters.coin,
          type: filters.type,
          from: filters.from,
          to: filters.to,
          sort: filters.sort,
          dir: filters.dir,
        },
      }),
    markets: () => apiFetch<CryptoMarket[]>("/crypto/markets"),
    quote: (pair: string, amount: number) =>
      apiFetch<CryptoQuote>("/crypto/quote", { query: { pair, amount } }),
    trade: (payload: CryptoTradePayload) =>
      apiFetch<CryptoOrder>("/crypto/trade", { method: "POST", body: payload }),
    orders: (status?: "open" | "history") =>
      apiFetch<CryptoOrder[]>("/crypto/orders", { query: { status } }),
    cancelOrder: (id: number) =>
      apiFetch<CryptoOrder>(`/crypto/orders/${id}/cancel`, { method: "POST" }),
    wallet: () => apiFetch<Wallet>("/crypto/wallet"),
    deposit: (payload: CryptoDepositPayload) =>
      apiFetch<Wallet>("/crypto/wallet/deposit", {
        method: "POST",
        body: payload,
      }),
    withdraw: (payload: CryptoWithdrawPayload) =>
      apiFetch<Wallet>("/crypto/wallet/withdraw", {
        method: "POST",
        body: payload,
      }),
    icos: (filters: IcoFilters = {}) =>
      apiFetch<Ico[]>("/crypto/icos", { query: { status: filters.status } }),
    getIco: (id: number) => apiFetch<Ico>(`/crypto/icos/${id}`),
    submitKyc: (payload: KycPayload) =>
      apiFetch<KycApplication>("/crypto/kyc", {
        method: "POST",
        body: payload,
      }),
  },

  /* NFT (W4 niche): marketplace, explore, auctions, item detail, collections,
   * creators, ranking and mint. Reachable with nft.view (nft.manage to mint). */
  nft: {
    items: (filters: NftItemFilters = {}) =>
      apiFetch<Paginated<NftItem>>("/nft/items", {
        query: {
          page: filters.page,
          q: filters.q,
          category: filters.category,
          chain: filters.chain,
          status: filters.status,
          collection: filters.collection,
          min: filters.min,
          max: filters.max,
          sort: filters.sort,
        },
      }),
    item: (id: number) => apiFetch<NftItemDetail>(`/nft/items/${id}`),
    collections: (filters: NftCollectionFilters = {}) =>
      apiFetch<NftCollection[]>("/nft/collections", {
        query: { q: filters.q, sort: filters.sort },
      }),
    creators: (filters: NftCreatorFilters = {}) =>
      apiFetch<NftCreator[]>("/nft/creators", {
        query: { q: filters.q, sort: filters.sort },
      }),
    follow: (id: number) =>
      apiFetch<NftCreator>(`/nft/creators/${id}/follow`, { method: "POST" }),
    auctions: () => apiFetch<NftAuction[]>("/nft/auctions"),
    bid: (id: number, amount: number) =>
      apiFetch<NftAuction>(`/nft/auctions/${id}/bid`, {
        method: "POST",
        body: { amount },
      }),
    ranking: (period: NftRankingPeriod) =>
      apiFetch<RankingRow[]>("/nft/ranking", { query: { period } }),
    create: (payload: NftCreatePayload) =>
      apiFetch<NftMintResult>("/nft/items", { method: "POST", body: payload }),
  },

  /* Jobs / Recruitment (W4 niche): recruiter stats, postings (list/grid share one
   * query), candidates, companies directory, category CRUD and the apply form.
   * Reachable with jobs.view (jobs.manage to post jobs and manage categories). */
  jobs: {
    stats: () => apiFetch<JobsStats>("/jobs/stats"),
    list: (filters: JobFilters = {}) =>
      apiFetch<Paginated<Job>>("/jobs", {
        query: {
          page: filters.page,
          q: filters.q,
          department: filters.department,
          type: filters.type,
          status: filters.status,
          sort: filters.sort,
          dir: filters.dir,
        },
      }),
    get: (id: number) => apiFetch<JobDetail>(`/jobs/${id}`),
    applicants: (id: number) =>
      apiFetch<JobApplicant[]>(`/jobs/${id}/applicants`),
    candidates: (filters: CandidateFilters = {}) =>
      apiFetch<Paginated<Candidate>>("/jobs/candidates", {
        query: {
          page: filters.page,
          q: filters.q,
          stage: filters.stage,
          sort: filters.sort,
          dir: filters.dir,
        },
      }),
    apply: (payload: ApplicationPayload) =>
      apiFetch<Application>("/jobs/apply", { method: "POST", body: payload }),
    create: (payload: JobCreatePayload) =>
      apiFetch<JobCreateResult>("/jobs", { method: "POST", body: payload }),
    companies: (filters: JobCompanyFilters = {}) =>
      apiFetch<Paginated<JobCompany>>("/jobs/companies", {
        query: { page: filters.page, q: filters.q },
      }),
    company: (id: number) =>
      apiFetch<JobCompanyDetail>(`/jobs/companies/${id}`),
    categories: () => apiFetch<JobCategory[]>("/jobs/categories"),
    saveCategory: (payload: JobCategoryPayload) =>
      apiFetch<JobCategory>("/jobs/categories", {
        method: "POST",
        body: payload,
      }),
    deleteCategory: (id: number) =>
      apiFetch<{ id: number }>(`/jobs/categories/${id}`, { method: "DELETE" }),
  },

  /* Help (D:help §6): read-only, any authenticated user — no permission gates. */
  help: {
    tree: () => apiFetch<HelpGroup[]>("/help"),
    page: (module: string, page: string) =>
      apiFetch<HelpArticle>(`/help/${module}/${page}`),
    search: (q: string) =>
      apiFetch<HelpSearchHit[]>("/help/search", { query: { q } }),
    /** Context help for the current screen; null → the "?" button is hidden. */
    forScreen: (screenKey: string) =>
      apiFetch<HelpArticle | null>(`/help/screen/${screenKey}`),
  },
};
