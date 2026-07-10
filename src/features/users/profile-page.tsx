import { useMemo, useState } from "react";
import { devDebug } from "@/lib/debug";
import { useMutation, useQuery } from "@tanstack/react-query";
import { KeyRound, UserCircle } from "lucide-react";
import { toast } from "sonner";

import { api, ValidationError, type TimelineCategory } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SaveBar } from "@/components/save-bar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineIndicator,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/ui/timeline";
import { SecurityCard } from "@/features/users/mfa";
import { useAuth } from "@/lib/auth";
import {
  ADMIN_LOCALES,
  LOCALE_NAMES,
  setLocale,
  t,
  type AdminLocale,
} from "@/lib/i18n";

/*
 * /profile (UI:users-roles §2): the operator's own profile. A profile header
 * (banner, avatar, bio, stat tiles) sits above two tabs — Account (editable
 * name + UI language + password + 2FA) and Timeline (recent activity). The
 * profile card writes only name + ui_locale; the password card requires the
 * current password (wrong → 422 under the field).
 */

const STAT_KEYS = ["projects", "tasks", "comments"] as const;
const STAT_VALUES: Record<(typeof STAT_KEYS)[number], number> = {
  projects: 24,
  tasks: 132,
  comments: 318,
};

const INDICATOR: Record<
  TimelineCategory,
  "success" | "info" | "warning" | "default"
