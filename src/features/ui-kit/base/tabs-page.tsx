import type { ReactNode } from "react";
import { BarChart3, Bell, Settings, User } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Tabs showcase (W5): the Tabs primitive — the default underline (line) style,
 * the segmented (default) variant, triggers with icons, and a vertical
 * orientation. Static demos — no data flow.
 */

/** Shared panel body used across the tab demos. */
function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground ring-1 ring-border">
      {children}
    </div>
  );
}

export function TabsPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.base.tabs.title")}
      description={t("showcase.base.tabs.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.s.default")}
        previewClassName="block"
        code={`<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">…</TabsContent>
</Tabs>`}
      >
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Panel>Overview panel content.</Panel>
          </TabsContent>
          <TabsContent value="activity">
            <Panel>Activity panel content.</Panel>
          </TabsContent>
          <TabsContent value="settings">
            <Panel>Settings panel content.</Panel>
          </TabsContent>
        </Tabs>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.tabs.segmented")}
        previewClassName="block"
        code={`<Tabs defaultValue="day">
  <TabsList variant="default">
    <TabsTrigger value="day">Day</TabsTrigger>
    <TabsTrigger value="week">Week</TabsTrigger>
    <TabsTrigger value="month">Month</TabsTrigger>
  </TabsList>
</Tabs>`}
      >
        <Tabs defaultValue="day" className="w-full">
          <TabsList variant="default">
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
          <TabsContent value="day">
            <Panel>Daily figures.</Panel>
          </TabsContent>
          <TabsContent value="week">
            <Panel>Weekly figures.</Panel>
          </TabsContent>
          <TabsContent value="month">
            <Panel>Monthly figures.</Panel>
          </TabsContent>
        </Tabs>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.withIcon")}
        previewClassName="block"
        code={`<TabsTrigger value="profile"><User />Profile</TabsTrigger>
<TabsTrigger value="alerts"><Bell />Alerts</TabsTrigger>
<TabsTrigger value="stats"><BarChart3 />Stats</TabsTrigger>`}
      >
        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">
              <User />
              Profile
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 />
              Stats
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Panel>Profile details.</Panel>
          </TabsContent>
          <TabsContent value="alerts">
            <Panel>Alert preferences.</Panel>
          </TabsContent>
          <TabsContent value="stats">
            <Panel>Usage statistics.</Panel>
          </TabsContent>
        </Tabs>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.tabs.vertical")}
        previewClassName="block"
        code={`<Tabs defaultValue="general" orientation="vertical">
  <TabsList>
    <TabsTrigger value="general"><Settings />General</TabsTrigger>
    <TabsTrigger value="account"><User />Account</TabsTrigger>
  </TabsList>
  <TabsContent value="general">…</TabsContent>
</Tabs>`}
      >
        <Tabs defaultValue="general" orientation="vertical" className="w-full">
          <TabsList>
            <TabsTrigger value="general">
              <Settings />
              General
            </TabsTrigger>
            <TabsTrigger value="account">
              <User />
              Account
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell />
              Notifications
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <Panel>General settings.</Panel>
          </TabsContent>
          <TabsContent value="account">
            <Panel>Account settings.</Panel>
          </TabsContent>
          <TabsContent value="alerts">
            <Panel>Notification settings.</Panel>
          </TabsContent>
        </Tabs>
      </ComponentDemo>
    </ShowcasePage>
  );
}
