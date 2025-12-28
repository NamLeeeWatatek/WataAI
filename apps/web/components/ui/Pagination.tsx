'use client'

import * as React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "./Button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select"

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  hasNextPage: boolean
  totalPages: number
}

export interface PaginationProps {
  pagination: PaginationInfo
  pageSizeOptions?: number[]
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  className?: string
}

const PaginationRoot = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
PaginationRoot.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
  size?: "default" | "sm" | "icon"
} & React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export function Pagination({
  pagination,
  pageSizeOptions = [5, 10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  className
}: PaginationProps) {
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      onPageChange?.(page)
    }
  }

  const handlePageSizeChange = (pageSize: number) => {
    onPageSizeChange?.(pageSize)
  }

  if (pagination.total === 0) {
    return null
  }

  const generatePages = () => {
    const pages = []
    const totalPages = pagination.totalPages
    const currentPage = pagination.page

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }
    return pages
  }

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 py-2", className)}>
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
          <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
          <span className="font-medium text-foreground">{pagination.total}</span> results
        </p>
        {pageSizeOptions.length > 1 && (
          <>
            <span className="text-sm text-muted-foreground">•</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Rows:</span>
              <Select
                value={String(pagination.limit)}
                onValueChange={(value) => handlePageSizeChange(Number(value))}
              >
                <SelectTrigger className="w-[70px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <PaginationRoot className="mx-0 w-auto">
        <PaginationContent>
          {/* First Page */}
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </PaginationItem>

          {/* Previous Page */}
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </PaginationItem>

          {/* Page Numbers */}
          {generatePages().map((page, index) => (
            <PaginationItem key={index}>
              {page === 'ellipsis' ? (
                <PaginationEllipsis className="h-8 w-8" />
              ) : (
                <Button
                  variant={pagination.page === page ? "outline" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    pagination.page === page && "border-primary text-primary hover:bg-primary/5 shadow-sm"
                  )}
                  onClick={() => handlePageChange(page as number)}
                >
                  {page}
                </Button>
              )}
            </PaginationItem>
          ))}

          {/* Next Page */}
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>

          {/* Last Page */}
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </PaginationRoot>
    </div>
  )
}
