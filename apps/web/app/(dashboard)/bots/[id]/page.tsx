'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoading } from '@/components/ui/PageLoading';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsHeader } from '@/components/ui/Tabs';
import {
    Save,
    AlertCircle,
    Bot as BotIcon,
    Palette,
    Code,
    History,
    Clock,
    RefreshCw
} from 'lucide-react';
import { toast } from '@/lib/toast';

import {
    BotConfigurationTab
} from '@/components/features/bots/BotConfigurationTab';
import { BotKnowledgeBaseSection } from '@/components/features/bots/BotKnowledgeBaseSection';
import { BotChannelsSection } from '@/components/features/bots/BotChannelsSection';
import { BotSettingsTab } from '@/components/features/bots/BotSettingsTab';
import { BotGlobalInterfaceTab } from '@/components/features/bots/BotGlobalInterfaceTab';
import { WidgetAppearanceSettings } from '@/components/features/widget/WidgetAppearanceSettings';
import { WidgetDeploymentHistory } from '@/components/features/widget/WidgetDeploymentHistory';
import { WidgetEmbedCode } from '@/components/features/widget/WidgetEmbedCode';
import { WidgetVersionsList } from '@/components/features/widget/WidgetVersionsList';
import { useWidgetVersions, useWidgetDeployments } from '@/lib/hooks/use-widget-versions';

import { PageHeader } from '@/components/ui/PageHeader';
import { useBot, useBots } from '@/lib/hooks/features/useBots';
import { BotStatus, BotWidgetPosition, BotWidgetButtonSize } from '@/lib/types/bots';

