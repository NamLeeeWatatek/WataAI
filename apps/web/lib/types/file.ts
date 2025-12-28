
export interface UploadResponse {
  file: {
    id: string
    path: string
  }
  uploadSignedUrl?: string
}

export interface FileUploadOptions {
  onProgress?: (progress: number) => void
  bucket?: 'images' | 'documents' | 'avatars'
}

export interface UseFileUploadOptions extends FileUploadOptions {
  onSuccess?: (fileUrl: string, fileData: any) => void
  onError?: (error: Error) => void
}

export interface FileItem {
  id?: string
  name: string
  url: string
  size?: number
  uploadedAt?: string
  type?: string
}

export interface FileListProps {
  files: FileItem[]
  onDelete?: (id: string) => void
}

export interface ImageGalleryProps {
  images: Array<{
    url: string
    name: string
    id?: string
  }>
  onDelete?: (id: string) => void
}

export interface MediaUploaderProps {
  value?: string
  onChange: (url: string) => void
  accept?: string
  maxSize?: number
  bucket?: 'images' | 'documents' | 'avatars'
}

