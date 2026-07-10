import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ListTodo, SendHorizontal } from "lucide-react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { api, type TaskPriority, type TaskStatus } from "@/api";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSiteDateTime } from "@/lib/datetime";
import { t } from "@/lib/i18n";

/*
 * /tasks/:id — single task workspace: description, subtasks checklist and a
 * comments thread on the left; assignee, dates, labels and project link aside.
 * Status change and subtask toggles are optimistic. Reachable with tasks.view.
 */

const PRIORITY_KIND: Record<TaskPriority, StatusKind> = {
  low: "archived",
  medium: "info",
  high: "pending",
  urgent: "error",
};
const STATUS_KIND: Record<TaskStatus, StatusKind> = {
  todo: "pending",
  in_progress: "info",
  review: "pending",
  done: "success",
};
const STATUSES: TaskStatus[] = ["todo", "in_progress", "review", "done"];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function TaskDetailPage() {
  const { id } = useParams();
  const taskId = Number(id);
  const dt = useSiteDateTime();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const key = ["tasks", "detail", taskId];
  const taskQuery = useQuery({ queryKey: key, queryFn: () => api.tasks.get(taskId) });

  console.debug("[TaskDetailPage] load", { id: taskId });

  const statusMutation = useMutation({
    mutationFn: (status: TaskStatus) => {
      console.debug("[TaskDetailPage] setStatus", { id: taskId, status });
      return api.tasks.setStatus(taskId, status);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const subtaskMutation = useMutation({
    mutationFn: (subtaskId: number) => {
      console.debug("[TaskDetailPage] toggleSubtask", { id: taskId, subtaskId });
      return api.tasks.toggleSubtask(taskId, subtaskId);
    },
    onSuccess: (task) => queryClient.setQueryData(key, task),
    onError: () => toast.error(t("common.request_failed")),
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) => {
      console.debug("[TaskDetailPage] comment", { id: taskId });
      return api.tasks.comment(taskId, body);
    },
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: key });
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  if (taskQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={t("tasks.detail.title")}
          icon={ListTodo}
          breadcrumbs={[
            { label: t("nav.tasks"), href: "/tasks" },
            { label: t("tasks.detail.title") },
          ]}
        />
        <Panel>
          <div className="py-10 text-center text-sm text-muted-foreground">
            {t("tasks.detail.not_found")}
          </div>
        </Panel>
      </div>
    );
  }

  const task = taskQuery.data;
  const doneCount = task?.subtasks.filter((subtask) => subtask.done).length ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title={task?.title ?? t("tasks.detail.title")}
        icon={ListTodo}
        breadcrumbs={[
          { label: t("nav.tasks"), href: "/tasks" },
          { label: task?.title ?? "…" },
        ]}
        secondaryActions={[
          {
            label: t("common.back"),
            href: "/tasks",
            icon: <ArrowLeft className="rtl:-scale-x-100" />,
          },
        ]}
      />

      {!task ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-4">
            <Panel>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge
                  status={PRIORITY_KIND[task.priority]}
                  label={t(`tasks.priority.${task.priority}`)}
                />
                <StatusBadge
                  status={STATUS_KIND[task.status]}
                  label={t(`tasks.status.${task.status}`)}
                />
                <div className="ms-auto">
                  <Select
                    value={task.status}
                    onValueChange={(value) =>
                      statusMutation.mutate(value as TaskStatus)
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(`tasks.status.${status}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {task.description}
              </p>
            </Panel>

            <Panel
              title={t("tasks.detail.subtasks")}
              description={t("tasks.detail.subtasks_progress", {
                done: doneCount,
                total: task.subtasks.length,
              })}
            >
              <ul className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <li key={subtask.id} className="flex items-center gap-2.5">
                    <Checkbox
                      id={`subtask-${subtask.id}`}
                      checked={subtask.done}
                      onCheckedChange={() => subtaskMutation.mutate(subtask.id)}
                    />
                    <label
                      htmlFor={`subtask-${subtask.id}`}
                      className={
                        subtask.done
                          ? "text-sm text-muted-foreground line-through"
                          : "text-sm"
                      }
                    >
                      {subtask.title}
                    </label>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title={t("tasks.detail.comments")}>
              <div className="space-y-4">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="text-xs">
                        {initials(comment.author)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {comment.author}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {dt.format(comment.at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {comment.body}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="flex items-end gap-2 border-t border-border/50 pt-4">
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={t("tasks.detail.comment_placeholder")}
                    rows={1}
                    className="max-h-32 min-h-[2.5rem] flex-1 resize-none"
                    aria-label={t("tasks.detail.comment_placeholder")}
                  />
                  <Button
                    onClick={() => commentMutation.mutate(draft.trim())}
                    disabled={!draft.trim() || commentMutation.isPending}
                    aria-label={t("tasks.detail.send")}
                  >
                    <SendHorizontal className="rtl:-scale-x-100" />
                    <span className="max-sm:sr-only">
                      {t("tasks.detail.send")}
                    </span>
                  </Button>
                </div>
              </div>
            </Panel>
          </div>

          <Panel title={t("tasks.detail.details")} className="self-start">
            <dl className="space-y-3 text-sm">
              <Row label={t("tasks.col.assignee")}>
                <span className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback className="text-[10px]">
                      {initials(task.assignee)}
                    </AvatarFallback>
                  </Avatar>
                  {task.assignee}
                </span>
              </Row>
              <Row label={t("tasks.col.due")}>{dt.format(task.due)}</Row>
              <Row label={t("tasks.detail.created")}>
                {dt.format(task.created_at)}
              </Row>
              <Row label={t("tasks.col.project")}>
                <Link
                  to="/projects"
                  className="text-primary hover:underline"
                >
                  {task.project}
                </Link>
              </Row>
              <div>
                <dt className="mb-1.5 text-xs text-muted-foreground uppercase">
                  {t("tasks.detail.labels")}
                </dt>
                <dd className="flex flex-wrap gap-1.5">
                  {task.labels.map((label) => (
                    <Badge key={label} variant="secondary">
                      {label}
                    </Badge>
                  ))}
                </dd>
              </div>
            </dl>
          </Panel>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
