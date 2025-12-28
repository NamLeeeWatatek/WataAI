'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import axiosClient from '@/lib/axios-client';
import { cn } from '@/lib/utils';

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
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (channelType !== 'facebook') {
      return;
    }

    try {
      setSyncing(true);
      toast.info('Syncing conversations from Facebook...');

      const data: any = await axiosClient.post(
        `/channels/facebook/connections/${channelId}/sync-to-db`,
        {
          conversationLimit: 25,
          messageLimit: 50,
        }
      );

      if (data.success) {
        toast.success(`Synced ${data.synced} conversation(s) from Facebook`);
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        toast.error('Failed to sync conversations');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to sync conversations';
      toast.error(errorMessage);
    } finally {
      setSyncing(false);
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
      <span className="text-xs">Sync</span>
    </Button>
  );
}

