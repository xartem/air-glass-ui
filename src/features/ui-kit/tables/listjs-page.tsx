import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { EmptyState } from "@/components/empty-state";
import { PaginationBar } from "@/components/pagination-bar";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Searchable List showcase (W5): an <Input> search box + <PaginationBar> over a
 * locally filtered/paged row set (useState) — the token-only replacement for
 * List.js. Data is LOCAL static demo content.
 */

type Member = {
  name: string;
  role: string;
  email: string;
  status: "published" | "pending" | "draft";
};

const ROLES = ["Admin", "Editor", "Author", "Viewer"];
const STATUSES = ["published", "pending", "draft"] as const;

const MEMBERS: Member[] = Array.from({ length: 23 }, (_, i) => ({
  name: `Member ${String(i + 1).padStart(2, "0")}`,
  role: ROLES[i % ROLES.length]!,
  email: `member${i + 1}@example.com`,
  status: STATUSES[i % STATUSES.length]!,
}));

const PER_PAGE = 6;

export function TablesListJsPage() {
  useLocale();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MEMBERS;
    return MEMBERS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q),
    );
  }, [query]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <ShowcasePage
      title={t("showcase.tables.listjs.title")}
      description={t("showcase.tables.listjs.desc")}
      breadcrumb={{ group: t("nav.components.tables") }}
    >
      <ComponentDemo
        title={t("showcase.s.examples")}
        notes={t("showcase.tables.listjs.note")}
        previewClassName="block"
        code={`const [query, setQuery] = useState("");
const [page, setPage] = useState(1);

const filtered = members.filter((m) => m.name.includes(query));
const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

<Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
<Table>…{rows.map(...)}…</Table>
<PaginationBar
  pagination={{ page, pages, total: filtered.length, perPage: PER_PAGE }}
  shown={rows.length}
  onPage={setPage}
/>`}
      >
        <div className="w-full space-y-4">
          <div className="relative max-w-xs">
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

          {rows.length === 0 ? (
            <EmptyState
              icon={Search}
              title={t("table.empty.title")}
              description={t("table.empty.description")}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("showcase.tables.col.name")}</TableHead>
                    <TableHead>{t("showcase.tables.col.role")}</TableHead>
                    <TableHead>{t("showcase.tables.col.email")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((member) => (
                    <TableRow key={member.email}>
                      <TableCell className="font-medium">
                        {member.name}
                      </TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={member.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationBar
                pagination={{
                  page: safePage,
                  pages,
                  total: filtered.length,
                  perPage: PER_PAGE,
                }}
                shown={rows.length}
                onPage={setPage}
                className="pt-2"
              />
            </>
          )}
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
