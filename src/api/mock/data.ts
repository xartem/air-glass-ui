import type { ActivityEntry, AdminSearchGroup, Me } from "../types";

/*
 * Mock fixtures. Shapes follow the API DTOs exactly (../types) — a real backend
 * replaces this layer without touching any screen.
 * Switch the acting user via localStorage key `mock.user` (admin|editor|viewer).
 */

export type MockUserKey = "admin" | "editor" | "viewer";

export const ALL_PERMISSIONS = [
  "pages.view",
  "pages.manage",
  "pages.modals",
  "collections.view",
  "collections.fields",
  "collections.pages.view",
  "collections.pages.manage",
  "collections.blog.view",
  "collections.blog.manage",
  "collections.products.view",
  "collections.products.manage",
  "catalog.view",
  "catalog.manage",
  "posts.view",
  "posts.manage",
  "media.view",
  "media.manage",
  "menus.view",
  "menus.manage",
  "forms.view",
  "forms.manage",
  "forms.submissions",
  "contacts.view",
  "contacts.manage",
  "orders.view",
  "orders.manage",
  "orders.delivery",
  "orders.discounts",
  "products.view",
  "products.manage",
  "customers.view",
  "customers.manage",
  "customers.impersonate",
  "payments.view",
  "payments.manage",
  "payments.refund",
  "invoices.view",
  "invoices.manage",
  "reviews.moderate",
  "inbox.view",
  "kanban.view",
  "analytics.view",
  "seo.view",
  "seo.manage",
  "redirects.view",
  "redirects.manage",
  "search.manage",
  "themes.view",
  "themes.manage",
  "settings.view",
  "settings.manage",
  "modules.manage",
  "i18n.view",
  "i18n.manage",
  "users.view",
  "users.manage",
  "roles.manage",
  "users.impersonate",
  "mail.view",
  "mail.manage",
  "notifications.channels",
  "scheduler.view",
  "scheduler.manage",
  "cache.view",
  "cache.manage",
  "backups.view",
  "backups.manage",
  "backups.restore",
  "updates.view",
  "updates.manage",
  "activity.view",
  "activity.restore",
  "dashboard.manage",
  "ai.use",
  "ai.manage",
  // W3 app suites
  "sellers.view",
  "sellers.manage",
  "projects.view",
  "projects.manage",
  "tasks.view",
  "crm.companies",
  "crm.deals",
  "crm.leads",
  "calendar.view",
  "email.view",
  "support.view",
  "support.manage",
  "todo.view",
  "apikeys.view",
  "apikeys.manage",
];

export const EDITOR_PERMISSIONS = [
  "pages.view",
  "pages.manage",
  "collections.view",
  "collections.blog.view",
  "collections.blog.manage",
  "media.view",
  "media.manage",
  "menus.view",
  "menus.manage",
  "forms.view",
  "forms.submissions",
  "contacts.view",
  "activity.view",
  "ai.use",
  // W3 app suites: the editor role manages the day-to-day app screens.
  "sellers.view",
  "projects.view",
  "projects.manage",
  "tasks.view",
  "crm.companies",
  "crm.deals",
  "crm.leads",
  "calendar.view",
  "email.view",
  "support.view",
  "todo.view",
  "apikeys.view",
];

// Content locales for the content-language switcher (endonyms, as in LOCALE_NAMES).
const LOCALES: Me["locales"] = [
  { code: "en", label: "English", is_default: true },
  { code: "de", label: "Deutsch", is_default: false },
  { code: "fr", label: "Français", is_default: false },
];

const COLLECTIONS: Me["collections"] = [];

