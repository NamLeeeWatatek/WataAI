import * as React from "react"
import { Loader2, Camera, User, Pencil, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { Button } from "@/components/ui/Button"
import { toast } from "sonner"
import { fileUploadService } from "@/lib/api/files"

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
    const [uploading, setUploading] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || disabled) return

        // Validate
        const validation = fileUploadService.validateFile(file, { maxSize: 5 * 1024 * 1024 }) // 5MB
        if (!validation.valid) {
            toast.error(validation.error)
            return
        }

        try {
            setUploading(true)
            const res = await fileUploadService.uploadFile(file, { bucket: 'avatars' })
            const url = res.downloadSignedUrl || res.uploadSignedUrl || fileUploadService.getFileUrl(res.file.path, 'avatars')
            onChange?.(url)
            toast.success("Avatar updated")
        } catch (error) {
            console.error("Avatar upload failed", error)
            toast.error("Failed to upload avatar")
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange?.(null)
    }

    return (
        <div className={cn("relative group", className)}>
            <Avatar className={cn(sizeClasses[size], "border-4 border-background shadow-xl ring-1 ring-border/10 transition-all duration-300 group-hover:ring-primary/20", uploading && "opacity-50 grayscale")}>
                <AvatarImage src={value || ""} className="object-cover" />
                <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xl">
                    {fallback.toUpperCase().slice(0, 2)}
                </AvatarFallback>
            </Avatar>

            {/* Loading Overlay */}
            {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full z-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            )}

            {/* Hover Overlay / Actions */}
            {!uploading && !disabled && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full cursor-pointer z-10 backdrop-blur-[1px]"
                >
                    <Camera className="w-6 h-6" />
                </div>
            )}

            {/* Edit/Delete Buttons (Optional, floating outside or replacing overlay) */}
            {/* For now, just a click on the avatar triggers upload. If value exists, we could show a delete button? */}
            {value && !disabled && !uploading && (
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 z-20"
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
                disabled={disabled}
            />
        </div>
    )
}
