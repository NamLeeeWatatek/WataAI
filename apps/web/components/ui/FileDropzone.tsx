'use client';

import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Video, Music, FileText } from 'lucide-react';
import { Progress } from './Progress';
import { cn } from '@/lib/utils';
import { useFileUpload } from '@/lib/hooks/use-file-upload';
import { type FileUploadOptions } from '@/lib/api/files';

export interface FileDropzoneProps {
    onUploadComplete?: (url: string, file: any) => void;
    onUploadError?: (error: Error) => void;
    accept?: string;
    maxSize?: number;
    bucket?: FileUploadOptions['bucket'];
    height?: string;
    className?: string;
    compact?: boolean;
}

export function FileDropzone({
    onUploadComplete,
    onUploadError,
    accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx',
    maxSize = 100 * 1024 * 1024,
    bucket,
    height = 'h-64',
    className = '',
    compact = false,
}: FileDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { uploading, progress, uploadFile } = useFileUpload({
        onSuccess: onUploadComplete,
        onError: onUploadError,
        bucket,
    });

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // For now, handling single file upload in dropzone as per previous logic structure implies strictly sequential or single
            // Ideally dropzone handles multiple, but hook is single-file oriented for simplicity in this refactor step.
            // We will loop through if needed, but standardizing on single or sequential.
            // Let's stick to the previous 'processFiles' logic which did a loop.
            for (const file of Array.from(files)) {
                await uploadFile(file);
            }
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            for (const file of Array.from(files)) {
                await uploadFile(file);
            }
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={className}>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={cn(
                    height,
                    "border-2 border-dashed rounded-xl transition-all duration-500 ease-out relative overflow-hidden group place-content-center cursor-pointer",
                    isDragging
                        ? "border-primary bg-primary/5 scale-[0.99] shadow-inner ring-4 ring-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm",
                    uploading && "cursor-wait opacity-80"
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple // Allow selecting multiple files to loop through
                />

                {uploading ? (
                    <div className={cn(
                        "flex flex-col items-center justify-center space-y-3 animate-in fade-in zoom-in-95 duration-500",
                        compact ? "p-2" : "p-4 w-full max-w-sm mx-auto"
                    )}>
                        {!compact ? (
                            <>
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1 animate-pulse">
                                    <Upload className="w-5 h-5 text-primary" />
                                </div>
                                <div className="w-full space-y-1.5 text-center">
                                    <p className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 uppercase tracking-wider">
                                        Uploading...
                                    </p>
                                    <div className="relative pt-1">
                                        <Progress
                                            value={progress}
                                            className="h-1.5 w-full bg-primary/5 rounded-full"
                                            indicatorClassName="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                                        />
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-muted-foreground">{progress}%</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={cn(
                        "flex flex-col items-center justify-center text-center transition-transform duration-300 group-hover:scale-[1.02]",
                        compact ? "p-2" : "p-6 space-y-4"
                    )}>
                        {compact ? (
                            <div className="flex flex-col items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-5 h-5" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Upload</span>
                            </div>
                        ) : (
                            <>
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border group-hover:shadow-md",
                                    isDragging ? "bg-primary text-primary-foreground scale-110 rotate-3" : "bg-muted/50 text-muted-foreground group-hover:bg-background group-hover:text-primary group-hover:border-primary/20"
                                )}>
                                    <Upload className="w-8 h-8" />
                                </div>

                                <div className="space-y-1.5">
                                    <p className="text-sm font-bold text-foreground">
                                        {isDragging ? "Drop to upload" : "Click or drag file to upload"}
                                    </p>
                                    <p className="text-xs text-muted-foreground font-medium opacity-60 max-w-[240px] mx-auto">
                                        Max size: {maxSize / 1024 / 1024}MB
                                    </p>
                                </div>

                                <div className="flex gap-3 justify-center text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors pt-2">
                                    <ImageIcon className="w-4 h-4 hover:text-blue-500 transition-colors" />
                                    <Video className="w-4 h-4 hover:text-purple-500 transition-colors" />
                                    <Music className="w-4 h-4 hover:text-green-500 transition-colors" />
                                    <FileText className="w-4 h-4 hover:text-orange-500 transition-colors" />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