export const MOCK_USERS: Record<MockUserKey, Me> = {
  admin: {
    user: {
      id: 1,
      name: "Anna Adminson",
      email: "admin@demo.test",
      role: { key: "admin", label: "Administrator" },
      ui_locale: "en",
    },
    permissions: ALL_PERMISSIONS,
    locales: LOCALES,
    collections: COLLECTIONS,
    impersonator: null,
    maintenance_mode: "off",
    mfa: { enabled: false, enroll_required: false },
    ai_available: true,
    timezone: "UTC",
  },
  editor: {
    user: {
      id: 2,
      name: "Evan Editor",
      email: "editor@demo.test",
      role: { key: "editor", label: "Editor" },
      ui_locale: "en",
    },
    permissions: EDITOR_PERMISSIONS,
    locales: LOCALES,
    collections: COLLECTIONS,
    impersonator: null,
    maintenance_mode: "off",
    mfa: { enabled: false, enroll_required: false },
    ai_available: true,
    timezone: "UTC",
  },
  viewer: {
    user: {
      id: 3,
      name: "Victor Newman",
      email: "viewer@demo.test",
      role: { key: "viewer", label: "Viewer" },
      ui_locale: "en",
    },
    permissions: [],
    locales: LOCALES,
    collections: [],
    impersonator: null,
    maintenance_mode: "off",
    mfa: { enabled: false, enroll_required: false },
    ai_available: true,
    timezone: "UTC",
  },
};

/** Known mock credentials: any of these emails + password "password". */
export const MOCK_CREDENTIALS: Record<string, MockUserKey> = {
  "admin@demo.test": "admin",
  "editor@demo.test": "editor",
  "viewer@demo.test": "viewer",
};

const ENTITY_TYPES = [
  "page",
  "record",
  "form",
  "menu",
  "media",
  "user",
  "settings",
] as const;
const ACTIONS = [
  "created",
  "updated",
  "published",
  "deleted",
  "restored",
  "reordered",
] as const;

const SAMPLE_TITLES = [
  "Homepage",
  "About Us",
  "Contact",
  "Getting Started",
  "Release Notes",
  "Contact Form",
  "Header Menu",
  "hero.jpg",
  "Article: July Highlights",
  "Price List",
];

/** Entity-appropriate field diff for the audit fixture — settings show real keys, not a generic title/status. */
function changesFor(
  entityType: string,
  title: string,
): Record<string, { old: string; new: string }> {
  if (entityType === "settings") {
    return {
      "general.site_name": {
        old: "Acme Admin",
        new: "Acme Admin — HQ",
      },
      "general.timezone": { old: "UTC", new: "Europe/London" },
      "mail.from_email": {
        old: "noreply@example.com",
        new: "hello@example.com",
      },
    };
  }
  if (entityType === "user") {
    return {
      role: { old: "Viewer", new: "Editor" },
      is_active: { old: "No", new: "Yes" },
    };
  }
  return {
    title: { old: "Old title", new: title },
    status: { old: "draft", new: "published" },
  };
}

export function buildActivityFixture(): ActivityEntry[] {
  const rows: ActivityEntry[] = [];
  const base = Date.now() - 5 * 60 * 1000;
  for (let i = 0; i < 34; i++) {
    const entityType = ENTITY_TYPES[i % ENTITY_TYPES.length];
    const action = ACTIONS[i % ACTIONS.length];
    const isAi = i % 7 === 3;
    const hasChanges = action === "updated" || action === "published";
    rows.push({
      id: 200 - i,
      created_at: new Date(base - i * 47 * 60 * 1000).toISOString(),
      actor: isAi
        ? null
        : i % 3 === 0
          ? { id: 1, name: "Anna Adminson" }
          : { id: 2, name: "Evan Editor" },
      is_ai: isAi,
      impersonator: i % 11 === 5 ? { id: 1, name: "Anna Adminson" } : null,
      action,
      entity_type: entityType,
      entity_id: 10 + (i % 9),
      description: `${action}: ${SAMPLE_TITLES[i % SAMPLE_TITLES.length]}`,
      changes: hasChanges
        ? changesFor(entityType, SAMPLE_TITLES[i % SAMPLE_TITLES.length]!)
        : null,
      // Only surviving screens are linkable; other audit rows have no target.
      url:
        entityType === "media"
          ? "/media"
          : entityType === "user"
            ? "/users"
            : null,
    });
  }
  return rows;
}

