import { useState, useCallback } from 'react';

export interface NotificationPreferences {
    sound: boolean;
    toast: boolean;
    desktop: boolean;
    doNotDisturb: boolean;
    onlyWhenInactive: boolean;
    messagePreview: boolean;
}

export function useNotificationPreferences() {
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        sound: true,
        toast: true,
        desktop: true,
        doNotDisturb: false,
        onlyWhenInactive: false,
        messagePreview: true,
    });

    const updatePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
        setPreferences(prev => ({ ...prev, ...newPrefs }));
    }, []);

    return {
        ...preferences,
        updatePreferences,
    };
}
