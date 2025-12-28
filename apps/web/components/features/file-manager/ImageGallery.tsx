'use client';

import { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

interface ImageGalleryProps {
  images: Array<{
    url: string;
    name: string;
    id?: string;
  }>;
  onDelete?: (id: string) => void;
}

export function ImageGallery({ images, onDelete }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="group relative border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedImage(image.url)}
          >
            <div className="aspect-square relative">
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(image.url, image.name);
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
                {onDelete && image.id && (
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(image.id!);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="p-2">
              <p className="text-xs text-muted-foreground truncate">
                {image.name}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

