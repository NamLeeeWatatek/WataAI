'use client';

import { useTranslation } from 'react-i18next';
import { RefreshCw, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useBotConversations } from '@/lib/hooks/features/useBotConversations';

interface SyncInstagramButtonProps {
    channelId: string;
    channelType: string;
    onSyncComplete?: () => void;
}

export function SyncInstagramButton({
    channelId,
    channelType,
    onSyncComplete,
}: SyncInstagramButtonProps) {
    const { t } = useTranslation();
    const { syncConversations, isSyncing: syncing } = useBotConversations();

    const handleSync = async () => {
        if (channelType !== 'instagram') {
            return;
        }

        try {
            await syncConversations({
                channelId,
                channelType: 'instagram',
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

    if (channelType !== 'instagram') {
        return null;
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            className="h-9 gap-2 text-pink-600 border-pink-200 hover:bg-pink-50"
            disabled={syncing}
        >
            <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} />
            <span className="text-xs">{t('conversations.sync', { defaultValue: 'Sync' })}</span>
        </Button>
    );
}
