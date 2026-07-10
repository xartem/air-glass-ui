import { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { createDndA11y } from "@/lib/dnd-a11y";
import { devDebug } from "@/lib/debug";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * NestableList (W5 gap primitive): a nested drag-and-drop list — drag a row up
 * or down to reorder, drag horizontally to change its nesting depth (the
 * "Nestable" affordance Velzon ships). Built on dnd-kit's flattened-tree
 * pattern with keyboard support (via createDndA11y). Distinct from TreeList,
 * which nests via explicit indent/outdent buttons.
 *
 * Interactive, so it logs at the drop boundary (devDebug, dev-only).
 */

export interface NestableItem {
  id: string;
  label: string;
  children?: NestableItem[];
}

const INDENT = 28;

interface FlatItem {
  id: string;
  label: string;
  depth: number;
  parentId: string | null;
  index: number;
}

function flatten(
  items: NestableItem[],
  parentId: string | null = null,
  depth = 0,
): FlatItem[] {
  return items.flatMap((item, index) => [
    { id: item.id, label: item.label, depth, parentId, index },
    ...flatten(item.children ?? [], item.id, depth + 1),
  ]);
}

function buildTree(flat: FlatItem[]): NestableItem[] {
  const roots: NestableItem[] = [];
  const nodes = new Map<string, NestableItem>();
  for (const item of flat)
    nodes.set(item.id, { id: item.id, label: item.label });
  for (const item of flat) {
    const node = nodes.get(item.id)!;
    if (item.parentId && nodes.has(item.parentId)) {
      const parent = nodes.get(item.parentId)!;
      (parent.children ??= []).push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/** Depth the dragged row would land at, clamped to [0, prevDepth + 1]. */
function projectedDepth(
  flat: FlatItem[],
  overIndex: number,
  dragDepth: number,
): number {
  const prev = flat[overIndex - 1];
  const maxDepth = prev ? prev.depth + 1 : 0;
  return Math.max(0, Math.min(dragDepth, maxDepth));
}

function Row({
  item,
  renderLabel,
}: {
  item: FlatItem;
  renderLabel?: (item: FlatItem) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        marginLeft: item.depth * INDENT,
      }}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-[var(--glass-border)] bg-background/40 px-2.5 py-2 text-sm",
        isDragging && "z-10 opacity-80 shadow-lg",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={t("showcase.nestable.drag")}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="truncate">
        {renderLabel ? renderLabel(item) : item.label}
      </span>
    </div>
  );
}

export function NestableList({
  items,
  onChange,
  renderLabel,
  className,
}: {
  items: NestableItem[];
  onChange: (next: NestableItem[]) => void;
  renderLabel?: (item: FlatItem) => React.ReactNode;
  className?: string;
}) {
  const flat = useMemo(() => flatten(items), [items]);
  const [offsetDepth, setOffsetDepth] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = flat.map((item) => item.id);

  function handleStart(_event: DragStartEvent) {
    setOffsetDepth(0);
  }

  function handleMove(event: DragMoveEvent) {
    setOffsetDepth(Math.round(event.delta.x / INDENT));
  }

  function handleEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const oldIndex = ids.indexOf(String(active.id));
    const overIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || overIndex === -1) return;

    const moved = flat[oldIndex]!;
    const target = flat[overIndex]!;
    const dragDepth = moved.depth + offsetDepth;

    // Rebuild a flat order with the moved row at its new slot + projected depth.
    const without = flat.filter((item) => item.id !== moved.id);
    const insertAt = without.findIndex((item) => item.id === target.id);
    const finalIndex = oldIndex < overIndex ? insertAt + 1 : insertAt;
    const depth = projectedDepth(
      [...without.slice(0, finalIndex), moved, ...without.slice(finalIndex)],
      finalIndex,
      dragDepth,
    );
    // The new parent is the nearest preceding row with depth === depth - 1.
    let parentId: string | null = null;
    for (let i = finalIndex - 1; i >= 0; i -= 1) {
      const candidate = without[i]!;
      if (candidate.depth === depth - 1) {
        parentId = candidate.id;
        break;
      }
      if (candidate.depth < depth) break;
    }
    const nextFlat = [
      ...without.slice(0, finalIndex),
      { ...moved, depth, parentId },
      ...without.slice(finalIndex),
    ];
    devDebug("[nestable] drop", { id: moved.id, depth, parentId });
    onChange(buildTree(nextFlat));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={createDndA11y(t("dnd.item.node"))}
      onDragStart={handleStart}
      onDragMove={handleMove}
      onDragEnd={handleEnd}
      onDragCancel={() => setOffsetDepth(0)}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={cn("flex flex-col gap-1.5", className)}>
          {flat.map((item) => (
            <Row key={item.id} item={item} renderLabel={renderLabel} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
