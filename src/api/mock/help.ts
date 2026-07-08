import type { HelpArticle, HelpArticleRef, HelpGroup, HelpSearchHit } from '../types'

/*
 * Help fixtures. A real backend reads modules/{slug}/docs/{locale}/*.md; the mock
 * keeps a few finished articles so the /help screen and the "?" sheet are fully
 * browsable. Content is written in plain language, no jargon.
 */

interface MockArticle {
  module: string
  page: string
  section: string
  sectionKey: string
  title: string
  /** Screen key for contextual help (front-matter `screen`). */
  screen?: string
  /** True → ui_locale translation is "missing", source-locale text shown (fallback demo). */
  isFallback?: boolean
  markdown: string
}

const ARTICLES: MockArticle[] = [
  {
    module: 'dashboard',
    page: 'overview',
    section: 'Getting started',
    sectionKey: 'getting-started',
    title: 'Get to know your dashboard',
    screen: 'dashboard',
    markdown: `The dashboard is the first thing you see after signing in. It gathers the numbers and shortcuts you use most into a grid of widgets.

## What you can do

1. **Rearrange widgets** — drag any card to reorder it, and use the size control to make a card wider or taller.
2. **Pick a period** — the range picker at the top rescales every time-based widget (week, month, quarter).
3. **Hide what you don't need** — hidden widgets stay available and can be restored at any time.

> **Tip.** Layouts are saved per role, so each team sees the widgets that matter to them.`,
  },
  {
    module: 'media',
    page: 'upload',
    section: 'Getting started',
    sectionKey: 'getting-started',
    title: 'Upload and manage media',
    screen: 'media.library',
    markdown: `All images and files live in the **Media library** — upload once, reuse anywhere.

## Steps

1. Open **Media** and drag files straight into the window — or press **"Upload"**.
2. Fill in the **alt text**: search engines and screen readers rely on it.
3. Insert an image into any screen through the media picker.

> **Photo too large?** No problem — the system prepares resized copies automatically, and the original is kept.`,
  },
  {
    module: 'orders',
    page: 'overview',
    section: 'Shop',
    sectionKey: 'shop',
    title: 'Manage orders',
    screen: 'orders.list',
    markdown: `The **Orders** screen lists every order with its status, customer and total.

## Working with an order

1. Use the filters and search to narrow the list, then open an order to see its full details.
2. Update the status as the order moves through **paid → shipped → done**.
3. Payments and invoices for the order are linked from the same screen.

> **Tip.** Amounts are shown in the store currency and formatted for the active language automatically.`,
  },
  {
    module: 'products',
    page: 'overview',
    section: 'Shop',
    sectionKey: 'shop',
    title: 'Add and edit products',
    screen: 'products.list',
    markdown: `The **Products** screen is your catalog: prices, stock and status in one place.

## Steps

1. Press **"Add"** to create a product, or open an existing one to edit it.
2. Set the price and stock; save the product as a draft until it's ready.
3. Switch the status to **published** to make it available.

> **Not showing up?** Draft products are visible only in the admin — publish to make a product live.`,
  },
  {
    module: 'users',
    page: 'roles',
    section: 'System',
    sectionKey: 'system',
    title: 'Users and roles',
    screen: 'users.list',
    markdown: `Every teammate signs in with their own account, and their role decides what they can access.

## How it works

1. **Users** — the list of accounts: who is active and when they last signed in.
2. A role is a set of permission checkboxes. Ready-made roles: Administrator and Editor; you can create your own.
3. A role change takes effect immediately — the user does not need to sign in again.

> **Someone left the team?** Don't delete the account — deactivate it. The activity history is kept and access is closed.`,
  },
  {
    module: 'ai',
    page: 'assistant',
    section: 'System',
    sectionKey: 'system',
    title: 'Using the AI assistant',
    screen: 'ai',
    markdown: `The AI assistant helps you find things and draft content without leaving the admin.

## Steps

1. Open the assistant from the header, or press **⌘J / Ctrl+J** anywhere.
2. Ask a question or describe what you need — the assistant knows which screen you're on.
3. Start a fresh conversation with **"+"**; the panel keeps your last dialog for quick reference.

> **Button missing?** The assistant appears only when an AI provider key is configured.`,
  },
]

const GROUP_ORDER: { key: string; label: string }[] = [
  { key: 'getting-started', label: 'Getting started' },
  { key: 'shop', label: 'Shop' },
  { key: 'system', label: 'System' },
]

function ref(a: MockArticle): HelpArticleRef {
  return { module: a.module, page: a.page, title: a.title }
}

export function helpTree(): HelpGroup[] {
  return GROUP_ORDER.map((g) => ({
    key: g.key,
    label: g.label,
    articles: ARTICLES.filter((a) => a.sectionKey === g.key).map(ref),
  })).filter((g) => g.articles.length > 0)
}

export function helpPage(module: string, page: string): HelpArticle | null {
  const idx = ARTICLES.findIndex((a) => a.module === module && a.page === page)
  if (idx === -1) return null
  const a = ARTICLES[idx]
  const siblings = ARTICLES.filter((s) => s.sectionKey === a.sectionKey)
  const sIdx = siblings.indexOf(a)
  return {
    module: a.module,
    page: a.page,
    title: a.title,
    section: a.section,
    is_fallback: a.isFallback ?? false,
    markdown: a.markdown,
    prev: sIdx > 0 ? ref(siblings[sIdx - 1]) : null,
    next: sIdx < siblings.length - 1 ? ref(siblings[sIdx + 1]) : null,
  }
}

export function helpForScreen(screenKey: string): HelpArticle | null {
  const a = ARTICLES.find((x) => x.screen === screenKey)
  return a ? helpPage(a.module, a.page) : null
}

export function helpSearch(q: string): HelpSearchHit[] {
  const needle = q.trim().toLowerCase()
  if (needle.length < 2) return []
  return ARTICLES.filter(
    (a) => a.title.toLowerCase().includes(needle) || a.markdown.toLowerCase().includes(needle),
  ).map((a) => {
    const text = a.markdown.replace(/[#>*`]/g, '')
    const pos = text.toLowerCase().indexOf(needle)
    const start = Math.max(0, pos - 40)
    const raw = pos === -1 ? text.slice(0, 110) : text.slice(start, pos + needle.length + 70)
    return { ...ref(a), section: a.section, snippet: (start > 0 ? '…' : '') + raw.trim() + '…' }
  })
}
