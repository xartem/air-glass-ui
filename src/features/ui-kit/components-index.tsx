import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ChevronRight, Search } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { SHOWCASE_GROUPS } from "@/features/ui-kit/showcase-registry";
import { t } from "@/lib/i18n";

/*
 * ComponentsIndex (W5): the searchable index grid on the /ui-kit hub — links to
 * every showcase page, grouped by the nine COMPONENTS sections. Groups with no
 * pages yet (empty registry links) are hidden; the search filters by the
 * translated page title so the grid stays useful as pages land.
 */
export function ComponentsIndex() {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return SHOWCASE_GROUPS.map((group) => {
      const links = group.links.filter((link) =>
        needle ? t(link.labelKey).toLowerCase().includes(needle) : true,
      );
      return { ...group, links };
    }).filter((group) => group.links.length > 0);
  }, [query]);

  return (
    <div className="space-y-5 pt-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("showcase.hub.search")}
          className="pl-9"
          aria-label={t("showcase.hub.search")}
        />
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={Search} title={t("showcase.hub.empty")} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => {
            const GroupIcon = group.icon;
            return (
              <Card key={group.key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <GroupIcon className="size-4 text-primary" />
                    {t(group.labelKey)}
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                      {group.links.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-0.5">
                  {group.links.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="truncate">{t(link.labelKey)}</span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 rtl:rotate-180" />
                    </Link>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
