import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
}

export function LoadingLogo({
  size = 'md',
  text,
  className,
}: LoadingLogoProps) {
  const iconSizes = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <Loader2 className={cn("text-primary animate-spin", iconSizes[size])} />
      {text && (
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}
