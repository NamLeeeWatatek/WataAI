'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, File, Image as ImageIcon, Video, Music, FileText } from 'lucide-react';
import { fileUploadService, type FileUploadOptions } from '@/lib/api/files';
import { Button } from './Button';
import { Progress } from './Progress';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUploadComplete?: (fileUrl: string, fileData: any) => void;
  onUploadError?: (error: Error) => void;
  accept?: string;
  maxSize?: number;
  bucket?: 'images' | 'documents' | 'avatars' | 'videos' | 'audios';
  multiple?: boolean;
  className?: string;
  compact?: boolean;
}
export function FileUpload({
  onUploadComplete,
  onUploadError,
  accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx',
  maxSize = 50 * 1024 * 1024, // Default 50MB
  bucket,
  multiple = false,
  className = '',
  compact = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<{ type: 'image' | 'video' | 'audio' | 'file'; url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    processFile(file);
  };

  const processFile = async (file: File) => {
    // Validate
    const validation = fileUploadService.validateFile(file, {
      maxSize,
      allowedTypes: accept.split(',').map((type) => type.trim()),
    });

    if (!validation.valid) {
      onUploadError?.(new Error(validation.error));
      return;
    }

    // Generate Preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview({ type: 'image', url: reader.result as string, name: file.name });
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview({ type: 'video', url: reader.result as string, name: file.name });
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('audio/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview({ type: 'audio', url: reader.result as string, name: file.name });
      reader.readAsDataURL(file);
    } else {
      setPreview({ type: 'file', url: '', name: file.name });
    }

    // Start Upload
    setUploading(true);
    setProgress(0);

    try {
      // Auto-determine bucket if not specified
      let targetBucket = bucket;
      if (!targetBucket) {
        if (file.type.startsWith('image/')) targetBucket = 'images';
        else if (file.type.startsWith('video/')) targetBucket = 'videos';
        else if (file.type.startsWith('audio/')) targetBucket = 'audios';
        else targetBucket = 'documents';
      }

      const options: FileUploadOptions = {
        bucket: targetBucket,
        onProgress: (prog) => setProgress(prog),
      };

      const result = await fileUploadService.uploadFile(file, options);
      // Use the URL returned by the API (downloadSignedUrl or uploadSignedUrl) 
      // instead of manually constructing it which relies on env vars that might be missing
      const fileUrl = result.downloadSignedUrl || result.uploadSignedUrl || fileUploadService.getFileUrl(result.file.path, targetBucket);

      onUploadComplete?.(fileUrl, result.file);
    } catch (error) {
      onUploadError?.(error as Error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleClear = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Uploading...' : 'Choose File'}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />

        {preview && !uploading && (
          <div className="flex items-center gap-2 text-sm font-medium bg-muted/50 px-3 py-1.5 rounded-full border">
            {preview.type === 'image' && <ImageIcon className="h-4 w-4 text-blue-500" />}
            {preview.type === 'video' && <Video className="h-4 w-4 text-purple-500" />}
            {preview.type === 'audio' && <Music className="h-4 w-4 text-green-500" />}
            {preview.type === 'file' && <File className="h-4 w-4 text-orange-500" />}
            <span className="truncate max-w-[200px]">{preview.name}</span>
            <button
              type="button"
              onClick={handleClear}
              className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {uploading && (
        <div className="mt-4 space-y-2 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex justify-between text-[10px] items-center px-1">
            <span className="font-bold text-primary uppercase tracking-tight">Uploading</span>
            <span className="font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className="h-2 w-full bg-primary/10 shadow-inner rounded-full overflow-hidden"
            indicatorClassName="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
          />
        </div>
      )}

      {/* Rich Preview Area */}
      {preview && !uploading && (preview.type === 'image' || preview.type === 'video') && (
        <div className="relative group rounded-xl overflow-hidden border bg-background/50 max-w-sm mt-3 shadow-lg">
          {preview.type === 'image' && (
            <img src={preview.url} alt="Preview" className="w-full h-auto max-h-64 object-cover" />
          )}
          {preview.type === 'video' && (
            <video src={preview.url} controls className="w-full h-auto max-h-64 bg-black" />
          )}
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Audio Preview */}
      {preview && !uploading && preview.type === 'audio' && (
        <div className="mt-3 bg-muted/30 p-3 rounded-xl border flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
            <Music className="h-5 w-5" />
          </div>
          <audio src={preview.url} controls className="h-8 w-full max-w-xs" />
        </div>
      )}
    </div>
  );
}

interface FileDropzoneProps extends Omit<FileUploadProps, 'className'> {
  height?: string;
  className?: string;
  compact?: boolean;
}

export function FileDropzone({
  onUploadComplete,
  onUploadError,
  accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx',
  maxSize = 100 * 1024 * 1024, // 100MB default for dropzone
  bucket,
  height = 'h-64',
  className = '',
  compact = false,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const processFile = async (file: File) => {
    // Validate
    const validation = fileUploadService.validateFile(file, {
      maxSize,
      allowedTypes: accept.split(',').map((type) => type.trim()),
    });

    if (!validation.valid) {
      onUploadError?.(new Error(validation.error));
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Auto-determine bucket
      let targetBucket = bucket;
      if (!targetBucket) {
        if (file.type.startsWith('image/')) targetBucket = 'images';
        else if (file.type.startsWith('video/')) targetBucket = 'videos';
        else if (file.type.startsWith('audio/')) targetBucket = 'audios';
        else targetBucket = 'documents';
      }

      const options: FileUploadOptions = {
        bucket: targetBucket,
        onProgress: (prog) => setProgress(prog),
      };

      const result = await fileUploadService.uploadFile(file, options);
      // Use the URL returned by the API (downloadSignedUrl or uploadSignedUrl) 
      // instead of manually constructing it which relies on env vars that might be missing
      const fileUrl = result.downloadSignedUrl || result.uploadSignedUrl || fileUploadService.getFileUrl(result.file.path, targetBucket);

      onUploadComplete?.(fileUrl, result.file);
    } catch (error) {
      onUploadError?.(error as Error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };


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
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
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
          "border-2 border-dashed rounded-xl transition-all duration-300 relative overflow-hidden group place-content-center",
          isDragging ? "border-primary bg-primary/5 scale-[0.99]" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30",
          uploading ? "cursor-wait" : "cursor-pointer"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className={cn(
            "flex flex-col items-center justify-center space-y-2 animate-in fade-in zoom-in-95 duration-500",
            compact ? "p-2" : "p-8 w-full max-w-md mx-auto space-y-6"
          )}>
            {!compact ? (
              <>
                <div className="w-full space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 uppercase tracking-wider">
                        Processing File
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium italic">
                        Uploading to secure storage...
                      </p>
                    </div>
                    <span className="text-sm font-black text-primary font-mono">{progress}%</span>
                  </div>

                  <div className="relative pt-1">
                    <Progress
                      value={progress}
                      className="h-3.5 w-full bg-primary/5 shadow-inner border border-primary/10 rounded-full"
                      indicatorClassName="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 transition-all duration-500 ease-out hover:brightness-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-30 pointer-events-none rounded-full" />
                  </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
                  <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <p className="text-[10px] font-bold text-primary/80 uppercase tracking-widest">Encrypting Transfer</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-[8px] font-black text-primary">{progress}%</span>
              </div>
            )}
          </div>
        ) : (
          <div className={cn(
            "flex flex-col items-center justify-center text-center",
            compact ? "p-2" : "p-6 space-y-4"
          )}>
            {compact ? (
              <div className="flex flex-col items-center justify-center gap-1">
                <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Add</span>
              </div>
            ) : (
              <>
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm border",
                  isDragging ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Upload className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    {isDragging ? "Drop file to upload" : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
                    Supported: Images, Videos, Audio, PDF, Docs (Max {maxSize / 1024 / 1024}MB)
                  </p>
                </div>

                <div className="flex gap-2 justify-center opacity-60 group-hover:opacity-100 transition-opacity pt-2">
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                  <Video className="w-4 h-4 text-purple-500" />
                  <Music className="w-4 h-4 text-green-500" />
                  <FileText className="w-4 h-4 text-orange-500" />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

