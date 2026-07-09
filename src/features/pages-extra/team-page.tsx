import { useMemo, useState } from "react";
import { devDebug } from "@/lib/debug";
import { useQuery } from "@tanstack/react-query";
import { Bird, Code2, Contact, Mail, Palette, Users } from "lucide-react";

import { api, type TeamMember } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SearchInput } from "@/components/toolbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /team: a team directory card grid with a search box and a department filter.
 * Data comes from the mock pages module; empty/skeleton/error states included.
 */

const DEPARTMENTS = [
  "all",
  "management",
  "engineering",
  "design",
  "marketing",
  "support",
] as const;

const SOCIAL_ICONS = {
  twitter: Bird,
  github: Code2,
  linkedin: Contact,
  dribbble: Palette,
} as const;

function MemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="glass-card flex flex-col items-center gap-3 rounded-2xl p-5 text-center">
      <Avatar size="lg" className="size-16">
        <AvatarFallback
          style={{ backgroundColor: member.color }}
          className="text-base font-medium text-foreground/70"
        >
          {member.initials}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-0.5">
        <p className="font-medium">{member.name}</p>
        <p className="text-sm text-muted-foreground">{member.title}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          asChild
          aria-label={t("team.email")}
        >
          <a href={`mailto:${member.email}`}>
            <Mail className="size-4" />
          </a>
        </Button>
        {(Object.keys(SOCIAL_ICONS) as Array<keyof typeof SOCIAL_ICONS>)
          .filter((key) => member.socials[key])
          .map((key) => {
            const Icon = SOCIAL_ICONS[key];
            return (
              <Button
                key={key}
                variant="ghost"
                size="icon-sm"
                asChild
                aria-label={key}
              >
                <a href={member.socials[key]} target="_blank" rel="noreferrer">
                  <Icon className="size-4" />
                </a>
              </Button>
            );
          })}
      </div>
    </div>
  );
}

export function TeamPage() {
  useLocale();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string>("all");

  const teamQuery = useQuery({
    queryKey: ["pages", "team"],
    queryFn: api.pages.team,
  });
  devDebug("[TeamPage] query", { status: teamQuery.status });

  const members = useMemo(() => {
    const rows = teamQuery.data ?? [];
    const q = search.toLowerCase().trim();
    return rows.filter((member) => {
      if (department !== "all" && member.department !== department)
        return false;
      if (q && !`${member.name} ${member.title}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [teamQuery.data, search, department]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("team.title")}
        icon={Users}
        breadcrumbs={[{ label: t("team.title") }]}
      />
      <Panel
        title={t("team.members")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t("team.search")}
              className="w-full sm:w-56"
            />
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger
                className="w-40"
                aria-label={t("team.department.label")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`team.department.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {teamQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : teamQuery.isError ? (
          <EmptyState
            title={t("table.error.title")}
            description={t("table.error.description")}
          />
        ) : members.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t("team.empty.title")}
            description={t("team.empty.description")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
