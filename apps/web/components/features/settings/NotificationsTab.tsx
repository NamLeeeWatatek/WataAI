"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Bell, BellOff, Volume2, Monitor, Smartphone, Terminal, Mail, Zap, ShieldCheck, MessageSquare } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { usersApi } from '@/lib/api/users';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { useNotifications } from '@/lib/hooks/useNotifications';

interface NotificationPreferences {
  desktop: boolean;
  sound: boolean;
  messagePreview: boolean;
  onlyWhenInactive: boolean;
  doNotDisturb: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  desktop: true,
  sound: true,
  messagePreview: true,
  onlyWhenInactive: false,
  doNotDisturb: false,
};

export function NotificationsTab() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(false);
  const { permission, requestPermission, isSupported } = useNotifications();

  useEffect(() => {
    const fetchSettings = async () => {
      if (user?.id) {
        try {
          const userData = await usersApi.findOne(user.id);
          if (userData.notificationPreferences) {
            setPreferences(userData.notificationPreferences as NotificationPreferences);
          }
        } catch (error) {
          console.error("Failed to fetch user settings", error);
        }
      }
    };
    fetchSettings();
  }, [user?.id]);

  const updatePreference = async <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    if (!user?.id) return;

    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences); // Optimistic update

    try {
      await usersApi.update(user.id, {
        notificationPreferences: newPreferences
      });
      toast.success("Settings saved");
    } catch (error) {
      console.error("Failed to update preferences", error);
      toast.error("Failed to save settings");
      setPreferences(preferences); // Revert
    }
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-border/40 bg-muted/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">In-App & Desktop</CardTitle>
              <CardDescription>Configure how you receive alerts on this device</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          {/* Desktop Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-2xl bg-muted/20 border-border/40">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border/50">
                <Monitor className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <Label className="text-sm font-bold">Desktop Notifications</Label>
                <p className="text-xs text-muted-foreground">Show popup notifications</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isSupported && <Badge variant="destructive" className="text-[10px]">Not Supported</Badge>}
              <Switch
                checked={preferences.desktop && permission === 'granted'}
                onCheckedChange={handleDesktopToggle}
                disabled={!isSupported}
              />
            </div>
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between p-4 border rounded-2xl bg-muted/20 border-border/40">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border/50">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <Label className="text-sm font-bold">Sound Effects</Label>
                <p className="text-xs text-muted-foreground">Play sound on new message</p>
              </div>
            </div>
            <Switch
              checked={preferences.sound}
              onCheckedChange={(c) => updatePreference('sound', c)}
            />
          </div>

          {/* Do Not Disturb */}
          <div className="flex items-center justify-between p-4 border rounded-2xl bg-muted/20 border-border/40">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border/50">
                <BellOff className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <Label className="text-sm font-bold">Do Not Disturb</Label>
                <p className="text-xs text-muted-foreground">Pause all notifications</p>
              </div>
            </div>
            <Switch
              checked={preferences.doNotDisturb}
              onCheckedChange={(c) => updatePreference('doNotDisturb', c)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Existing System Alerts Section - kept for completeness or placeholders if backend supports them later */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-border/40 bg-muted/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">System Alerts</CardTitle>
              <CardDescription>Manage automated system notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          <div className="grid gap-4">
            {[
              { key: 'security', title: 'Security Protocol Alerts', desc: 'Critical unauthorized access or infrastructure events', icon: ShieldCheck, default: true },
              { key: 'ai', title: 'AI Logic Updates', desc: 'Notifications when models are retrained or parameters shift', icon: Zap, default: false },
              { key: 'data', title: 'Data Ingestion Events', desc: 'Real-time status of large knowledge base imports', icon: MessageSquare, default: true },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 border rounded-2xl bg-muted/20 border-border/40 transition-all hover:border-primary/30 group">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border/50 group-hover:border-primary/20 transition-all">
                    <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={preferences[item.key as keyof NotificationPreferences] ?? item.default}
                  onCheckedChange={(c) => updatePreference(item.key as keyof NotificationPreferences, c)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
