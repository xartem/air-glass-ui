import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  Mail,
  Paperclip,
  Pencil,
  Reply,
  Send,
  ShieldAlert,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { api, type MailFolder, type MailMessage } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ThreePaneLayout } from "@/components/three-pane-layout";
import { SearchInput } from "@/components/toolbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextEditor } from "@/components/rich-text-editor";
import { useSiteDateTime } from "@/lib/datetime";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { NavIcon } from "@/app/nav";

/*
 * /email — a three-pane mailbox on the shared ThreePaneLayout: folder rail,
 * searchable message list (star, unread, multiselect) and a reading pane with a
 * compose dialog. Star / read / move are optimistic. Reachable with email.view.
 */

const FOLDERS: { key: MailFolder; icon: NavIcon }[] = [
  { key: "inbox", icon: Mail },
  { key: "sent", icon: Send },
  { key: "drafts", icon: FileText },
  { key: "spam", icon: ShieldAlert },
  { key: "trash", icon: Trash2 },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function MailboxPage() {
  const queryClient = useQueryClient();
  const [folder, setFolder] = useState<MailFolder>("inbox");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [compose, setCompose] = useState<{
    to: string;
    subject: string;
  } | null>(null);

  const listKey = ["email", "list", folder, search];
  const listQuery = useQuery({
    queryKey: listKey,
    queryFn: () => api.email.list(folder, search || undefined),
    placeholderData: (previous) => previous,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.email.markRead(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["email", "list"] }),
  });
  const starMutation = useMutation({
    mutationFn: (id: number) => {
      console.debug("[MailboxPage] star", { id });
      return api.email.star(id);
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["email", "list"] }),
    onError: () => toast.error(t("common.request_failed")),
  });
  const moveMutation = useMutation({
    mutationFn: ({ id, to }: { id: number; to: MailFolder }) => {
      console.debug("[MailboxPage] move", { id, to });
      return api.email.move(id, to);
    },
    onSuccess: () => {
      toast.success(t("email.moved"));
      void queryClient.invalidateQueries({ queryKey: ["email", "list"] });
      setSelectedId(null);
    },
    onError: () => toast.error(t("common.request_failed")),
  });
  const sendMutation = useMutation({
    mutationFn: (payload: { to: string; subject: string; body: string }) => {
      console.debug("[MailboxPage] send", payload);
      return api.email.send(payload);
    },
    onSuccess: () => {
      toast.success(t("email.sent"));
      void queryClient.invalidateQueries({ queryKey: ["email", "list"] });
      setCompose(null);
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const openMessage = (id: number) => {
    setSelectedId(id);
    markReadMutation.mutate(id);
  };
  const selectFolder = (key: MailFolder) => {
    setFolder(key);
    setSelectedId(null);
  };

  const messages = listQuery.data?.messages ?? [];
  const counts = listQuery.data?.counts;

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-4">
      <PageHeader title={t("nav.email")} icon={Mail} />

      <ThreePaneLayout
        showDetail={selectedId !== null}
        columns="lg:grid-cols-[13rem_22rem_1fr]"
        rail={
          <>
            <Button
              className="mb-2 w-full"
              onClick={() => setCompose({ to: "", subject: "" })}
            >
              <Pencil /> {t("email.compose")}
            </Button>
            {FOLDERS.map(({ key, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => selectFolder(key)}
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
                  {t(`email.folder.${key}`)}
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
          </>
        }
        list={
          <>
            <div className="space-y-2 border-b border-border/50 p-3">
              <div className="flex gap-1 overflow-x-auto lg:hidden">
                {FOLDERS.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectFolder(key)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                      folder === key
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent/40",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {t(`email.folder.${key}`)}
                  </button>
                ))}
              </div>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t("email.search_placeholder")}
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
                  icon={Mail}
                  title={t("table.error.title")}
                  description={t("table.error.description")}
                  action={{
                    label: t("common.retry"),
                    onClick: () => void listQuery.refetch(),
                  }}
                />
              ) : messages.length === 0 ? (
                <EmptyState
                  icon={Mail}
                  title={t("email.empty")}
                  description={t("email.empty_hint")}
                />
              ) : (
                <ul>
                  {messages.map((message) => (
                    <MessageRow
                      key={message.id}
                      message={message}
                      active={message.id === selectedId}
                      onSelect={() => openMessage(message.id)}
                      onStar={() => starMutation.mutate(message.id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </>
        }
        detail={
          selectedId === null ? (
            <div className="hidden h-full items-center justify-center lg:flex">
              <EmptyState
                icon={Mail}
                title={t("email.no_selection")}
                description={t("email.no_selection_hint")}
              />
            </div>
          ) : (
            <ReadingPane
              id={selectedId}
              onBack={() => setSelectedId(null)}
              onReply={(message) =>
                setCompose({
                  to: message.from_email,
                  subject: `Re: ${message.subject}`,
                })
              }
              onTrash={(id) => moveMutation.mutate({ id, to: "trash" })}
            />
          )
        }
      />

      <ComposeDialog
        value={compose}
        onClose={() => setCompose(null)}
        onSend={(payload) => sendMutation.mutate(payload)}
        sending={sendMutation.isPending}
      />
    </div>
  );
}

function MessageRow({
  message,
  active,
  onSelect,
  onStar,
}: {
  message: MailMessage;
  active: boolean;
  onSelect: () => void;
  onStar: () => void;
}) {
  const dt = useSiteDateTime();
  return (
    <li>
      <div
        className={cn(
          "flex items-start gap-3 border-b border-border/40 p-3 transition-colors",
          active ? "bg-primary/5" : "hover:bg-accent/40",
        )}
      >
        <button
          type="button"
          onClick={onStar}
          aria-label={t("email.star")}
          className="mt-0.5 shrink-0"
        >
          <Star
            className={cn(
              "size-4",
              message.starred
                ? "fill-[var(--status-pending-fg)] text-[var(--status-pending-fg)]"
                : "text-muted-foreground",
            )}
          />
        </button>
        <button
          type="button"
          onClick={onSelect}
          aria-label={message.subject}
          aria-current={active ? "true" : undefined}
          className="flex min-w-0 flex-1 items-start gap-3 text-start"
        >
          <Avatar className="size-9 shrink-0">
            <AvatarFallback className="text-xs">
              {initials(message.from_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "truncate text-sm",
                  message.unread ? "font-semibold" : "font-medium",
                )}
              >
                {message.from_name}
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {dt.format(message.date)}
              </span>
            </div>
            <div className="truncate text-sm text-muted-foreground">
              {message.subject}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {message.preview}
              </span>
              {message.unread ? (
                <span
                  className="size-2 shrink-0 rounded-full bg-primary"
                  aria-hidden
                />
              ) : null}
            </div>
          </div>
        </button>
      </div>
    </li>
  );
}

function ReadingPane({
  id,
  onBack,
  onReply,
  onTrash,
}: {
  id: number;
  onBack: () => void;
  onReply: (message: MailMessage) => void;
  onTrash: (id: number) => void;
}) {
  const dt = useSiteDateTime();
  const query = useQuery({
    queryKey: ["email", "message", id],
    queryFn: () => api.email.get(id),
  });

  if (query.isPending) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={Mail}
          title={t("table.error.title")}
          description={t("table.error.description")}
          action={{
            label: t("common.retry"),
            onClick: () => void query.refetch(),
          }}
        />
      </div>
    );
  }

  const message = query.data;
  return (
    <div className="flex h-full min-h-0 flex-col">
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
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{message.subject}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {message.from_name} · {message.from_email}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("common.delete")}
          onClick={() => onTrash(message.id)}
        >
          <Trash2 className="text-muted-foreground" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{message.to}</span>
          <span>{dt.format(message.date)}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm">{message.body}</p>
        {message.attachments.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-t border-border/50 pt-3">
            {message.attachments.map((name) => (
              <span
                key={name}
                className="flex items-center gap-1.5 rounded-lg border border-border/50 px-2.5 py-1.5 text-xs"
              >
                <Paperclip className="size-3.5 text-muted-foreground" />
                {name}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex gap-2 border-t border-border/50 p-3">
        <Button variant="outline" size="sm" onClick={() => onReply(message)}>
          <Reply /> {t("email.reply")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onReply(message)}>
          {t("email.forward")}
        </Button>
      </div>
    </div>
  );
}

function ComposeDialog({
  value,
  onClose,
  onSend,
  sending,
}: {
  value: { to: string; subject: string } | null;
  onClose: () => void;
  onSend: (payload: { to: string; subject: string; body: string }) => void;
  sending: boolean;
}) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Radix does not fire onOpenChange when `open` is driven programmatically, so
  // seed the fields from `value` whenever a Reply/Forward opens the dialog.
  useEffect(() => {
    if (value) {
      setTo(value.to);
      setSubject(value.subject);
      setBody("");
    }
  }, [value]);

  return (
    <Dialog
      open={value !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("email.compose")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="mail-to">{t("email.field.to")}</Label>
            <Input
              id="mail-to"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mail-subject">{t("email.field.subject")}</Label>
            <Input
              id="mail-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("email.field.body")}</Label>
            <RichTextEditor value={body} onChange={setBody} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => onSend({ to, subject, body })}
            disabled={!to.trim() || sending}
          >
            <Send /> {t("email.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
