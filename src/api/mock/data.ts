import type { AdminLocale } from "@/lib/i18n";
import type { ActivityEntry, AdminSearchGroup, Me } from "../types";

/*
 * Mock fixtures for stage 0–1. Shapes follow the API DTOs exactly (../types) —
 * the future PHP backend replaces this layer without touching any screen.
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
];

const LOCALES: Me["locales"] = [
  { code: "ru", label: "Русский", is_default: true },
  { code: "en", label: "English", is_default: false },
  { code: "uk", label: "Українська", is_default: false },
];

const COLLECTIONS: Me["collections"] = [
  { slug: "blog", label: "Блог", has_categories: true, kind: "channel" },
  { slug: "products", label: "Товары", has_categories: true, kind: "catalog" },
];

/*
 * Collection labels are content (C1, translatable): the real API returns them
 * localized to the operator's UI locale. Mocked per-locale so the sidebar
 * matches the active admin language instead of always showing the ru default
 * (fixes English UI rendering "Блог"). buildMe() resolves via getLocale().
 */
export const COLLECTION_LABELS: Record<string, Record<AdminLocale, string>> = {
  blog: {
    ru: "Блог",
    uk: "Блог",
    en: "Blog",
    de: "Blog",
    fr: "Blog",
    es: "Blog",
    it: "Blog",
    pl: "Blog",
  },
  products: {
    ru: "Товары",
    uk: "Товари",
    en: "Products",
    de: "Produkte",
    fr: "Produits",
    es: "Productos",
    it: "Prodotti",
    pl: "Produkty",
  },
};

export function localizeCollections(
  collections: Me["collections"],
  locale: AdminLocale,
): Me["collections"] {
  return collections.map((collection) => ({
    ...collection,
    label: COLLECTION_LABELS[collection.slug]?.[locale] ?? collection.label,
  }));
}

export const MOCK_USERS: Record<MockUserKey, Me> = {
  admin: {
    user: {
      id: 1,
      name: "Анна Админова",
      email: "admin@demo.test",
      role: { key: "admin", label: "Администратор" },
      ui_locale: "ru",
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
      name: "Евгений Редактор",
      email: "editor@demo.test",
      role: { key: "editor", label: "Редактор" },
      ui_locale: "ru",
    },
    permissions: EDITOR_PERMISSIONS,
    locales: LOCALES,
    collections: COLLECTIONS.filter((c) => c.slug === "blog"),
    impersonator: null,
    maintenance_mode: "off",
    mfa: { enabled: false, enroll_required: false },
    ai_available: true,
    timezone: "UTC",
  },
  viewer: {
    user: {
      id: 3,
      name: "Виктор Новенький",
      email: "viewer@demo.test",
      role: { key: "viewer", label: "Наблюдатель" },
      ui_locale: "ru",
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
  "Главная страница",
  "О компании",
  "Контакты",
  "Насос ГНОМ-25",
  "Кровельные работы",
  "Форма обратной связи",
  "Меню шапки",
  "hero.jpg",
  "Статья: новинки июля",
  "Прайс-лист",
];

/** Entity-appropriate field diff for the audit fixture — settings show real keys, not a generic title/status. */
function changesFor(
  entityType: string,
  title: string,
): Record<string, { old: string; new: string }> {
  if (entityType === "settings") {
    return {
      "general.site_name": {
        old: "Universal CMS",
        new: "Universal CMS — Пермь",
      },
      "general.timezone": { old: "UTC", new: "Europe/Moscow" },
      "mail.from_email": {
        old: "noreply@example.com",
        new: "hello@example.com",
      },
    };
  }
  if (entityType === "user") {
    return {
      role: { old: "Наблюдатель", new: "Редактор" },
      is_active: { old: "Нет", new: "Да" },
    };
  }
  return {
    title: { old: "Старый заголовок", new: title },
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
          ? { id: 1, name: "Анна Админова" }
          : { id: 2, name: "Евгений Редактор" },
      is_ai: isAi,
      impersonator: i % 11 === 5 ? { id: 1, name: "Анна Админова" } : null,
      action,
      entity_type: entityType,
      entity_id: 10 + (i % 9),
      description: `${action}: ${SAMPLE_TITLES[i % SAMPLE_TITLES.length]}`,
      changes: hasChanges
        ? changesFor(entityType, SAMPLE_TITLES[i % SAMPLE_TITLES.length]!)
        : null,
      url:
        entityType === "page"
          ? "/pages/12"
          : entityType === "record"
            ? "/c/blog/7"
            : null,
    });
  }
  return rows;
}

/* ---- users & roles fixtures (D:users §3) ---- */

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
    label: "Администратор",
    is_system: true,
    permissions: [...ALL_PERMISSIONS],
  },
  {
    id: 2,
    key: "editor",
    label: "Редактор",
    is_system: false,
    permissions: [...EDITOR_PERMISSIONS],
  },
  {
    id: 3,
    key: "viewer",
    label: "Наблюдатель",
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
  "Ольга Петрова",
  "Дмитрий Соколов",
  "Мария Кузнецова",
  "Игорь Волков",
  "Наталья Смирнова",
  "Павел Морозов",
  "Елена Новикова",
  "Сергей Козлов",
  "Татьяна Лебедева",
  "Андрей Попов",
  "Юлия Егорова",
  "Максим Орлов",
  "Ирина Фролова",
  "Роман Зайцев",
  "Светлана Титова",
  "Артём Белов",
  "Оксана Гусева",
  "Никита Тарасов",
  "Вера Комарова",
  "Алексей Крылов",
  "Людмила Сорокина",
];

/*
 * User list dataset: the three canonical login identities (ids 1–3, aligned
 * with MOCK_USERS) followed by generated rows. Separate from MOCK_USERS, which
 * only defines the demo *sessions* (mock.user switch).
 */
export function buildUsersFixture(): MockUser[] {
  const users: MockUser[] = [
    {
      id: 1,
      name: "Анна Админова",
      email: "admin@demo.test",
      role_id: 1,
      ui_locale: "ru",
      is_active: true,
      last_login_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      name: "Евгений Редактор",
      email: "editor@demo.test",
      role_id: 2,
      ui_locale: "ru",
      is_active: true,
      last_login_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: 3,
      name: "Виктор Новенький",
      email: "viewer@demo.test",
      role_id: 3,
      ui_locale: "ru",
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
      ui_locale: index % 3 === 0 ? "en" : "ru",
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
    key: "pages",
    label: "Страницы",
    items: [
      { title: "Главная страница", url: "/pages/1" },
      { title: "О компании", url: "/pages/2" },
      { title: "Насосы — обзор", status: "draft", url: "/pages/31" },
      { title: "Контакты", url: "/pages/4" },
      { title: "Доставка и оплата", url: "/pages/5" },
    ],
  },
  {
    key: "products",
    label: "Товары",
    items: [
      { title: "Насос ГНОМ-25", hint: "SKU GN-25", url: "/c/products/7" },
      { title: "Насос дренажный НД-40", status: "draft", url: "/c/products/9" },
    ],
  },
  {
    key: "submissions",
    label: "Заявки",
    items: [
      {
        title: "№432 — «нужен насос для дачи…»",
        url: "/forms/submissions?id=432",
      },
      {
        title: "№431 — «перезвоните по кровле»",
        url: "/forms/submissions?id=431",
      },
    ],
  },
];
