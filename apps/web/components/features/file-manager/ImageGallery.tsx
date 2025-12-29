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
import { Media } from '@/components/ui/Media';

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
            className="group relative border rounded-xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer bg-muted/20"
            onClick={() => setSelectedImage(image.url)}
          >
            <div className="aspect-video relative">
              <Media
                src={image.url}
                alt={image.name}
                fill
                ambient
                objectFit="contain"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full"
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
                    className="rounded-full"
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
            <div className="p-3 bg-card border-t">
              <p className="text-[10px] font-bold text-foreground/80 truncate">
                {image.name}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-0 gap-0 shadow-2xl">
          {selectedImage && (
            <div className="relative aspect-video w-full bg-black">
              <Media
                src={selectedImage}
                alt="Preview"
                fill
                ambient
                objectFit="contain"
                controls
                autoPlay
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

