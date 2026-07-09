import { useRef, type ReactNode } from "react";
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
import { GripVertical, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createDndA11y } from "@/lib/dnd-a11y";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * RepeaterField (E6 §3, E2 §7: field type `repeater`) — array of sub-forms,
 * dnd-sortable, add/remove. Sub-form fields come from the field sub-schema (§7),
 * rendered by the caller via renderItem.
 */

function RepeaterRow({
  id,
  onRemove,
  children,
}: {
  id: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-start gap-2 rounded-lg border bg-background/40 p-3",
        isDragging && "z-10 opacity-80 shadow-lg",
      )}
    >
      <button
        type="button"
        className="mt-2 shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={t("common.actions")}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("common.delete")}
        onClick={onRemove}
      >
        <Trash2 className="text-destructive" />
      </Button>
    </div>
  );
}

export function RepeaterField<T>({
  value,
  onChange,
  renderItem,
  newItem,
  addLabel,
  className,
}: {
  value: T[];
  onChange: (value: T[]) => void;
  /** Sub-form for one item; call update(next) to replace the item. */
  renderItem: (item: T, index: number, update: (next: T) => void) => ReactNode;
  newItem: () => T;
  addLabel?: string;
  className?: string;
}) {
  // Stable row keys parallel to `value` (dnd needs identity across re-renders).
  const counter = useRef(0);
  const keysRef = useRef<string[]>([]);
  while (keysRef.current.length < value.length)
    keysRef.current.push(`row-${counter.current++}`);
  if (keysRef.current.length > value.length)
    keysRef.current = keysRef.current.slice(0, value.length);
  const keys = keysRef.current;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = keys.indexOf(String(active.id));
    const to = keys.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    keysRef.current = arrayMove(keys, from, to);
    onChange(arrayMove(value, from, to));
  };

  const removeAt = (index: number) => {
    keysRef.current = keys.filter((_, i) => i !== index);
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div data-slot="repeater-field" className={cn("space-y-2", className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={createDndA11y(t("dnd.item.row"))}
      >
        <SortableContext items={keys} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {value.map((item, index) => (
              <RepeaterRow
                key={keys[index]}
                id={keys[index]!}
                onRemove={() => removeAt(index)}
              >
                {renderItem(item, index, (next) => {
                  const copy = [...value];
                  copy[index] = next;
                  onChange(copy);
                })}
              </RepeaterRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...value, newItem()])}
      >
        <Plus />
        {addLabel ?? t("repeater.add")}
      </Button>
    </div>
  );
}
