import { Network } from "lucide-react";
import { devDebug } from "@/lib/debug";
import { Link } from "react-router";

import {
  buildNavGroups,
  isNavParent,
  type NavEntry,
  type NavItem,
} from "@/app/nav";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { usePermissionChecker } from "@/lib/permissions";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /sitemap: a full-site link map generated from the single nav map — one source,
 * no drift. Each nav group becomes a column of its permitted leaf links.
 */

function leavesOf(entry: NavEntry): NavItem[] {
  return isNavParent(entry) ? entry.children.flatMap(leavesOf) : [entry];
}

export function SitemapPage() {
  useLocale();
  const can = usePermissionChecker();

  const columns = buildNavGroups()
    .map((group) => ({
      key: group.key,
      label: group.label,
      links: group.items.flatMap(leavesOf).filter((leaf) => can(leaf.perm)),
    }))
    .filter((column) => column.links.length > 0);

  devDebug("[SitemapPage] groups", { count: columns.length });

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("sitemap.title")}
        icon={Network}
        breadcrumbs={[{ label: t("sitemap.title") }]}
      />
      <Panel>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {columns.map((column) => (
            <nav
              key={column.key}
              aria-label={column.label}
              className="space-y-3"
            >
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {column.label}
              </h2>
              <ul className="space-y-1">
                {column.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}
        </div>
      </Panel>
    </div>
  );
}
