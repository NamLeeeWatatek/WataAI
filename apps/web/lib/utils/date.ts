import {
    formatDistanceToNow as formatDistanceToNowFn,
    format,
    isToday as isTodayFn,
    isYesterday as isYesterdayFn,
    differenceInHours
} from 'date-fns';

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
    if (!date) {
        return 'N/A';
    }

    const parsedDate = new Date(date);
    
    if (isNaN(parsedDate.getTime())) {
        console.warn('Invalid date in formatRelativeTime:', date);
        return 'Invalid date';
    }

    return formatDistanceToNowFn(parsedDate, {
        addSuffix: true,
    });
}

/**
 * Format date to locale string
 */
export function formatDate(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (!date) {
        return 'N/A';
    }

    const parsedDate = new Date(date);
    
    if (isNaN(parsedDate.getTime())) {
        console.warn('Invalid date in formatDate:', date);
        return 'Invalid date';
    }

    return parsedDate.toLocaleDateString('vi-VN', options);
}

/**
 * Format date to locale date and time string
 */
export function formatDateTime(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (!date) {
        return 'N/A';
    }

    const parsedDate = new Date(date);
    
    if (isNaN(parsedDate.getTime())) {
        console.warn('Invalid date in formatDateTime:', date);
        return 'Invalid date';
    }

    return parsedDate.toLocaleString('vi-VN', options);
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date | null | undefined): boolean {
    if (!date) {
        return false;
    }

    const checkDate = new Date(date);
    
    if (isNaN(checkDate.getTime())) {
        return false;
    }

    const today = new Date();
    return (
        checkDate.getDate() === today.getDate() &&
        checkDate.getMonth() === today.getMonth() &&
        checkDate.getFullYear() === today.getFullYear()
    );
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: string | Date | null | undefined): boolean {
    if (!date) {
        return false;
    }

    const checkDate = new Date(date);
    
    if (isNaN(checkDate.getTime())) {
        return false;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return (
        checkDate.getDate() === yesterday.getDate() &&
        checkDate.getMonth() === yesterday.getMonth() &&
        checkDate.getFullYear() === yesterday.getFullYear()
    );
}

// ========================================
// MESSAGE & CONVERSATION TIMESTAMP FORMATTING
// ========================================

/**
 * Format message timestamp for chat display
 * Smart context-aware formatting:
 * - Within 1 hour: "2 minutes ago", "1 hour ago"
 * - Today: "9:08 PM"
 * - Yesterday: "Yesterday at 9:08 PM"
 * - This year: "Dec 4, 9:08 PM"
 * - Different year: "Dec 4, 2024 9:08 PM"
 */
export function formatMessageTime(timestamp: string | Date | null | undefined): string {
    if (!timestamp) {
        return 'N/A';
    }

    const date = new Date(timestamp);
    
    // Validate date
    if (isNaN(date.getTime())) {
        console.warn('Invalid date in formatMessageTime:', timestamp);
        return 'Invalid date';
    }

    const now = new Date();
    const hoursDiff = differenceInHours(now, date);

    // Within last 1 hour: relative time
    if (hoursDiff < 1) {
        return formatDistanceToNowFn(date, { addSuffix: true });
    }

    // Today: time only
    if (isTodayFn(date)) {
        return format(date, 'h:mm a');
    }

    // Yesterday
    if (isYesterdayFn(date)) {
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
export function formatFullTimestamp(timestamp: string | Date | null | undefined): string {
    if (!timestamp) {
        return 'N/A';
    }

    const date = new Date(timestamp);
    
    if (isNaN(date.getTime())) {
        console.warn('Invalid date in formatFullTimestamp:', timestamp);
        return 'Invalid date';
    }

    return format(date, "PPpp");
}

/**
 * Format conversation list timestamp
 * Compact display for inbox:
 * - Today: "9:08 PM"
 * - Yesterday: "Yesterday"
 * - This week: "Monday"
 * - This year: "Dec 4"
 * - Last year: "Dec 4, 2024"
 */
export function formatConversationTime(timestamp: string | Date | null | undefined): string {
    if (!timestamp) {
        return 'N/A';
    }

    const date = new Date(timestamp);
    
    if (isNaN(date.getTime())) {
        console.warn('Invalid date in formatConversationTime:', timestamp);
        return 'Invalid date';
    }

    const now = new Date();

    if (isTodayFn(date)) {
        return format(date, 'h:mm a');
    }

    if (isYesterdayFn(date)) {
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
export function isRecent(timestamp: string | Date | null | undefined): boolean {
    if (!timestamp) {
        return false;
    }

    const date = new Date(timestamp);
    
    if (isNaN(date.getTime())) {
        return false;
    }

    const now = new Date();
    const minutesDiff = (now.getTime() - date.getTime()) / 1000 / 60;
    return minutesDiff < 5;
}

/**
 * Sort messages by timestamp (oldest first)
 * For chat display - natural chronological order
 */
export function sortMessagesByTime<T extends { createdAt: string | Date | null | undefined }>(
    messages: T[]
): T[] {
    return [...messages].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        
        // Handle invalid dates
        const validTimeA = isNaN(timeA) ? 0 : timeA;
        const validTimeB = isNaN(timeB) ? 0 : timeB;
        
        return validTimeA - validTimeB;
    });
}

/**
 * Sort conversations by last message time (newest first)
 * For inbox display - most recent conversations first
 */
export function sortConversationsByTime<T extends { lastMessageAt: string | Date | null | undefined }>(
    conversations: T[]
): T[] {
    return [...conversations].sort((a, b) => {
        const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        
        // Handle invalid dates
        const validTimeA = isNaN(timeA) ? 0 : timeA;
        const validTimeB = isNaN(timeB) ? 0 : timeB;
        
        return validTimeB - validTimeA;  // DESC: newest first
    });
}


