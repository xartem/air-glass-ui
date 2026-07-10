import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  LifeBuoy,
  MessageSquareText,
  SendHorizontal,
} from "lucide-react";
import { useParams } from "react-router";
import { toast } from "sonner";

import { api, type TicketStatus } from "@/api";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { RichTextEditor } from "@/components/rich-text-editor";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineIndicator,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/ui/timeline";
import { useSiteDateTime } from "@/lib/datetime";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  AGENTS,
  TICKET_PRIORITY_KIND,
  TICKET_STATUS_KIND,
} from "./ticket-list-page";

/*
 * /support/tickets/:id — single ticket conversation: agent/customer bubbles and
 * a rich-text reply composer with canned responses; requester info, assignment,
 * SLA and activity aside. Status and assignment apply optimistically.
 */

const STATUSES: TicketStatus[] = ["open", "pending", "solved", "closed"];
const CANNED_KEYS = ["greeting", "investigating", "resolved"] as const;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function htmlToText(html: string): string {
  return (
    new DOMParser().parseFromString(html, "text/html").body.textContent ?? ""
  ).trim();
}

export function TicketDetailPage() {
  const { id } = useParams();
  const ticketId = Number(id);
  const dt = useSiteDateTime();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const key = ["support", "detail", ticketId];
  const ticketQuery = useQuery({
    queryKey: key,
    queryFn: () => api.support.get(ticketId),
  });

  console.debug("[TicketDetailPage] load", { id: ticketId });

  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) => {
      console.debug("[TicketDetailPage] setStatus", { id: ticketId, status });
      return api.support.setStatus(ticketId, status);
    },
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(
        key,
        (ticket: typeof ticketQuery.data) => ticket && { ...ticket, status },
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(t("common.request_failed"));
    },
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: ["support"] }),
  });

  const assignMutation = useMutation({
    mutationFn: (agent: string) => {
      console.debug("[TicketDetailPage] assign", { id: ticketId, agent });
      return api.support.assign(ticketId, agent);
    },
    onMutate: async (agent) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(
        key,
        (ticket: typeof ticketQuery.data) => ticket && { ...ticket, agent },
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(t("common.request_failed"));
    },
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: ["support"] }),
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => {
      console.debug("[TicketDetailPage] reply", { id: ticketId });
      return api.support.reply(ticketId, body);
    },
    onSuccess: (ticket) => {
      setDraft("");
      queryClient.setQueryData(key, ticket);
      toast.success(t("support.detail.replied"));
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  if (ticketQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={t("support.detail.title")}
          icon={LifeBuoy}
          breadcrumbs={[
            { label: t("nav.support"), href: "/support/tickets" },
            { label: t("support.detail.title") },
          ]}
        />
        <Panel>
          <div className="py-10 text-center text-sm text-muted-foreground">
            {t("support.detail.not_found")}
          </div>
        </Panel>
      </div>
    );
  }

  const ticket = ticketQuery.data;
  const elapsedHours = ticket
    ? Math.max(
        1,
        Math.round((Date.now() - Date.parse(ticket.created_at)) / 3600000),
      )
    : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title={ticket?.subject ?? t("support.detail.title")}
        icon={LifeBuoy}
        breadcrumbs={[
          { label: t("nav.support"), href: "/support/tickets" },
          { label: ticket ? `#${ticket.id}` : "…" },
        ]}
        secondaryActions={[
          {
            label: t("common.back"),
            href: "/support/tickets",
            icon: <ArrowLeft className="rtl:-scale-x-100" />,
          },
        ]}
      />

      {!ticket ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_18rem]">
          <Panel
            icon={MessageSquareText}
            title={t("support.detail.conversation")}
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <StatusBadge
                status={TICKET_PRIORITY_KIND[ticket.priority]}
                label={t(`support.priority.${ticket.priority}`)}
              />
              <StatusBadge
                status={TICKET_STATUS_KIND[ticket.status]}
                label={t(`support.status.${ticket.status}`)}
              />
              <div className="ms-auto">
                <Select
                  value={ticket.status}
                  onValueChange={(value) =>
                    statusMutation.mutate(value as TicketStatus)
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`support.status.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {ticket.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "agent" && "flex-row-reverse",
                  )}
                >
                  <Avatar className="size-8 shrink-0" title={message.author}>
                    <AvatarFallback className="text-xs">
                      {initials(message.author)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5",
                      message.role === "agent"
                        ? "bg-primary/10"
                        : "bg-muted/60",
                    )}
                  >
                    <div className="mb-0.5 flex items-baseline gap-2">
                      <span className="text-sm font-medium">
                        {message.author}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {dt.format(message.at)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {message.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-2 border-t border-border/50 pt-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {t("support.detail.reply")}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {t("support.detail.canned")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {CANNED_KEYS.map((canned) => (
                      <DropdownMenuItem
                        key={canned}
                        onSelect={() =>
                          setDraft(
                            `<p>${t(`support.detail.canned.${canned}`)}</p>`,
                          )
                        }
                      >
                        {t(`support.detail.canned.${canned}`)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <RichTextEditor
                value={draft}
                onChange={setDraft}
                placeholder={t("support.detail.reply_placeholder")}
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => replyMutation.mutate(htmlToText(draft))}
                  disabled={!htmlToText(draft) || replyMutation.isPending}
                >
                  <SendHorizontal className="rtl:-scale-x-100" />
                  {t("support.detail.send")}
                </Button>
              </div>
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel title={t("support.detail.requester")} className="self-start">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback>{initials(ticket.requester)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {ticket.requester}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {ticket.requester_email}
                  </div>
                </div>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">
                    {t("support.detail.created")}
                  </dt>
                  <dd className="font-medium">
                    {dt.format(ticket.created_at)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">
                    {t("support.detail.sla")}
                  </dt>
                  <dd>
                    <Badge
                      variant={elapsedHours > 24 ? "destructive" : "secondary"}
                    >
                      {t("support.detail.sla_elapsed", {
                        hours: elapsedHours,
                      })}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="mb-1.5 text-xs text-muted-foreground uppercase">
                    {t("support.detail.tags")}
                  </dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {ticket.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="mb-1.5 text-xs text-muted-foreground uppercase">
                    {t("support.detail.assignee")}
                  </dt>
                  <dd>
                    <Select
                      value={ticket.agent}
                      onValueChange={(value) => assignMutation.mutate(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AGENTS.map((agent) => (
                          <SelectItem key={agent} value={agent}>
                            {agent}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </dd>
                </div>
              </dl>
            </Panel>

            <Panel title={t("support.detail.activity")} className="self-start">
              <Timeline>
                {ticket.activity.map((entry) => (
                  <TimelineItem key={entry.id}>
                    <TimelineIndicator />
                    <TimelineConnector />
                    <TimelineContent>
                      <TimelineTitle>{entry.text}</TimelineTitle>
                      <TimelineTime>{dt.format(entry.at)}</TimelineTime>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
