'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, X, Eye, File, Image as ImageIcon, Video, Camera, Loader2, Trash2, ArrowUpFromLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileUpload } from '@/lib/hooks/use-file-upload';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { AspectRatio } from '@/components/ui/AspectRatio';

export type FileUploadVariant = 'default' | 'avatar' | 'cover' | 'zone';

export interface UnifiedFileUploadProps {
    variant?: FileUploadVariant;
    value?: string | string[] | null;
    onChange?: (value: string | string[] | null) => void;
    accept?: string;
    maxFiles?: number;
    maxSize?: number; // bytes
    disabled?: boolean;
    bucket?: 'images' | 'documents' | 'avatars' | 'videos' | 'audios';
    className?: string;
    description?: string;
    preview?: boolean;
}

export function UnifiedFileUpload({
    variant = 'default',
    value,
    onChange,
    accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx',
    maxFiles = 1,
    maxSize = 10 * 1024 * 1024,
    disabled = false,
    bucket = 'images',
    className,
    description,
    preview = true
}: UnifiedFileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    // Normalize value to array for consistent handling (except for avatar/single cover logic where we use the first item if needed, but array makes generic logic easier)
    // However, for single-value props (string | null), we should be careful.
    const currentFiles = Array.isArray(value) ? value : (value ? [value] : []);

    const { uploading, progress, uploadFile } = useFileUpload({
        bucket,
        onSuccess: () => { }
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        await processFiles(files);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const processFiles = async (fileList: FileList) => {
        if (disabled || uploading) return;

        const filesToUpload = Array.from(fileList);
        const newUrls: string[] = [];
        const isSingleMode = maxFiles === 1 || variant === 'avatar' || variant === 'cover';

        if (!isSingleMode && currentFiles.length + filesToUpload.length > maxFiles) {
            console.error("Max files exceeded");
            return;
        }

        for (const file of filesToUpload) {
            if (file.size > maxSize) continue;
            try {
                const result = await uploadFile(file);
                if (result?.fileUrl) newUrls.push(result.fileUrl);
            } catch (err) {
                console.error(`Upload failed for ${file.name}`, err);
            }
        }

        if (newUrls.length > 0) {
            if (isSingleMode) {
                onChange?.(newUrls[0]);
            } else {
                // If previously was single string but now we want to add more? 
                // The prop definition allows string | string[]. 
                // If variant is default/zone, usage implies array.
                onChange?.([...currentFiles, ...newUrls]);
            }
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.length > 0) {
            await processFiles(e.dataTransfer.files);
        }
    };

    const handleRemove = (urlToRemove: string) => {
        if (Array.isArray(value)) {
            onChange?.(value.filter(url => url !== urlToRemove));
        } else {
            onChange?.(null);
        }
    };

    // --- Variant: Avatar ---
    if (variant === 'avatar') {
        const avatarUrl = typeof value === 'string' ? value : null;
        return (
            <div
                className={cn(
                    "relative group h-32 w-32 rounded-full cursor-pointer transition-all",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
                onClick={() => !disabled && fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <Avatar className={cn(
                    "h-full w-full border-2 border-dashed border-muted-foreground/20 group-hover:border-primary/50 transition-all",
                    dragActive && "border-primary ring-2 ring-primary/20 bg-primary/5"
                )}>
                    {avatarUrl ? (
                        <div className="relative w-full h-full">
                            <Image
                                src={avatarUrl}
                                alt="Avatar"
                                fill
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <AvatarFallback className="bg-muted/10 text-muted-foreground">
                            {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Camera className="w-8 h-8" />}
                        </AvatarFallback>
                    )}
                </Avatar>

                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                    <Camera className="w-6 h-6" />
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={disabled}
                />
            </div>
        );
    }

    // --- Variant: Cover ---
    if (variant === 'cover') {
        const coverUrl = typeof value === 'string' ? value : null;
        return (
            <div
                className={cn(
                    "relative w-full overflow-hidden rounded-lg border border-border bg-muted/5 transition-all group",
                    "hover:bg-muted/10",
                    dragActive && "border-primary ring-1 ring-primary/20 bg-primary/5",
                    className
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {coverUrl ? (
                    <AspectRatio ratio={21 / 9}>
                        <div className="relative w-full h-full">
                            {coverUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                <video src={coverUrl} className="w-full h-full object-cover" controls />
                            ) : (
                                <Image
                                    src={coverUrl}
                                    alt="Cover"
                                    fill
                                    className="object-cover"
                                />
                            )}

                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 text-xs backdrop-blur-md bg-background/80 hover:bg-background"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Change
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => { e.stopPropagation(); handleRemove(coverUrl); }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </AspectRatio>
                ) : (
                    <div
                        className="flex flex-col items-center justify-center aspect-[21/9] cursor-pointer"
                        onClick={() => !disabled && fileInputRef.current?.click()}
                    >
                        {uploading ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <span className="text-xs text-muted-foreground">Uploading... {progress}%</span>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 p-3 rounded-full bg-background border shadow-sm group-hover:scale-110 transition-transform">
                                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-sm font-medium text-foreground">Click to upload cover</p>
                                    <p className="text-xs text-muted-foreground">{description || "SVG, PNG, JPG or GIF (max 10MB)"}</p>
                                </div>
                            </>
                        )}
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={disabled}
                />
            </div>
        );
    }

    // --- Variant: Default / Zone (Multi-file) ---
    return (
        <div className={cn("space-y-4", className)}>
            {/* Dropzone Area */}
            {(!maxFiles || currentFiles.length < maxFiles) && (
                <div
                    className={cn(
                        "relative flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed border-muted-foreground/10 bg-muted/5 transition-all text-center px-8 py-16 cursor-pointer",
                        "hover:border-primary/40 hover:bg-primary/[0.02] hover:shadow-inner",
                        dragActive && "border-primary bg-primary/5 ring-4 ring-primary/5",
                        disabled && "opacity-50 cursor-not-allowed",
                        uploading && "pointer-events-none opacity-80"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !uploading && !disabled && fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={accept}
                        multiple={maxFiles > 1}
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={disabled}
                    />

                    {uploading ? (
                        <div className="w-full max-w-sm space-y-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-[10px] font-bold">{progress}%</span>
                                    </div>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Uploading Assets...</span>
                            </div>
                            <Progress value={progress} className="h-1 bg-primary/10" />
                        </div>
                    ) : (
                        <div className="space-y-5 group/upload">
                            <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-2xl bg-background border border-border shadow-sm group-hover/upload:scale-110 group-hover/upload:border-primary/50 group-hover/upload:shadow-lg transition-all duration-300">
                                <ArrowUpFromLine className="w-6 h-6 text-primary/60 group-hover/upload:text-primary transition-colors" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-foreground">Click or Drag assets to Upload</h4>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted/50 inline-block px-3 py-1 rounded-full">
                                    AI-Driven Context Extraction Enabled
                                </p>
                            </div>
                            <p className="text-[11px] text-muted-foreground/50 font-medium">
                                {description || `Supports any file up to ${Math.round(maxSize / 1024 / 1024)}MB`}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* File List / Previews */}
            {preview && currentFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {currentFiles.map((url, idx) => {
                        const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);
                        const isImage = url.match(/\.(jpeg|jpg|png|gif|webp|svg)$/i);

                        return (
                            <div key={`${url}-${idx}`} className="group relative aspect-square rounded-lg border bg-background overflow-hidden shadow-sm">
                                {isImage ? (
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={url}
                                            alt="Uploaded file"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ) : isVideo ? (
                                    <video src={url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/10 p-4">
                                        <File className="w-8 h-8 text-muted-foreground mb-2" />
                                        <span className="text-xs text-muted-foreground truncate w-full text-center">
                                            {url.split('/').pop()}
                                        </span>
                                    </div>
                                )}

                                {!disabled && (
                                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(url, '_blank');
                                            }}
                                            className="p-1.5 rounded-full bg-background/90 text-foreground shadow-sm hover:bg-primary hover:text-white transition-all"
                                            title="Preview"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemove(url);
                                            }}
                                            className="p-1.5 rounded-full bg-background/90 text-foreground shadow-sm hover:bg-destructive hover:text-white transition-all"
                                            title="Remove"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Named exports for cleaner compatibility if needed, though direct usage is preferred
export const UnifiedAvatarUpload = (props: UnifiedFileUploadProps) => <UnifiedFileUpload variant="avatar" {...props} />;
export const UnifiedCoverUpload = (props: UnifiedFileUploadProps) => <UnifiedFileUpload variant="cover" {...props} />;
