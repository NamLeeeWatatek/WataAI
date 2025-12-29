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
    ambient?: boolean
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
    ambient,
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

    const renderMedia = (isBackground: boolean = false) => {
        const commonProps = {
            src,
            className: cn(
                isBackground ? "object-cover blur-xl opacity-40 scale-110" : (objectFit === 'cover' ? "object-cover" : "object-contain"),
                fill ? "absolute inset-0 w-full h-full" : "",
                !isBackground && className
            ),
            containerClassName: cn(fill ? "absolute inset-0 w-full h-full" : "", !isBackground && containerClassName),
            ...props
        }

        if (type === 'video') {
            return (
                <Video
                    {...commonProps}
                    controls={!isBackground && controls}
                    autoPlay={isBackground || autoPlay}
                    loop={isBackground || loop}
                    muted={isBackground || muted}
                    playsInline={isBackground || playsInline}
                    showPlayIcon={!isBackground && showPlayIcon}
                    autoPlayOnHover={!isBackground && autoPlayOnHover}
                />
            )
        }

        return (
            <Image
                {...commonProps}
                alt={isBackground ? "" : (alt || "Media content")}
                priority={!isBackground && priority}
                unoptimized={unoptimized}
                width={!fill ? width : undefined}
                height={!fill ? height : undefined}
                fill={fill}
            />
        )
    }

    if (ambient && objectFit === 'contain' && fill) {
        return (
            <div className={cn("relative overflow-hidden w-full h-full", containerClassName)}>
                {/* 1. Background Ambient Layer */}
                {renderMedia(true)}

                {/* Subtle overlay to soften the background */}
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />

                {/* 2. Main Media Layer */}
                <div className="absolute inset-0 flex items-center justify-center p-0.5">
                    {renderMedia(false)}
                </div>
            </div>
        )
    }

    return renderMedia(false)
}
