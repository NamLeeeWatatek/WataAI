'use client';

import { Media } from '@/components/ui/Media';
import { cn } from '@/lib/utils';
import { Image, icons } from 'lucide-react';
import { useState } from 'react';

interface TemplateCardMediaProps {
    thumbnailUrl?: string | null;
    name: string;
    aspectRatio?: 'video' | 'square' | 'portrait';
    className?: string;
    autoPlayOnHover?: boolean;
    icon?: string;
}

export function TemplateCardMedia({
    thumbnailUrl,
    name,
    aspectRatio = 'video',
    className,
    autoPlayOnHover = true,
    icon,
}: TemplateCardMediaProps) {
    const [hasError, setHasError] = useState(false);

    // Resolve icon component
    const IconComponent = icon && (icons as any)[icon] ? (icons as any)[icon] : Image;

    // Use fallback if no URL or if error occurred
    const showFallback = !thumbnailUrl || hasError;

    return (
        <div className={cn(
            "relative w-full overflow-hidden bg-secondary/10",
            aspectRatio === 'video' && 'aspect-video',
            aspectRatio === 'square' && 'aspect-square',
            aspectRatio === 'portrait' && 'aspect-[3/4]',
            className
        )}>
            {!showFallback ? (
                <>
                    {/* 1. Blurred Background Layer - Fills space with ambiance */}
                    <Media
                        src={thumbnailUrl!}
                        alt={`${name} background`}
                        fill
                        objectFit="cover"
                        containerClassName="w-full h-full absolute inset-0 pointer-events-none"
                        className="w-full h-full blur-xl scale-110 opacity-60 saturate-150 transition-transform duration-700 ease-out group-hover:scale-125"
                        // Background shouldn't play video or have sound
                        muted
                        showPlayIcon={false}
                        onError={() => setHasError(true)}
                    />

                    {/* Dark overlay to ensure text readability and focus */}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500 pointer-events-none" />

                    {/* 2. Main Content Layer - Perfectly contained, never cropped */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full h-full rounded-lg overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-500 group-hover:-translate-y-1">
                            <Media
                                src={thumbnailUrl!}
                                alt={name}
                                fill
                                autoPlayOnHover={autoPlayOnHover}
                                showPlayIcon={false}
                                loop
                                muted
                                playsInline
                                objectFit="contain"
                                containerClassName="w-full h-full"
                                className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
                                onError={() => setHasError(true)}
                            />
                        </div>
                    </div>
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/30 via-muted/10 to-muted/5 group-hover:from-primary/10 group-hover:to-primary/5 transition-all duration-500">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <IconComponent className="relative w-16 h-16 text-muted-foreground/10 group-hover:text-primary/30 transition-colors duration-500" strokeWidth={1} />
                    </div>
                </div>
            )}
            {/* Glass sheen effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        </div>
    );
}
