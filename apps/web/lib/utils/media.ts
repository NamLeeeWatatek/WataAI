
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic', 'avif'];
export const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'ogg', 'm4v'];

export function isImageUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return (
        IMAGE_EXTENSIONS.some(ext => cleanUrl.endsWith(`.${ext}`)) ||
        url.startsWith('data:image/')
    );
}

export function isVideoUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return (
        VIDEO_EXTENSIONS.some(ext => cleanUrl.endsWith(`.${ext}`)) ||
        url.startsWith('data:video/')
    );
}

export function getMediaType(url: string | null | undefined): 'image' | 'video' | 'unknown' {
    if (isImageUrl(url)) return 'image';
    if (isVideoUrl(url)) return 'video';
    return 'unknown';
}
