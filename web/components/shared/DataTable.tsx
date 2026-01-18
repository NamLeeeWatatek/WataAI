'use client'

import * as React from 'react'
import {
  ArrowUpDown,
  LayoutGrid,
  List,
  Loader2,
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
import { Skeleton } from "@/components/ui/Skeleton"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"

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
  title?: React.ReactNode
  description?: React.ReactNode
  /** Left-aligned slot for Breadcrumbs or additional Context */
  headerActions?: React.ReactNode
  /** Left-aligned slot for Filters (Selects, Date ranges) */
  filterActions?: React.ReactNode
  noCard?: boolean
  renderGridItem?: (item: TData) => React.ReactNode
  gridClassName?: string
  viewMode?: 'table' | 'grid'
  onViewModeChange?: (mode: 'table' | 'grid') => void
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
  fixed = true,
  title,
  description,
  headerActions,
  filterActions,
  noCard,
  renderGridItem,
  gridClassName,
  viewMode: externalViewMode,
  onViewModeChange,
}: DataTableProps<TData, TValue> & { fixed?: boolean }) {
  // --- TanStack Table State ---
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [expanded, setExpanded] = React.useState<ExpandedState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [internalViewMode, setInternalViewMode] = React.useState<'table' | 'grid'>('table')

  const viewMode = externalViewMode || internalViewMode
  const setViewMode = (mode: 'table' | 'grid') => {
    setInternalViewMode(mode)
    onViewModeChange?.(mode)
  }

  // Sync external sorting
  React.useEffect(() => {
    const nextSorting: SortingState = sortColumn && sortDirection
      ? [{ id: sortColumn, desc: sortDirection === 'desc' }]
      : []
    setSorting(prev => JSON.stringify(prev) === JSON.stringify(nextSorting) ? prev : nextSorting)
  }, [sortColumn, sortDirection])

  const pageSize = pagination?.limit || 10

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
    manualPagination: true,
  })

  const [localSearchValue, setLocalSearchValue] = React.useState(searchValue)
  React.useEffect(() => setLocalSearchValue(searchValue), [searchValue])

  const headerContent = (title || description || headerActions || filterActions || searchable || actions || renderGridItem) && (
    <CardHeader className={cn(
      "px-6 py-4 border-b bg-card/50",
      noCard && "px-0 border-b bg-transparent py-4"
    )}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Side: Context, Filters, Search, Query */}
        <div className="flex flex-1 flex-wrap items-center gap-4 min-w-0">
          {(title || description) && (
            <div className="space-y-1 pr-4 border-r border-border/40 mr-1 last:border-0 last:pr-0 last:mr-0 flex-shrink-0">
              {title && <CardTitle className="text-xl font-bold tracking-tight">{title}</CardTitle>}
              {description && <CardDescription className="text-sm">{description}</CardDescription>}
            </div>
          )}

          {(headerActions) && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}

          {searchable && (
            <div className="relative w-full sm:w-[250px] lg:w-[300px]">
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

          {filterActions && (
            <div className="flex flex-wrap items-center gap-3">
              {filterActions}
            </div>
          )}
        </div>

        {/* Right Side: Actions & View Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}

          {/* View Mode Switcher */}
          {renderGridItem && (
            <div className="border border-border/40 rounded-lg p-1 flex items-center gap-1 bg-muted/20">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-md transition-all",
                  viewMode === 'grid' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-md transition-all",
                  viewMode === 'table' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </CardHeader>
  )

  const content = (
    <>
      {headerContent}
      <CardContent className={cn("p-0 flex-1", noCard && "p-0")}>
        {viewMode === 'table' ? (
          <div className={cn("relative overflow-hidden", tableClassName)}>
            <Table className={fixed ? "table-fixed w-full" : "w-full"}>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
                    {headerGroup.headers.map((header) => {
                      const isSelection = header.id === 'selection'
                      const isActions = header.id === 'actions'
                      const size = header.column.getSize()

                      return (
                        <TableHead
                          key={header.id}
                          className={cn(
                            "h-11 px-4 py-2 text-left font-medium text-muted-foreground transition-colors",
                            isSelection && "w-10 p-0 text-center",
                            isActions && "w-16 text-right",
                            header.column.getCanSort() && "cursor-pointer group hover:text-foreground",
                            (header.column.columnDef.meta as any)?.className
                          )}
                          style={{
                            width: isSelection ? '40px' : isActions ? '64px' : size ? `${size}px` : undefined,
                            minWidth: isSelection ? '40px' : isActions ? '64px' : undefined,
                            maxWidth: isSelection ? '40px' : isActions ? '64px' : undefined,
                          }}
                        >
                          {header.isPlaceholder ? null : (
                            <div className={cn(
                              "flex items-center gap-2",
                              isActions && "justify-end",
                              isSelection && "justify-center"
                            )}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="relative">
                {loading && !data.length ? (
                  <TableSkeleton columns={columns.length} rows={pageSize} />
                ) : table.getRowModel().rows?.length ? (
                  <>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className={cn(
                          "group transition-colors border-b last:border-0",
                          onRowClick && "cursor-pointer hover:bg-muted/50"
                        )}
                        onClick={() => onRowClick?.(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const isSelection = cell.column.id === 'selection'
                          const isActions = cell.column.id === 'actions'

                          return (
                            <TableCell
                              key={cell.id}
                              className={cn(
                                "h-12 px-4 py-2",
                                isSelection && "w-10 p-0 text-center",
                                isActions && "w-16 text-right",
                                (cell.column.columnDef.meta as any)?.className
                              )}
                              style={{
                                width: isSelection ? '40px' : isActions ? '64px' : undefined,
                                minWidth: isSelection ? '40px' : isActions ? '64px' : undefined,
                                maxWidth: isSelection ? '40px' : isActions ? '64px' : undefined,
                              }}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      {emptyComponent || emptyMessage}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {/* Feedback Overlay for Subsequent Loads - Moved outside TableBody for valid HTML */}
            {loading && data.length > 0 && (
              <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex items-center justify-center z-10 animate-in fade-in duration-300">
                <div className="bg-background/80 p-3 rounded-full shadow-lg border border-border/50">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={cn("p-6 grid gap-6", gridClassName)}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 rounded-2xl border border-border/50 bg-card/40 p-6 shadow-sm animate-pulse space-y-4">
                  <div className="h-8 w-1/3 bg-muted rounded"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted/60 rounded"></div>
                    <div className="h-4 w-2/3 bg-muted/60 rounded"></div>
                  </div>
                </div>
              ))
            ) : data.length > 0 ? (
              data.map((item, index) => (
                <React.Fragment key={(item as any).id || index}>
                  {renderGridItem?.(item)}
                </React.Fragment>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <p>{emptyMessage}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {pagination && (
        <CardFooter className={cn(
          "px-6 py-3 border-t bg-muted/5",
          noCard && "px-0 border-t bg-transparent mt-4"
        )}>
          <Pagination
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={pageSizeOptions}
            className="w-full pl-4 pr-2"
          />
        </CardFooter>
      )}
    </>
  )

  if (noCard) {
    return (
      <div className={cn("flex flex-col", className)}>
        {content}
      </div>
    )
  }

  return (
    <Card className={cn("overflow-hidden flex flex-col", className)}>
      {content}
    </Card>
  )
}

function TableSkeleton({ columns, rows }: { columns: number, rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent border-b">
          {Array.from({ length: columns }).map((_, idx) => (
            <TableCell key={idx} className="p-4">
              <Skeleton className="h-5 w-full rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export const DataTable = React.memo(DataTableInner) as typeof DataTableInner;



