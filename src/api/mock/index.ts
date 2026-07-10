import { ApiError, ValidationError, type RequestOptions } from "../client";
import { devDebug } from "../../lib/debug";
import type {
  ActivityEntry,
  CustomerFilters,
  CustomerStatus,
  DeliveryPayload,
  DiscountPayload,
  InboxFolder,
  InvoiceDraft,
  InvoiceFilters,
  InvoiceStatus,
  LayoutOverrides,
  Me,
  OrderFilters,
  OrderStatus,
  PaymentFilters,
  PaymentMethod,
  PaymentTxnStatus,
  PlaceOrderPayload,
  ProductFilters,
  ProductPayload,
  ProjectFilters,
  ProjectPayload,
  ProjectStatus,
  TaskFilters,
  TaskPriority,
  TaskStatus,
  CompanyFilters,
  CompanyPayload,
  CrmContactFilters,
  CrmContactPayload,
  DealStage,
  LeadFilters,
  LeadStatus,
  CalendarEventPayload,
  MailFolder,
  MailSendPayload,
  SellerFilters,
  SellerStatus,
  SettingValue,
  TicketFilters,
  TicketPayload,
  TicketPriority,
  TicketStatus,
  TodoPriority,
  ApiKeyCreatePayload,
  CryptoTxFilters,
  CryptoTxType,
  CryptoTradePayload,
  CryptoDepositPayload,
  CryptoWithdrawPayload,
  IcoStatus,
  KycPayload,
  NftCategory,
  NftChain,
  NftCollectionFilters,
  NftCreatePayload,
  NftCreatorFilters,
  NftItemFilters,
  NftItemStatus,
  NftRankingPeriod,
  ApplicationPayload,
  CandidateFilters,
  CandidateStage,
  JobCategoryPayload,
  JobCompanyFilters,
  JobCreatePayload,
  JobDepartment,
  JobFilters,
  JobStatus,
  JobType,
} from "../types";
import {
  MOCK_CREDENTIALS,
  MOCK_USERS,
  SEARCH_GROUPS,
  buildActivityFixture,
  type MockUser,
  type MockUserKey,
} from "./data";
import {
  changeProfilePassword,
  createUser,
  getUser,
  listUsers,
  mfaBeginEnroll,
  mfaConfirmEnroll,
  mfaDisable,
  mfaEnabled,
  mfaRegenerateCodes,
  mfaReset,
  mfaVerify,
  setUserActive,
  updateProfile,
  updateUser,
} from "./users";
import {
  createRole,
  deleteRole,
  listPermissions,
  listRoles,
  renameRole,
  saveRolePermissions,
} from "./roles";
import {
  clampPeriod,
  getDashboard,
  getWidgetData,
  resetDashboardLayout,
  saveDashboardLayout,
} from "./dashboard";
import { getAnalytics } from "./analytics";
import {
  getDashboard as getVerticalDashboard,
  isDashboardVertical,
} from "./dashboards";
import { getThread, listThreads, markRead, sendMessage } from "./inbox";
import { getBoard, moveCard } from "./kanban";
import {
  MEDIA_PRESETS,
  buildSettingsPayload,
  mediaPresetOverrides,
  saveSettingsGroup,
  storedSettingValue,
} from "./settings";
import { regenerateStatus, startRegenerate } from "./media";
import { getAppearance, saveAppearance } from "./appearance";
import { createPassword, registerAccount, reauth, verifyOtp } from "./auth";
import {
  listFaq,
  listGallery,
  listSearchResults,
  listTeam,
  listTimeline,
} from "./pages";
import { addBlogComment, getBlogPost, listBlog } from "./blog";
import {
  applyPromo,
  createInvoice,
  deleteDelivery,
  deleteDiscount,
  getCart,
  getCustomer,
  getInvoice,
  getOrder,
  getProduct,
  getSeller,
  listCustomers,
  listDelivery,
  listDiscounts,
  listInvoices,
  listOrders,
  listPayments,
  listProducts,
  listReviews,
  listSellerProducts,
  listSellers,
  paymentStats,
  placeOrder,
  refundPayment,
  removeCartItem,
  saveDelivery,
  saveDiscount,
  saveProduct,
  setOrderStatus,
  shippingMethods,
  updateCartItem,
} from "./shop";
import {
  createProject,
  getProject,
  listProjects,
  projectFiles,
  projectTasks,
} from "./projects";
import {
  addTaskComment,
  getTask,
  listTasks,
  setTaskStatus,
  toggleSubtask,
} from "./tasks";
import {
  convertLead,
  createCompany,
  createCrmContact,
  getCompany,
  getCrmContact,
  listCompanies,
  listCrmContacts,
  listDeals,
  listLeads,
  moveDeal,
} from "./crm";
import { deleteEvent, listEvents, moveEvent, saveEvent } from "./calendar";
import {
  getMail,
  listMail,
  markMailRead,
  moveMail,
  sendMail,
  starMail,
} from "./email";
import {
  assignTicket,
  createTicket,
  getTicket,
  listTickets,
  replyTicket,
  setTicketStatus,
  ticketStats,
} from "./support";
import {
  addTodo,
  listTodos,
  removeTodo,
  reorderTodos,
  toggleTodo,
} from "./todo";
import { createApiKey, listApiKeys, revokeApiKey } from "./apikeys";
import {
  cryptoCancelOrder,
  cryptoDeposit,
  cryptoGetIco,
  cryptoIcos,
  cryptoMarkets,
  cryptoOrders,
  cryptoQuote,
  cryptoSubmitKyc,
  cryptoTrade,
  cryptoTransactions,
  cryptoWallet,
  cryptoWithdraw,
} from "./crypto";
import {
  nftAuctions,
  nftBid,
  nftCollections,
  nftCreate,
  nftCreators,
  nftFollow,
  nftItem,
  nftItems,
  nftRanking,
} from "./nft";
import {
  jobsApplicants,
  jobsApply,
  jobsCandidates,
  jobsCategories,
  jobsCompanies,
  jobsCompany,
  jobsCreate,
  jobsDeleteCategory,
  jobsGet,
  jobsList,
  jobsSaveCategory,
  jobsStats,
} from "./jobs";
import { helpForScreen, helpPage, helpSearch, helpTree } from "./help";
import {
  aiSpend,
  aiTestConnection,
  cancelAiAction,
  confirmAiAction,
  createAiConversation,
  deleteAiConversation,
  getAiConversation,
  listAiConversations,
  listAiFindings,
  rejectAiPlan,
  runAiTool,
  setAiFindingStatus,
  streamAiMessage,
  streamAiPlanApprove,
} from "./ai";
import type { AiFindingStatus, AiScreenContext, AiStreamEvent } from "../types";

/*
 * In-memory mock of the Admin API (dev only; disabled via VITE_API_REAL).
 * Session survives reloads through localStorage. Scenario switches:
 *   mock.user        — admin | editor | viewer (who logs in / is logged in)
 *   mock.maintenance — off | read_only | full  (topbar banner scenarios)
 *   mock.impersonate — '1' to simulate an active impersonation session
 */

const SESSION_KEY = "mock.session";
const USER_KEY = "mock.user";
const FAILS_KEY = "mock.loginFails";
const MAINTENANCE_KEY = "mock.maintenance";
const IMPERSONATE_KEY = "mock.impersonate";
/** Password accepted, 2FA pending (D:auth §6) — holds the user key, no session yet. */
const PENDING_2FA_KEY = "mock.pending2fa";
/** Scenario switch: JSON array of role keys that must have 2FA (security.mfa_required_roles). */
const MFA_REQUIRED_ROLES_KEY = "mock.mfaRequiredRoles";

