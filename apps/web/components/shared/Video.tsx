'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/Skeleton"
import { Play } from "lucide-react"

interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
    containerClassName?: string
    showPlayIcon?: boolean
    autoPlayOnHover?: boolean
}

export function Video({
    src,
    className,
    containerClassName,
    showPlayIcon = false,
    autoPlayOnHover = false,
    ...props
}: VideoProps) {
    const [isLoading, setIsLoading] = React.useState(true)
    const [isHovered, setIsHovered] = React.useState(false)
    const videoRef = React.useRef<HTMLVideoElement>(null)

    const handleMouseEnter = () => {
        setIsHovered(true)
        if (autoPlayOnHover && videoRef.current) {
            videoRef.current.play().catch(err => console.debug("Autoplay blocked", err))
        }
    }

    const handleMouseLeave = () => {
        setIsHovered(false)
        if (autoPlayOnHover && videoRef.current) {
            videoRef.current.pause()
            videoRef.current.currentTime = 0
        }
    }

    return (
        <div
            className={cn("relative overflow-hidden group/video", containerClassName)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {isLoading && (
                <Skeleton className="absolute inset-0 z-10 w-full h-full" />
            )}

            <video
                ref={videoRef}
                src={src}
                className={cn(
                    "transition-all duration-500",
                    isLoading ? "scale-105 blur-lg opacity-0" : "scale-100 blur-0 opacity-100",
                    className
                )}
                onLoadedData={() => setIsLoading(false)}
                {...props}
            />

            {showPlayIcon && !isHovered && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                </div>
            )}
        </div>
    )
}