/* ---- users & roles fixtures ---- */

export interface MockRole {
  id: number;
  key: string;
  label: string;
  is_system: boolean;
  permissions: string[];
}

/** Seed roles. `admin` is the system role (all permissions, matrix read-only). */
export const ROLE_SEED: MockRole[] = [
  {
    id: 1,
    key: "admin",
    label: "Administrator",
    is_system: true,
    permissions: [...ALL_PERMISSIONS],
  },
  {
    id: 2,
    key: "editor",
    label: "Editor",
    is_system: false,
    permissions: [...EDITOR_PERMISSIONS],
  },
  {
    id: 3,
    key: "viewer",
    label: "Viewer",
    is_system: false,
    permissions: [],
  },
];

/** All permission keys of enabled modules, grouped by owning module (key prefix). */
export function permissionCatalogue(): { key: string; group: string }[] {
  return ALL_PERMISSIONS.map((key) => ({ key, group: key.split(".")[0] }));
}

export interface MockUser {
  id: number;
  name: string;
  email: string;
  role_id: number;
  ui_locale: string;
  is_active: boolean;
  last_login_at: string | null;
}

const USER_NAMES = [
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
  "Susan Green",
  "Nick Tarrant",
  "Vera Cross",
  "Alex Crane",
  "Linda Sorrell",
];

const LIST_LOCALES = ["en", "de", "fr", "es"];

/*
 * User list dataset: the three canonical login identities (ids 1–3, aligned
 * with MOCK_USERS) followed by generated rows. Separate from MOCK_USERS, which
 * only defines the demo *sessions* (mock.user switch).
 */
export function buildUsersFixture(): MockUser[] {
  const users: MockUser[] = [
    {
      id: 1,
      name: "Anna Adminson",
      email: "admin@demo.test",
      role_id: 1,
      ui_locale: "en",
      is_active: true,
      last_login_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      name: "Evan Editor",
      email: "editor@demo.test",
      role_id: 2,
      ui_locale: "en",
      is_active: true,
      last_login_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: 3,
      name: "Victor Newman",
      email: "viewer@demo.test",
      role_id: 3,
      ui_locale: "en",
      is_active: true,
      last_login_at: null,
    },
  ];
  const roleCycle = [
    2, 2, 3, 2, 1, 2, 3, 2, 2, 3, 2, 2, 3, 2, 2, 3, 2, 2, 3, 2, 2,
  ];
  USER_NAMES.forEach((name, index) => {
    const id = index + 4;
    const active = index % 6 !== 5; // ~1 in 6 deactivated
    users.push({
      id,
      name,
      email: `user${id}@demo.test`,
      role_id: roleCycle[index] ?? 2,
      ui_locale: LIST_LOCALES[index % LIST_LOCALES.length]!,
      is_active: active,
      last_login_at:
        active && index % 4 !== 0
          ? new Date(Date.now() - (index + 1) * 11 * 3600 * 1000).toISOString()
          : null,
    });
  });
  return users;
}

export const SEARCH_GROUPS: AdminSearchGroup[] = [
  {
    key: "orders",
    label: "Orders",
    items: [
      { title: "Order #1046", url: "/shop/orders?id=1046" },
      { title: "Order #1043", url: "/shop/orders?id=1043" },
      { title: "Order #1039", url: "/shop/orders?id=1039" },
    ],
  },
  {
    key: "products",
    label: "Products",
    items: [
      {
        title: "Wireless Keyboard",
        hint: "SKU WK-25",
        url: "/shop/products/7",
      },
      { title: "USB-C Hub", status: "draft", url: "/shop/products/9" },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    items: [
      { title: "Irene Frost", url: "/shop/customers/1046" },
      { title: "BuildServ LLC", url: "/shop/customers/1043" },
    ],
  },
];
