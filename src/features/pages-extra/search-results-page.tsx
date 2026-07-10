import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { devDebug } from "@/lib/debug";
import { FileText, Image as ImageIcon, Search, UserCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { api } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { Panel } from "@/components/panel";
import { SearchInput } from "@/components/toolbar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /search-results: global search results with type tabs (all/pages/users/media)
 * and pagination. Flow-entered (no sidebar row). Demo data comes from the
 * mock-API layer; filtering stays client-side.
 */

const TYPE_ICON = {
  page: FileText,
  user: UserCircle,
  media: ImageIcon,
} as const;
const TABS = ["all", "page", "user", "media"] as const;
const PER_PAGE = 6;

export function SearchResultsPage() {
  useLocale();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const type = params.get("type") ?? "all";
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);

  devDebug("[SearchResultsPage] render", { query, type, page });

  const searchQuery = useQuery({
    queryKey: ["pages", "search"],
    queryFn: api.pages.search,
  });

  const matches = useMemo(() => {
    const q = query.toLowerCase().trim();
    return (searchQuery.data ?? []).filter((result) => {
      if (type !== "all" && result.type !== type) return false;
      if (q && !`${result.title} ${result.hint}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [searchQuery.data, query, type]);

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

        {searchQuery.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: PER_PAGE }, (_, index) => (
              <Skeleton key={index} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : shown.length === 0 ? (
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
