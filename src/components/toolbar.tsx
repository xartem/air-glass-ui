import type { ReactNode } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * List-screen controls (E6 §1A/§2): on list screens the search+filters cluster
 * lives in the Panel HEADER actions slot (search first, filters right of it) —
 * ListLayout wires that. The inline <Toolbar> row remains only for embedded
 * picking surfaces (media grid, MediaPicker) that have no Panel header of
 * their own. BulkBar shows over the content when rows are selected.
 */

export type BulkAction = {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  icon?: ReactNode;
};

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? t("common.search")}
        className="ps-9"
        aria-label={t("common.search")}
      />
    </div>
  );
}

export function BulkBar({
  actions,
  selectedCount,
}: {
  actions: BulkAction[];
  selectedCount: number;
}) {
  return (
    <div className="flex w-full items-center gap-2 rounded-lg bg-accent px-3 py-1.5">
      <span className="text-sm font-medium text-accent-foreground">
        {t("common.selected", { count: selectedCount })}
      </span>
      <div className="ms-auto flex items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            size="sm"
            variant={action.destructive ? "destructive" : "outline"}
            onClick={action.onClick}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function Toolbar({
  search,
  filters,
  view,
  bulkActions = [],
  selectedCount = 0,
  className,
}: {
  search: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /** Filter controls (Select/Popover) rendered right of the search. */
  filters?: ReactNode;
  /** View switcher (table/grid) rendered at the far right. */
  view?: ReactNode;
  bulkActions?: BulkAction[];
  selectedCount?: number;
  className?: string;
}) {
  const bulkMode = selectedCount > 0 && bulkActions.length > 0;

  return (
    <div
      data-slot="toolbar"
      className={cn(
        "flex min-h-[38px] flex-wrap items-center gap-2",
        className,
      )}
    >
      {bulkMode ? (
        <BulkBar actions={bulkActions} selectedCount={selectedCount} />
      ) : (
        <>
          <SearchInput
            value={search.value}
            onChange={search.onChange}
            placeholder={search.placeholder}
            className="w-full sm:max-w-72"
          />
          {filters}
          {view ? <div className="ms-auto">{view}</div> : null}
        </>
      )}
    </div>
  );
}