/*
 * Demo-data seed version. Entity stores persist to localStorage once touched,
 * so seeds saved by an older template version would shadow the current
 * fixtures forever (e.g. pre-translation role labels). On mismatch, persisted
 * demo entities are dropped and reseeded; the session, the chosen demo user
 * and the saved appearance survive the purge. Bump when fixtures change shape
 * or wording.
 */
const SEED_VERSION_KEY = "mock.seedVersion";
const SEED_VERSION = "2";
const SEED_SURVIVORS = new Set([
  SEED_VERSION_KEY,
  SESSION_KEY,
  USER_KEY,
  "mock.appearance",
]);
if (localStorage.getItem(SEED_VERSION_KEY) !== SEED_VERSION) {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("mock.") && !SEED_SURVIVORS.has(key)) {
      localStorage.removeItem(key);
    }
  }
  localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
}

let activity: ActivityEntry[] | null = null;

function activityRows(): ActivityEntry[] {
  activity ??= buildActivityFixture();
  return activity;
}

function delay(): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, 150 + Math.random() * 250),
  );
}

function currentUserKey(): MockUserKey {
  const stored = localStorage.getItem(USER_KEY) as MockUserKey | null;
  return stored && stored in MOCK_USERS ? stored : "admin";
}

function buildMe(): Me {
  const me = structuredClone(MOCK_USERS[currentUserKey()]);
  me.maintenance_mode =
    (localStorage.getItem(MAINTENANCE_KEY) as Me["maintenance_mode"]) || "off";
  if (localStorage.getItem(IMPERSONATE_KEY) === "1") {
    me.impersonator = { id: 1, name: "Anna Adminson" };
  }
  const enabled = mfaEnabled(me.user.id);
  let requiredRoles: string[] = [];
  try {
    requiredRoles = JSON.parse(
      localStorage.getItem(MFA_REQUIRED_ROLES_KEY) ?? "[]",
    );
  } catch {
    requiredRoles = [];
  }
  me.mfa = {
    enabled,
    enroll_required: requiredRoles.includes(me.user.role.key) && !enabled,
  };
  // Demo default: the AI module counts as configured; 'mock.aiAvailable'='0'
  // simulates the no-LLM-key state (panel button hidden, UI:ai §1).
  me.ai_available = localStorage.getItem("mock.aiAvailable") !== "0";
  // Admin renders absolute times in the site timezone (C7 §4), not the operator's browser.
  me.timezone = String(storedSettingValue("site.timezone") ?? "UTC");
  return me;
}

function requireSession(): void {
  if (localStorage.getItem(SESSION_KEY) !== "1")
    throw new ApiError(401, "Unauthenticated");
}

function pushActivity(entry: Omit<ActivityEntry, "id" | "created_at">): void {
  const rows = activityRows();
  rows.unshift({
    ...entry,
    id: (rows[0]?.id ?? 0) + 1,
    created_at: new Date().toISOString(),
  });
}

type Handler = (
  options: RequestOptions,
  params: Record<string, string>,
) => unknown;

