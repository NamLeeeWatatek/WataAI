/**
 * Enterprise Notification System
 * Inspired by: Slack, Intercom, Microsoft Teams
 */

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface NotificationOptions {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    data?: any;
    silent?: boolean;
    requireInteraction?: boolean;
}

interface UseNotificationsReturn {
    permission: NotificationPermission;
    requestPermission: () => Promise<NotificationPermission>;
    showNotification: (options: NotificationOptions) => void;
    playSound: (type?: 'message' | 'mention' | 'call') => void;
    isSupported: boolean;
}

// Sound URLs - you can replace with your own sounds
const SOUNDS = {
    message: 'data:audio/wav;base64,UklGRhYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQA=', // Subtle beep
    mention: 'data:audio/wav;base64,UklGRhYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQA=',
    call: 'data:audio/wav;base64,UklGRhYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQA='
};

export function useNotifications(): UseNotificationsReturn {
    const [permission, setPermission] = useState<NotificationPermission>(
        typeof window !== 'undefined' && 'Notification' in window
            ? Notification.permission
            : 'denied'
    );

    const isSupported = typeof window !== 'undefined' && 'Notification' in window;

    useEffect(() => {
        if (isSupported) {
            setPermission(Notification.permission);
        }
    }, [isSupported]);

    const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
        if (!isSupported) {
            return 'denied';
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                toast.success('Desktop notifications enabled!');
            } else {
                toast.info('You can enable notifications later in settings');
            }

            return result;
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            return 'denied';
        }
    }, [isSupported]);

    const showNotification = useCallback((options: NotificationOptions) => {
        if (!isSupported || permission !== 'granted') {
            // Fallback to toast if notifications are not available
            toast(options.title, {
                description: options.body,
                duration: 4000,
            });
            return;
        }

        try {
            const notification = new Notification(options.title, {
                body: options.body,
                icon: options.icon || '/logo.png',
                badge: '/logo.png',
                tag: options.tag || 'wataomi-notification',
                data: options.data,
                silent: options.silent || false,
                requireInteraction: options.requireInteraction || false,
            });

            // Auto-close after 5 seconds if not requiring interaction
            if (!options.requireInteraction) {
                setTimeout(() => {
                    notification.close();
                }, 5000);
            }

            // Handle click
            notification.onclick = (event) => {
                event.preventDefault();
                window.focus();

                // Navigate to conversation if data contains conversationId
                if (options.data?.conversationId) {
                    window.location.href = `/conversations?id=${options.data.conversationId}`;
                }

                notification.close();
            };
        } catch (error) {
            console.error('Failed to show notification:', error);
            toast(options.title, {
                description: options.body,
            });
        }
    }, [isSupported, permission]);

    const playSound = useCallback((type: 'message' | 'mention' | 'call' = 'message') => {
        try {
            const audio = new Audio(SOUNDS[type]);
            audio.volume = 0.3; // 30% volume - subtle
            audio.play().catch((error) => {
                console.warn('Could not play notification sound:', error);
            });
        } catch (error) {
            console.warn('Sound playback failed:', error);
        }
    }, []);

    return {
        permission,
        requestPermission,
        showNotification,
        playSound,
        isSupported,
    };
}

