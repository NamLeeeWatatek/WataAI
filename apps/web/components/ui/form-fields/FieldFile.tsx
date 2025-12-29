import { DynamicFormFieldProps } from "./types"
import { FileDropzone } from "../FileUpload"
import { Button } from "../Button"
import { X, Eye } from "lucide-react"
import { Media } from "../Media"
import { ImagePreview } from "../FilePreview"
import { isImageUrl, isVideoUrl } from "@/lib/utils/media"
import axiosClient from "@/lib/axios-client"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function FieldFile({ field, value, onChange }: DynamicFormFieldProps) {
    // value can be a single file object, array of file objects, or null
    // Standardize to array for consistent rendering
    const filesToShow = Array.isArray(value) ? value : (value ? [value] : [])
    const [previewFiles, setPreviewFiles] = useState<any[]>([])

    const handleUploadComplete = (fileUrl: string, fileData: any) => {
        const newFile = {
            url: fileUrl,
            fileId: fileData.id,
            fileKey: fileData.path,
            name: fileData.name || fileData.path.split('/').pop()
        }

        if (field.multiple || field.type === 'files') {
            const currentFiles = Array.isArray(value) ? value : (value ? [value] : [])
            onChange(field.name, [...currentFiles, newFile])
        } else {
            onChange(field.name, newFile)
        }
    }

    const handleFileDelete = async (fileId: string, idx: number) => {
        if (fileId) {
            try {
                await axiosClient.delete(`/files/${fileId}`)
            } catch (error) {
                console.error('Delete error:', error)
            }
        }

        if (field.multiple || field.type === 'files') {
            const currentFiles = Array.isArray(value) ? value : (value ? [value] : [])
            const newFiles = currentFiles.filter((_: any, i: number) => i !== idx)
            onChange(field.name, newFiles.length > 0 ? newFiles : null)
        } else {
            onChange(field.name, null)
        }
    }

    return (
        <div className="space-y-4">
            <FileDropzone
                onUploadComplete={handleUploadComplete}
                accept={field.accept}
                maxSize={field.max ? field.max * 1024 * 1024 : undefined} // field.max is often in MB or similar in schema? Default to 100MB if undefined
                bucket="images" // Default specific bucket or auto-detect
                height="h-36"
                className={filesToShow.length > 0 && !field.multiple ? "hidden" : ""} // Hide uploader if single file mode and file exists
            />

            {filesToShow.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                    {filesToShow.map((item: any, idx: number) => {
                        const fileObj = typeof item === 'object' && item.url ? item : { url: item, fileId: null, fileKey: null }
                        const isImage = isImageUrl(fileObj.url)
                        const isVideo = isVideoUrl(fileObj.url)

                        return (
                            <div
                                key={idx}
                                className="group relative flex items-center gap-4 p-4 rounded-2xl bg-card/40 border border-primary/10 backdrop-blur-md hover:bg-card/60 hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 overflow-hidden"
                            >
                                <Media
                                    src={fileObj.url}
                                    alt={fileObj.name || `File ${idx}`}
                                    containerClassName="w-16 h-16 rounded-xl overflow-hidden border border-primary/20 bg-muted/50 shrink-0 shadow-inner"
                                    className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110"
                                    muted
                                    playsInline
                                    autoPlayOnHover
                                    showPlayIcon
                                />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-black truncate pr-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 tracking-tight">
                                            {fileObj.name || (typeof fileObj.url === 'string' ? fileObj.url.split('/').pop()?.split('?')[0] : 'File Ready')}
                                        </span>
                                        <div className="flex gap-1 shrink-0">
                                            {(isImage || isVideo) && (
                                                <ImagePreview src={fileObj.url}>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </ImagePreview>
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                                                onClick={() => handleFileDelete(fileObj.fileId, idx)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-black text-primary uppercase tracking-tighter">
                                            {isImage ? 'Image' : isVideo ? 'Video' : 'File'}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-bold italic opacity-70">
                                            System verified • Ready to sync
                                        </span>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 h-0.5 w-full bg-primary/10">
                                    <div className="h-full w-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-30" />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
