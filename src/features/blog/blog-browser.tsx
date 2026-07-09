import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { devDebug } from "@/lib/debug";
import { LayoutGrid, List, Newspaper } from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { api, type BlogListItem } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { Panel } from "@/components/panel";
import { SearchInput } from "@/components/toolbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListParams } from "@/lib/list-params";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Shared blog browser behind /blog/list and /blog/grid — one query + one filter
 * state (search, category, page live in the URL); only the item layout differs
 * by `view`. The view toggle links between the two routes, preserving filters.
 */

const CATEGORIES = [
  "all",
  "product",
  "engineering",
  "design",
  "company",
] as const;

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Cover({ color, className }: { color: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        backgroundImage: `linear-gradient(135deg, ${color}, ${color}99)`,
      }}
    />
  );
}

function Meta({ post }: { post: BlogListItem }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Avatar size="sm">
        <AvatarFallback>{initialsOf(post.author.name)}</AvatarFallback>
      </Avatar>
      <span>{post.author.name}</span>
      <span aria-hidden>·</span>
      <span>{post.date.slice(0, 10)}</span>
      <span aria-hidden>·</span>
      <span>{t("blog.readTime", { minutes: post.readMinutes })}</span>
    </div>
  );
}

function Tags({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Badge key={tag} variant="outline">
          {tag}
        </Badge>
      ))}
    </div>
  );
}

function GridCard({ post }: { post: BlogListItem }) {
  return (
    <Link
      to={`/blog/${post.id}`}
      className="glass-card flex flex-col overflow-hidden rounded-2xl transition-transform hover:-translate-y-0.5"
    >
      <Cover color={post.coverColor} className="h-36 w-full" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Badge variant="secondary" className="w-fit">
          {t(`blog.category.${post.category}`)}
        </Badge>
        <h3 className="font-semibold tracking-tight">{post.title}</h3>
        <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">
          {post.excerpt}
        </p>
        <Meta post={post} />
      </div>
    </Link>
  );
}

function ListRow({ post }: { post: BlogListItem }) {
  return (
    <Link
      to={`/blog/${post.id}`}
      className="glass-card flex flex-col gap-4 rounded-2xl p-4 transition-colors hover:bg-accent sm:flex-row"
    >
      <Cover
        color={post.coverColor}
        className="h-40 w-full shrink-0 rounded-xl sm:h-28 sm:w-44"
      />
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {t(`blog.category.${post.category}`)}
          </Badge>
          <Tags tags={post.tags} />
        </div>
        <h3 className="font-semibold tracking-tight">{post.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {post.excerpt}
        </p>
        <Meta post={post} />
      </div>
    </Link>
  );
}

export function BlogBrowser({ view }: { view: "list" | "grid" }) {
  useLocale();
  const params = useListParams();
  const [searchParams] = useSearchParams();
  const category = params.filter("category") ?? "all";

  const query = useQuery({
    queryKey: ["blog", "list", params.query, category, params.page],
    queryFn: () =>
      api.blog.list({
        page: params.page,
        q: params.query || undefined,
        category: category === "all" ? undefined : category,
      }),
    placeholderData: keepPreviousData,
  });
  devDebug("[BlogListPage] query", { view, category, page: params.page });

  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;
  const perPage = query.data?.per_page ?? 6;
  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("blog.title")}
        icon={Newspaper}
        breadcrumbs={[{ label: t("blog.title") }]}
      />
      <Panel
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={params.search}
              onChange={params.setSearch}
              placeholder={t("blog.search")}
              className="w-full sm:w-56"
            />
            <Select
              value={category}
              onValueChange={(value) =>
                params.setFilter(
                  "category",
                  value === "all" ? undefined : value,
                )
              }
            >
              <SelectTrigger
                className="w-40"
                aria-label={t("blog.categoryLabel")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`blog.category.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center rounded-lg border border-[var(--glass-border)] p-0.5">
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="icon-sm"
                asChild
                aria-label={t("blog.view.list")}
              >
                <Link
                  to={`/blog/list${searchParams.toString() ? `?${searchParams}` : ""}`}
                >
                  <List className="size-4" />
                </Link>
              </Button>
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon-sm"
                asChild
                aria-label={t("blog.view.grid")}
              >
                <Link
                  to={`/blog/grid${searchParams.toString() ? `?${searchParams}` : ""}`}
                >
                  <LayoutGrid className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        }
      >
        {query.isPending ? (
          <div
            className={
              view === "grid"
                ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-3"
            }
          >
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton
                key={index}
                className={
                  view === "grid" ? "h-72 rounded-2xl" : "h-36 rounded-2xl"
                }
              />
            ))}
          </div>
        ) : query.isError ? (
          <EmptyState
            title={t("table.error.title")}
            description={t("table.error.description")}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title={t("blog.empty.title")}
            description={t("blog.empty.description")}
          />
        ) : (
          <div className="space-y-4">
            <div
              className={
                view === "grid"
                  ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  : "space-y-3"
              }
            >
              {rows.map((post) =>
                view === "grid" ? (
                  <GridCard key={post.id} post={post} />
                ) : (
                  <ListRow key={post.id} post={post} />
                ),
              )}
            </div>
            <PaginationBar
              pagination={{ page: params.page, pages, total, perPage }}
              shown={rows.length}
              onPage={params.setPage}
            />
          </div>
        )}
      </Panel>
    </div>
  );
}
