import * as React from "react"
import { Loader2, Camera, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { Button } from "@/components/ui/Button"
import { useAvatarUpload } from "@/lib/hooks/use-avatar-upload"

interface AvatarUploadProps {
    value?: string | null
    onChange?: (url: string | null) => void
    className?: string
    fallback?: string
    size?: "sm" | "md" | "lg" | "xl" | "2xl"
    disabled?: boolean
}

const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-24 w-24",
    xl: "h-32 w-32",
    "2xl": "h-40 w-40"
}

export function AvatarUpload({
    value,
    onChange,
    className,
    fallback = "U",
    size = "xl",
    disabled = false
}: AvatarUploadProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = React.useState(false)

    const { upload, isUploading } = useAvatarUpload({
        onSuccess: (url) => onChange?.(url),
        // Max size could be passed as prop if needed
    })

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        if (!disabled) setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (disabled || isUploading) return

        const file = e.dataTransfer.files?.[0]
        if (file) {
            await handleUpload(file)
        }
    }

    const handleUpload = async (file: File) => {
        const url = await upload(file)
        if (url && fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && !disabled) {
            await handleUpload(file)
        }
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault() // Prevent triggering the upload click
        onChange?.(null)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!disabled && !isUploading) {
                fileInputRef.current?.click()
            }
        }
    }

    const handleClick = () => {
        if (!disabled && !isUploading) {
            fileInputRef.current?.click()
        }
    }

    return (
        <div
            className={cn(
                "relative group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                disabled && "opacity-50 cursor-not-allowed",
                !disabled && "cursor-pointer",
                className
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label="Upload avatar"
            aria-disabled={disabled}
        >
            <Avatar
                className={cn(
                    sizeClasses[size],
                    "border-4 border-background shadow-xl transition-all duration-300",
                    isDragging ? "scale-[0.98] ring-4 ring-primary/40 sepia-[.3]" : "group-hover:ring-4 group-hover:ring-primary/10",
                    isUploading && "opacity-50 grayscale"
                )}
            >
                <AvatarImage src={value || ""} className="object-cover" />
                <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xl select-none">
                    {fallback.toUpperCase().slice(0, 2)}
                </AvatarFallback>
            </Avatar>

            {/* Loading Overlay */}
            {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full z-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            )}

            {/* Hover/Drag Overlay */}
            {!isUploading && !disabled && (
                <div
                    className={cn(
                        "absolute inset-0 flex items-center justify-center bg-black/40 text-white transition-opacity duration-200 rounded-full z-10 backdrop-blur-[1px]",
                        isDragging ? "opacity-100 bg-black/60" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                    )}
                >
                    <Camera className="w-6 h-6" />
                </div>
            )}

            {/* Delete Button */}
            {value && !disabled && !isUploading && (
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all scale-75 group-hover:scale-100 z-20 hover:scale-110"
                    onClick={handleDelete}
                    title="Remove avatar"
                >
                    <X className="w-4 h-4" />
                </Button>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={disabled || isUploading}
                tabIndex={-1} // Input is hidden, focus is on the container
            />
        </div>
    )
}
