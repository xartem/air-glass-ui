import { ApiError } from "../client";
import type {
  BlogComment,
  BlogListItem,
  BlogListParams,
  BlogPost,
  Paginated,
} from "../types";

/*
 * Blog fixtures (list / grid / article). Deterministic demo content — covers are
 * token-driven gradient blocks (no external images), comments are in-memory only.
 */

const COVER_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];
const CATEGORIES = ["product", "engineering", "design", "company"] as const;

const TAG_POOL = [
  "release",
  "guide",
  "ui",
  "performance",
  "accessibility",
  "security",
  "culture",
  "roadmap",
];
const AUTHORS = [
  { name: "Anna Adminson", initials: "AA" },
  { name: "Mia Chen", initials: "MC" },
  { name: "Liam Novak", initials: "LN" },
  { name: "Emma Wright", initials: "EW" },
];

const TITLES = [
  "Designing calm admin interfaces",
  "Shipping RTL support without regressions",
  "A closer look at our appearance styles",
  "How we keep bundle size in check",
  "Building an accessible component library",
  "The story behind the theme customizer",
  "Scaling mock data for realistic demos",
  "Lessons from a full WCAG 2.2 audit",
  "Rethinking empty states and skeletons",
  "Our approach to internationalization",
  "From kanban to calendar: workflow tools",
  "Performance budgets that actually stick",
  "Writing docs developers enjoy reading",
  "A pragmatic guide to design tokens",
  "What we learned launching the blog",
];

function excerptFor(title: string): string {
  return `${title} — a practical, opinionated take drawn from building a production-grade admin template, with concrete examples you can apply today.`;
}

function bodyFor(title: string): string[] {
  return [
    `${title}. This article walks through the decisions, trade-offs and small details that add up to a polished result.`,
    "We start with the problem, then move to the constraints that shaped the solution: accessibility, theming, and keeping the login path light.",
    "Along the way we lean on design tokens so every screen adapts to light, dark and all three appearance styles automatically — no hardcoded colors.",
    "Finally, we cover how we validated the work: keyboard navigation, contrast checks, and a review pass against the marketplace quality bar.",
  ];
}

function buildPost(index: number): BlogPost {
  const id = index + 1;
  const title = TITLES[index % TITLES.length];
  const author = AUTHORS[index % AUTHORS.length];
  const day = 8 - (index % 8);
  const tags = [
    TAG_POOL[index % TAG_POOL.length],
    TAG_POOL[(index + 3) % TAG_POOL.length],
  ];
  return {
    id,
    title,
    excerpt: excerptFor(title),
    coverColor: COVER_COLORS[index % COVER_COLORS.length],
    category: CATEGORIES[index % CATEGORIES.length],
    author,
    date: `2026-07-${String(day).padStart(2, "0")}T09:00:00Z`,
    tags,
    readMinutes: 4 + (index % 6),
    body: bodyFor(title),
    related: [],
    comments: [],
  };
}

const POSTS: BlogPost[] = TITLES.map((_, index) => buildPost(index));

/** In-memory comments keyed by post id (demo-only; cleared on reload). */
const COMMENTS = new Map<number, BlogComment[]>();

function toListItem(post: BlogPost): BlogListItem {
  const { body, related, comments, ...rest } = post;
  void body;
  void related;
  void comments;
  return rest;
}

export function listBlog(params: BlogListParams = {}): Paginated<BlogListItem> {
  const q = (params.q ?? "").toLowerCase().trim();
  const category = params.category;
  const perPage = 6;
  let rows = POSTS.filter((post) => {
    if (category && post.category !== category) return false;
    if (q && !`${post.title} ${post.excerpt}`.toLowerCase().includes(q))
      return false;
    return true;
  }).map(toListItem);
  const total = rows.length;
  const page = Math.max(1, params.page ?? 1);
  rows = rows.slice((page - 1) * perPage, page * perPage);
  return { rows, total, page, per_page: perPage };
}

export function getBlogPost(id: number): BlogPost {
  const post = POSTS.find((entry) => entry.id === id);
  if (!post) throw new ApiError(404, "Post not found");
  const related = POSTS.filter(
    (entry) => entry.id !== id && entry.category === post.category,
  )
    .slice(0, 3)
    .map(toListItem);
  return { ...post, related, comments: COMMENTS.get(id) ?? [] };
}

export function addBlogComment(id: number, body: string): BlogComment {
  const list = COMMENTS.get(id) ?? [];
  const comment: BlogComment = {
    id: (list[list.length - 1]?.id ?? 0) + 1,
    author: "You",
    initials: "YO",
    date: new Date().toISOString(),
    body,
  };
  COMMENTS.set(id, [...list, comment]);
  return comment;
}
