'use client'

import * as React from "react"
import NextImage, { ImageProps as NextImageProps } from "next/image"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/Skeleton"

interface ImageProps extends Omit<NextImageProps, 'onLoadingComplete'> {
    containerClassName?: string
    fallbackSrc?: string
}

export function Image({
    src,
    alt,
    className,
    containerClassName,
    fallbackSrc = "/images/placeholder.svg",
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
                src={error ? fallbackSrc : src}
                alt={alt || "Image"}
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
