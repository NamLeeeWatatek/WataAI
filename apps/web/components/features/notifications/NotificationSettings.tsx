/**
 * Notification Settings Panel Component
 * Enterprise-grade settings like Slack
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    BellOff,
    Volume2,
    VolumeX,
    Monitor,
    Smartphone,
    Settings as SettingsIcon,
    X,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Separator } from '@/components/ui/Separator';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/lib/hooks/useNotifications';

interface NotificationSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NotificationPreferences {
    desktop: boolean;
    sound: boolean;
    messagePreview: boolean;
    onlyWhenInactive: boolean;
    doNotDisturb: boolean;
    mutedConversations: string[];
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    desktop: true,
    sound: true,
    messagePreview: true,
    onlyWhenInactive: false,
    doNotDisturb: false,
    mutedConversations: [],
};

export function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
    const { permission, requestPermission, isSupported } = useNotifications();
    const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        // Load preferences from localStorage
        const saved = localStorage.getItem('notificationPreferences');
        if (saved) {
            try {
                setPreferences(JSON.parse(saved));
            } catch (error) {
                console.error('Failed to load notification preferences:', error);
            }
        }
    }, []);

    const savePreferences = () => {
        localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
        setHasChanges(false);
    };

    const updatePreference = <K extends keyof NotificationPreferences>(
        key: K,
        value: NotificationPreferences[K]
    ) => {
        setPreferences((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleDesktopToggle = async (enabled: boolean) => {
        if (enabled && permission !== 'granted') {
            const result = await requestPermission();
            if (result === 'granted') {
                updatePreference('desktop', true);
            }
        } else {
            updatePreference('desktop', enabled);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", duration: 0.3 }}
                    className="bg-background border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10">
                                <Bell className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Notification Settings</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Customize how you receive notifications
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="rounded-full"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                        {/* Desktop Notifications */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Monitor className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <Label htmlFor="desktop" className="text-sm font-medium">
                                            Desktop Notifications
                                        </Label>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Show notifications on your desktop
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {permission === 'granted' && preferences.desktop && (
                                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                                            <Check className="w-3 h-3 mr-1" />
                                            Enabled
                                        </Badge>
                                    )}
                                    <Switch
                                        id="desktop"
                                        checked={preferences.desktop && permission === 'granted'}
                                        onCheckedChange={handleDesktopToggle}
                                        disabled={!isSupported}
                                    />
                                </div>
                            </div>

                            {!isSupported && (
                                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                                    ⚠️ Desktop notifications are not supported in your browser
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Sound Notifications */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {preferences.sound ? (
                                    <Volume2 className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                    <VolumeX className="w-5 h-5 text-muted-foreground" />
                                )}
                                <div>
                                    <Label htmlFor="sound" className="text-sm font-medium">
                                        Sound Notifications
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Play a sound when you receive a message
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="sound"
                                checked={preferences.sound}
                                onCheckedChange={(checked) => updatePreference('sound', checked)}
                            />
                        </div>

                        <Separator />

                        {/* Message Preview */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Smartphone className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <Label htmlFor="preview" className="text-sm font-medium">
                                        Message Preview
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Show message content in notifications
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="preview"
                                checked={preferences.messagePreview}
                                onCheckedChange={(checked) => updatePreference('messagePreview', checked)}
                            />
                        </div>

                        <Separator />

                        {/* Only when inactive */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Monitor className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <Label htmlFor="inactive" className="text-sm font-medium">
                                        Only When Inactive
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Only notify when you're not viewing the conversation
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="inactive"
                                checked={preferences.onlyWhenInactive}
                                onCheckedChange={(checked) => updatePreference('onlyWhenInactive', checked)}
                            />
                        </div>

                        <Separator />

                        {/* Do Not Disturb */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {preferences.doNotDisturb ? (
                                    <BellOff className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                    <Bell className="w-5 h-5 text-muted-foreground" />
                                )}
                                <div>
                                    <Label htmlFor="dnd" className="text-sm font-medium">
                                        Do Not Disturb
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Mute all notifications temporarily
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="dnd"
                                checked={preferences.doNotDisturb}
                                onCheckedChange={(checked) => updatePreference('doNotDisturb', checked)}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            Settings are saved automatically
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={onClose} size="sm">
                                Close
                            </Button>
                            {hasChanges && (
                                <Button onClick={savePreferences} size="sm" className="gap-2">
                                    <Check className="w-4 h-4" />
                                    Save Changes
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// Hook to use notification preferences
export function useNotificationPreferences(): NotificationPreferences {
    const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

    useEffect(() => {
        const saved = localStorage.getItem('notificationPreferences');
        if (saved) {
            try {
                setPreferences(JSON.parse(saved));
            } catch (error) {
                console.error('Failed to load notification preferences:', error);
            }
        }
    }, []);

    return preferences;
}
