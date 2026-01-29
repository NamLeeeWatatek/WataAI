import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  fullPage?: boolean
  noSpinner?: boolean
}

export function LoadingLogo({
  size = 'md',
  text,
  className,
  fullPage = false,
  noSpinner = false,
}: LoadingLogoProps) {
  const iconSizes = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  const logoIcon = (
    <div className="relative flex items-center justify-center">
      {/* Branded Logo Placeholder / Icon */}
      <div className={cn(
        "rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]",
        iconSizes[size]
      )}>
        <div className="w-1/2 h-1/2 rounded-full bg-primary animate-pulse" />
      </div>
      {!noSpinner && (
        <Loader2 className={cn("text-primary animate-spin absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] opacity-50")} />
      )}
    </div>
  )

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-6", className)}>
      {logoIcon}
      {text && (
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 animate-pulse">
          {text}
        </p>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
        {content}
      </div>
    )
  }

  return content
}
