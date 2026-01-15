'use client';

import { Media } from '@/components/shared/Media';
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
                <div className="absolute inset-0">
                    <Media
                        src={thumbnailUrl!}
                        alt={name}
                        fill
                        ambient
                        objectFit="contain"
                        autoPlayOnHover={autoPlayOnHover}
                        showPlayIcon={false}
                        loop
                        muted
                        playsInline
                        onError={() => setHasError(true)}
                    />

                    {/* Subtle glass sheen effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                </div>
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
