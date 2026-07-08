import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from '@tanstack/react-table'
import { AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/empty-state'
import { PaginationBar, type PaginationMeta } from '@/components/pagination-bar'
import { useCan } from '@/lib/permissions'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/*
 * DataTable (E6 §3.1) — the ONLY way to render lists in the admin:
 * <DataTable columns data state rowActions selection? pagination onSort onPage emptyState />
 * Renders loading (row skeletons) / error (with retry) / empty (EmptyState) itself —
 * screens never build those states. Row actions always live in the trailing "⋯" menu (E6 §2).
 */

export type DataTableState = 'loading' | 'error' | 'empty' | 'ready'

export type { PaginationMeta }

export type RowAction<TData> = {
  key: string
  label: string
  icon?: ReactNode
  destructive?: boolean
  permission?: string
  /** Per-row visibility (e.g. hide "Impersonate" on self/inactive rows). */
  hidden?: (row: TData) => boolean
  /** Per-row disabling with an explanatory tooltip (e.g. "Deactivate" on self / last admin). */
  disabled?: (row: TData) => boolean
  disabledHint?: (row: TData) => string
  onSelect: (row: TData) => void
}

export type SortState = { column: string; dir: 'asc' | 'desc' }

function RowActionsMenu<TData>({ row, actions }: { row: TData; actions: RowAction<TData>[] }) {
  const can = useCan()
  void can
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t('common.actions')}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <RowActionItem key={action.key} row={row} action={action} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RowActionItem<TData>({ row, action }: { row: TData; action: RowAction<TData> }) {
  const allowed = useCan(action.permission)
  if (!allowed || action.hidden?.(row)) return null
  const disabled = action.disabled?.(row) ?? false
  const item = (
    <DropdownMenuItem
      variant={action.destructive ? 'destructive' : 'default'}
      disabled={disabled}
      onSelect={() => action.onSelect(row)}
    >
      {action.icon}
      {action.label}
    </DropdownMenuItem>
  )
  const hint = disabled ? action.disabledHint?.(row) : undefined
  if (!hint) return item
  // Radix disables pointer events on disabled items — wrap so the tooltip still fires.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block" tabIndex={0}>
          {item}
        </span>
      </TooltipTrigger>
      <TooltipContent side="left">{hint}</TooltipContent>
    </Tooltip>
  )
}

export function DataTable<TData>({
  columns,
  data,
  state = 'ready',
  rowActions = [],
  selection = false,
  onSelectionChange,
  selectionResetKey,
  pagination,
  sort,
  onSort,
  onPage,
  onRetry,
  emptyState,
  getRowId,
  className,
}: {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  state?: DataTableState
  rowActions?: RowAction<TData>[]
  selection?: boolean
  onSelectionChange?: (selected: TData[]) => void
  /** Bump to clear the internal row selection (page switch, bulk action done). */
  selectionResetKey?: string | number
  pagination?: PaginationMeta
  sort?: SortState
  /** Server-driven sorting: called with column id and next direction. */
  onSort?: (column: string, dir: 'asc' | 'desc') => void
  onPage?: (page: number) => void
  onRetry?: () => void
  emptyState?: { title?: string; description?: string; action?: { label: string; onClick: () => void } }
  getRowId?: (row: TData) => string
  className?: string
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Clear checkboxes when the caller resets selection (page switch, bulk action)
  useEffect(() => {
    setRowSelection({})
  }, [selectionResetKey])

  const allColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
    const cols = [...columns]
    if (selection) {
      cols.unshift({
        id: '_select',
        size: 32,
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected() || (table.getIsSomeRowsSelected() && 'indeterminate')}
            onCheckedChange={(checked) => table.toggleAllRowsSelected(checked === true)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox checked={row.getIsSelected()} onCheckedChange={(checked) => row.toggleSelected(checked === true)} />
        ),
      })
    }
    if (rowActions.length > 0) {
      cols.push({
        id: '_actions',
        size: 40,
        header: () => null,
        cell: ({ row }) => <RowActionsMenu row={row.original} actions={rowActions} />,
      })
    }
    return cols
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, selection, rowActions])

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { rowSelection },
    enableRowSelection: selection,
    onRowSelectionChange: (updater) => {
      // Resolve outside the state updater — notifying the parent from inside it
      // is a side effect in a pure function (React setState-in-render warning)
      const next = typeof updater === 'function' ? updater(rowSelection) : updater
      setRowSelection(next)
      if (onSelectionChange) {
        const selectedRows = data.filter((_, index) => next[getRowId ? getRowId(data[index]!) : String(index)])
        onSelectionChange(selectedRows)
      }
    },
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  })

  const resolvedState: DataTableState = state === 'ready' && data.length === 0 ? 'empty' : state

  const handleSortClick = (columnId: string) => {
    if (!onSort) return
    const nextDir = sort?.column === columnId && sort.dir === 'asc' ? 'desc' : 'asc'
    onSort(columnId, nextDir)
  }

  return (
    <div data-slot="data-table" className={cn('flex flex-col', className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                // Columns opt in via meta.sortable — not every column sorts (UI specs per screen).
                const meta = header.column.columnDef.meta as { sortable?: boolean } | undefined
                const sortable = Boolean(onSort) && !header.id.startsWith('_') && meta?.sortable === true
                const isSorted = sort?.column === header.id
                return (
                  <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                    {header.isPlaceholder ? null : sortable ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                        onClick={() => handleSortClick(header.id)}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {isSorted ? (
                          sort?.dir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                        ) : (
                          <ArrowUpDown className="size-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {resolvedState === 'loading'
            ? Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {allColumns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-full max-w-40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : resolvedState === 'ready'
              ? table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              : null}
        </TableBody>
      </Table>

      {resolvedState === 'empty' ? (
        <EmptyState
          title={emptyState?.title ?? t('table.empty.title')}
          description={emptyState?.description ?? t('table.empty.description')}
          action={emptyState?.action}
        />
      ) : null}

      {resolvedState === 'error' ? (
        <EmptyState
          icon={AlertCircle}
          title={t('table.error.title')}
          description={t('table.error.description')}
          action={onRetry ? { label: t('common.retry'), onClick: onRetry } : undefined}
        />
      ) : null}

      {pagination && resolvedState === 'ready' ? (
        <PaginationBar
          pagination={pagination}
          shown={data.length}
          onPage={onPage}
          className="border-t px-2 pt-3 pb-1"
        />
      ) : null}
    </div>
  )
}
