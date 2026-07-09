import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FileText,
  ListTree,
  Search,
  SearchCheck,
  SearchX,
  Settings,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";

import { api, type HelpGroup } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { HelpArticleBody } from "@/components/help-article";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * /help (UI:help §2, D:help §6): user docs of enabled modules, read-only —
 * no SaveBar/dirty-guard by design. Left panel: search (debounced, swaps the
 * tree for snippet results) + collapsible groups mirroring the menu map.
 * Right panel: the article. Selected article and query live in the URL (E4).
 */

const GROUP_ICONS: Record<string, typeof FileText> = {
  content: FileText,
  promotion: SearchCheck,
  system: Settings,
};

function useDebounced(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onChange("")}
        placeholder={t("help.searchPlaceholder")}
        className="pe-9 ps-9"
      />
      {value ? (
        <button
          type="button"
          aria-label={t("help.searchClear")}
          onClick={() => onChange("")}
          className="absolute top-1/2 end-2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : (
        <Kbd className="absolute top-1/2 end-2.5 -translate-y-1/2">/</Kbd>
      )}
    </div>
  );
}

function highlight(text: string, needle: string) {
  const idx = text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx === -1 || !needle) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-primary/15 px-0.5 text-inherit">
        {text.slice(idx, idx + needle.length)}
      </mark>
      {text.slice(idx + needle.length)}
    </>
  );
}

