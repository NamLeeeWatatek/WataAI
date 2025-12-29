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
                maxSize={field.max ? field.max * 1024 * 1024 : undefined}
                height="h-40"
                className={filesToShow.length > 0 && !field.multiple ? "hidden" : ""}
            />

            {filesToShow.length > 0 && (
                <div className="space-y-6">
                    {filesToShow.map((item: any, idx: number) => {
                        const fileObj = typeof item === 'object' && item.url ? item : { url: item, fileId: null, fileKey: null }
                        const isImage = isImageUrl(fileObj.url)
                        const isVideo = isVideoUrl(fileObj.url)
                        const isMedia = isImage || isVideo

                        // Professional Aspect-Ratio Controlled Card
                        if (!field.multiple && isMedia) {
                            return (
                                <div key={idx} className="relative group rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-xl transition-all duration-500">
                                    <ImagePreview src={fileObj.url}>
                                        <div className="relative w-full aspect-video bg-muted/20 cursor-zoom-in overflow-hidden">
                                            {/* Studio Quality Media - Natural No-Crop Display */}
                                            <Media
                                                src={fileObj.url}
                                                alt={fileObj.name || `File ${idx}`}
                                                fill
                                                ambient
                                                objectFit="contain"
                                                muted
                                                playsInline
                                                autoPlayOnHover
                                                showPlayIcon={isVideo}
                                            />

                                            {/* Action UI */}
                                            <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full shadow-lg border border-white/20"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFileDelete(fileObj.fileId, idx);
                                                    }}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </ImagePreview>

                                    <div className="px-4 py-3 flex items-center justify-between bg-card">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold truncate">
                                                {fileObj.name || 'Original Media'}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-50">
                                                Studio Quality • Non-Cropped
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        // Compact Item Style for List
                        return (
                            <div
                                key={idx}
                                className="group relative flex items-center gap-4 p-2.5 rounded-xl border border-border/60 bg-card hover:border-primary/30 transition-all"
                            >
                                <ImagePreview src={fileObj.url}>
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black/5 shrink-0 cursor-zoom-in">
                                        <Media
                                            src={fileObj.url}
                                            fill
                                            className="object-contain"
                                            containerClassName="h-full w-full"
                                            muted
                                            playsInline
                                            autoPlayOnHover
                                            showPlayIcon={false}
                                        />
                                    </div>
                                </ImagePreview>

                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold truncate">
                                        {fileObj.name || 'Media Asset'}
                                    </p>
                                    <span className="text-[9px] text-primary font-black uppercase tracking-tighter opacity-80">
                                        Verified
                                    </span>
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                    onClick={() => handleFileDelete(fileObj.fileId, idx)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
