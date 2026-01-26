'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoading } from '@/components/shared/PageLoading';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsHeader } from '@/components/ui/Tabs';
import {
    CheckCircle2,
    Save,
    AlertCircle,
    Bot as BotIcon,
    Palette,
    Code,
    History,
    Clock,
    RefreshCw,
    BarChart3,
    BrainCircuit,
    Share2,
    Layout,
    Rocket
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
import { BotPerformanceTab } from '@/components/features/bots/BotPerformanceTab';

import { PageHeader } from '@/components/shared/PageHeader';
import { useBot, useBots } from '@/lib/hooks/features/useBots';
import { useBotConversations } from '@/lib/hooks/features/useBotConversations';
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

    const { updateBot, isMutating: saving, deleteBot } = useBots();
    const { total: totalServed } = useBotConversations({ botId, source: 'widget', limit: 0 });

    const [hasChanges, setHasChanges] = useState(false);
    const [activeTab, setActiveTab] = useState('configuration');
    const { t } = useTranslation();

    const { versions, isLoading: versionsLoading, mutate: mutateVersions } = useWidgetVersions(botId);
    const { deployments, isLoading: deploymentsLoading } = useWidgetDeployments(botId);

    const activeVersion = versions?.find(v => v.isActive && v.status === 'published');

    // Aligned with Backend Bot domain entity for Flat structure
    interface BotFormData {
        name: string;
        description: string;
        avatarUrl: string | null;
        systemPrompt: string;
        aiProviderId: string | null;
        aiModelName: string;
        aiParameters: {
            temperature: number;
            maxTokens: number; // Corrected from max_tokens
        };
        enableAutoLearn: boolean;
        status: BotStatus;
        tags: string[];

        // Widget Config (Flat)
        widgetEnabled: boolean;
        welcomeMessage: string | null;
        placeholderText: string | null;
        primaryColor: string | null;
        widgetPosition: BotWidgetPosition;
        widgetButtonSize: BotWidgetButtonSize;
        showAvatar: boolean;
        showTimestamp: boolean;
        borderRadius: number;
        glassmorphism: boolean;
        headerStyle: 'solid' | 'minimal' | 'gradient';
        botMessageColor: string;
        botMessageTextColor: string;
        userMessageColor: string;
        userMessageTextColor: string;
    }

    const [formData, setFormData] = useState<BotFormData>({
        name: '',
        description: '',
        avatarUrl: null,
        systemPrompt: '',
        aiProviderId: null,
        aiModelName: '',
        aiParameters: {
            temperature: 0.7,
            maxTokens: 1000,
        },
        enableAutoLearn: false,
        status: 'draft',
        tags: [],

        widgetEnabled: true,
        welcomeMessage: '',
        placeholderText: '',
        primaryColor: '#667eea',
        widgetPosition: 'bottom-right',
        widgetButtonSize: 'medium',
        showAvatar: true,
        showTimestamp: true,
        borderRadius: 16,
        glassmorphism: true,
        headerStyle: 'solid',
        botMessageColor: '#f3f4f6',
        botMessageTextColor: '#1f2937',
        userMessageColor: '#667eea',
        userMessageTextColor: '#ffffff',
    });

    // Sync form data when bot is loaded
    useEffect(() => {
        if (bot) {
            setFormData({
                name: bot.name,
                description: bot.description || '',
                avatarUrl: bot.avatarUrl || null,
                systemPrompt: bot.systemPrompt || '',
                aiProviderId: bot.aiConfigId || bot.aiProviderId || null,
                aiModelName: bot.aiModelName || '',
                aiParameters: {
                    temperature: bot.aiParameters?.temperature ?? 0.7,
                    maxTokens: bot.aiParameters?.maxTokens ?? 1000,
                },
                enableAutoLearn: bot.enableAutoLearn || false,
                status: bot.status || 'draft',
                tags: bot.tags || [],

                widgetEnabled: bot.widgetEnabled ?? true,
                welcomeMessage: bot.welcomeMessage || '',
                placeholderText: bot.placeholderText || '',
                primaryColor: bot.primaryColor || '#667eea',
                widgetPosition: bot.widgetPosition || 'bottom-right',
                widgetButtonSize: bot.widgetButtonSize || 'medium',
                showAvatar: bot.showAvatar ?? true,
                showTimestamp: bot.showTimestamp ?? true,
                borderRadius: bot.borderRadius ?? 16,
                glassmorphism: bot.glassmorphism ?? true,
                headerStyle: bot.headerStyle || 'solid',
                botMessageColor: (bot as any).botMessageColor || '#f3f4f6',
                botMessageTextColor: (bot as any).botMessageTextColor || '#1f2937',
                userMessageColor: (bot as any).userMessageColor || '#667eea',
                userMessageTextColor: (bot as any).userMessageTextColor || '#ffffff',
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
            toast.error(t('bots.errorNameRequired'));
            return;
        }

        try {
            await updateBot({ id: botId, data: formData });
            setHasChanges(false);
            refetchBot();
        } catch { }
    };

    const isOnline = formData.status === 'active';

    if (botLoading && !bot) return <PageLoading message={t('bots.loadingDetails')} />;

    if (!bot && !botLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <AlertCircle className="w-16 h-16 text-destructive/20 mb-4" />
                <h2 className="text-xl font-black mb-2">{t('bots.notFound')}</h2>
                <p className="text-muted-foreground text-sm font-medium">{t('bots.notFoundDesc')}</p>
                <Button variant="link" onClick={() => router.push('/bots')} className="mt-4">{t('bots.backToBots')}</Button>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto scrollbar-hide bg-grid-pattern">
            <div className="max-w-[1440px] mx-auto p-4 md:p-8">
                <PageHeader
                    title={bot?.name || 'Bot'}
                    description={t('bots.manageInstructions')}
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
                            {t('bots.saveChanges')}
                        </Button>
                    </div>
                </PageHeader>

                {hasChanges && (
                    <Card className="mb-8 border-amber-500/20 bg-amber-500/5 animate-in fade-in slide-in-from-top-4">
                        <CardContent className="py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                                <RefreshCw className="w-5 h-5 animate-spin-slow" />
                                <p className="text-sm font-black tracking-tight uppercase">{t('bots.unsavedChanges')}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                    <TabsHeader>
                        <TabsList variant="pills" className="bg-muted/20 p-1 border border-border/40">
                            {[
                                { value: 'configuration', label: t('ai.configuration', 'AI Brain'), icon: BrainCircuit },
                                { value: 'knowledge-base', label: t('dashboard.knowledgeBase', 'Knowledge'), icon: Code },
                                { value: 'channels', label: t('dashboard.channels', 'Connect'), icon: Share2 },
                                { value: 'widget', label: t('common.appearance', 'Interface'), icon: Layout },
                                { value: 'performance', label: t('dashboard.stats.conversations', 'Analytics'), icon: BarChart3 },
                                { value: 'settings', label: t('common.settings', 'Settings'), icon: Clock }
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    variant="pills"
                                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary"
                                >
                                    <tab.icon className="w-4 h-4 mr-2" />
                                    <span className="font-bold text-xs uppercase tracking-wider">{tab.label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </TabsHeader>

                    <div className="mt-8">
                        <TabsContent value="configuration" className="m-0 focus-visible:outline-none">
                            <BotConfigurationTab
                                formData={formData}
                                onChange={handleChange}
                                workspaceId={bot?.workspaceId}
                                totalServed={totalServed}
                            />
                        </TabsContent>

                        <TabsContent value="performance" className="m-0 focus-visible:outline-none">
                            <BotPerformanceTab botId={botId} />
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
                                onDelete={async () => {
                                    try {
                                        await deleteBot(botId);
                                        router.push('/bots');
                                    } catch (e) { }
                                }}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