function TreeNav({
  groups,
  active,
  onNavigate,
}: {
  groups: HelpGroup[];
  active: { module?: string; page?: string };
  onNavigate?: () => void;
}) {
  const activeGroupKey = groups.find((g) =>
    g.articles.some(
      (a) => a.module === active.module && a.page === active.page,
    ),
  )?.key;
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  return (
    <nav aria-label={t("help.nav_label")} className="flex flex-col gap-1">
      {groups.map((group) => {
        const Icon = GROUP_ICONS[group.key] ?? BookOpen;
        const isClosed =
          closed[group.key] ?? group.key !== (activeGroupKey ?? groups[0]?.key);
        return (
          <div key={group.key}>
            <button
              type="button"
              onClick={() =>
                setClosed((s) => ({ ...s, [group.key]: !isClosed }))
              }
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-start text-[13.5px] font-semibold text-secondary-foreground hover:bg-secondary"
            >
              <Icon className="size-4 text-muted-foreground" />
              {group.label}
              <ChevronDown
                className={cn(
                  "ms-auto size-3.5 text-muted-foreground transition-transform",
                  isClosed && "-rotate-90",
                )}
              />
            </button>
            {!isClosed ? (
              <div className="flex flex-col gap-px py-1 ps-1.5">
                {group.articles.map((article) => {
                  const isActive =
                    article.module === active.module &&
                    article.page === active.page;
                  return (
                    <Link
                      key={`${article.module}/${article.page}`}
                      to={`/help/${article.module}/${article.page}`}
                      onClick={onNavigate}
                      className={cn(
                        "relative rounded-lg py-1.5 pe-2 ps-5 text-[14px]",
                        isActive
                          ? "bg-accent font-semibold text-accent-foreground before:absolute before:top-1/2 before:start-2 before:size-1.5 before:-translate-y-1/2 before:rounded-full before:bg-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                      )}
                    >
                      {article.title}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function SearchResults({
  q,
  onNavigate,
}: {
  q: string;
  onNavigate?: () => void;
}) {
  const query = useQuery({
    queryKey: ["help-search", q],
    queryFn: () => api.help.search(q),
  });

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-2 py-1">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    );
  }
  if (!query.data?.length) {
    return (
      <EmptyState
        icon={SearchX}
        title={t("help.emptyTitle")}
        description={t("help.emptyHint")}
        className="py-8"
      />
    );
  }
  return (
    <div className="flex flex-col gap-px">
      {query.data.map((hit) => (
        <Link
          key={`${hit.module}/${hit.page}`}
          to={`/help/${hit.module}/${hit.page}?q=${encodeURIComponent(q)}`}
          onClick={onNavigate}
          className="rounded-lg px-2.5 py-2 hover:bg-secondary"
        >
          <div className="text-[14px] font-medium text-foreground">
            {highlight(hit.title, q)}
          </div>
          <div className="mt-0.5 line-clamp-2 text-[12.5px] text-muted-foreground">
            {highlight(hit.snippet, q)}
          </div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground/70">
            {hit.section}
          </div>
        </Link>
      ))}
    </div>
  );
}

function ArticlePane({ module, page }: { module: string; page: string }) {
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["help-article", module, page],
    queryFn: () => api.help.page(module, page),
    retry: false,
  });

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-2 h-36 w-full rounded-xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <EmptyState
        icon={CircleHelp}
        title={t("help.unavailableTitle")}
        description={t("help.unavailableHint")}
        action={{
          label: t("help.backToSections"),
          onClick: () => navigate("/help"),
        }}
      />
    );
  }

  const article = query.data;
  return (
    <article>
      {/* Section line sits under the H1 (UI:help §2) */}
      <h2 className="text-[24px] leading-tight font-semibold tracking-tight text-balance">
        {article.title}
      </h2>
      <div className="mt-1 text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
        {t("help.sectionLabel", { section: article.section })}
      </div>
      <HelpArticleBody
        markdown={article.markdown}
        isFallback={article.is_fallback}
        className="mt-2"
      />

      {article.prev || article.next ? (
        <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-4 text-[14px]">
          {article.prev ? (
            <Link
              to={`/help/${article.prev.module}/${article.prev.page}`}
              className="flex min-w-0 items-center gap-1 font-medium text-primary hover:underline"
            >
              <ChevronLeft className="size-4 shrink-0 rtl:rotate-180" />
              <span className="truncate">{article.prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {article.next ? (
            <Link
              to={`/help/${article.next.module}/${article.next.page}`}
              className="flex min-w-0 items-center gap-1 text-end font-medium text-primary hover:underline"
            >
              <span className="truncate">{article.next.title}</span>
              <ChevronRight className="size-4 shrink-0 rtl:rotate-180" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </article>
  );
}

export function HelpPage() {
  const { module, page } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rawQuery, setRawQuery] = useState(searchParams.get("q") ?? "");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const q = useDebounced(rawQuery.trim(), 250);
  const searching = q.length >= 2;

  const treeQuery = useQuery({
    queryKey: ["help-tree"],
    queryFn: api.help.tree,
    staleTime: Infinity,
  });
  const groups = useMemo(() => treeQuery.data ?? [], [treeQuery.data]);

  // Keep ?q= in the URL (deep-linkable search state, E4).
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (q) next.set("q", q);
        else next.delete("q");
        return next;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // No article selected → open the very first one (spec: auto-open the overview).
  useEffect(() => {
    if (!module && groups.length && groups[0].articles.length) {
      const first = groups[0].articles[0];
      navigate(`/help/${first.module}/${first.page}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, groups]);

  const sidePanelContent = (
    <div className="flex flex-col gap-3">
      <SearchBox value={rawQuery} onChange={setRawQuery} />
      {searching ? (
        <SearchResults q={q} onNavigate={() => setMobileNavOpen(false)} />
      ) : treeQuery.isPending ? (
        <div className="flex flex-col gap-2 py-1">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              className={cn(
                "h-7 rounded-lg",
                i % 3 === 0 ? "w-2/5" : "ms-4 w-4/5",
              )}
            />
          ))}
        </div>
      ) : (
        <TreeNav
          groups={groups}
          active={{ module, page }}
          onNavigate={() => setMobileNavOpen(false)}
        />
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("nav.help")} icon={CircleHelp} />
      <p className="-mt-3 text-sm text-muted-foreground">
        {t("help.subtitle")}
      </p>

      {/* Mobile: the tree lives in a Sheet behind the "Sections" button (UI:help §2). */}
      <div className="lg:hidden">
        <Button variant="outline" onClick={() => setMobileNavOpen(true)}>
          <ListTree />
          {t("help.sections")}
        </Button>
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-full gap-0 sm:max-w-[320px]">
            <SheetHeader className="pb-1">
              <SheetTitle>{t("help.sections")}</SheetTitle>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
              {sidePanelContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-start gap-4">
        <Panel
          className="sticky top-4 hidden w-[280px] shrink-0 lg:block"
          contentClassName="p-3.5"
        >
          {sidePanelContent}
        </Panel>
        <Panel className="min-w-0 flex-1" contentClassName="px-6 py-6 sm:px-8">
          {module && page ? (
            <ArticlePane module={module} page={page} />
          ) : (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
