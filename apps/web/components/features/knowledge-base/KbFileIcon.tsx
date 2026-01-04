import React from 'react';
import {
    Folder,
    FileText,
    FileCode,
    FileImage,
    FileVideo,
    FileAudio,
    Music,
    Image as ImageIcon,
    Video,
    Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isImageUrl, isVideoUrl } from '@/lib/utils/media';

interface KbFileIconProps {
    name: string;
    type: 'folder' | 'document';
    className?: string;
    icon?: string | null; // For folder custom icons if supported later
}

export function KbFileIcon({ name, type, className, icon }: KbFileIconProps) {
    if (type === 'folder') {
        return <Folder className={cn("w-5 h-5", className)} />;
    }

    if (!name) {
        return <FileText className={cn("w-5 h-5", className)} />;
    }

    // Check specific extensions
    const ext = name.split('.').pop()?.toLowerCase();

    // Media checks
    if (isImageUrl(name) || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
        return <ImageIcon className={cn("w-5 h-5", className)} />;
    }

    if (isVideoUrl(name) || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext || '')) {
        return <Video className={cn("w-5 h-5", className)} />;
    }

    if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext || '')) {
        return <Music className={cn("w-5 h-5", className)} />;
    }

    // Code files
    if (['json', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py', 'go', 'java', 'c', 'cpp', 'rs', 'php', 'sql'].includes(ext || '')) {
        return <FileCode className={cn("w-5 h-5", className)} />;
    }

    // Documents
    if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'].includes(ext || '')) {
        return <FileText className={cn("w-5 h-5", className)} />;
    }

    // Default
    return <FileText className={cn("w-5 h-5", className)} />;
}
