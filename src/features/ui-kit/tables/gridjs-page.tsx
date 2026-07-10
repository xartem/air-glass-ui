import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Sortable Table showcase (W5): the <Table> primitive with client-side column
 * sorting driven by local useState — the token-only replacement for Grid.js.
 * Data is LOCAL static demo content.
 */

type Member = {
  name: string;
  role: string;
  signups: number;
  status: "published" | "pending" | "draft";
};

const MEMBERS: Member[] = [
  { name: "Olga Petrova", role: "Admin", signups: 142, status: "published" },
  { name: "Marek Nowak", role: "Editor", signups: 88, status: "pending" },
  { name: "Chen Wei", role: "Author", signups: 205, status: "published" },
  { name: "Amara Okafor", role: "Viewer", signups: 37, status: "draft" },
  { name: "Diego Alvarez", role: "Editor", signups: 119, status: "published" },
  { name: "Sofia Rossi", role: "Author", signups: 64, status: "pending" },
];

type SortKey = "name" | "role" | "signups";
type SortDir = "asc" | "desc";

export function TablesGridJsPage() {
  useLocale();
  const [sortKey, setSortKey] = useState<SortKey>("signups");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const rows = [...MEMBERS];
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortHeader = ({
    column,
    label,
    align,
  }: {
    column: SortKey;
    label: string;
    align?: "end";
  }) => {
    const active = sortKey === column;
    return (
      <TableHead
        aria-sort={
          active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
        }
        className={align === "end" ? "text-end" : undefined}
      >
        <button
          type="button"
          onClick={() => toggleSort(column)}
          className={cn(
            "inline-flex items-center gap-1 hover:text-foreground",
            align === "end" && "flex-row-reverse",
          )}
        >
          {label}
          {active ? (
            sortDir === "asc" ? (
              <ArrowUp className="size-3" />
            ) : (
              <ArrowDown className="size-3" />
            )
          ) : (
            <ArrowUpDown className="size-3 opacity-40" />
          )}
        </button>
      </TableHead>
    );
  };

  return (
    <ShowcasePage
      title={t("showcase.tables.gridjs.title")}
      description={t("showcase.tables.gridjs.desc")}
      breadcrumb={{ group: t("nav.components.tables") }}
    >
      <ComponentDemo
        title={t("showcase.s.examples")}
        notes={t("showcase.tables.gridjs.note")}
        previewClassName="block"
        code={`const [sortKey, setSortKey] = useState("signups");
const [sortDir, setSortDir] = useState("desc");

const sorted = useMemo(() => {
  const rows = [...members];
  rows.sort((a, b) => {
    const cmp = typeof a[sortKey] === "number"
      ? a[sortKey] - b[sortKey]
      : String(a[sortKey]).localeCompare(String(b[sortKey]));
    return sortDir === "asc" ? cmp : -cmp;
  });
  return rows;
}, [sortKey, sortDir]);

<TableHead aria-sort={active ? "ascending" : "none"}>
  <button onClick={() => toggleSort("signups")}>Signups <ArrowUpDown /></button>
</TableHead>`}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader column="name" label={t("showcase.tables.col.name")} />
              <SortHeader column="role" label={t("showcase.tables.col.role")} />
              <SortHeader
                column="signups"
                label={t("showcase.tables.col.signups")}
                align="end"
              />
              <TableHead>{t("common.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((member) => (
              <TableRow key={member.name}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell className="text-end tabular-nums">
                  {member.signups}
                </TableCell>
                <TableCell>
                  <StatusBadge status={member.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ComponentDemo>
    </ShowcasePage>
  );
}