const routes: Array<{ method: string; pattern: RegExp; handler: Handler }> = [
  {
    method: "GET",
    pattern: /^\/me$/,
    handler: () => {
      requireSession();
      return buildMe();
    },
  },
  {
    method: "POST",
    pattern: /^\/auth\/login$/,
    handler: (options) => {
      const { email, password } = options.body as {
        email: string;
        password: string;
      };
      const fails = Number(localStorage.getItem(FAILS_KEY) ?? "0");
      if (fails >= 5) throw new ApiError(429, "Too many attempts", "throttled");
      const userKey = MOCK_CREDENTIALS[email.toLowerCase().trim()];
      if (!userKey || password !== "password") {
        localStorage.setItem(FAILS_KEY, String(fails + 1));
        throw new ValidationError("Invalid credentials", {
          password: "invalid_credentials",
        });
      }
      localStorage.removeItem(FAILS_KEY);
      // Confirmed 2FA: password alone does not open a session (D:auth §6) —
      // the pending state waits for /auth/2fa/challenge.
      if (mfaEnabled(MOCK_USERS[userKey].user.id)) {
        localStorage.setItem(PENDING_2FA_KEY, userKey);
        return { mfa_required: true };
      }
      localStorage.setItem(SESSION_KEY, "1");
      localStorage.setItem(USER_KEY, userKey);
      pushActivity({
        actor: {
          id: MOCK_USERS[userKey].user.id,
          name: MOCK_USERS[userKey].user.name,
        },
        is_ai: false,
        impersonator: null,
        action: "login",
        entity_type: "user",
        entity_id: MOCK_USERS[userKey].user.id,
        description: `login: ${MOCK_USERS[userKey].user.name}`,
        changes: null,
        url: null,
      });
      return { ok: true };
    },
  },
  {
    method: "POST",
    pattern: /^\/auth\/2fa\/challenge$/,
    handler: (options) => {
      const pendingKey = localStorage.getItem(
        PENDING_2FA_KEY,
      ) as MockUserKey | null;
      if (!pendingKey || !(pendingKey in MOCK_USERS))
        throw new ApiError(401, "No pending 2FA login");
      const fails = Number(localStorage.getItem(FAILS_KEY) ?? "0");
      if (fails >= 5) throw new ApiError(429, "Too many attempts", "throttled");
      const { code } = options.body as { code: string };
      const user = MOCK_USERS[pendingKey].user;
      if (!mfaVerify(user.id, String(code ?? ""))) {
        localStorage.setItem(FAILS_KEY, String(fails + 1));
        throw new ValidationError("Validation failed", {
          code: "invalid_code",
        });
      }
      localStorage.removeItem(FAILS_KEY);
      localStorage.removeItem(PENDING_2FA_KEY);
      localStorage.setItem(SESSION_KEY, "1");
      localStorage.setItem(USER_KEY, pendingKey);
      pushActivity({
        actor: { id: user.id, name: user.name },
        is_ai: false,
        impersonator: null,
        action: "login",
        entity_type: "user",
        entity_id: user.id,
        description: `login (2fa): ${user.name}`,
        changes: null,
        url: null,
      });
      return { ok: true };
    },
  },
  {
    method: "POST",
    pattern: /^\/mfa\/enroll$/,
    handler: () => {
      requireSession();
      const me = buildMe();
      return mfaBeginEnroll(me.user.id, me.user.email);
    },
  },
  {
    method: "POST",
    pattern: /^\/mfa\/enroll\/confirm$/,
    handler: (options) => {
      requireSession();
      return mfaConfirmEnroll(
        buildMe().user.id,
        String((options.body as { code: string }).code ?? ""),
      );
    },
  },
  {
    method: "POST",
    pattern: /^\/mfa\/disable$/,
    handler: (options) => {
      requireSession();
      return mfaDisable(
        buildMe().user.id,
        String((options.body as { code: string }).code ?? ""),
      );
    },
  },
  {
    method: "POST",
    pattern: /^\/mfa\/recovery-codes$/,
    handler: () => {
      requireSession();
      return mfaRegenerateCodes(buildMe().user.id);
    },
  },
  {
    method: "POST",
    pattern: /^\/users\/(\d+)\/mfa\/reset$/,
    handler: (_options, params) => {
      requireSession();
      return mfaReset(Number(params[0]));
    },
  },
  {
    method: "POST",
    pattern: /^\/auth\/logout$/,
    handler: () => {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(IMPERSONATE_KEY);
      localStorage.removeItem(PENDING_2FA_KEY);
      return { ok: true };
    },
  },
  {
    method: "POST",
    pattern: /^\/auth\/forgot$/,
    handler: () => ({ ok: true }), // anti-enumeration: identical success for any email
  },
  {
    method: "POST",
    pattern: /^\/auth\/reset$/,
    handler: (options) => {
      const { token } = options.body as { token: string };
      if (token === "expired" || token === "used")
        throw new ApiError(410, "Token invalid", "invalid_token");
      return { ok: true };
    },
  },
  {
    method: "POST",
    pattern: /^\/auth\/impersonate\/stop$/,
    handler: () => {
      localStorage.removeItem(IMPERSONATE_KEY);
      return { ok: true };
    },
  },
  {
    method: "POST",
    pattern: /^\/auth\/register$/,
    handler: (options) =>
      registerAccount(options.body as Parameters<typeof registerAccount>[0]),
  },
  {
    method: "POST",
    pattern: /^\/auth\/password\/create$/,
    handler: (options) =>
      createPassword(options.body as Parameters<typeof createPassword>[0]),
  },
  {
    method: "POST",
    pattern: /^\/auth\/verify$/,
    handler: (options) => verifyOtp((options.body as { code: string }).code),
  },
  {
    method: "POST",
    pattern: /^\/auth\/reauth$/,
    handler: (options) => {
      requireSession();
      return reauth((options.body as { password: string }).password);
    },
  },
  {
    method: "GET",
    pattern: /^\/help$/,
    handler: () => {
      requireSession();
      return helpTree();
    },
  },
  {
    method: "GET",
    pattern: /^\/help\/search$/,
    handler: (options) => {
      requireSession();
      return helpSearch(String(options.query?.q ?? ""));
    },
  },
  {
    method: "GET",
    pattern: /^\/help\/screen\/([\w.-]+)$/,
    handler: (_options, params) => {
      requireSession();
      return helpForScreen(params[0]);
    },
  },
  {
    method: "GET",
    pattern: /^\/help\/([\w-]+)\/([\w-]+)$/,
    handler: (_options, params) => {
      requireSession();
      const article = helpPage(params[0], params[1]);
      if (!article) throw new ApiError(404, "Article not found");
      return article;
    },
  },
  /* ---- dashboard (D:dashboard §6) ---- */
  {
    method: "GET",
    pattern: /^\/dashboard$/,
    handler: (options) => {
      requireSession();
      const role = options.query?.role;
      return getDashboard(
        buildMe(),
        role === undefined ? undefined : String(role),
      );
    },
  },
  {
    method: "GET",
    pattern: /^\/dashboard\/widgets\/([\w.-]+)$/,
    handler: (options, params) => {
      requireSession();
      const period = clampPeriod(
        options.query?.period === undefined
          ? undefined
          : String(options.query.period),
      );
      return getWidgetData(
        params[0],
        buildMe(),
        { activity: activityRows() },
        period,
      );
    },
  },
  {
    method: "PUT",
    pattern: /^\/dashboard\/layout\/([\w-]+)$/,
    handler: (options, params) => {
      requireSession();
      return saveDashboardLayout(
        buildMe(),
        params[0],
        options.body as LayoutOverrides,
      );
    },
  },
  {
    method: "DELETE",
    pattern: /^\/dashboard\/layout\/([\w-]+)$/,
    handler: (_options, params) => {
      requireSession();
      return resetDashboardLayout(buildMe(), params[0]);
    },
  },
  {
    method: "POST",
    pattern: /^\/cache\/clear$/,
    handler: () => {
      requireSession();
      return { ok: true };
    },
  },
  {
    method: "GET",
    pattern: /^\/activity$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      let rows = activityRows().slice();
      if (query.entity_type)
        rows = rows.filter((row) => row.entity_type === query.entity_type);
      if (query.action)
        rows = rows.filter((row) => row.action === query.action);
      if (query.actor_id)
        rows = rows.filter((row) => row.actor?.id === Number(query.actor_id));
      if (query.only_ai) rows = rows.filter((row) => row.is_ai);
      if (query.from)
        rows = rows.filter((row) => row.created_at >= String(query.from));
      if (query.to)
        rows = rows.filter((row) => row.created_at <= `${query.to}T23:59:59Z`);
      // Fixture is newest-first; only the date column is sortable (UI:shell-auth §2).
      if (query.dir === "asc") rows.reverse();
      const page = Number(query.page ?? 1);
      const perPage = 15;
      return {
        rows: rows.slice((page - 1) * perPage, page * perPage),
        total: rows.length,
        page,
        per_page: perPage,
      };
    },
  },
  {
    method: "POST",
    pattern: /^\/activity\/(\d+)\/restore$/,
    handler: (_options, params) => {
      requireSession();
      const source = activityRows().find((row) => row.id === Number(params[0]));
      if (!source?.changes) throw new ApiError(404, "Nothing to restore");
      pushActivity({
        actor: buildMe().user && {
          id: buildMe().user.id,
          name: buildMe().user.name,
        },
        is_ai: false,
        impersonator: null,
        action: "restored",
        entity_type: source.entity_type,
        entity_id: source.entity_id,
        description: `restored: ${source.description}`,
        changes: null,
        url: source.url,
      });
      return { ok: true };
    },
  },
  {
    method: "GET",
    pattern: /^\/admin-search$/,
    handler: (options) => {
      requireSession();
      const q = String(options.query?.q ?? "").toLowerCase();
      if (q.length < 2) return { groups: [] };
      const permissions = new Set(buildMe().permissions);
      const visibility: Record<string, string> = {
        orders: "orders.view",
        products: "products.view",
        customers: "customers.view",
      };
      const groups = SEARCH_GROUPS.filter((group) =>
        permissions.has(visibility[group.key]),
      )
        .map((group) => ({
          ...group,
          items: group.items
            .filter((item) => item.title.toLowerCase().includes(q))
            .slice(0, 5),
        }))
        .filter((group) => group.items.length > 0);
      return { groups };
    },
  },
  {
    method: "GET",
    pattern: /^\/notifications\/unread-count$/,
    handler: () => {
      requireSession();
      return { count: 3 };
    },
  },
  {
    method: "GET",
    pattern: /^\/media$/,
    handler: (options) => {
      requireSession();
      const q = String(options.query?.q ?? "").toLowerCase();
      const names = [
        "hero.jpg",
        "logo.svg",
        "favicon.png",
        "og-cover.jpg",
        "team-photo.jpg",
        "pump-gnom-25.jpg",
        "roof-works.jpg",
        "office-map.png",
        "banner-summer.jpg",
        "price-list.pdf",
        "catalog-tile.webp",
        "about-video-poster.jpg",
      ];
      const swatches = [
        "#bfdbfe",
        "#bbf7d0",
        "#fde68a",
        "#fecaca",
        "#ddd6fe",
        "#a5f3fc",
      ];
      const base = Date.now();
      const items = names
        .filter((name) => name.includes(q))
        .map((name, index) => ({
          path: `2026/07/${name}`,
          name,
          preview_url: `data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="${swatches[index % swatches.length]}"/></svg>`,
          )}`,
          // Demo metadata for the file-manager details panel (deterministic, stable-ish).
          size: 24_000 + ((index * 37_931) % 4_200_000),
          modified_at: new Date(
            base - (index + 1) * 8 * 3600 * 1000,
          ).toISOString(),
        }));
      return { rows: items, total: items.length, page: 1, per_page: 50 };
    },
  },
  {
    method: "GET",
    pattern: /^\/media\/presets$/,
    handler: () => {
      requireSession();
      return { presets: MEDIA_PRESETS, overrides: mediaPresetOverrides() };
    },
  },
  {
    method: "POST",
    pattern: /^\/media\/regenerate$/,
    handler: (options) => {
      requireSession();
      const group = (options.body as { group?: string } | undefined)?.group;
      return startRegenerate(group);
    },
  },
  {
    method: "GET",
    pattern: /^\/media\/regenerate\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return regenerateStatus(Number(params[0]));
    },
  },
  {
    method: "GET",
    pattern: /^\/settings$/,
    handler: () => {
      requireSession();
      return buildSettingsPayload();
    },
  },
  {
    method: "PUT",
    pattern: /^\/settings\/([a-z]+)$/,
    handler: (options, params) => {
      requireSession();
      return saveSettingsGroup(
        params[0],
        options.body as Record<string, SettingValue>,
      );
    },
  },

  /* ---- appearance (E1 §2.2.1) ---- */
  {
    method: "GET",
    pattern: /^\/appearance$/,
    handler: () => {
      requireSession();
      return getAppearance();
    },
  },
  {
    method: "PUT",
    pattern: /^\/appearance$/,
    handler: (options) => {
      requireSession();
      return saveAppearance(options.body);
    },
  },

  /* ---- users (D:users §6) ---- */
  {
    method: "GET",
    pattern: /^\/users$/,
    handler: (options) => {
      requireSession();
      return listUsers(options);
    },
  },
  {
    method: "POST",
    pattern: /^\/users$/,
    handler: (options) => {
      requireSession();
      return createUser(
        options.body as Partial<MockUser> & { password?: string },
      );
    },
  },
  {
    method: "GET",
    pattern: /^\/users\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return getUser(Number(params[0]));
    },
  },
  {
    method: "PUT",
    pattern: /^\/users\/(\d+)$/,
    handler: (options, params) => {
      requireSession();
      return updateUser(
        Number(params[0]),
        options.body as Partial<MockUser> & { password?: string },
      );
    },
  },
  {
    method: "POST",
    pattern: /^\/users\/(\d+)\/(deactivate|activate)$/,
    handler: (_options, params) => {
      requireSession();
      return setUserActive(Number(params[0]), params[1] === "activate");
    },
  },

  /* ---- roles & permissions (D:users §6) ---- */
  {
    method: "GET",
    pattern: /^\/roles$/,
    handler: () => {
      requireSession();
      return listRoles();
    },
  },
  {
    method: "GET",
    pattern: /^\/roles\/permissions$/,
    handler: () => {
      requireSession();
      return listPermissions();
    },
  },
  {
    method: "POST",
    pattern: /^\/roles$/,
    handler: (options) => {
      requireSession();
      return createRole(options.body as Parameters<typeof createRole>[0]);
    },
  },
  {
    method: "PUT",
    pattern: /^\/roles\/(\d+)$/,
    handler: (options, params) => {
      requireSession();
      return renameRole(
        Number(params[0]),
        (options.body as { label: string }).label,
      );
    },
  },
  {
    method: "DELETE",
    pattern: /^\/roles\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return deleteRole(Number(params[0]));
    },
  },
  {
    method: "PUT",
    pattern: /^\/roles\/(\d+)\/permissions$/,
    handler: (options, params) => {
      requireSession();
      return saveRolePermissions(
        Number(params[0]),
        (options.body as { permissions: string[] }).permissions,
      );
    },
  },

  /* ---- ai (D:ai §5; streaming endpoints live in handleMockStream below) ---- */
  {
    method: "GET",
    pattern: /^\/ai\/conversations$/,
    handler: () => {
      requireSession();
      return listAiConversations();
    },
  },
  {
    method: "POST",
    pattern: /^\/ai\/conversations$/,
    handler: () => {
      requireSession();
      return createAiConversation();
    },
  },
  {
    method: "GET",
    pattern: /^\/ai\/conversations\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return getAiConversation(Number(params[0]));
    },
  },
  {
    method: "DELETE",
    pattern: /^\/ai\/conversations\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return deleteAiConversation(Number(params[0]));
    },
  },
  {
    method: "POST",
    pattern: /^\/ai\/plans\/(\d+)\/reject$/,
    handler: (_options, params) => {
      requireSession();
      return rejectAiPlan(Number(params[0]));
    },
  },
  {
    method: "POST",
    pattern: /^\/ai\/actions\/(\d+)\/confirm$/,
    handler: (_options, params) => {
      requireSession();
      const result = confirmAiAction(Number(params[0]));
      // Every agent action lands in the audit trail flagged as AI (C8, D:ai §10a)
      pushActivity({
        actor: null,
        is_ai: true,
        impersonator: null,
        action: "deleted",
        entity_type: "page",
        entity_id: result.params.id ?? "",
        description: `AI · ${result.tool}: ${result.params.title ?? result.params.id ?? ""}`,
        changes: null,
        url: null,
      });
      return { ok: result.ok };
    },
  },
  {
    method: "POST",
    pattern: /^\/ai\/actions\/(\d+)\/cancel$/,
    handler: (_options, params) => {
      requireSession();
      return cancelAiAction(Number(params[0]));
    },
  },
  {
    method: "POST",
    pattern: /^\/ai\/conversations\/(\d+)\/tools$/,
    handler: (options, params) => {
      requireSession();
      const body = options.body as {
        tool: string;
        args?: Record<string, unknown>;
      };
      return runAiTool(Number(params[0]), body.tool, body.args ?? {});
    },
  },
  {
    method: "POST",
    pattern: /^\/ai\/test$/,
    handler: () => {
      requireSession();
      return aiTestConnection();
    },
  },
  {
    method: "GET",
    pattern: /^\/ai\/spend$/,
    handler: () => {
      requireSession();
      return aiSpend();
    },
  },
  {
    method: "GET",
    pattern: /^\/ai\/findings$/,
    handler: () => {
      requireSession();
      return listAiFindings();
    },
  },
  {
    method: "POST",
    pattern: /^\/ai\/findings\/(\d+)\/status$/,
    handler: (options, params) => {
      requireSession();
      const body = options.body as { status: AiFindingStatus; note?: string };
      return setAiFindingStatus(Number(params[0]), body.status, body.note);
    },
  },

  /* ---- profile & impersonation (D:users §6, D:auth §6) ---- */
  {
    method: "PUT",
    pattern: /^\/profile$/,
    handler: (options) => {
      requireSession();
      return updateProfile(options.body as Record<string, unknown>);
    },
  },
  {
    method: "POST",
    pattern: /^\/profile\/password$/,
    handler: (options) => {
      requireSession();
      return changeProfilePassword(options.body as Record<string, unknown>);
    },
  },
  {
    method: "POST",
    pattern: /^\/auth\/impersonate\/(\d+)$/,
    handler: () => {
      requireSession();
      localStorage.setItem(IMPERSONATE_KEY, "1");
      return { ok: true };
    },
  },

  /* ---- shop: orders ---- */
  {
    method: "GET",
    pattern: /^\/shop\/orders$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: OrderFilters = {
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
        status:
          query.status === undefined
            ? undefined
            : (String(query.status) as OrderStatus),
        from: query.from === undefined ? undefined : String(query.from),
        to: query.to === undefined ? undefined : String(query.to),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as OrderFilters["sort"]),
        dir: query.dir === "asc" ? "asc" : "desc",
      };
      return listOrders(filters);
    },
  },
  {
    method: "GET",
    pattern: /^\/shop\/orders\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return getOrder(Number(params[0]));
    },
  },
  {
    method: "POST",
    pattern: /^\/shop\/orders\/(\d+)\/status$/,
    handler: (options, params) => {
      requireSession();
      const body = options.body as { status: OrderStatus };
      return setOrderStatus(Number(params[0]), body.status);
    },
  },

  /* ---- shop: products catalog ---- */
  {
    method: "GET",
    pattern: /^\/shop\/products$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: ProductFilters = {
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
        status:
          query.status === undefined
            ? undefined
            : (String(query.status) as ProductFilters["status"]),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as ProductFilters["sort"]),
        dir: query.dir === "desc" ? "desc" : "asc",
      };
      return listProducts(filters);
    },
  },
  {
    method: "GET",
    pattern: /^\/shop\/products\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return getProduct(Number(params[0]));
    },
  },
  {
    method: "POST",
    pattern: /^\/shop\/products$/,
    handler: (options) => {
      requireSession();
      return saveProduct(options.body as ProductPayload);
    },
  },
  {
    method: "PUT",
    pattern: /^\/shop\/products\/(\d+)$/,
    handler: (options, params) => {
      requireSession();
      return saveProduct(options.body as ProductPayload, Number(params[0]));
    },
  },

  /* ---- shop: customers (CRM) ---- */
  {
    method: "GET",
    pattern: /^\/shop\/customers$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: CustomerFilters = {
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
        status:
          query.status === undefined
            ? undefined
            : (String(query.status) as CustomerStatus),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as CustomerFilters["sort"]),
        dir: query.dir === "desc" ? "desc" : "asc",
      };
      return listCustomers(filters);
    },
  },
  {
    method: "GET",
    pattern: /^\/shop\/customers\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return getCustomer(Number(params[0]));
    },
  },

  /* ---- shop: payments ---- */
  {
    method: "GET",
    pattern: /^\/shop\/payments\/stats$/,
    handler: () => {
      requireSession();
      return paymentStats();
    },
  },
  {
    method: "GET",
    pattern: /^\/shop\/payments$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: PaymentFilters = {
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
        status:
          query.status === undefined
            ? undefined
            : (String(query.status) as PaymentTxnStatus),
        method:
          query.method === undefined
            ? undefined
            : (String(query.method) as PaymentMethod),
        from: query.from === undefined ? undefined : String(query.from),
        to: query.to === undefined ? undefined : String(query.to),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as PaymentFilters["sort"]),
        dir: query.dir === "asc" ? "asc" : "desc",
      };
      return listPayments(filters);
    },
  },
  {
    method: "POST",
    pattern: /^\/shop\/payments\/(\d+)\/refund$/,
    handler: (_options, params) => {
      requireSession();
      return refundPayment(Number(params[0]));
    },
  },

  /* ---- shop: invoices ---- */
  {
    method: "GET",
    pattern: /^\/shop\/invoices$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: InvoiceFilters = {
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
        status:
          query.status === undefined
            ? undefined
            : (String(query.status) as InvoiceStatus),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as InvoiceFilters["sort"]),
        dir: query.dir === "asc" ? "asc" : "desc",
      };
      return listInvoices(filters);
    },
  },
  {
    method: "GET",
    pattern: /^\/shop\/invoices\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return getInvoice(Number(params[0]));
    },
  },
  {
    method: "POST",
    pattern: /^\/shop\/invoices$/,
    handler: (options) => {
      requireSession();
      return createInvoice(options.body as InvoiceDraft);
    },
  },

  /* ---- shop: ecommerce extension (W3) ---- */
  {
    method: "GET",
    pattern: /^\/shop\/products\/(\d+)\/reviews$/,
    handler: (_options, params) => {
      requireSession();
      return listReviews(Number(params[0]));
    },
  },
  {
    method: "GET",
    pattern: /^\/shop\/cart$/,
    handler: () => {
      requireSession();
      return getCart();
    },
  },
  {
    method: "PUT",
    pattern: /^\/shop\/cart\/items\/(\d+)$/,
    handler: (options, params) => {
      requireSession();
      return updateCartItem(
        Number(params[0]),
        Number((options.body as { qty: number }).qty),
      );
    },
  },
  {
    method: "DELETE",
    pattern: /^\/shop\/cart\/items\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return removeCartItem(Number(params[0]));
    },
  },
  {
    method: "POST",
    pattern: /^\/shop\/cart\/promo$/,
    handler: (options) => {
      requireSession();
      return applyPromo(String((options.body as { code: string }).code ?? ""));
    },
  },
  {
    method: "GET",
    pattern: /^\/shop\/shipping$/,
    handler: () => {
      requireSession();
      return shippingMethods();
    },
  },
  {
    method: "POST",
    pattern: /^\/shop\/orders$/,
    handler: (options) => {
      requireSession();
      return placeOrder(options.body as PlaceOrderPayload);
    },
  },
  {
    method: "GET",
    pattern: /^\/shop\/sellers$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: SellerFilters = {
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
        status:
          query.status === undefined
            ? undefined
            : (String(query.status) as SellerStatus),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as SellerFilters["sort"]),
        dir: query.dir === "desc" ? "desc" : "asc",
      };
      return listSellers(filters);
    },
  },
  {
    method: "GET",
    pattern: /^\/shop\/sellers\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return getSeller(Number(params[0]));
    },
  },
  {
    method: "GET",
    pattern: /^\/shop\/sellers\/(\d+)\/products$/,
    handler: (_options, params) => {
      requireSession();
      return listSellerProducts(Number(params[0]));
    },
  },

  /* ---- analytics dashboard ---- */
  {
    method: "GET",
    pattern: /^\/analytics$/,
    handler: (options) => {
      requireSession();
      return getAnalytics(
        clampPeriod(
          options.query?.period === undefined
            ? undefined
            : String(options.query.period),
        ),
      );
    },
  },

  /* ---- dashboard verticals (W2) ---- */
  {
    method: "GET",
    pattern: /^\/dashboards\/([a-z]+)$/,
    handler: (options, params) => {
      requireSession();
      const vertical = params[0];
      if (!isDashboardVertical(vertical))
        throw new ApiError(404, `Unknown dashboard vertical: ${vertical}`);
      const period = clampPeriod(
        options.query?.period === undefined
          ? undefined
          : String(options.query.period),
      );
      devDebug("[mock:dashboards] get", { vertical, period });
      return getVerticalDashboard(vertical, period);
    },
  },

  /* ---- inbox / chat ---- */
  {
    method: "GET",
    pattern: /^\/inbox$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const folder = (
        query.folder === undefined ? "inbox" : String(query.folder)
      ) as InboxFolder;
      const q = query.q === undefined ? undefined : String(query.q);
      return listThreads(folder, q);
    },
  },
  {
    method: "GET",
    pattern: /^\/inbox\/threads\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return getThread(Number(params[0]));
    },
  },
  {
    method: "POST",
    pattern: /^\/inbox\/threads\/(\d+)\/messages$/,
    handler: (options, params) => {
      requireSession();
      return sendMessage(
        Number(params[0]),
        String((options.body as { body: string }).body ?? ""),
      );
    },
  },
  {
    method: "POST",
    pattern: /^\/inbox\/threads\/(\d+)\/read$/,
    handler: (_options, params) => {
      requireSession();
      return markRead(Number(params[0]));
    },
  },

  /* ---- shop: discounts (CRUD) ---- */
  {
    method: "GET",
    pattern: /^\/shop\/discounts$/,
    handler: () => {
      requireSession();
      return listDiscounts();
    },
  },
  {
    method: "POST",
    pattern: /^\/shop\/discounts$/,
    handler: (options) => {
      requireSession();
      return saveDiscount(options.body as DiscountPayload);
    },
  },
  {
    method: "PUT",
    pattern: /^\/shop\/discounts\/(\d+)$/,
    handler: (options, params) => {
      requireSession();
      return saveDiscount(options.body as DiscountPayload, Number(params[0]));
    },
  },
  {
    method: "DELETE",
    pattern: /^\/shop\/discounts\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return deleteDiscount(Number(params[0]));
    },
  },

  /* ---- shop: delivery methods (CRUD) ---- */
  {
    method: "GET",
    pattern: /^\/shop\/delivery$/,
    handler: () => {
      requireSession();
      return listDelivery();
    },
  },
  {
    method: "POST",
    pattern: /^\/shop\/delivery$/,
    handler: (options) => {
      requireSession();
      return saveDelivery(options.body as DeliveryPayload);
    },
  },
  {
    method: "PUT",
    pattern: /^\/shop\/delivery\/(\d+)$/,
    handler: (options, params) => {
      requireSession();
      return saveDelivery(options.body as DeliveryPayload, Number(params[0]));
    },
  },
  {
    method: "DELETE",
    pattern: /^\/shop\/delivery\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return deleteDelivery(Number(params[0]));
    },
  },

  /* ---- kanban board ---- */
  {
    method: "GET",
    pattern: /^\/kanban$/,
    handler: () => {
      requireSession();
      return getBoard();
    },
  },
  {
    method: "POST",
    pattern: /^\/kanban\/move$/,
    handler: (options) => {
      requireSession();
      const body = options.body as {
        card_id: string;
        to_column: string;
        to_index: number;
      };
      return moveCard(body.card_id, body.to_column, Number(body.to_index));
    },
  },

  /* ---- W1 utility pages (team, timeline, FAQ) ---- */
  {
    method: "GET",
    pattern: /^\/pages\/team$/,
    handler: () => {
      requireSession();
      devDebug("[mock:pages] listTeam");
      return listTeam();
    },
  },
  {
    method: "GET",
    pattern: /^\/pages\/timeline$/,
    handler: () => {
      requireSession();
      devDebug("[mock:pages] listTimeline");
      return listTimeline();
    },
  },
  {
    method: "GET",
    pattern: /^\/pages\/faq$/,
    handler: () => {
      requireSession();
      devDebug("[mock:pages] listFaq");
      return listFaq();
    },
  },
  {
    method: "GET",
    pattern: /^\/pages\/gallery$/,
    handler: () => {
      requireSession();
      devDebug("[mock:pages] listGallery");
      return listGallery();
    },
  },
  {
    method: "GET",
    pattern: /^\/pages\/search$/,
    handler: () => {
      requireSession();
      devDebug("[mock:pages] listSearchResults");
      return listSearchResults();
    },
  },

  /* ---- W1 blog ---- */
  {
    method: "GET",
    pattern: /^\/blog$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      devDebug("[mock:blog] list", query);
      return listBlog({
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
        category:
          query.category === undefined ? undefined : String(query.category),
      });
    },
  },
  {
    method: "GET",
    pattern: /^\/blog\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      devDebug("[mock:blog] get", params[0]);
      return getBlogPost(Number(params[0]));
    },
  },
  {
    method: "POST",
    pattern: /^\/blog\/(\d+)\/comments$/,
    handler: (options, params) => {
      requireSession();
      devDebug("[mock:blog] comment", params[0]);
      return addBlogComment(
        Number(params[0]),
        String((options.body as { body: string }).body ?? ""),
      );
    },
  },

  /* ---- projects (W3) ---- */
  {
    method: "GET",
    pattern: /^\/projects$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: ProjectFilters = {
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
        status:
          query.status === undefined
            ? undefined
            : (String(query.status) as ProjectStatus),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as ProjectFilters["sort"]),
        dir: query.dir === "desc" ? "desc" : "asc",
      };
      return listProjects(filters);
    },
  },
  {
    method: "POST",
    pattern: /^\/projects$/,
    handler: (options) => {
      requireSession();
      return createProject(options.body as ProjectPayload);
    },
  },
  {
    method: "GET",
    pattern: /^\/projects\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return getProject(Number(params[0]));
    },
  },
  {
    method: "GET",
    pattern: /^\/projects\/(\d+)\/tasks$/,
    handler: (_options, params) => {
      requireSession();
      return projectTasks(Number(params[0]));
    },
  },
  {
    method: "GET",
    pattern: /^\/projects\/(\d+)\/files$/,
    handler: (_options, params) => {
      requireSession();
      return projectFiles(Number(params[0]));
    },
  },

  /* ---- tasks (W3) ---- */
  {
    method: "GET",
    pattern: /^\/tasks$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: TaskFilters = {
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
        project:
          query.project === undefined ? undefined : String(query.project),
        assignee:
          query.assignee === undefined ? undefined : String(query.assignee),
        priority:
          query.priority === undefined
            ? undefined
            : (String(query.priority) as TaskPriority),
        status:
          query.status === undefined
            ? undefined
            : (String(query.status) as TaskStatus),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as TaskFilters["sort"]),
        dir: query.dir === "desc" ? "desc" : "asc",
      };
      return listTasks(filters);
    },
  },
  {
    method: "GET",
    pattern: /^\/tasks\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return getTask(Number(params[0]));
    },
  },
  {
    method: "POST",
    pattern: /^\/tasks\/(\d+)\/status$/,
    handler: (options, params) => {
      requireSession();
      return setTaskStatus(
        Number(params[0]),
        (options.body as { status: TaskStatus }).status,
      );
    },
  },
  {
    method: "POST",
    pattern: /^\/tasks\/(\d+)\/comments$/,
    handler: (options, params) => {
      requireSession();
      return addTaskComment(
        Number(params[0]),
        String((options.body as { body: string }).body ?? ""),
      );
    },
  },
  {
    method: "POST",
    pattern: /^\/tasks\/(\d+)\/subtasks\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return toggleSubtask(Number(params[0]), Number(params[1]));
    },
  },

  /* ---- CRM (W3) ---- */
  {
    method: "GET",
    pattern: /^\/crm\/contacts$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: CrmContactFilters = {
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
        tag: query.tag === undefined ? undefined : String(query.tag),
        owner: query.owner === undefined ? undefined : String(query.owner),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as CrmContactFilters["sort"]),
        dir: query.dir === "desc" ? "desc" : "asc",
      };
      return listCrmContacts(filters);
    },
  },
  {
    method: "POST",
    pattern: /^\/crm\/contacts$/,
    handler: (options) => {
      requireSession();
      return createCrmContact(options.body as CrmContactPayload);
    },
  },
  {
    method: "GET",
    pattern: /^\/crm\/contacts\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return getCrmContact(Number(params[0]));
    },
  },
  {
    method: "GET",
    pattern: /^\/crm\/companies$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: CompanyFilters = {
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as CompanyFilters["sort"]),
        dir: query.dir === "desc" ? "desc" : "asc",
      };
      return listCompanies(filters);
    },
  },
  {
    method: "POST",
    pattern: /^\/crm\/companies$/,
    handler: (options) => {
      requireSession();
      return createCompany(options.body as CompanyPayload);
    },
  },
  {
    method: "GET",
    pattern: /^\/crm\/companies\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return getCompany(Number(params[0]));
    },
  },
  {
    method: "GET",
    pattern: /^\/crm\/deals$/,
    handler: () => {
      requireSession();
      return listDeals();
    },
  },
  {
    method: "POST",
    pattern: /^\/crm\/deals\/(\d+)\/move$/,
    handler: (options, params) => {
      requireSession();
      return moveDeal(
        Number(params[0]),
        (options.body as { stage: DealStage }).stage,
      );
    },
  },
  {
    method: "GET",
    pattern: /^\/crm\/leads$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: LeadFilters = {
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
        status:
          query.status === undefined
            ? undefined
            : (String(query.status) as LeadStatus),
        source: query.source === undefined ? undefined : String(query.source),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as LeadFilters["sort"]),
        dir: query.dir === "desc" ? "desc" : "asc",
      };
      return listLeads(filters);
    },
  },
  {
    method: "POST",
    pattern: /^\/crm\/leads\/(\d+)\/convert$/,
    handler: (_options, params) => {
      requireSession();
      return convertLead(Number(params[0]));
    },
  },

  /* ---- calendar (W3) ---- */
  {
    method: "GET",
    pattern: /^\/calendar\/events$/,
    handler: () => {
      requireSession();
      return listEvents();
    },
  },
  {
    method: "POST",
    pattern: /^\/calendar\/events$/,
    handler: (options) => {
      requireSession();
      return saveEvent(options.body as CalendarEventPayload);
    },
  },
  {
    method: "POST",
    pattern: /^\/calendar\/events\/(\d+)\/move$/,
    handler: (options, params) => {
      requireSession();
      const body = options.body as { start: string; end: string };
      return moveEvent(Number(params[0]), body.start, body.end);
    },
  },
  {
    method: "DELETE",
    pattern: /^\/calendar\/events\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return deleteEvent(Number(params[0]));
    },
  },

  /* ---- email / mailbox (W3) ---- */
  {
    method: "GET",
    pattern: /^\/email$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const folder = (
        query.folder === undefined ? "inbox" : String(query.folder)
      ) as MailFolder;
      const q = query.q === undefined ? undefined : String(query.q);
      return listMail(folder, q);
    },
  },
  {
    method: "POST",
    pattern: /^\/email\/send$/,
    handler: (options) => {
      requireSession();
      return sendMail(options.body as MailSendPayload);
    },
  },
  {
    method: "GET",
    pattern: /^\/email\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return getMail(Number(params[0]));
    },
  },
  {
    method: "POST",
    pattern: /^\/email\/(\d+)\/star$/,
    handler: (_options, params) => {
      requireSession();
      return starMail(Number(params[0]));
    },
  },
  {
    method: "POST",
    pattern: /^\/email\/(\d+)\/read$/,
    handler: (_options, params) => {
      requireSession();
      return markMailRead(Number(params[0]));
    },
  },
  {
    method: "POST",
    pattern: /^\/email\/(\d+)\/move$/,
    handler: (options, params) => {
      requireSession();
      return moveMail(
        Number(params[0]),
        (options.body as { folder: MailFolder }).folder,
      );
    },
  },

  /* ---- support tickets (W3) ---- */
  {
    method: "GET",
    pattern: /^\/support\/tickets$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: TicketFilters = {
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
        status:
          query.status === undefined
            ? undefined
            : (String(query.status) as TicketStatus),
        priority:
          query.priority === undefined
            ? undefined
            : (String(query.priority) as TicketPriority),
        agent: query.agent === undefined ? undefined : String(query.agent),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as TicketFilters["sort"]),
        dir: query.dir === "asc" ? "asc" : "desc",
      };
      return listTickets(filters);
    },
  },
  {
    method: "GET",
    pattern: /^\/support\/tickets\/stats$/,
    handler: () => {
      requireSession();
      return ticketStats();
    },
  },
  {
    method: "POST",
    pattern: /^\/support\/tickets$/,
    handler: (options) => {
      requireSession();
      return createTicket(options.body as TicketPayload);
    },
  },
  {
    method: "GET",
    pattern: /^\/support\/tickets\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return getTicket(Number(params[0]));
    },
  },
  {
    method: "POST",
    pattern: /^\/support\/tickets\/(\d+)\/reply$/,
    handler: (options, params) => {
      requireSession();
      return replyTicket(
        Number(params[0]),
        (options.body as { body: string }).body,
      );
    },
  },
  {
    method: "POST",
    pattern: /^\/support\/tickets\/(\d+)\/status$/,
    handler: (options, params) => {
      requireSession();
      return setTicketStatus(
        Number(params[0]),
        (options.body as { status: TicketStatus }).status,
      );
    },
  },
  {
    method: "POST",
    pattern: /^\/support\/tickets\/(\d+)\/assign$/,
    handler: (options, params) => {
      requireSession();
      return assignTicket(
        Number(params[0]),
        (options.body as { agent: string }).agent,
      );
    },
  },

  /* ---- to-do (W3) ---- */
  {
    method: "GET",
    pattern: /^\/todo$/,
    handler: () => {
      requireSession();
      return listTodos();
    },
  },
  {
    method: "POST",
    pattern: /^\/todo$/,
    handler: (options) => {
      requireSession();
      const body = options.body as { title: string; priority: TodoPriority };
      return addTodo(body.title, body.priority);
    },
  },
  {
    method: "POST",
    pattern: /^\/todo\/reorder$/,
    handler: (options) => {
      requireSession();
      return reorderTodos((options.body as { ids: number[] }).ids);
    },
  },
  {
    method: "POST",
    pattern: /^\/todo\/(\d+)\/toggle$/,
    handler: (_options, params) => {
      requireSession();
      return toggleTodo(Number(params[0]));
    },
  },
  {
    method: "DELETE",
    pattern: /^\/todo\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return removeTodo(Number(params[0]));
    },
  },

  /* ---- api keys (W3) ---- */
  {
    method: "GET",
    pattern: /^\/api-keys$/,
    handler: () => {
      requireSession();
      return listApiKeys();
    },
  },
  {
    method: "POST",
    pattern: /^\/api-keys$/,
    handler: (options) => {
      requireSession();
      return createApiKey(options.body as ApiKeyCreatePayload);
    },
  },
  {
    method: "POST",
    pattern: /^\/api-keys\/(\d+)\/revoke$/,
    handler: (_options, params) => {
      requireSession();
      return revokeApiKey(Number(params[0]));
    },
  },

  /* ---- crypto (W4 mono-niche) ---- */
  {
    method: "GET",
    pattern: /^\/crypto\/transactions$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: CryptoTxFilters = {
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
        coin: query.coin === undefined ? undefined : String(query.coin),
        type:
          query.type === undefined
            ? undefined
            : (String(query.type) as CryptoTxType),
        from: query.from === undefined ? undefined : String(query.from),
        to: query.to === undefined ? undefined : String(query.to),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as CryptoTxFilters["sort"]),
        dir: query.dir === "asc" ? "asc" : "desc",
      };
      return cryptoTransactions(filters);
    },
  },
  {
    method: "GET",
    pattern: /^\/crypto\/markets$/,
    handler: () => {
      requireSession();
      return cryptoMarkets();
    },
  },
  {
    method: "GET",
    pattern: /^\/crypto\/quote$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      return cryptoQuote(String(query.pair ?? ""), Number(query.amount ?? 0));
    },
  },
  {
    method: "POST",
    pattern: /^\/crypto\/trade$/,
    handler: (options) => {
      requireSession();
      return cryptoTrade(options.body as CryptoTradePayload);
    },
  },
  {
    method: "GET",
    pattern: /^\/crypto\/orders$/,
    handler: (options) => {
      requireSession();
      const status = options.query?.status;
      return cryptoOrders(status === undefined ? undefined : String(status));
    },
  },
  {
    method: "POST",
    pattern: /^\/crypto\/orders\/(\d+)\/cancel$/,
    handler: (_options, params) => {
      requireSession();
      return cryptoCancelOrder(Number(params[0]));
    },
  },
  {
    method: "GET",
    pattern: /^\/crypto\/wallet$/,
    handler: () => {
      requireSession();
      return cryptoWallet();
    },
  },
  {
    method: "POST",
    pattern: /^\/crypto\/wallet\/deposit$/,
    handler: (options) => {
      requireSession();
      return cryptoDeposit(options.body as CryptoDepositPayload);
    },
  },
  {
    method: "POST",
    pattern: /^\/crypto\/wallet\/withdraw$/,
    handler: (options) => {
      requireSession();
      return cryptoWithdraw(options.body as CryptoWithdrawPayload);
    },
  },
  {
    method: "GET",
    pattern: /^\/crypto\/icos$/,
    handler: (options) => {
      requireSession();
      const status = options.query?.status;
      return cryptoIcos({
        status:
          status === undefined ? undefined : (String(status) as IcoStatus),
      });
    },
  },
  {
    method: "GET",
    pattern: /^\/crypto\/icos\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return cryptoGetIco(Number(params[0]));
    },
  },
  {
    method: "POST",
    pattern: /^\/crypto\/kyc$/,
    handler: (options) => {
      requireSession();
      return cryptoSubmitKyc(options.body as KycPayload);
    },
  },

  /* ---- nft (W4 niche) ---- */
  {
    method: "GET",
    pattern: /^\/nft\/items$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: NftItemFilters = {
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
        category:
          query.category === undefined
            ? undefined
            : (String(query.category) as NftCategory),
        chain:
          query.chain === undefined
            ? undefined
            : (String(query.chain) as NftChain),
        status:
          query.status === undefined
            ? undefined
            : (String(query.status) as NftItemStatus),
        collection:
          query.collection === undefined ? undefined : Number(query.collection),
        min: query.min === undefined ? undefined : Number(query.min),
        max: query.max === undefined ? undefined : Number(query.max),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as NftItemFilters["sort"]),
      };
      return nftItems(filters);
    },
  },
  {
    method: "GET",
    pattern: /^\/nft\/collections$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: NftCollectionFilters = {
        q: query.q === undefined ? undefined : String(query.q),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as NftCollectionFilters["sort"]),
      };
      return nftCollections(filters);
    },
  },
  {
    method: "GET",
    pattern: /^\/nft\/creators$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: NftCreatorFilters = {
        q: query.q === undefined ? undefined : String(query.q),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as NftCreatorFilters["sort"]),
      };
      return nftCreators(filters);
    },
  },
  {
    method: "POST",
    pattern: /^\/nft\/creators\/(\d+)\/follow$/,
    handler: (_options, params) => {
      requireSession();
      return nftFollow(Number(params[0]));
    },
  },
  {
    method: "GET",
    pattern: /^\/nft\/auctions$/,
    handler: () => {
      requireSession();
      return nftAuctions();
    },
  },
  {
    method: "POST",
    pattern: /^\/nft\/auctions\/(\d+)\/bid$/,
    handler: (options, params) => {
      requireSession();
      return nftBid(
        Number(params[0]),
        Number((options.body as { amount: number }).amount),
      );
    },
  },
  {
    method: "GET",
    pattern: /^\/nft\/ranking$/,
    handler: (options) => {
      requireSession();
      const period = options.query?.period;
      return nftRanking(
        (period === undefined ? "24h" : String(period)) as NftRankingPeriod,
      );
    },
  },
  {
    method: "POST",
    pattern: /^\/nft\/items$/,
    handler: (options) => {
      requireSession();
      return nftCreate(options.body as NftCreatePayload);
    },
  },
  {
    method: "GET",
    pattern: /^\/nft\/items\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return nftItem(Number(params[0]));
    },
  },

  /* ---- jobs / recruitment (W4 niche) ---- */
  {
    method: "GET",
    pattern: /^\/jobs\/stats$/,
    handler: () => {
      requireSession();
      return jobsStats();
    },
  },
  {
    method: "GET",
    pattern: /^\/jobs\/candidates$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: CandidateFilters = {
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
        stage:
          query.stage === undefined
            ? undefined
            : (String(query.stage) as CandidateStage),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as CandidateFilters["sort"]),
        dir: query.dir === "asc" ? "asc" : "desc",
      };
      return jobsCandidates(filters);
    },
  },
  {
    method: "GET",
    pattern: /^\/jobs\/companies$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: JobCompanyFilters = {
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
      };
      return jobsCompanies(filters);
    },
  },
  {
    method: "GET",
    pattern: /^\/jobs\/companies\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return jobsCompany(Number(params[0]));
    },
  },
  {
    method: "GET",
    pattern: /^\/jobs\/categories$/,
    handler: () => {
      requireSession();
      return jobsCategories();
    },
  },
  {
    method: "POST",
    pattern: /^\/jobs\/categories$/,
    handler: (options) => {
      requireSession();
      return jobsSaveCategory(options.body as JobCategoryPayload);
    },
  },
  {
    method: "DELETE",
    pattern: /^\/jobs\/categories\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return jobsDeleteCategory(Number(params[0]));
    },
  },
  {
    method: "POST",
    pattern: /^\/jobs\/apply$/,
    handler: (options) => {
      requireSession();
      return jobsApply(options.body as ApplicationPayload);
    },
  },
  {
    method: "GET",
    pattern: /^\/jobs$/,
    handler: (options) => {
      requireSession();
      const query = options.query ?? {};
      const filters: JobFilters = {
        page: query.page === undefined ? undefined : Number(query.page),
        q: query.q === undefined ? undefined : String(query.q),
        department:
          query.department === undefined
            ? undefined
            : (String(query.department) as JobDepartment),
        type:
          query.type === undefined
            ? undefined
            : (String(query.type) as JobType),
        status:
          query.status === undefined
            ? undefined
            : (String(query.status) as JobStatus),
        sort:
          query.sort === undefined
            ? undefined
            : (String(query.sort) as JobFilters["sort"]),
        dir: query.dir === "asc" ? "asc" : "desc",
      };
      return jobsList(filters);
    },
  },
  {
    method: "POST",
    pattern: /^\/jobs$/,
    handler: (options) => {
      requireSession();
      return jobsCreate(options.body as JobCreatePayload);
    },
  },
  {
    method: "GET",
    pattern: /^\/jobs\/(\d+)$/,
    handler: (_options, params) => {
      requireSession();
      return jobsGet(Number(params[0]));
    },
  },
  {
    method: "GET",
    pattern: /^\/jobs\/(\d+)\/applicants$/,
    handler: (_options, params) => {
      requireSession();
      return jobsApplicants(Number(params[0]));
    },
  },
];

export async function handleMockRequest<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  await delay();
  const method = options.method ?? "GET";
  for (const route of routes) {
    if (route.method !== method) continue;
    const match = path.match(route.pattern);
    if (!match) continue;
    try {
      const result = route.handler(
        options,
        match.slice(1) as unknown as Record<string, string>,
      ) as T;
      console.debug("[mock]", method, path);
      return result;
    } catch (cause) {
      // Surface which server-side invariant fired (422 field codes / error codes).
      const detail =
        cause instanceof ValidationError
          ? Object.values(cause.fields).join(",")
          : (cause as ApiError)?.code;
      console.debug(
        "[mock]",
        method,
        path,
        "→",
        (cause as ApiError)?.status ?? "error",
        detail ?? "",
      );
      throw cause;
    }
  }
  throw new ApiError(404, `Mock route not implemented: ${method} ${path}`);
}

/** SSE mock (D:ai §5): scripted event sequences for message send and plan approve. */
export async function handleMockStream(
  path: string,
  body: unknown,
  onEvent: (event: unknown) => void,
  signal?: AbortSignal,
): Promise<void> {
  await delay();
  requireSession();
  const emit = onEvent as (event: AiStreamEvent) => void;
  const message = path.match(/^\/ai\/conversations\/(\d+|new)\/messages$/);
  if (message) {
    console.debug("[mock:sse]", path);
    const id = message[1] === "new" ? null : Number(message[1]);
    return streamAiMessage(
      id,
      body as { message: string; screen_context?: AiScreenContext | null },
      emit,
      signal,
    );
  }
  const approve = path.match(/^\/ai\/plans\/(\d+)\/approve$/);
  if (approve) {
    console.debug("[mock:sse]", path);
    return streamAiPlanApprove(Number(approve[1]), emit, signal);
  }
  throw new ApiError(404, `Mock stream not implemented: ${path}`);
}
