
import React from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

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
      className
    )}>
      {icon && (
        <div className="flex justify-center mb-6">
          <div className={cn(
            'text-muted-foreground/60',
            'transition-all duration-300 hover:scale-110 hover:text-muted-foreground/80'
          )}>
            {icon}
          </div>
        </div>
      )}

      <h3 className={cn(
        'text-xl font-semibold mb-3 text-foreground/90'
      )}>
        {title}
      </h3>

      {description && (
        <p className={cn(
          'text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed'
        )}>
          {description}
        </p>
      )}

      {action && (
        <div>
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
  title,
  description,
  onCreate,
  createLabel,
  icon
}: {
  title?: string
  description?: string
  onCreate?: () => void
  createLabel?: string
  icon?: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <EmptyState
      icon={icon}
      title={title || t('common.no_data')}
      description={description || t('common.no_data_desc')}
      action={onCreate ? {
        label: createLabel || t('common.create_new'),
        onClick: onCreate,
        variant: 'default'
      } : undefined}
    />
  )
}

export function NoResultsEmptyState({
  title,
  description,
  onClear,
  clearLabel,
  icon
}: {
  title?: string
  description?: string
  onClear?: () => void
  clearLabel?: string
  icon?: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <EmptyState
      icon={icon}
      title={title || t('common.no_results')}
      description={description || t('common.no_results_desc')}
      action={onClear ? {
        label: clearLabel || t('common.clear_filters'),
        onClick: onClear,
        variant: 'outline'
      } : undefined}
    />
  )
}

export function ErrorEmptyState({
  title,
  description,
  onRetry,
  retryLabel,
  icon
}: {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  icon?: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <EmptyState
      icon={icon}
      title={title || t('common.error_occurred')}
      description={description || t('common.error_load_failed')}
      action={onRetry ? {
        label: retryLabel || t('common.retry'),
        onClick: onRetry,
        variant: 'outline'
      } : undefined}
    />
  )
}

