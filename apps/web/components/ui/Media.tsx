'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Image } from "./Image"
import { Video } from "./Video"
import { FileText } from "lucide-react"
import { getMediaType } from "@/lib/utils/media"

interface MediaProps {
    src: string | null | undefined
    alt?: string
    className?: string
    containerClassName?: string
    priority?: boolean
    unoptimized?: boolean
    controls?: boolean
    autoPlay?: boolean
    loop?: boolean
    muted?: boolean
    playsInline?: boolean
    showPlayIcon?: boolean
    autoPlayOnHover?: boolean
    fallbackIcon?: React.ReactNode
    fill?: boolean
    width?: number
    height?: number
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
    onError?: () => void
}

export function Media({
    src,
    alt,
    className,
    containerClassName,
    priority,
    unoptimized = true,
    controls,
    autoPlay,
    loop,
    muted,
    playsInline,
    showPlayIcon,
    autoPlayOnHover,
    fallbackIcon,
    fill,
    width = 1920,
    height = 1080,
    objectFit = 'contain',
    ...props
}: MediaProps) {
    if (!src) {
        return (
            <div className={cn("flex flex-col items-center justify-center bg-muted/30 rounded-xl border border-dashed border-primary/20 p-4", containerClassName)}>
                {fallbackIcon || <FileText className="w-8 h-8 text-muted-foreground opacity-20" />}
            </div>
        )
    }

    const type = getMediaType(src)

    if (type === 'video') {
        return (
            <Video
                src={src}
                className={cn(
                    objectFit === 'cover' ? "object-cover" : "object-contain",
                    fill ? "absolute inset-0 w-full h-full" : "",
                    className
                )}
                containerClassName={cn(fill ? "absolute inset-0 w-full h-full" : "", containerClassName)}
                controls={controls}
                autoPlay={autoPlay}
                loop={loop}
                muted={muted}
                playsInline={playsInline}
                showPlayIcon={showPlayIcon}
                autoPlayOnHover={autoPlayOnHover}
                {...(props as any)}
            />
        )
    }

    if (type === 'image') {
        return (
            <Image
                src={src}
                alt={alt || "Media content"}
                className={cn(
                    objectFit === 'cover' ? "object-cover" : "object-contain",
                    className
                )}
                containerClassName={cn(fill ? "absolute inset-0 w-full h-full" : "", containerClassName)}
                priority={priority}
                unoptimized={unoptimized}
                width={!fill ? width : undefined}
                height={!fill ? height : undefined}
                fill={fill}
                {...(props as any)}
            />
        )
    }

    // Default fallback for unknown file types
    return (
        <div className={cn("flex flex-col items-center justify-center bg-muted/50 rounded-xl border border-primary/10", containerClassName)}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center shrink-0 border border-primary/10 shadow-inner">
                {fallbackIcon || <FileText className="w-6 h-6 text-primary" />}
            </div>
            {alt && <span className="text-[10px] text-muted-foreground mt-2 font-medium truncate max-w-full px-2">{alt}</span>}
        </div>
    )
}