export default function BotDetailPage() {
    const params = useParams();
    const router = useRouter();
    const botId = params.id as string;

    const {
        bot,
        channels: botChannels,
        isLoading: botLoading,
        refetch: refetchBot,
    } = useBot(botId);

    const { updateBot, isMutating: saving } = useBots();

    const [hasChanges, setHasChanges] = useState(false);
    const [activeTab, setActiveTab] = useState('configuration');

    const { versions, isLoading: versionsLoading, mutate: mutateVersions } = useWidgetVersions(botId);
    const { deployments, isLoading: deploymentsLoading } = useWidgetDeployments(botId);

    const activeVersion = versions?.find(v => v.isActive && v.status === 'published');

    // Aligned with Backend Bot domain entity for Flat structure
    interface BotFormData {
        name: string;
        description: string;
        systemPrompt: string;
        aiProviderId: string | null;
        aiModelName: string;
        aiParameters: {
            temperature: number;
            maxTokens: number; // Corrected from max_tokens
        };
        enableAutoLearn: boolean;
        status: BotStatus;

        // Widget Config (Flat)
        widgetEnabled: boolean;
        welcomeMessage: string | null;
        placeholderText: string | null;
        primaryColor: string | null;
        widgetPosition: BotWidgetPosition;
        widgetButtonSize: BotWidgetButtonSize;
        showAvatar: boolean;
        showTimestamp: boolean;
    }

    const [formData, setFormData] = useState<BotFormData>({
        name: '',
        description: '',
        systemPrompt: '',
        aiProviderId: null,
        aiModelName: '',
        aiParameters: {
            temperature: 0.7,
            maxTokens: 1000,
        },
        enableAutoLearn: false,
        status: 'draft',

        widgetEnabled: true,
        welcomeMessage: '',
        placeholderText: '',
        primaryColor: '#667eea',
        widgetPosition: 'bottom-right',
        widgetButtonSize: 'medium',
        showAvatar: true,
        showTimestamp: true,
    });

    // Sync form data when bot is loaded
    useEffect(() => {
        if (bot) {
            setFormData({
                name: bot.name,
                description: bot.description || '',
                systemPrompt: bot.systemPrompt || '',
                aiProviderId: bot.aiProviderId || null,
                aiModelName: bot.aiModelName || '',
                aiParameters: {
                    temperature: bot.aiParameters?.temperature ?? 0.7,
                    maxTokens: bot.aiParameters?.maxTokens ?? 1000,
                },
                enableAutoLearn: bot.enableAutoLearn || false,
                status: bot.status || 'draft',

                widgetEnabled: bot.widgetEnabled ?? true,
                welcomeMessage: bot.welcomeMessage || '',
                placeholderText: bot.placeholderText || '',
                primaryColor: bot.primaryColor || '#667eea',
                widgetPosition: bot.widgetPosition || 'bottom-right',
                widgetButtonSize: bot.widgetButtonSize || 'medium',
                showAvatar: bot.showAvatar ?? true,
                showTimestamp: bot.showTimestamp ?? true,
            });
            setHasChanges(false);
        }
    }, [bot]);

    const handleChange = (updates: Partial<BotFormData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Identity identifier is required');
            return;
        }

        try {
            await updateBot({ id: botId, data: formData });
            setHasChanges(false);
            refetchBot();
        } catch { }
    };

    const isOnline = formData.status === 'active';

    if (botLoading && !bot) return <PageLoading message="Loading bot details..." />;

    if (!bot && !botLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <AlertCircle className="w-16 h-16 text-destructive/20 mb-4" />
                <h2 className="text-xl font-black mb-2">Bot Not Found</h2>
                <p className="text-muted-foreground text-sm font-medium">The requested bot could not be found in this workspace.</p>
                <Button variant="link" onClick={() => router.push('/bots')} className="mt-4">Back to Bots</Button>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto scrollbar-hide bg-grid-pattern">
            <div className="max-w-[1440px] mx-auto p-4 md:p-8">
                <PageHeader
                    title={bot?.name || 'Bot'}
                    description="Manage your bot settings and integrations"
                    onRefresh={refetchBot}
                    refreshing={botLoading}
                    premium
                >
                    <div className="flex items-center gap-3">

                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges}
                            loading={saving}
                            className="font-bold h-10 px-8 shadow-lg shadow-primary/20"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </PageHeader>

                {hasChanges && (
                    <Card className="mb-8 border-amber-500/20 bg-amber-500/5 animate-in fade-in slide-in-from-top-4">
                        <CardContent className="py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                                <RefreshCw className="w-5 h-5 animate-spin-slow" />
                                <p className="text-sm font-black tracking-tight uppercase">You have unsaved changes</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                    <TabsHeader>
                        <TabsList variant="pills">
                            {[
                                { value: 'configuration', label: 'General', icon: BotIcon },
                                { value: 'knowledge-base', label: 'Knowledge Base', icon: Code },
                                { value: 'channels', label: 'Channels', icon: Palette },
                                { value: 'widget', label: 'Interface', icon: History },
                                { value: 'settings', label: 'Settings', icon: Clock }
                            ].map((tab) => (
                                <TabsTrigger key={tab.value} value={tab.value} variant="pills">
                                    <tab.icon className="w-3.5 h-3.5 mr-2" />
                                    <span className="font-bold text-xs">{tab.label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </TabsHeader>

                    <div className="mt-8">
                        <TabsContent value="configuration" className="m-0 focus-visible:outline-none">
                            <BotConfigurationTab formData={formData} onChange={handleChange} workspaceId={bot?.workspaceId} />
                        </TabsContent>

                        <TabsContent value="knowledge-base" className="m-0 focus-visible:outline-none">
                            <BotKnowledgeBaseSection botId={botId} workspaceId={bot?.workspaceId} onRefresh={refetchBot} />
                        </TabsContent>

                        <TabsContent value="channels" className="m-0 focus-visible:outline-none">
                            <BotChannelsSection botId={botId} botChannels={botChannels} onRefresh={refetchBot} workspaceId={bot?.workspaceId} />
                        </TabsContent>

                        <TabsContent value="widget" className="m-0 focus-visible:outline-none">
                            <BotGlobalInterfaceTab
                                botId={botId}
                                formData={formData}
                                onChange={handleChange}
                            />
                        </TabsContent>

                        <TabsContent value="settings" className="m-0 focus-visible:outline-none">
                            <BotSettingsTab
                                enableAutoLearn={formData.enableAutoLearn}
                                status={formData.status}
                                onChange={(updates) => handleChange(updates)}
                                onDelete={() => router.push('/bots')}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
