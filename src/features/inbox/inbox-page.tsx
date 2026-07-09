import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Inbox,
  Archive,
  Send,
  Star,
  SendHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import {
  api,
  ValidationError,
  type InboxFolder,
  type InboxThread,
  type InboxThreadListItem,
} from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/toolbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSiteDateTime } from "@/lib/datetime";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { NavIcon } from "@/app/nav";

/*
 * /inbox (build-demo-screen-catalog): a three-pane messaging screen — a folder
 * rail, a searchable conversation list with unread badges, and a message thread
 * with a composer. On mobile it collapses to a single-pane drill-down (list →
 * thread → back). Mark-read and send are mock mutations that refresh the query
 * cache. Reachable with inbox.view.
 */

const FOLDERS: { key: InboxFolder; icon: NavIcon }[] = [
  { key: "inbox", icon: Inbox },
  { key: "starred", icon: Star },
  { key: "sent", icon: Send },
  { key: "archived", icon: Archive },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function InboxPage() {
  const queryClient = useQueryClient();
  const [folder, setFolder] = useState<InboxFolder>("inbox");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const listQuery = useQuery({
    queryKey: ["inbox", "list", folder, search],
    queryFn: () => api.inbox.list(folder, search || undefined),
    placeholderData: (previous) => previous,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.inbox.markRead(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["inbox", "list"] }),
  });

  const openThread = (id: number) => {
    console.debug("[InboxPage] openThread", { id });
    setSelectedId(id);
    markReadMutation.mutate(id);
  };

  const threads = listQuery.data?.threads ?? [];
  const counts = listQuery.data?.counts;

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-4">
      <PageHeader title={t("nav.inbox")} icon={Inbox} />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[13rem_20rem_1fr]">
        {/* folder rail — hidden on mobile (folder chips move into the list header) */}
        <aside className="hidden min-h-0 flex-col gap-1 lg:flex">
          {FOLDERS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setFolder(key);
                setSelectedId(null);
              }}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                folder === key
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-accent/40",
              )}
              aria-current={folder === key ? "true" : undefined}
            >
              <span className="flex items-center gap-2">
                <Icon className="size-4" />
                {t(`inbox.folder.${key}`)}
              </span>
              {counts && counts[key] > 0 ? (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary tabular-nums"
                >
                  {counts[key]}
                </Badge>
              ) : null}
            </button>
          ))}
        </aside>

        {/* conversation list */}
        <section
          className={cn(
            "glass-card flex min-h-0 flex-col overflow-hidden rounded-2xl",
            selectedId !== null && "max-lg:hidden",
          )}
        >
          <div className="space-y-2 border-b border-border/50 p-3">
            {/* mobile folder switch */}
            <div className="flex gap-1 overflow-x-auto lg:hidden">
              {FOLDERS.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setFolder(key);
                    setSelectedId(null);
                  }}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                    folder === key
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent/40",
                  )}
                >
                  <Icon className="size-3.5" />
                  {t(`inbox.folder.${key}`)}
                  {counts && counts[key] > 0 ? (
                    <span className="tabular-nums">({counts[key]})</span>
                  ) : null}
                </button>
              ))}
            </div>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t("inbox.search_placeholder")}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {listQuery.isPending ? (
              <ul className="space-y-1 p-2">
                {Array.from({ length: 6 }, (_, index) => (
                  <li key={index} className="flex items-center gap-3 p-2">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : listQuery.isError ? (
              <EmptyState
                icon={Inbox}
                title={t("table.error.title")}
                description={t("table.error.description")}
                action={{
                  label: t("common.retry"),
                  onClick: () => void listQuery.refetch(),
                }}
              />
            ) : threads.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={t("inbox.empty")}
                description={t("inbox.empty_hint")}
              />
            ) : (
              <ul>
                {threads.map((thread) => (
                  <ThreadRow
                    key={thread.id}
                    thread={thread}
                    active={thread.id === selectedId}
                    onSelect={() => openThread(thread.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* thread pane */}
        <section
          className={cn(
            "glass-card flex min-h-0 flex-col overflow-hidden rounded-2xl",
            selectedId === null && "max-lg:hidden",
          )}
        >
          {selectedId === null ? (
            <div className="hidden h-full items-center justify-center lg:flex">
              <EmptyState
                icon={Inbox}
                title={t("inbox.no_selection")}
                description={t("inbox.no_selection_hint")}
              />
            </div>
          ) : (
            <ThreadPane id={selectedId} onBack={() => setSelectedId(null)} />
          )}
        </section>
      </div>
    </div>
  );
}

function ThreadRow({
  thread,
  active,
  onSelect,
}: {
  thread: InboxThreadListItem;
  active: boolean;
  onSelect: () => void;
}) {
  const dt = useSiteDateTime();
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full items-start gap-3 border-b border-border/40 p-3 text-start transition-colors",
          active ? "bg-primary/5" : "hover:bg-accent/40",
        )}
      >
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className="text-xs">
            {initials(thread.participant)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "truncate text-sm",
                thread.unread ? "font-semibold" : "font-medium",
              )}
            >
              {thread.participant}
            </span>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {dt.format(thread.last_at)}
            </span>
          </div>
          <div className="truncate text-sm text-muted-foreground">
            {thread.subject}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {thread.preview}
            </span>
            {thread.unread ? (
              <span
                className="size-2 shrink-0 rounded-full bg-primary"
                aria-hidden
              />
            ) : null}
          </div>
          {thread.labels.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {thread.labels.map((label) => (
                <Badge key={label} variant="secondary" className="text-[10px]">
                  {t(`inbox.label.${label}`)}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </button>
    </li>
  );
}

function ThreadPane({ id, onBack }: { id: number; onBack: () => void }) {
  const dt = useSiteDateTime();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const query = useQuery({
    queryKey: ["inbox", "thread", id],
    queryFn: () => api.inbox.get(id),
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => api.inbox.send(id, body),
    onSuccess: (thread) => {
      console.debug("[InboxPage] send done", { id });
      queryClient.setQueryData(["inbox", "thread", id], thread);
      void queryClient.invalidateQueries({ queryKey: ["inbox", "list"] });
      setDraft("");
    },
    onError: (cause) => {
      const invalid = cause instanceof ValidationError;
      toast.error(
        invalid ? t("inbox.error.empty_message") : t("common.request_failed"),
      );
    },
  });

  const messages = query.data?.messages;
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    console.debug("[InboxPage] send submit", { id });
    sendMutation.mutate(body);
  };

  if (query.isPending) return <ThreadSkeleton onBack={onBack} />;
  if (query.isError || !query.data) {
    return (
      <div className="flex h-full flex-col">
        <ThreadHeader
          title={t("table.error.title")}
          subtitle=""
          onBack={onBack}
        />
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={Inbox}
            title={t("table.error.title")}
            description={t("table.error.description")}
            action={{
              label: t("common.retry"),
              onClick: () => void query.refetch(),
            }}
          />
        </div>
      </div>
    );
  }

  const thread: InboxThread = query.data;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ThreadHeader
        title={thread.subject}
        subtitle={`${thread.participant} · ${thread.email}`}
        onBack={onBack}
      />

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
      >
        {thread.messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.from_me ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                message.from_me
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
              <p
                className={cn(
                  "mt-1 text-[10px]",
                  message.from_me
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground",
                )}
              >
                {dt.format(message.at)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2 border-t border-border/50 p-3">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={t("inbox.composer_placeholder")}
          rows={1}
          className="max-h-32 min-h-[2.5rem] flex-1 resize-none"
          aria-label={t("inbox.composer_placeholder")}
        />
        <Button
          onClick={submit}
          disabled={!draft.trim() || sendMutation.isPending}
          aria-label={t("inbox.send")}
        >
          <SendHorizontal className="rtl:-scale-x-100" />
          <span className="max-sm:sr-only">{t("inbox.send")}</span>
        </Button>
      </div>
    </div>
  );
}

function ThreadHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border/50 p-3">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onBack}
        aria-label={t("common.back")}
      >
        <ArrowLeft className="rtl:-scale-x-100" />
      </Button>
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function ThreadSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <ThreadHeader title="" subtitle="" onBack={onBack} />
      <div className="flex-1 space-y-3 p-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className={cn("flex", index % 2 ? "justify-end" : "justify-start")}
          >
            <Skeleton className="h-12 w-48 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
