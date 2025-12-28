
import React from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive'
  }
  className?: string
}

/**
 * Empty state component with premium design
 * Use for displaying no data, no results, or error states
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <Card className={cn(
      'p-12 text-center border-dashed',
      'bg-gradient-to-br from-card/50 to-card/30',
      'animate-in fade-in-50 zoom-in-95 duration-500',
      className
    )}>
      {icon && (
        <div className="flex justify-center mb-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-150">
          <div className={cn(
            'text-muted-foreground/60',
            'transition-all duration-300 hover:scale-110 hover:text-muted-foreground/80'
          )}>
            {icon}
          </div>
        </div>
      )}

      <h3 className={cn(
        'text-xl font-semibold mb-3 text-foreground/90',
        'animate-in fade-in-50 slide-in-from-bottom-3 duration-700 delay-300'
      )}>
        {title}
      </h3>

      {description && (
        <p className={cn(
          'text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed',
          'animate-in fade-in-50 slide-in-from-bottom-2 duration-700 delay-500'
        )}>
          {description}
        </p>
      )}

      {action && (
        <div className="animate-in fade-in-50 slide-in-from-bottom-1 duration-700 delay-700">
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            {action.label}
          </Button>
        </div>
      )}
    </Card>
  )
}

// Specialized empty states for common use cases

export function NoDataEmptyState({
  title = "Không có dữ liệu",
  description = "Chưa có dữ liệu nào được tạo.",
  onCreate,
  createLabel = "Tạo mới",
  icon
}: {
  title?: string
  description?: string
  onCreate?: () => void
  createLabel?: string
  icon?: React.ReactNode
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={onCreate ? {
        label: createLabel,
        onClick: onCreate,
        variant: 'default'
      } : undefined}
    />
  )
}

export function NoResultsEmptyState({
  title = "Không tìm thấy kết quả",
  description = "Không có kết quả nào phù hợp với tìm kiếm của bạn.",
  onClear,
  clearLabel = "Xóa bộ lọc",
  icon
}: {
  title?: string
  description?: string
  onClear?: () => void
  clearLabel?: string
  icon?: React.ReactNode
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={onClear ? {
        label: clearLabel,
        onClick: onClear,
        variant: 'outline'
      } : undefined}
    />
  )
}

export function ErrorEmptyState({
  title = "Đã xảy ra lỗi",
  description = "Không thể tải dữ liệu. Vui lòng thử lại.",
  onRetry,
  retryLabel = "Thử lại",
  icon
}: {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  icon?: React.ReactNode
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={onRetry ? {
        label: retryLabel,
        onClick: onRetry,
        variant: 'outline'
      } : undefined}
    />
  )
}

