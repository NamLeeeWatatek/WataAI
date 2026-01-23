'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useBotConversations } from '@/lib/hooks/features/useBotConversations';

interface SyncFacebookButtonProps {
  channelId: string;
  channelType: string;
  onSyncComplete?: () => void;
}

export function SyncFacebookButton({
  channelId,
  channelType,
  onSyncComplete,
}: SyncFacebookButtonProps) {
  const { t } = useTranslation();
  const { syncConversations, isSyncing: syncing } = useBotConversations();

  const handleSync = async () => {
    if (channelType !== 'facebook') {
      return;
    }

    try {
      await syncConversations({
        channelId,
        syncParams: {
          conversationLimit: 25,
          messageLimit: 50,
        }
      });
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error: any) {
      // Error handled in hook
    }
  };

  if (channelType !== 'facebook') {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      className="h-9 gap-2"
      disabled={syncing}
    >
      <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} />
      <span className="text-xs">{t('conversations.sync', { defaultValue: 'Sync' })}</span>
    </Button>
  );
}

