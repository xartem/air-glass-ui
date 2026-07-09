import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import type { SortState } from "@/components/data-table";

/*
 * useListParams (E2 §6): list state — search, page, sort, filters — lives in the
 * URL so deep-links and Back work. Changing the search text or any filter resets
 * the page; the search input is debounced (250ms) before it hits the URL/query.
 */

export type ListParams = {
  /** Immediate input value — bind to the Toolbar search field. */
  search: string;
  setSearch: (value: string) => void;
  /** Debounced value from the URL — use in the query key / API call. */
  query: string;
  page: number;
  setPage: (page: number) => void;
  sort?: SortState;
  setSort: (column: string, dir: "asc" | "desc") => void;
  filter: (key: string) => string | undefined;
  setFilter: (key: string, value: string | undefined) => void;
};

const SEARCH_DEBOUNCE_MS = 250;

export function useListParams(): ListParams {
  const [searchParams, setSearchParams] = useSearchParams();

  const patch = (
    values: Record<string, string | undefined>,
    keepPage = false,
  ) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!keepPage) next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const query = searchParams.get("q") ?? "";
  const [search, setSearch] = useState(query);
  const lastPushed = useRef(query);

  // Debounce typed input into the URL
  useEffect(() => {
    if (search === query) return;
    const timer = setTimeout(() => {
      lastPushed.current = search;
      patch({ q: search || undefined });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Follow external URL changes (Back/Forward, deep-link)
  useEffect(() => {
    if (query !== lastPushed.current) {
      setSearch(query);
      lastPushed.current = query;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const sortColumn = searchParams.get("sort");
  const sortDir = searchParams.get("dir");

  return {
    search,
    setSearch,
    query,
    page: Math.max(1, Number(searchParams.get("page") ?? 1) || 1),
    setPage: (page) =>
      patch({ page: page > 1 ? String(page) : undefined }, true),
    sort: sortColumn
      ? { column: sortColumn, dir: sortDir === "desc" ? "desc" : "asc" }
      : undefined,
    setSort: (column, dir) => patch({ sort: column, dir }),
    filter: (key) => searchParams.get(key) ?? undefined,
    setFilter: (key, value) => patch({ [key]: value }),
  };
}
