'use client'

import * as React from "react"
import NextImage, { ImageProps as NextImageProps } from "next/image"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/Skeleton"

interface ImageProps extends Omit<NextImageProps, 'onLoadingComplete'> {
    containerClassName?: string
    fallbackSrc?: string
}

const DEFAULT_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";

export function Image({
    src,
    alt,
    className,
    containerClassName,
    fallbackSrc,
    ...props
}: ImageProps) {
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState(false)

    return (
        <div className={cn("relative overflow-hidden", containerClassName)}>
            {isLoading && (
                <Skeleton className="absolute inset-0 z-10 w-full h-full" />
            )}

            <NextImage
                src={error ? (fallbackSrc || DEFAULT_FALLBACK) : src}
                alt={alt || ""}
                className={cn(
                    "transition-all duration-500",
                    isLoading ? "scale-105 blur-lg" : "scale-100 blur-0",
                    className
                )}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setError(true)
                    setIsLoading(false)
                }}
                {...props}
            />
        </div>
    )
}
