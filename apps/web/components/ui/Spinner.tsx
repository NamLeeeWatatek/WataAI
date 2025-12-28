'use client'

import { Loader2Icon } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const spinnerVariants = cva(
  'animate-spin',
  {
    variants: {
      size: {
        xs: 'size-3',
        sm: 'size-4',
        md: 'size-6',
        lg: 'size-8',
        xl: 'size-12'
      },
      variant: {
        default: 'text-primary',
        muted: 'text-muted-foreground',
        accent: 'text-accent-foreground',
        destructive: 'text-destructive',
        success: 'text-green-500'
      }
    },
    defaultVariants: {
      size: 'md',
      variant: 'default'
    }
  }
)

export interface SpinnerProps
  extends React.ComponentProps<'svg'>,
  VariantProps<typeof spinnerVariants> { }

/**
 * Spinner component for inline loading indicators
 * Use LoadingLogo for centered page loading states
 */
function Spinner({ className, size, variant, ...props }: SpinnerProps) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn(spinnerVariants({ size, variant }), className)}
      {...props}
    />
  )
}

export { Spinner, spinnerVariants }


