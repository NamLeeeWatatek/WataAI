import { useState } from "react"
import { toast } from "sonner"
import { fileUploadService } from "@/lib/api/files"

interface UseAvatarUploadOptions {
    onSuccess?: (url: string) => void
    onError?: (error: Error) => void
    maxSize?: number // in bytes
}

export function useAvatarUpload({
    onSuccess,
    onError,
    maxSize = 2 * 1024 * 1024 // 2MB default for avatars
}: UseAvatarUploadOptions = {}) {
    const [isUploading, setIsUploading] = useState(false)

    const upload = async (file: File) => {
        // Validate
        const validation = fileUploadService.validateFile(file, { maxSize })
        if (!validation.valid) {
            toast.error(validation.error)
            return null
        }

        try {
            setIsUploading(true)
            const res = await fileUploadService.uploadFile(file, { bucket: 'avatars' })
            const url = res.downloadSignedUrl || res.uploadSignedUrl || fileUploadService.getFileUrl(res.file.path, 'avatars')

            toast.success("Avatar updated")
            onSuccess?.(url)
            return url
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Upload failed')
            console.error("Avatar upload failed", err)
            toast.error("Failed to upload avatar")
            onError?.(err)
            return null
        } finally {
            setIsUploading(false)
        }
    }

    return {
        upload,
        isUploading
    }
}
