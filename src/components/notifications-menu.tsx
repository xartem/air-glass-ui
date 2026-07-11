import { useMemo, useState } from "react";
import { Bell, CheckCheck, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * NotificationsMenu (C8, E5): the topbar bell. Unread dot on the trigger,
 * a glass-card popover (offset clear of the topbar) with type tabs over the
 * latest admin notifications and "mark all read".
 * Items come from GET /api/notifications once the API lands — the shape below
 * mirrors admin_notify() payloads; `type` drives the filter tabs.
 */

export type NotificationType = "mention" | "system";

export type AdminNotification = {
  id: string;
  title: string;
  time: string;
  read: boolean;
  type: NotificationType;
};

type TabValue = "all" | NotificationType;

const TABS: { value: TabValue; labelKey: string }[] = [
  { value: "all", labelKey: "notifications.tabs.all" },
  { value: "mention", labelKey: "notifications.tabs.mention" },
  { value: "system", labelKey: "notifications.tabs.system" },
];

export function NotificationsMenu({
  initialItems = [],
}: {
  /** Demo/preloaded items; later replaced by a TanStack Query hook. */
  initialItems?: AdminNotification[];
}) {
  const [items, setItems] = useState<AdminNotification[]>(initialItems);
  const [tab, setTab] = useState<TabValue>("all");
  const unread = items.filter((item) => !item.read).length;

  const visible = useMemo(
    () => (tab === "all" ? items : items.filter((item) => item.type === tab)),
    [items, tab],
  );

  const markAllRead = () =>
    setItems(items.map((item) => ({ ...item, read: true })));
  const markRead = (id: string) =>
    setItems(
      items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("shell.notifications")}
          className="relative"
        >
          <Bell />
          {unread > 0 ? (
            <span className="absolute top-1.5 end-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      {/*
       * .notifications-panel promotes the popover from the flat overlay recipe to the
       * site's glass-card look (see src/index.css); sideOffset clears the topbar so the
       * panel no longer overlaps it. Full width on phones via .mobile-full-popover.
       */}
      <PopoverContent
        align="end"
        sideOffset={12}
        collisionPadding={8}
        className="notifications-panel mobile-full-popover w-80 p-0"
      >
        <div className="flex items-center justify-between py-1 pe-1 ps-3">
          <p className="text-sm font-medium">{t("notifications.title")}</p>
          {unread > 0 ? (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              <CheckCheck />
              {t("notifications.markAll")}
            </Button>
          ) : null}
        </div>
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as TabValue)}
          className="px-3"
        >
          <TabsList className="w-full justify-start">
            {TABS.map((entry) => (
              <TabsTrigger key={entry.value} value={entry.value}>
                {t(entry.labelKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <Inbox className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("notifications.empty")}
            </p>
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto py-1">
            {visible.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => markRead(item.id)}
                  aria-label={item.title}
                  className={cn(
                    "flex w-full items-start gap-2.5 px-3 py-2.5 text-start transition-colors hover:bg-muted",
                    !item.read && "bg-accent/50",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      item.read ? "bg-transparent" : "bg-primary",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm",
                        !item.read && "font-medium",
                      )}
                    >
                      {item.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {item.time}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
