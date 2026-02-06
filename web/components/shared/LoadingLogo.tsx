import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  fullPage?: boolean
}

export function LoadingLogo({
  size = 'md',
  text,
  className,
  fullPage = false,
}: LoadingLogoProps) {
  const iconSizes = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  const spinner = (
    <div className="relative flex items-center justify-center">
      <Loader2 className={cn("text-primary animate-spin", iconSizes[size])} />
    </div>
  )

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      {spinner}
      {text && (
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 animate-pulse">
          {text}
        </p>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return content
}
