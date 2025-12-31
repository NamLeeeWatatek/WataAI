'use client'

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Media } from "@/components/ui/Media"

interface ImagePreviewProps {
    src: string
    alt?: string
    children: React.ReactNode
}

export function ImagePreview({ src, alt, children }: ImagePreviewProps) {
    return (
        <DialogPrimitive.Root>
            <DialogPrimitive.Trigger asChild>
                {children}
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    className={cn(
                        "fixed left-[50%] top-[50%] z-[101] w-full h-full translate-x-[-50%] translate-y-[-50%]",
                        "flex items-center justify-center p-4 sm:p-8 outline-none",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                    )}
                >
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        <Media
                            src={src}
                            alt={alt || "Preview"}
                            fill
                            ambient
                            objectFit="contain"
                            controls
                            autoPlay
                            loop
                            muted={false}
                            playsInline
                            className="transition-transform duration-700 hover:scale-[1.01]"
                        />

                        {/* Top Right Controls */}
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                            <DialogPrimitive.Close className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-90">
                                <X className="w-6 h-6" />
                                <span className="sr-only">Close</span>
                            </DialogPrimitive.Close>
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
