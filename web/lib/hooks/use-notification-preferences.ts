'use client';

import { useAuth } from './useAuth';
import { useMemo } from 'react';

export interface NotificationPreferences {
    desktop: boolean;
    sound: boolean;
    messagePreview: boolean;
    onlyWhenInactive: boolean;
    doNotDisturb: boolean;
    mutedConversations?: string[];
    [key: string]: any;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    desktop: true,
    sound: true,
    messagePreview: true,
    onlyWhenInactive: false,
    doNotDisturb: false,
    mutedConversations: [],
};

export function useNotificationPreferences(): NotificationPreferences {
    const { user } = useAuth();

    const preferences = useMemo(() => {
        const fullUser = user as any;
        if (fullUser?.notificationPreferences) {
            return { ...DEFAULT_PREFERENCES, ...fullUser.notificationPreferences } as NotificationPreferences;
        }
        return DEFAULT_PREFERENCES;
    }, [user]);

    return preferences;
}
