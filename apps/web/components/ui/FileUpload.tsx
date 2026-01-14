'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, File, Image as ImageIcon, Video, Music } from 'lucide-react';
import { Button } from './Button';
import { Progress } from './Progress';
import { cn } from '@/lib/utils';
import { useFileUpload } from '@/lib/hooks/use-file-upload';
import { type FileUploadOptions } from '@/lib/api/files';

// Re-export specific components
export { CoverUpload } from './CoverUpload';
export { FileDropzone } from './FileDropzone';

// --- Main FileUpload Component ---

interface FileUploadProps {
  onUploadComplete?: (fileUrl: string, fileData: any) => void;
  onUploadError?: (error: Error) => void;
  accept?: string;
  maxSize?: number;
  bucket?: 'images' | 'documents' | 'avatars' | 'videos' | 'audios';
  multiple?: boolean;
  className?: string;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx',
  maxSize = 50 * 1024 * 1024,
  bucket,
  multiple = false,
  className = '',
}: FileUploadProps) {
  const [previews, setPreviews] = useState<Array<{ type: 'image' | 'video' | 'audio' | 'file'; url: string; name: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploading, progress, uploadFile, uploadMultipleFiles } = useFileUpload({
    onSuccess: (url, file) => {
      onUploadComplete?.(url, file);
      // We don't clear previews immediately for multiple files to avoid UI flickering
      // or we clear them one by one. For now, let's keep them until manual clear or new selection
      // But if single file, we clear.
      if (!multiple) {
        setPreviews([]);
      }
    },
    onError: onUploadError,
    bucket,
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Generate previews for all files
    const newPreviews = await Promise.all(Array.from(files).map(async (file) => {
      return generatePreview(file);
    }));

    if (multiple) {
      setPreviews((prev) => [...prev, ...newPreviews]);
      uploadMultipleFiles(Array.from(files).map(f => f)); // Pass File objects
    } else {
      setPreviews([newPreviews[0]]);
      uploadFile(files[0]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generatePreview = (file: File): Promise<{ type: 'image' | 'video' | 'audio' | 'file'; url: string; name: string }> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => resolve({ type: 'image', url: reader.result as string, name: file.name });
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onloadend = () => resolve({ type: 'video', url: reader.result as string, name: file.name });
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onloadend = () => resolve({ type: 'audio', url: reader.result as string, name: file.name });
        reader.readAsDataURL(file);
      } else {
        resolve({ type: 'file', url: '', name: file.name });
      }
    });
  };

  const handleClear = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    if (previews.length <= 1 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4 flex-wrap">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Uploading...' : (multiple ? 'Choose Files' : 'Choose File')}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />

        {previews.length > 0 && !uploading && (
          <div className="flex flex-wrap gap-2">
            {previews.map((preview, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm font-medium bg-muted/50 px-3 py-1.5 rounded-full border">
                {preview.type === 'image' && <ImageIcon className="h-4 w-4 text-blue-500" />}
                {preview.type === 'video' && <Video className="h-4 w-4 text-purple-500" />}
                {preview.type === 'audio' && <Music className="h-4 w-4 text-green-500" />}
                {preview.type === 'file' && <File className="h-4 w-4 text-orange-500" />}
                <span className="truncate max-w-[150px]">{preview.name}</span>
                <button
                  type="button"
                  onClick={() => handleClear(idx)}
                  className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {uploading && (
        <div className="mt-4 space-y-2 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex justify-between text-[10px] items-center px-1">
            <span className="font-bold text-primary uppercase tracking-tight">Uploading {previews.length} files...</span>
            <span className="font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className="h-2 w-full bg-primary/10 shadow-inner rounded-full overflow-hidden"
            indicatorClassName="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
          />
        </div>
      )}

      {/* Grid Previews */}
      {previews.length > 0 && !uploading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
          {previews.map((preview, idx) => (
            (preview.type === 'image' || preview.type === 'video') && (
              <div key={idx} className="relative group rounded-md overflow-hidden border bg-background/50 aspect-square shadow-sm hover:shadow-md transition-all">
                {preview.type === 'image' && (
                   
                  <img src={preview.url} alt="Preview" className="w-full h-full object-cover" />
                )}
                {preview.type === 'video' && (
                  <video src={preview.url} controls className="w-full h-full object-cover bg-black" />
                )}
                <button
                  type="button"
                  onClick={() => handleClear(idx)}
                  className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}