> = {
  release: "success",
  update: "info",
  meeting: "default",
  note: "warning",
};

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ProfileHeader({ name, role }: { name: string; role: string }) {
  return (
    <section className="glass-card overflow-hidden rounded-2xl">
      <div aria-hidden className="h-28 bg-[image:var(--gradient-heading)]" />
      <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end">
        <Avatar size="lg" className="-mt-10 size-20 ring-4 ring-background">
          <AvatarFallback className="text-xl">
            {initialsOf(name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1 pt-1">
          <h2 className="text-lg font-semibold tracking-tight">{name}</h2>
          <p className="text-sm text-muted-foreground">{role}</p>
          <p className="max-w-xl text-sm text-muted-foreground">
            {t("profile.bio")}
          </p>
        </div>
        <div className="flex gap-4">
          {STAT_KEYS.map((key) => (
            <div key={key} className="text-center">
              <p className="text-lg font-semibold tabular-nums">
                {STAT_VALUES[key]}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(`profile.stat.${key}`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileTimelineTab() {
  const timelineQuery = useQuery({
    queryKey: ["pages", "timeline"],
    queryFn: api.pages.timeline,
  });
  devDebug("[ProfilePage] timeline", { status: timelineQuery.status });

  return (
    <Panel>
      {timelineQuery.isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : timelineQuery.isError ? (
        <EmptyState
          title={t("table.error.title")}
          description={t("table.error.description")}
        />
      ) : (timelineQuery.data ?? []).length === 0 ? (
        <EmptyState
          title={t("timeline.empty.title")}
          description={t("timeline.empty.description")}
        />
      ) : (
        <Timeline>
          {(timelineQuery.data ?? []).map((event) => (
            <TimelineItem key={event.id}>
              <TimelineIndicator variant={INDICATOR[event.category]} />
              <TimelineConnector />
              <TimelineContent>
                <div className="flex flex-wrap items-center gap-2">
                  <TimelineTitle>{event.title}</TimelineTitle>
                  <Badge variant="outline">
                    {t(`timeline.category.${event.category}`)}
                  </Badge>
                </div>
                <TimelineDescription>{event.description}</TimelineDescription>
                <TimelineTime>{event.date.slice(0, 10)}</TimelineTime>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      )}
    </Panel>
  );
}

export function ProfilePage() {
  const { me, refresh } = useAuth();
  const [tab, setTab] = useState("account");

  const initial = useMemo(
    () => ({ name: me.user.name, ui_locale: me.user.ui_locale }),
    [me.user],
  );
  const [name, setName] = useState(initial.name);
  const [uiLocale, setUiLocale] = useState(initial.ui_locale);

  const dirty = name !== initial.name || uiLocale !== initial.ui_locale;

  const profileMutation = useMutation({
    mutationFn: () =>
      api.profile.update({ name: name.trim(), ui_locale: uiLocale }),
    onSuccess: async () => {
      if (ADMIN_LOCALES.includes(uiLocale as AdminLocale))
        setLocale(uiLocale as AdminLocale);
      toast.success(t("profile.saved"));
      await refresh();
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  return (
    <div className="space-y-4">
      <PageHeader title={t("shell.profile")} icon={UserCircle} />

      <ProfileHeader name={me.user.name} role={me.user.role.label} />

      <Tabs
        value={tab}
        onValueChange={(value) => {
          devDebug("[ProfilePage] tab", { tab: value });
          setTab(value);
        }}
      >
        <TabsList>
          <TabsTrigger value="account">{t("profile.tab.account")}</TabsTrigger>
          <TabsTrigger value="timeline">
            {t("profile.tab.timeline")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Panel icon={UserCircle} title={t("profile.section.profile")}>
            <div className="grid max-w-2xl gap-4 md:grid-cols-2">
              <FormField
                name="profile-name"
                label={t("profile.field.name")}
                required
                className="md:col-span-2"
              >
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </FormField>
              <FormField
                name="profile-locale"
                label={t("profile.field.ui_locale")}
              >
                <Select value={uiLocale} onValueChange={setUiLocale}>
                  <SelectTrigger id="profile-locale" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_LOCALES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {LOCALE_NAMES[code]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField
                name="profile-email"
                label={t("profile.field.email")}
                help={t("profile.email_hint")}
              >
                <Input
                  id="profile-email"
                  value={me.user.email}
                  readOnly
                  disabled
                />
              </FormField>
            </div>
          </Panel>

          <ChangeOwnPasswordCard />

          {/* "Security": 2FA self-service (D:auth §6) */}
          <SecurityCard />

          <SaveBar
            dirty={dirty}
            saving={profileMutation.isPending}
            onSave={() => profileMutation.mutate()}
            onReset={() => {
              setName(initial.name);
              setUiLocale(initial.ui_locale);
            }}
          />
        </TabsContent>

        <TabsContent value="timeline">
          <ProfileTimelineTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChangeOwnPasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () =>
      api.profile.changePassword({ current_password: current, password: next }),
    onSuccess: () => {
      toast.success(t("profile.password.saved"));
      setCurrent("");
      setNext("");
      setRepeat("");
      setErrors({});
    },
    onError: (cause) => {
      if (cause instanceof ValidationError) {
        setErrors(
          Object.fromEntries(
            Object.entries(cause.fields).map(([field, code]) => [
              field,
              t(`users.error.${code}`),
            ]),
          ),
        );
      } else {
        toast.error(t("common.request_failed"));
      }
    },
  });

  function submit() {
    const local: Record<string, string> = {};
    if (next.length < 8) local.password = t("users.error.password_too_short");
    if (next !== repeat) local.repeat = t("profile.password.mismatch");
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }
    mutation.mutate();
  }

  return (
    <Panel
      icon={KeyRound}
      title={t("profile.password.title")}
      description={t("profile.password.hint")}
    >
      <div className="grid max-w-2xl gap-4 md:grid-cols-2">
        <FormField
          name="current-password"
          label={t("profile.password.current")}
          required
          error={errors.current_password}
          className="md:col-span-2"
        >
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
        </FormField>
        <FormField
          name="new-password"
          label={t("profile.password.new")}
          required
          error={errors.password}
        >
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
          />
        </FormField>
        <FormField
          name="repeat-password"
          label={t("profile.password.repeat")}
          required
          error={errors.repeat}
        >
          <Input
            id="repeat-password"
            type="password"
            autoComplete="new-password"
            value={repeat}
            onChange={(event) => setRepeat(event.target.value)}
          />
        </FormField>
        <div className="md:col-span-2">
          <Button
            onClick={submit}
            disabled={mutation.isPending || !current || !next || !repeat}
          >
            {t("profile.password.submit")}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
