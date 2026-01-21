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

  // Icon dimensions - Increased sizes
  const iconSizes = {
    xs: 32,
    sm: 48,
    md: 64,
    lg: 96,
    xl: 128
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-6", className)}>
      <div className="relative flex items-center justify-center">
        {/* Simple Glow Effect */}
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse-slow" />

        <img
          src="/images/logo.svg"
          alt="Wata AI"
          className="relative z-10 object-contain drop-shadow-2xl animate-in fade-in zoom-in duration-700"
          style={{
            width: iconSizes[size] * 3, // Make it significantly wider since it's a full logo
            height: iconSizes[size]
          }}
        />
      </div>

      {text && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-widest uppercase">
          {text}
        </p>
      )}
    </div>
  )
}
