import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarClock,
  CheckCircle2,
  GripVertical,
  ListChecks,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { api, type TodoItem, type TodoPriority } from "@/api";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { SearchInput } from "@/components/toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteDateTime } from "@/lib/datetime";
import { createDndA11y } from "@/lib/dnd-a11y";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * /todo — personal task list grouped into Today / Upcoming / Completed with
 * inline add, optimistic toggle/remove and drag-reorder. Needs todo.view.
 */

const PRIORITIES: TodoPriority[] = ["low", "medium", "high"];
const PRIORITY_KIND: Record<TodoPriority, StatusKind> = {
  low: "archived",
  medium: "info",
  high: "error",
};

type GroupKey = "today" | "upcoming" | "completed";

function groupOf(todo: TodoItem): GroupKey {
  if (todo.done) return "completed";
  if (todo.due && Date.parse(todo.due) <= Date.now() + 24 * 3600 * 1000)
    return "today";
  return "upcoming";
}

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ListChecks;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs text-muted-foreground">{label}</div>
      </div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function TodoPage() {
  const dt = useSiteDateTime();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("medium");

  const key = ["todo"];
  const listQuery = useQuery({ queryKey: key, queryFn: () => api.todo.list() });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const setLocal = (updater: (todos: TodoItem[]) => TodoItem[]) => {
    queryClient.setQueryData<TodoItem[]>(key, (todos) =>
      todos ? updater(todos) : todos,
    );
  };
  const rollback = (previous: TodoItem[] | undefined) => {
    if (previous) queryClient.setQueryData(key, previous);
    toast.error(t("common.request_failed"));
  };
  const snapshot = async () => {
    await queryClient.cancelQueries({ queryKey: key });
    return queryClient.getQueryData<TodoItem[]>(key);
  };

  const addMutation = useMutation({
    mutationFn: (input: { title: string; priority: TodoPriority }) => {
      console.debug("[TodoPage] add", input);
      return api.todo.add(input.title, input.priority);
    },
    onMutate: async (input) => {
      const previous = await snapshot();
      setLocal((todos) => [
        {
          id: -Date.now(),
          title: input.title,
          done: false,
          priority: input.priority,
          due: null,
        },
        ...todos,
      ]);
      setTitle("");
      return { previous };
    },
    onError: (_error, _vars, context) => rollback(context?.previous),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: key }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => {
      console.debug("[TodoPage] toggle", id);
      return api.todo.toggle(id);
    },
    onMutate: async (id) => {
      const previous = await snapshot();
      setLocal((todos) =>
        todos.map((todo) =>
          todo.id === id ? { ...todo, done: !todo.done } : todo,
        ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => rollback(context?.previous),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: key }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => {
      console.debug("[TodoPage] remove", id);
      return api.todo.remove(id);
    },
    onMutate: async (id) => {
      const previous = await snapshot();
      setLocal((todos) => todos.filter((todo) => todo.id !== id));
      return { previous };
    },
    onError: (_error, _vars, context) => rollback(context?.previous),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: key }),
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => {
      console.debug("[TodoPage] reorder", ids);
      return api.todo.reorder(ids);
    },
    onMutate: async (ids) => {
      const previous = await snapshot();
      setLocal((todos) => {
        const byId = new Map(todos.map((todo) => [todo.id, todo]));
        return ids
          .map((id) => byId.get(id))
          .filter((todo): todo is TodoItem => Boolean(todo));
      });
      return { previous };
    },
    onError: (_error, _vars, context) => rollback(context?.previous),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: key }),
  });

  const todos = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  const q = search.toLowerCase().trim();
  const visible = todos.filter(
    (todo) =>
      (!q || todo.title.toLowerCase().includes(q)) &&
      (priorityFilter === "all" || todo.priority === priorityFilter),
  );
  const groups: Record<GroupKey, TodoItem[]> = {
    today: visible.filter((todo) => groupOf(todo) === "today"),
    upcoming: visible.filter((todo) => groupOf(todo) === "upcoming"),
    completed: visible.filter((todo) => groupOf(todo) === "completed"),
  };
  const stats = {
    total: todos.length,
    done: todos.filter((todo) => todo.done).length,
    overdue: todos.filter(
      (todo) => !todo.done && todo.due && Date.parse(todo.due) < Date.now(),
    ).length,
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const order = todos.map((todo) => todo.id);
    const from = order.indexOf(Number(active.id));
    const to = order.indexOf(Number(over.id));
    if (from < 0 || to < 0) return;
    reorderMutation.mutate(arrayMove(order, from, to));
  };

  const submitAdd = () => {
    if (!title.trim()) return;
    addMutation.mutate({ title: title.trim(), priority });
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t("nav.todo")} icon={ListChecks} />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_16rem]">
        <Panel
          icon={ListChecks}
          title={t("nav.todo")}
          description={t("todo.hint")}
          actions={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t("todo.search_placeholder")}
                className="w-44"
              />
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder={t("todo.filter.priority")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("todo.filter.all_priorities")}
                  </SelectItem>
                  {PRIORITIES.map((entry) => (
                    <SelectItem key={entry} value={entry}>
                      {t(`todo.priority.${entry}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        >
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitAdd();
              }}
              placeholder={t("todo.add_placeholder")}
              aria-label={t("todo.add_placeholder")}
              className="min-w-40 flex-1"
            />
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as TodoPriority)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {t(`todo.priority.${entry}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={submitAdd} disabled={!title.trim()}>
              <Plus />
              {t("todo.add")}
            </Button>
          </div>

          {listQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : listQuery.isError ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("common.request_failed")}{" "}
              <Button
                variant="link"
                size="sm"
                onClick={() => void listQuery.refetch()}
              >
                {t("common.retry")}
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
              accessibility={createDndA11y(t("todo.item"))}
            >
              <div className="space-y-6">
                {(["today", "upcoming", "completed"] as const).map((group) => (
                  <section key={group}>
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-tight">
                      {t(`todo.group.${group}`)}
                      <Badge variant="secondary" className="tabular-nums">
                        {groups[group].length}
                      </Badge>
                    </h2>
                    {groups[group].length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
                        {t("todo.group_empty")}
                      </p>
                    ) : (
                      <SortableContext
                        items={groups[group].map((todo) => todo.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <ul className="space-y-1.5">
                          {groups[group].map((todo) => (
                            <TodoRow
                              key={todo.id}
                              todo={todo}
                              dueLabel={todo.due ? dt.format(todo.due) : null}
                              onToggle={() => toggleMutation.mutate(todo.id)}
                              onRemove={() => removeMutation.mutate(todo.id)}
                            />
                          ))}
                        </ul>
                      </SortableContext>
                    )}
                  </section>
                ))}
              </div>
            </DndContext>
          )}
        </Panel>

        <Panel title={t("todo.stats.title")} className="self-start">
          <div className="space-y-4">
            <StatRow
              icon={ListChecks}
              label={t("todo.stats.total")}
              value={stats.total}
            />
            <StatRow
              icon={CheckCircle2}
              label={t("todo.stats.done")}
              value={stats.done}
            />
            <StatRow
              icon={CalendarClock}
              label={t("todo.stats.overdue")}
              value={stats.overdue}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function TodoRow({
  todo,
  dueLabel,
  onToggle,
  onRemove,
}: {
  todo: TodoItem;
  dueLabel: string | null;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-2.5 rounded-xl border border-border/50 bg-background/40 px-3 py-2",
        isDragging && "opacity-40",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground/60 hover:text-muted-foreground"
        aria-label={t("todo.reorder_handle")}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <Checkbox
        id={`todo-${todo.id}`}
        checked={todo.done}
        onCheckedChange={onToggle}
      />
      <label
        htmlFor={`todo-${todo.id}`}
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          todo.done && "text-muted-foreground line-through",
        )}
      >
        {todo.title}
      </label>
      <StatusBadge
        status={PRIORITY_KIND[todo.priority]}
        label={t(`todo.priority.${todo.priority}`)}
      />
      {dueLabel ? (
        <Badge variant="outline" className="max-sm:hidden">
          {dueLabel}
        </Badge>
      ) : null}
      <Button
        variant="ghost"
        size="icon"
        className="size-7 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        onClick={onRemove}
        aria-label={t("todo.delete")}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
