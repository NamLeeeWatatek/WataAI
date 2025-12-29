'use client'

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"

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
                    <div className="relative w-full h-full flex items-center justify-center group">
                        {/* Image Container */}
                        <div className="relative max-w-full max-h-full transition-transform duration-500 ease-out group-hover:scale-[1.01]">
                            <img
                                src={src}
                                alt={alt || "Preview"}
                                className="max-w-[95vw] max-h-[90vh] w-auto h-auto object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
                            />

                            {/* Floating labels / Metadata if needed can go here */}
                        </div>

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
