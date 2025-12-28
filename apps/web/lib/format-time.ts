import {
    formatDistanceToNow,
    format,
    isToday,
    isYesterday,
    differenceInHours
} from 'date-fns';

/**
 * Format message timestamp for chat display
 * - Within 1 hour: "2 minutes ago", "1 hour ago"
 * - Today: "9:08 PM"
 * - Yesterday: "Yesterday at 9:08 PM"
 * - Older: "Dec 4, 9:08 PM"
 * - Different year: "Dec 4, 2024 9:08 PM"
 */
export function formatMessageTime(timestamp: string | Date): string {
    const date = new Date(timestamp);
    const now = new Date();
    const hoursDiff = differenceInHours(now, date);

    // Within last 1 hour: relative time
    if (hoursDiff < 1) {
        return formatDistanceToNow(date, { addSuffix: true });
    }

    // Today: time only
    if (isToday(date)) {
        return format(date, 'h:mm a');
    }

    // Yesterday
    if (isYesterday(date)) {
        return `Yesterday at ${format(date, 'h:mm a')}`;
    }

    // This year: no year
    const currentYear = now.getFullYear();
    const messageYear = date.getFullYear();

    if (currentYear === messageYear) {
        return format(date, 'MMM d, h:mm a');  // "Dec 4, 9:08 PM"
    }

    // Different year: include year
    return format(date, 'MMM d, yyyy h:mm a');  // "Dec 4, 2024 9:08 PM"
}

/**
 * Format full timestamp with timezone
 * For tooltips or detailed views
 * Output: "December 5, 2025, 9:08:55 PM"
 */
export function formatFullTimestamp(timestamp: string | Date): string {
    const date = new Date(timestamp);
    return format(date, "PPpp");
}

/**
 * Format conversation list timestamp
 * - Today: "9:08 PM"
 * - Yesterday: "Yesterday"
 * - This week: "Monday"
 * - Older: "Dec 4"
 * - Last year: "Dec 4, 2024"
 */
export function formatConversationTime(timestamp: string | Date): string {
    const date = new Date(timestamp);
    const now = new Date();

    if (isToday(date)) {
        return format(date, 'h:mm a');
    }

    if (isYesterday(date)) {
        return 'Yesterday';
    }

    const daysDiff = differenceInHours(now, date) / 24;

    // Within last week: show day name
    if (daysDiff < 7) {
        return format(date, 'EEEE');  // "Monday", "Tuesday"
    }

    // This year: no year
    if (now.getFullYear() === date.getFullYear()) {
        return format(date, 'MMM d');  // "Dec 4"
    }

    // Different year
    return format(date, 'MMM d, yyyy');  // "Dec 4, 2024"
}

/**
 * Check if timestamp is recent (within last 5 minutes)
 * Useful for showing "new" badges
 */
export function isRecent(timestamp: string | Date): boolean {
    const date = new Date(timestamp);
    const now = new Date();
    const minutesDiff = (now.getTime() - date.getTime()) / 1000 / 60;
    return minutesDiff < 5;
}

/**
 * Sort messages by timestamp (oldest first)
 * For chat display
 */
export function sortMessagesByTime<T extends { createdAt: string | Date }>(
    messages: T[]
): T[] {
    return [...messages].sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
}

/**
 * Sort conversations by last message time (newest first)
 * For inbox display
 */
export function sortConversationsByTime<T extends { lastMessageAt: string | Date | null }>(
    conversations: T[]
): T[] {
    return [...conversations].sort((a, b) => {
        const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return timeB - timeA;  // DESC: newest first
    });
}

