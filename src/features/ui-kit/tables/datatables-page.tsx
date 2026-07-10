import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Copy, Pencil, Search, Trash2 } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import {
  DataTable,
  type PaginationMeta,
  type RowAction,
  type SortState,
} from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "@/components/toast";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * DataTables showcase (W5): the full DataTable (TanStack Table) — sortable
 * columns, a search filter, row selection and pagination — over LOCAL static
 * rows. Mirrors the list archetype in ui-kit-page.tsx.
 */

type Member = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "published" | "pending" | "draft";
};

const ROLES = ["Admin", "Editor", "Author", "Viewer"];
const STATUSES = ["published", "pending", "draft"] as const;

const MEMBERS: Member[] = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  name: `Member ${String(i + 1).padStart(2, "0")}`,
  email: `member${i + 1}@example.com`,
  role: ROLES[i % ROLES.length]!,
  status: STATUSES[i % STATUSES.length]!,
}));

const PER_PAGE = 8;

export function TablesDatatablesPage() {
  useLocale();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState>({ column: "name", dir: "asc" });
  const [page, setPage] = useState(1);
  const [selectedCount, setSelectedCount] = useState(0);

  const columns = useMemo<ColumnDef<Member, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: t("showcase.tables.col.name"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "email",
        id: "email",
        header: t("showcase.tables.col.email"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "role",
        id: "role",
        header: t("showcase.tables.col.role"),
        meta: { sortable: true },
      },
      {
        id: "status",
        header: t("common.status"),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    [],
  );

  const rowActions: RowAction<Member>[] = [
    {
      key: "edit",
      label: t("common.edit"),
      icon: <Pencil />,
      onSelect: (row) => toast(`${t("common.edit")}: ${row.name}`),
    },
    {
      key: "duplicate",
      label: t("common.duplicate"),
      icon: <Copy />,
      onSelect: (row) => toast(`${t("common.duplicate")}: ${row.name}`),
    },
    {
      key: "delete",
      label: t("common.delete"),
      icon: <Trash2 />,
      destructive: true,
      onSelect: (row) => toast.error(`${t("common.delete")}: ${row.name}`),
    },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? MEMBERS.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            m.role.toLowerCase().includes(q),
        )
      : MEMBERS;
    const sorted = [...base].sort((a, b) => {
      const av = String(a[sort.column as keyof Member]);
      const bv = String(b[sort.column as keyof Member]);
      const cmp = av.localeCompare(bv);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [query, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const pagination: PaginationMeta = {
    page: safePage,
    pages,
    total: filtered.length,
    perPage: PER_PAGE,
  };

  return (
    <ShowcasePage
      title={t("showcase.tables.datatables.title")}
      description={t("showcase.tables.datatables.desc")}
      breadcrumb={{ group: t("nav.components.tables") }}
    >
      <ComponentDemo
        title={t("showcase.s.examples")}
        notes={t("showcase.tables.datatables.note")}
        previewClassName="block"
        code={`<DataTable
  columns={columns}
  data={rows}
  selection
  onSelectionChange={(sel) => setSelectedCount(sel.length)}
  rowActions={rowActions}
  sort={sort}
  onSort={(column, dir) => setSort({ column, dir })}
  pagination={pagination}
  onPage={setPage}
  getRowId={(row) => String(row.id)}
/>`}
      >
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative max-w-xs flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder={t("common.search")}
                className="ps-9"
                aria-label={t("common.search")}
              />
            </div>
            {selectedCount > 0 ? (
              <span className="text-sm text-muted-foreground tabular-nums">
                {t("common.selected", { count: selectedCount })}
              </span>
            ) : null}
          </div>

          <DataTable<Member>
            columns={columns}
            data={rows}
            selection
            onSelectionChange={(selected) => setSelectedCount(selected.length)}
            selectionResetKey={safePage}
            rowActions={rowActions}
            sort={sort}
            onSort={(column, dir) => setSort({ column, dir })}
            pagination={pagination}
            onPage={setPage}
            getRowId={(row) => String(row.id)}
            label={t("showcase.tables.datatables.title")}
          />
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
