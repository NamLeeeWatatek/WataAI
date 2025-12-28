'use client'

import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  showGlow?: boolean
}

export function LoadingLogo({
  size = 'md',
  text,
  className,
}: LoadingLogoProps) {

  // Container dimensions (Square aspect ratio)
  const boxSizes = {
    xs: 'w-10 h-10',
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  }

  // Icon dimensions
  const iconSizes = {
    xs: 'w-5 h-5',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      {/* Magic Border Container */}
      <div className={cn("relative flex items-center justify-center rounded-2xl overflow-hidden", boxSizes[size])}>

        {/* Spinning Gradient Background Layer */}
        <div className="absolute inset-[-50%] flex items-center justify-center">
          <div className="w-[200%] h-[200%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,hsl(var(--primary))_50%,transparent_100%)] opacity-100" />
        </div>

        {/* Inner Mask Layer */}
        <div className="absolute inset-[2px] rounded-[14px] bg-background/90 backdrop-blur-3xl flex items-center justify-center z-10 shadow-inner">
          {/* Subtle Inner Highlight */}
          <div className="absolute inset-0 rounded-[14px] border border-white/5" />

          {/* Brand Icon */}
          <Sparkles className={cn(
            iconSizes[size],
            "text-primary fill-primary/20 animate-pulse"
          )} />
        </div>
      </div>
      {text && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide">
          {text}
        </p>
      )}
    </div>
  )
}
