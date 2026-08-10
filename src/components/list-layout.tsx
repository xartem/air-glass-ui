import { useState, type ComponentType, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import {
  DataTable,
  type DataTableState,
  type PaginationMeta,
  type RowAction,
  type SortState,
} from "@/components/data-table";
import { PageHeader, type HeaderAction } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { BulkBar, SearchInput, type BulkAction } from "@/components/toolbar";

/*
 * ListLayout — the WHOLE list-page archetype as one component:
 * PageHeader (title left, «Add» top-right) → Panel section whose HEADER carries
 * the search+filters cluster (search first, filters right of it, view switch
 * last) → DataTable in the panel body (skeleton/error/empty states,
 * «⋯» row actions) → PaginationBar (count left, pages right). The bulk panel
 * appears above the table on selection. Screens supply data and config;
 * placement stays law. Pair with useListParams (lib) so search, filters, page
 * and sort live in the URL.
 */

export function ListLayout<TData>({
  title,
  icon,
  description,
  primaryAction,
  secondaryActions,
  breadcrumbs,
  search,
  filters,
  view,
  bulkActions,
  columns,
  data,
  state = "ready",
  rowActions,
  pagination,
  sort,
  onSort,
  onPage,
  onRetry,
  emptyState,
  getRowId,
  children,
}: {
  /* Header (primary action top-right) */
  title: string;
  icon?: ComponentType<{ className?: string }>;
  /** Panel-header subtitle (one line under the section title). */
  description?: string;
  primaryAction?: HeaderAction;
  secondaryActions?: HeaderAction[];
  breadcrumbs?: { label: string; href?: string }[];
  /* Panel-header cluster (search first, filters right of it) */
  search: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  filters?: ReactNode;
  view?: ReactNode;
  /** Enables row selection; receives the selected rows and a selection reset. */
  bulkActions?: (selected: TData[], clear: () => void) => BulkAction[];
  /* Table */
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  state?: DataTableState;
  rowActions?: RowAction<TData>[];
  pagination?: PaginationMeta;
  sort?: SortState;
  onSort?: (column: string, dir: "asc" | "desc") => void;
  onPage?: (page: number) => void;
  onRetry?: () => void;
  emptyState?: {
    title?: string;
    description?: string;
    action?: { label: string; onClick: () => void };
  };
  getRowId?: (row: TData) => string;
  /** Extra content below the table (dialogs, sheets). */
  children?: ReactNode;
}) {
  const [selected, setSelected] = useState<TData[]>([]);
  const [selectionEpoch, setSelectionEpoch] = useState(0);

  const clearSelection = () => {
    setSelected([]);
    setSelectionEpoch((epoch) => epoch + 1);
  };

  const handlePage = (page: number) => {
    // Selection does not survive a page switch — it refers to rows no longer shown
    clearSelection();
    onPage?.(page);
  };

  const bulk = bulkActions ? bulkActions(selected, clearSelection) : [];

  return (
    <div data-slot="list-layout" className="flex min-h-full flex-col gap-4">
      <PageHeader
        title={title}
        icon={icon}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
        breadcrumbs={breadcrumbs}
      />
      <Panel
        icon={icon}
        title={title}
        description={description}
        actions={
          // Left-aligned and full-width once the cluster wraps onto its own rows
          // on a phone; the pinned-right cluster is a desktop shape.
          <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
            <SearchInput
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
              className="w-full sm:w-56"
            />
            {filters}
            {view}
          </div>
        }
        contentClassName="space-y-2 p-2 sm:p-3"
      >
        {selected.length > 0 && bulk.length > 0 ? (
          <BulkBar actions={bulk} selectedCount={selected.length} />
        ) : null}
        <DataTable<TData>
          columns={columns}
          data={data}
          state={state}
          rowActions={rowActions}
          selection={Boolean(bulkActions)}
          onSelectionChange={setSelected}
          selectionResetKey={selectionEpoch}
          pagination={pagination}
          sort={sort}
          onSort={onSort}
          onPage={handlePage}
          onRetry={onRetry}
          emptyState={emptyState}
          getRowId={getRowId}
        />
      </Panel>
      {children}
    </div>
  );
}
