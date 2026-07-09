import { useMemo } from "react";
import { devDebug } from "@/lib/debug";
import { FileText, Image as ImageIcon, Search, UserCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { Panel } from "@/components/panel";
import { SearchInput } from "@/components/toolbar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /search-results: global search results with type tabs (all/pages/users/media)
 * and pagination. Flow-entered (no sidebar row). Presentational demo fixture.
 */

type ResultType = "page" | "user" | "media";

interface Result {
  id: number;
  type: ResultType;
  title: string;
  hint: string;
  url: string;
}

const TYPE_ICON = {
  page: FileText,
  user: UserCircle,
  media: ImageIcon,
} as const;
const TABS = ["all", "page", "user", "media"] as const;
const PER_PAGE = 6;

const RESULTS: Result[] = [
  { id: 1, type: "page", title: "Dashboard overview", hint: "/", url: "/" },
  { id: 2, type: "page", title: "Team directory", hint: "/team", url: "/team" },
  {
    id: 3,
    type: "page",
    title: "Pricing plans",
    hint: "/pricing",
    url: "/pricing",
  },
  {
    id: 4,
    type: "page",
    title: "Blog list",
    hint: "/blog/list",
    url: "/blog/list",
  },
  { id: 5, type: "page", title: "FAQ & help", hint: "/faq", url: "/faq" },
  {
    id: 6,
    type: "user",
    title: "Anna Adminson",
    hint: "anna@example.com",
    url: "/team",
  },
  {
    id: 7,
    type: "user",
    title: "Mia Chen",
    hint: "mia@example.com",
    url: "/team",
  },
  {
    id: 8,
    type: "user",
    title: "Liam Novak",
    hint: "liam@example.com",
    url: "/team",
  },
  {
    id: 9,
    type: "user",
    title: "Emma Wright",
    hint: "emma@example.com",
    url: "/team",
  },
  {
    id: 10,
    type: "media",
    title: "hero.jpg",
    hint: "2026/07 · 1.2 MB",
    url: "/media",
  },
  {
    id: 11,
    type: "media",
    title: "og-cover.jpg",
    hint: "2026/07 · 840 KB",
    url: "/media",
  },
  {
    id: 12,
    type: "media",
    title: "team-photo.jpg",
    hint: "2026/07 · 2.1 MB",
    url: "/media",
  },
  {
    id: 13,
    type: "page",
    title: "Appearance settings",
    hint: "/appearance",
    url: "/appearance",
  },
  {
    id: 14,
    type: "user",
    title: "Noah Kim",
    hint: "noah@example.com",
    url: "/team",
  },
  {
    id: 15,
    type: "media",
    title: "banner-summer.jpg",
    hint: "2026/07 · 1.6 MB",
    url: "/media",
  },
];

export function SearchResultsPage() {
  useLocale();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const type = params.get("type") ?? "all";
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);

  devDebug("[SearchResultsPage] render", { query, type, page });

  const matches = useMemo(() => {
    const q = query.toLowerCase().trim();
    return RESULTS.filter((result) => {
      if (type !== "all" && result.type !== type) return false;
      if (q && !`${result.title} ${result.hint}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [query, type]);

  const patch = (next: Record<string, string | undefined>) => {
    const updated = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value) updated.set(key, value);
      else updated.delete(key);
    }
    setParams(updated, { replace: true });
  };

  const shown = matches.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pages = Math.max(1, Math.ceil(matches.length / PER_PAGE));

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("searchResults.title")}
        icon={Search}
        breadcrumbs={[{ label: t("searchResults.title") }]}
      />
      <Panel
        title={
          query ? t("searchResults.for", { query }) : t("searchResults.heading")
        }
        actions={
          <SearchInput
            value={query}
            onChange={(value) =>
              patch({ q: value || undefined, page: undefined })
            }
            placeholder={t("searchResults.placeholder")}
            className="w-full sm:w-64"
          />
        }
      >
        <Tabs
          value={type}
          onValueChange={(value) =>
            patch({
              type: value === "all" ? undefined : value,
              page: undefined,
            })
          }
          className="mb-4"
        >
          <TabsList className="flex-wrap">
            {TABS.map((key) => (
              <TabsTrigger key={key} value={key}>
                {t(`searchResults.tab.${key}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {shown.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t("searchResults.empty.title")}
            description={
              query
                ? t("searchResults.empty.query", { query })
                : t("searchResults.empty.description")
            }
          />
        ) : (
          <div className="space-y-2">
            {shown.map((result) => {
              const Icon = TYPE_ICON[result.type];
              return (
                <Link
                  key={result.id}
                  to={result.url}
                  className="flex items-center gap-3 rounded-xl border border-[var(--glass-border)] p-3 transition-colors hover:bg-accent"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {result.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {result.hint}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {t(`searchResults.tab.${result.type}`)}
                  </Badge>
                </Link>
              );
            })}
            <PaginationBar
              pagination={{
                page,
                pages,
                total: matches.length,
                perPage: PER_PAGE,
              }}
              shown={shown.length}
              onPage={(next) =>
                patch({ page: next > 1 ? String(next) : undefined })
              }
              className="pt-2"
            />
          </div>
        )}
      </Panel>
    </div>
  );
}
