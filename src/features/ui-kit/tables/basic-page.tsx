import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Basic Tables showcase (W5): the raw <Table> primitive and its parts —
 * header/body/footer/caption — in plain, striped and bordered layouts. Data is
 * LOCAL static demo content. For real list screens use DataTable (E6 §3.1).
 */

type Member = {
  name: string;
  role: string;
  email: string;
  status: "published" | "pending" | "draft";
};

const MEMBERS: Member[] = [
  { name: "Olga Petrova", role: "Admin", email: "olga@example.com", status: "published" },
  { name: "Marek Nowak", role: "Editor", email: "marek@example.com", status: "pending" },
  { name: "Chen Wei", role: "Author", email: "chen@example.com", status: "published" },
  { name: "Amara Okafor", role: "Viewer", email: "amara@example.com", status: "draft" },
];

type LineItem = { item: string; qty: number; amount: number };

const INVOICE: LineItem[] = [
  { item: "GNOM-40 pump", qty: 2, amount: 320 },
  { item: "Installation kit", qty: 1, amount: 85 },
  { item: "Delivery", qty: 1, amount: 25 },
];

export function TablesBasicPage() {
  useLocale();
  const total = INVOICE.reduce((sum, row) => sum + row.amount, 0);
  return (
    <ShowcasePage
      title={t("showcase.tables.basic.title")}
      description={t("showcase.tables.basic.desc")}
      breadcrumb={{ group: t("nav.components.tables") }}
    >
      <ComponentDemo
        title={t("showcase.s.default")}
        previewClassName="block"
        code={`<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Role</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {members.map((m) => (
      <TableRow key={m.email}>
        <TableCell>{m.name}</TableCell>
        <TableCell>{m.role}</TableCell>
        <TableCell>{m.email}</TableCell>
        <TableCell><StatusBadge status={m.status} /></TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`}
      >
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
            {MEMBERS.map((member) => (
              <TableRow key={member.email}>
                <TableCell className="font-medium">{member.name}</TableCell>
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
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.variants")}
        previewClassName="block"
        code={`{/* Striped: tint every even body row */}
<Table className="[&_tbody_tr:nth-child(even)]:bg-muted/40">…</Table>

{/* Bordered: outline the table and add vertical cell dividers */}
<Table className="rounded-lg border [&_td]:border-s [&_th]:border-s [&_:first-child]:border-s-0">…</Table>`}
      >
        <div className="w-full space-y-6">
          <Table className="[&_tbody_tr:nth-child(even)]:bg-muted/40">
            <TableHeader>
              <TableRow>
                <TableHead>{t("showcase.tables.col.name")}</TableHead>
                <TableHead>{t("showcase.tables.col.role")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MEMBERS.map((member) => (
                <TableRow key={member.email}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>
                    <StatusBadge status={member.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Table className="overflow-hidden rounded-lg border [&_td]:border-s [&_th]:border-s [&_tr>*:first-child]:border-s-0">
            <TableHeader>
              <TableRow>
                <TableHead>{t("showcase.tables.col.name")}</TableHead>
                <TableHead>{t("showcase.tables.col.role")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MEMBERS.map((member) => (
                <TableRow key={member.email}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>
                    <StatusBadge status={member.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.tables.basic.footer_title")}
        notes={t("showcase.tables.basic.footer_note")}
        previewClassName="block"
        code={`<Table>
  <TableCaption>Invoice #1042</TableCaption>
  <TableHeader>…</TableHeader>
  <TableBody>…</TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colSpan={2}>Total</TableCell>
      <TableCell className="text-end">$430</TableCell>
    </TableRow>
  </TableFooter>
</Table>`}
      >
        <Table>
          <TableCaption>Invoice #1042</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>{t("showcase.tables.col.item")}</TableHead>
              <TableHead className="text-end">
                {t("showcase.tables.col.qty")}
              </TableHead>
              <TableHead className="text-end">
                {t("showcase.tables.col.amount")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {INVOICE.map((row) => (
              <TableRow key={row.item}>
                <TableCell className="font-medium">{row.item}</TableCell>
                <TableCell className="text-end tabular-nums">
                  {row.qty}
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  ${row.amount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>{t("showcase.tables.col.total")}</TableCell>
              <TableCell className="text-end tabular-nums">${total}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </ComponentDemo>
    </ShowcasePage>
  );
}
