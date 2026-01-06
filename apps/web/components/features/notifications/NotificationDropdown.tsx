/**
 * Notification Dropdown Component
 * Shows notification list and unread count badge
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, AlertCircle, Info, X, Settings, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useNotificationsRealtime } from '@/lib/hooks/use-notifications-realtime';
import { useNotificationPreferences } from '@/lib/hooks/use-notification-preferences';
import { cn } from '@/lib/utils';
import { Notification, JobStatus } from '@/lib/types/notification';

interface NotificationDropdownProps {
  className?: string;
  badgeClassName?: string;
  dropdownClassName?: string;
}

export function NotificationDropdown({
  className,
  badgeClassName,
  dropdownClassName,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const preferences = useNotificationPreferences();
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    refreshUnreadCount,
  } = useNotificationsRealtime({
    enabled: true,
    autoConnect: true,
  });

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchNotifications(),
          refreshUnreadCount(),
        ]);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchNotifications, refreshUnreadCount]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="w-4 h-4 text-success" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'info': default: return <Info className="w-4 h-4 text-info" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-success/10 border-success/20 text-success';
      case 'error': return 'bg-destructive/10 border-destructive/20 text-destructive';
      case 'warning': return 'bg-warning/10 border-warning/20 text-warning';
      case 'info': default: return 'bg-info/10 border-info/20 text-info';
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Notification Button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        className={cn(
          'relative rounded-full hover:bg-muted/50 transition-all duration-200',
          isOpen && 'bg-muted'
        )}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge
            className={cn(
              'absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center p-0 text-xs font-medium',
              badgeClassName
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        {!isConnected && (
          <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background shadow-sm" />
        )}
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'absolute right-0 mt-2 w-80 bg-background border border-border rounded-xl shadow-2xl overflow-hidden z-50',
              dropdownClassName
            )}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <div className="flex items-center gap-1">
                      {isConnected ? (
                        <>
                          <div className="h-2 w-2 rounded-full bg-success" />
                          <span>Connected</span>
                        </>
                      ) : (
                        <>
                          <div className="h-2 w-2 rounded-full bg-destructive" />
                          <span>Disconnected</span>
                        </>
                      )}
                    </div>
                    <span>•</span>
                    <span>{notifications.length} notifications</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-muted/50"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-muted-foreground mt-3">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="w-10 h-10 text-muted-foreground mx-auto" />
                  <h4 className="font-medium mt-3">No notifications</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    You're all caught up! Notifications will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 hover:bg-muted/50 transition-colors duration-150 cursor-pointer',
                        !notification.isRead && 'bg-muted/30'
                      )}
                      onClick={async () => {
                        if (!notification.isRead) {
                          await markAsRead(notification.id);
                        }

                        // Navigate to results if applicable
                        if (
                          (notification.metadata?.resourceType === 'creation_job') ||
                          (notification.type === 'job_progress' && [JobStatus.COMPLETED, JobStatus.FAILED].includes(notification.data?.status))
                        ) {
                          const jobId = notification.metadata?.resourceId || notification.data?.jobId;
                          if (jobId) {
                            router.push(`/my-products?jobId=${jobId}`);
                          }
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'p-2 rounded-lg border flex-shrink-0',
                          getNotificationColor(notification.type)
                        )}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-medium truncate">
                              {notification.title}
                            </h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                          {notification.type === 'job_progress' && notification.data?.progress !== undefined && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>{notification.data.progress}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all duration-300 ease-out"
                                  style={{ width: `${notification.data.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          {notification.workspaceId && (
                            <div className="mt-2 flex items-center gap-2">
                              {notification.data?.status && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                                  {notification.data.status}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal text-muted-foreground">
                                WS: {notification.workspaceId.slice(0, 8)}
                              </Badge>
                            </div>
                          )}
                          {notification.metadata?.resourceType === 'creation_job' && (
                            <div className="mt-2 flex items-center justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/my-products?jobId=${notification.metadata?.resourceId}`);
                                }}
                              >
                                View Results
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {preferences.sound ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
                <span>Sound {preferences.sound ? 'on' : 'off'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={handleMarkAllAsRead}
                  disabled={notifications.filter(n => !n.isRead).length === 0}
                >
                  Mark all as read
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => {
                    // Navigate to settings
                    router.push('/settings?tab=notifications');
                    setIsOpen(false);
                  }}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to format time
function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'Just now';
  }
}
