'use client'

import * as React from 'react'
import {
  ChevronDown,
  ChevronRight,
  SortAsc,
  SortDesc
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Pagination, type PaginationInfo } from "./Pagination"
import { Search as SearchInput } from "./Search"
import { LoadingLogo } from "./LoadingLogo"
import { Checkbox } from "./Checkbox"

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table"

// Types for DataTable
export type SortDirection = 'asc' | 'desc' | null

export interface Column<T = any> {
  key: string
  label: React.ReactNode
  sortable?: boolean
  searchable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  width?: string | number
  className?: string
}


export interface DataTableProps<T = any> {
  // Data from Redux
  data: T[]
  loading?: boolean
  error?: string | null

  // Columns
  columns: Column<T>[]

  // Search
  searchable?: boolean
  searchPlaceholder?: string
  searchValue?: string
  onSearch?: (value: string) => void

  // Sorting
  sortable?: boolean
  sortColumn?: string
  sortDirection?: SortDirection
  onSort?: (column: string, direction: SortDirection) => void

  // Pagination
  pagination?: PaginationInfo
  pageSizeOptions?: number[]
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void

  // Tree Mode
  isTree?: boolean
  childrenKey?: string
  treeColumnKey?: string
  defaultExpanded?: string[]
  indentSize?: number

  // Actions
  actions?: React.ReactNode
  onRowClick?: (row: T) => void
  onRowDragStart?: (e: React.DragEvent, row: T) => void
  onRowDragOver?: (e: React.DragEvent, row: T) => void
  onRowDrop?: (e: React.DragEvent, row: T) => void

  // Empty state
  emptyMessage?: string
  emptyComponent?: React.ReactNode

  // Selection
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void

  // Styling
  className?: string
  tableClassName?: string
  compact?: boolean

  // Expand logic
  onRowExpand?: (row: T) => Promise<void> | void
  getRowCanExpand?: (row: T) => boolean
}

