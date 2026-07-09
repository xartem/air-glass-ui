import { useState, type ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  IndentDecrease,
  IndentIncrease,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createDndA11y } from "@/lib/dnd-a11y";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * TreeList (E6 §3): dnd tree for menus, categories, page hierarchy.
 * Reordering via drag within the same siblings group; nesting level changes via
 * explicit indent/outdent controls (deterministic, keyboard-friendly).
 */

export type TreeNode = {
  id: string;
  label: string;
  children?: TreeNode[];
};

/* ---- pure tree helpers ---- */

function findParent(
  nodes: TreeNode[],
  id: string,
  parent: TreeNode | null = null,
): { parent: TreeNode | null; index: number } | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i]!.id === id) return { parent, index: i };
    const inChild = findParent(nodes[i]!.children ?? [], id, nodes[i]!);
    if (inChild) return inChild;
  }
  return null;
}

function cloneTree(nodes: TreeNode[]): TreeNode[] {
  return nodes.map((node) => ({
    ...node,
    children: node.children ? cloneTree(node.children) : undefined,
  }));
}

function siblingsOf(tree: TreeNode[], parent: TreeNode | null): TreeNode[] {
  return parent ? (parent.children ??= []) : tree;
}

/* ---- sortable row ---- */

function TreeRow({
  node,
  depth,
  hasChildren,
  collapsed,
  onToggle,
  onIndent,
  onOutdent,
  canIndent,
  canOutdent,
  renderLabel,
}: {
  node: TreeNode;
  depth: number;
  hasChildren: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  canIndent: boolean;
  canOutdent: boolean;
  renderLabel?: (node: TreeNode) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        marginLeft: depth * 24,
      }}
      className={cn(
        "group flex items-center gap-1.5 rounded-lg border bg-background/40 px-2 py-1.5",
        isDragging && "z-10 opacity-80 shadow-lg",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={t("common.actions")}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      {hasChildren ? (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggle}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronRight /> : <ChevronDown />}
        </Button>
      ) : (
        <span className="size-6" />
      )}
      <span className="min-w-0 flex-1 truncate text-sm">
        {renderLabel ? renderLabel(node) : node.label}
      </span>
      <span className="flex opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onOutdent}
          disabled={!canOutdent}
          aria-label={t("tree.outdent")}
        >
          <IndentDecrease />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onIndent}
          disabled={!canIndent}
          aria-label={t("tree.indent")}
        >
          <IndentIncrease />
        </Button>
      </span>
    </div>
  );
}

/* ---- one siblings group = one sortable context ---- */

function TreeLevel({
  tree,
  nodes,
  parent,
  depth,
  collapsedIds,
  onToggle,
  onChange,
  renderLabel,
}: {
  tree: TreeNode[];
  nodes: TreeNode[];
  parent: TreeNode | null;
  depth: number;
  collapsedIds: Set<string>;
  onToggle: (id: string) => void;
  onChange: (next: TreeNode[]) => void;
  renderLabel?: (node: TreeNode) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = nodes.findIndex((n) => n.id === active.id);
    const to = nodes.findIndex((n) => n.id === over.id);
    if (from === -1 || to === -1) return;
    const next = cloneTree(tree);
    const location = findParent(next, String(active.id));
    if (!location) return;
    const group = siblingsOf(next, location.parent);
    const reordered = arrayMove(group, from, to);
    if (location.parent) location.parent.children = reordered;
    onChange(location.parent ? next : reordered);
  };

  const indent = (id: string) => {
    const next = cloneTree(tree);
    const location = findParent(next, id);
    if (!location || location.index === 0) return;
    const group = siblingsOf(next, location.parent);
    const node = group[location.index]!;
    const newParent = group[location.index - 1]!;
    group.splice(location.index, 1);
    (newParent.children ??= []).push(node);
    onChange(next);
  };

  const outdent = (id: string) => {
    const next = cloneTree(tree);
    const location = findParent(next, id);
    if (!location || !location.parent) return;
    const grand = findParent(next, location.parent.id);
    if (!grand) return;
    const group = siblingsOf(next, location.parent);
    const node = group[location.index]!;
    group.splice(location.index, 1);
    const grandGroup = siblingsOf(next, grand.parent);
    grandGroup.splice(grand.index + 1, 0, node);
    onChange(next);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={createDndA11y(t("dnd.item.node"))}
    >
      <SortableContext
        items={nodes.map((n) => n.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {nodes.map((node, index) => {
            const children = node.children ?? [];
            const collapsed = collapsedIds.has(node.id);
            return (
              <div key={node.id} className="space-y-1">
                <TreeRow
                  node={node}
                  depth={depth}
                  hasChildren={children.length > 0}
                  collapsed={collapsed}
                  onToggle={() => onToggle(node.id)}
                  onIndent={() => indent(node.id)}
                  onOutdent={() => outdent(node.id)}
                  canIndent={index > 0}
                  canOutdent={parent !== null}
                  renderLabel={renderLabel}
                />
                {children.length > 0 && !collapsed ? (
                  <TreeLevel
                    tree={tree}
                    nodes={children}
                    parent={node}
                    depth={depth + 1}
                    collapsedIds={collapsedIds}
                    onToggle={onToggle}
                    onChange={onChange}
                    renderLabel={renderLabel}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function TreeList({
  items,
  onChange,
  renderLabel,
  className,
}: {
  items: TreeNode[];
  onChange: (items: TreeNode[]) => void;
  renderLabel?: (node: TreeNode) => ReactNode;
  className?: string;
}) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div data-slot="tree-list" className={cn("space-y-1", className)}>
      <TreeLevel
        tree={items}
        nodes={items}
        parent={null}
        depth={0}
        collapsedIds={collapsedIds}
        onToggle={toggle}
        onChange={onChange}
        renderLabel={renderLabel}
      />
    </div>
  );
}
