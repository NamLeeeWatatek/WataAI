'use client'

import * as React from 'react'
import {
  ChevronDown,
  ChevronRight,
  SortAsc,
  SortDesc,
  ArrowUpDown,
} from "lucide-react"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  getSortedRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  type ExpandedState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { cn } from "@/lib/utils"
import { Pagination, type PaginationInfo } from "./Pagination"
import { Search as SearchInput } from "./Search"
import { Checkbox } from "./Checkbox"
import { Skeleton } from "@/components/ui/Skeleton"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table"

export type SortDirection = 'asc' | 'desc' | null

export interface DataTableProps<TData, TValue = unknown> {
  data: TData[]
  columns: ColumnDef<TData, TValue>[]
  loading?: boolean
  error?: string | null
  searchable?: boolean
  searchPlaceholder?: string
  searchValue?: string
  onSearch?: (value: string) => void
  sortable?: boolean
  sortColumn?: string
  sortDirection?: SortDirection
  onSort?: (column: string, direction: SortDirection) => void
  pagination?: PaginationInfo
  pageSizeOptions?: number[]
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  isTree?: boolean
  childrenKey?: string
  treeColumnKey?: string
  defaultExpanded?: string[]
  indentSize?: number
  actions?: React.ReactNode
  onRowClick?: (row: TData) => void
  onRowDragStart?: (e: React.DragEvent, row: TData) => void
  onRowDragOver?: (e: React.DragEvent, row: TData) => void
  onRowDrop?: (e: React.DragEvent, row: TData) => void
  emptyMessage?: string
  emptyComponent?: React.ReactNode
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  className?: string
  tableClassName?: string
  compact?: boolean
  onRowExpand?: (row: TData) => Promise<void> | void
  getRowCanExpand?: (row: TData) => boolean
}

function DataTableInner<TData, TValue>({
  data,
  columns,
  loading = false,
  error = null,
  searchable = true,
  searchPlaceholder = "Search",
  searchValue = '',
  onSearch,
  sortable = true,
  sortColumn = '',
  sortDirection = null,
  onSort,
  pagination,
  pageSizeOptions = [5, 10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  isTree = false,
  childrenKey = 'children',
  treeColumnKey,
  indentSize = 20,
  actions,
  onRowClick,
  onRowDragStart,
  onRowDragOver,
  onRowDrop,
  emptyMessage = "No data available",
  emptyComponent,
  selectedIds = [],
  onSelectionChange,
  onRowExpand,
  getRowCanExpand,
  className,
  tableClassName,
}: DataTableProps<TData, TValue>) {
  // --- TanStack Table State ---
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [expanded, setExpanded] = React.useState<ExpandedState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  // Sync external sorting
  React.useEffect(() => {
    const nextSorting: SortingState = sortColumn && sortDirection
      ? [{ id: sortColumn, desc: sortDirection === 'desc' }]
      : []
    setSorting(prev => JSON.stringify(prev) === JSON.stringify(nextSorting) ? prev : nextSorting)
  }, [sortColumn, sortDirection])

  // Sync external selection
  React.useEffect(() => {
    const nextSelection: RowSelectionState = {}
    selectedIds.forEach((id) => { nextSelection[id] = true })
    setRowSelection(prev => {
      const currentKeys = Object.keys(prev).filter(k => prev[k])
      if (currentKeys.length === selectedIds.length && selectedIds.every(id => prev[id])) return prev
      return nextSelection
    })
  }, [selectedIds])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, expanded, rowSelection },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(next)
      if (onSort) onSort(next.length > 0 ? next[0].id : '', next.length > 0 ? (next[0].desc ? 'desc' : 'asc') : null)
    },
    onExpandedChange: setExpanded,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater
      setRowSelection(next)
      if (onSelectionChange) onSelectionChange(Object.keys(next).filter((k) => next[k]))
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) => (row as any)[childrenKey],
    getRowId: (row) => (row as any).id || (row as any).key,
    enableRowSelection: true,
  })

  const [localSearchValue, setLocalSearchValue] = React.useState(searchValue)
  React.useEffect(() => setLocalSearchValue(searchValue), [searchValue])

  return (
    <div className={cn("space-y-4", className)}>
      {(searchable || actions) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <SearchInput
                placeholder={searchPlaceholder}
                value={localSearchValue}
                onChange={(e) => {
                  setLocalSearchValue(e.target.value)
                  onSearch?.(e.target.value)
                }}
                onClear={() => {
                  setLocalSearchValue('')
                  onSearch?.('')
                }}
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className={cn("rounded-xl border bg-card shadow-sm overflow-hidden", tableClassName)}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b bg-muted/20">
                {headerGroup.headers.map((header) => {
                  const isSelection = header.column.id === 'selection'
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-11 px-4 py-2 text-left font-medium text-muted-foreground",
                        isSelection && "w-12 p-0 text-center",
                        header.column.getCanSort() && "cursor-pointer group",
                        (header.column.columnDef.meta as any)?.className
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ width: header.column.getSize() ? `${header.column.getSize()}px` : undefined }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent border-b">
                  {columns.map((_, idx) => (
                    <TableCell key={idx} className="p-4"><Skeleton className="h-5 w-full rounded" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-destructive font-medium">{error}</TableCell></TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground italic">{emptyMessage}</TableCell></TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "transition-colors border-b",
                    onRowClick && "cursor-pointer hover:bg-muted/30",
                    row.getIsSelected() && "bg-primary/5 hover:bg-primary/10"
                  )}
                  onClick={() => onRowClick?.(row.original)}
                  draggable={!!onRowDragStart}
                  onDragStart={(e) => onRowDragStart?.(e, row.original)}
                  onDragOver={(e) => onRowDragOver?.(e, row.original)}
                  onDrop={(e) => onRowDrop?.(e, row.original)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isSelection = cell.column.id === 'selection'
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "h-12 px-4 py-2",
                          isSelection && "w-12 p-0 text-center",
                          (cell.column.columnDef.meta as any)?.className
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.total > 0 && (
        <Pagination
          pagination={pagination}
          pageSizeOptions={pageSizeOptions}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          className="m-2"
        />
      )}
    </div>
  )
}

export const DataTable = React.memo(DataTableInner) as typeof DataTableInner;