export function DataTable<T = any>({
  data,
  loading = false,
  error = null,

  columns,
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
  defaultExpanded = [],
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
  compact = false
}: DataTableProps<T>) {
  const [localSearchValue, setLocalSearchValue] = React.useState(searchValue)
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set(defaultExpanded))

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return
    const currentPageIds = data.map((row: any) => row.id).filter(Boolean) as string[]

    if (checked) {
      // Add all current page IDs that are not already selected
      const newSelectedIds = [...new Set([...selectedIds, ...currentPageIds])]
      onSelectionChange(newSelectedIds)
    } else {
      // Remove all current page IDs from selection
      const newSelectedIds = selectedIds.filter(id => !currentPageIds.includes(id))
      onSelectionChange(newSelectedIds)
    }
  }

  const handleSelectRow = (id: string) => {
    if (!onSelectionChange) return

    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(idx => idx !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const isAllPageSelected = React.useMemo(() => {
    if (data.length === 0) return false
    const currentPageIds = data.map((row: any) => row.id).filter(Boolean) as string[]
    return currentPageIds.every(id => selectedIds.includes(id))
  }, [data, selectedIds])

  const isSomePageSelected = React.useMemo(() => {
    const currentPageIds = data.map((row: any) => row.id).filter(Boolean) as string[]
    return currentPageIds.some(id => selectedIds.includes(id)) && !isAllPageSelected
  }, [data, selectedIds, isAllPageSelected])

  // Sync local search with prop
  React.useEffect(() => {
    setLocalSearchValue(searchValue)
  }, [searchValue])

  const handleSearchChange = (value: string) => {
    setLocalSearchValue(value)
    onSearch?.(value)
  }

  const toggleExpand = (e: React.MouseEvent, id: string, row: T) => {
    e.stopPropagation()
    const isExpanding = !expandedRows.has(id)

    if (isExpanding && onRowExpand) {
      onRowExpand(row)
    }

    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSort = (key: string, columnSortable: boolean) => {
    if (!sortable || !columnSortable) return

    let newDirection: SortDirection = 'asc'
    if (sortColumn === key) {
      if (sortDirection === 'asc') {
        newDirection = 'desc'
      } else if (sortDirection === 'desc') {
        newDirection = null
      }
    }

    onSort?.(key, newDirection)
  }

  const getSortIcon = (key: string) => {
    if (sortColumn !== key || !sortDirection) {
      return <SortAsc className="h-4 w-4 opacity-20" />
    }
    return sortDirection === 'asc' ? (
      <SortAsc className="h-4 w-4" />
    ) : (
      <SortDesc className="h-4 w-4" />
    )
  }

  const handlePageChange = (page: number) => {
    if (pagination && page >= 1 && page <= pagination.totalPages) {
      onPageChange?.(page)
    }
  }

  const handlePageSizeChange = (pageSize: number) => {
    onPageSizeChange?.(pageSize)
  }

  const renderRows = (nodes: T[], level = 0): React.ReactNode[] => {
    return nodes.flatMap((row, index) => {
      const id = (row as any).id || (row as any).key || index.toString()
      const children = (row as any)[childrenKey]

      const isExpanded = expandedRows.has(id)
      const canExpand = getRowCanExpand ? getRowCanExpand(row) : (children && Array.isArray(children) && children.length > 0)
      const hasChildren = canExpand

      const tableRow = (
        <TableRow
          key={id}
          className={cn(
            onRowClick && "cursor-pointer",
            selectedIds.includes(id) && "bg-primary/5 hover:bg-primary/10"
          )}
          onClick={() => onRowClick?.(row)}
          draggable={!!onRowDragStart}
          onDragStart={(e) => onRowDragStart?.(e, row)}
          onDragOver={(e) => onRowDragOver?.(e, row)}
          onDrop={(e) => onRowDrop?.(e, row)}
        >
          {columns.map((column, colIdx) => {
            const isSelection = column.key === 'selection'
            const isTreeColumn = isTree && (column.key === treeColumnKey || (!treeColumnKey && colIdx === 0))

            return (
              <TableCell
                key={column.key}
                className={cn(
                  "h-12",
                  !isSelection && "p-4",
                  isSelection && "p-0 w-12 text-center",
                  column.className
                )}
              >
                <div className={cn(
                  "flex items-center h-full",
                  isSelection && "justify-center"
                )}>
                  {isTreeColumn && (
                    <>
                      <div style={{ width: `${level * indentSize}px` }} className="flex-shrink-0" />
                      {hasChildren ? (
                        <button
                          onClick={(e) => toggleExpand(e, id, row)}
                          className="mr-2 h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground/60 hover:text-foreground"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      ) : (
                        <div className="w-9 flex-shrink-0" />
                      )}
                    </>
                  )}
                  <div className={cn(isSelection && "flex items-center justify-center w-full")}>
                    {(isSelection && !column.render) ? (
                      <Checkbox
                        checked={selectedIds.includes(id)}
                        onCheckedChange={() => handleSelectRow(id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : column.render
                      ? column.render((row as any)[column.key], row)
                      : (row as any)[column.key]
                    }
                  </div>
                </div>
              </TableCell>
            )
          })}
        </TableRow>
      )

      if (isTree && hasChildren && isExpanded && children) {
        return [tableRow, ...renderRows(children, level + 1)]
      }

      return [tableRow]
    })
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with search and actions */}
      {(searchable || actions) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <SearchInput
                placeholder={searchPlaceholder}
                value={localSearchValue}
                onChange={(e: any) => handleSearchChange(e.target.value)}
                onClear={() => handleSearchChange('')}
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Table */}
      <div className={cn("rounded-lg border bg-card shadow-sm overflow-hidden", tableClassName)}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "h-12",
                    column.key !== 'selection' && "px-4",
                    (sortable && column.sortable !== false) && "cursor-pointer hover:bg-muted/50 transition-colors",
                    column.width ? `w-[${typeof column.width === 'number' ? column.width + 'px' : column.width}]` : (column.key === 'selection' ? "w-12" : ""),
                    column.className
                  )}
                  onClick={() => handleSort(column.key, column.sortable !== false)}
                >
                  {(column.key === 'selection' && !column.label) ? (
                    <div className="flex justify-center items-center h-full w-full">
                      <Checkbox
                        checked={isAllPageSelected || (isSomePageSelected ? "indeterminate" : false)}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {column.label}
                      {(sortable && column.sortable !== false) && getSortIcon(column.key)}
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center bg-transparent border-0">
                  <LoadingLogo size="sm" text="Loading data" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : (!data || data.length === 0) ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyComponent || emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              renderRows(data)
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <Pagination
          pagination={pagination}
          pageSizeOptions={pageSizeOptions}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          className="mt-4"
        />
      )}
    </div>
  )
}


