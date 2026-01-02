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
    Eye,
    EyeOff
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { botsApi } from '@/lib/api/bots';
import axiosClient from '@/lib/axios-client';

import {
    BotConfigurationTab
} from '@/components/features/bots/BotConfigurationTab';
import { BotKnowledgeBaseSection } from '@/components/features/bots/BotKnowledgeBaseSection';
import { BotChannelsSection } from '@/components/features/bots/BotChannelsSection';
import { BotSettingsTab } from '@/components/features/bots/BotSettingsTab';
import { WidgetAppearanceSettings } from '@/components/features/widget/WidgetAppearanceSettings';
import { WidgetDeploymentHistory } from '@/components/features/widget/WidgetDeploymentHistory';
import { WidgetEmbedCode } from '@/components/features/widget/WidgetEmbedCode';
import { WidgetVersionsList } from '@/components/features/widget/WidgetVersionsList';
import { useWidgetVersions, useWidgetDeployments } from '@/lib/hooks/use-widget-versions';

import { PageHeader } from '@/components/ui/PageHeader';

export default function BotDetailPage() {
    const params = useParams();
    const router = useRouter();
    const botId = params.id as string;

    if (!botId || botId === 'undefined' || botId === 'null') {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                    <p className="text-muted-foreground">Invalid bot ID</p>
                </div>
            </div>
        );
    }

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [bot, setBot] = useState<any>(null);
    const [botChannels, setBotChannels] = useState<any[]>([]);
    const [botSettings, setBotSettings] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('configuration');

    const { versions, isLoading: versionsLoading, mutate: mutateVersions } = useWidgetVersions(botId);
    const { deployments, isLoading: deploymentsLoading } = useWidgetDeployments(botId);

    const activeVersion = versions?.find(v => v.isActive && v.status === 'published');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        systemPrompt: '',
        aiProviderId: undefined as string | undefined,
        aiModelName: '',
        aiParameters: {
            temperature: 0.7,
            max_tokens: 1000,
        },
        enableAutoLearn: false,
        isActive: false,
    });

    useEffect(() => {
        loadBot();
        loadAppearanceSettings();
    }, [botId]);

    const loadBot = async () => {
        try {
            setLoading(true);
            const [data, channels] = await Promise.all([
                botsApi.getOne(botId),
                botsApi.getChannels(botId)
            ]);

            setBot(data);
            setBotChannels(channels);

            setFormData({
                name: data.name,
                description: data.description || '',
                systemPrompt: data.systemPrompt || '',
                aiProviderId: data.aiProviderId || undefined,
                aiModelName: data.aiModelName || '',
                aiParameters: (data.aiParameters as { temperature: number; max_tokens: number }) || { temperature: 0.7, max_tokens: 1000 },
                enableAutoLearn: data.enableAutoLearn || false,
                isActive: data.isActive || false,
            });
        } catch {
            toast.error('Failed to load bot');
        } finally {
            setLoading(false);
        }
    };

    const loadAppearanceSettings = async () => {
        try {
            const response = await axiosClient.get(`/bots/${botId}/widget/appearance`);
            setBotSettings(response);
        } catch {
            // Ignore if settings don't exist yet
        }
    };

    const handleChange = (updates: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Bot name is required');
            return;
        }

        try {
            setSaving(true);
            const cleanData: any = {};
            Object.keys(formData).forEach(key => {
                const value = (formData as any)[key];
                if (value !== undefined && value !== null && value !== '') {
                    cleanData[key] = value;
                }
            });

            console.log('[Bot Save] Sending data:', cleanData);
            await botsApi.update(botId, cleanData);
            toast.success('Bot updated successfully');
            setHasChanges(false);
            loadBot();
        } catch {
            toast.error('Failed to save bot');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAppearance = async (settings: any) => {
        try {
            await axiosClient.put(`/bots/${botId}/widget/appearance`, {
                primaryColor: settings.primaryColor,
                backgroundColor: settings.backgroundColor,
                botMessageColor: settings.botMessageColor,
                botMessageTextColor: settings.botMessageTextColor,
                fontFamily: settings.fontFamily,
                position: settings.widgetPosition,
                buttonSize: settings.widgetButtonSize,
                welcomeMessage: settings.welcomeMessage,
                placeholderText: settings.placeholderText,
                showAvatar: settings.showAvatar,
                showTimestamp: settings.showTimestamp,
            });
            await loadAppearanceSettings();
            toast.success('Appearance updated');
        } catch {
            toast.error('Failed to update appearance');
        }
    };

    if (loading) {
        return <PageLoading message="Loading bot" />;
    }

    if (!bot) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Bot not found</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto scrollbar-hide">
            <div className="max-w-[1440px] mx-auto p-4 md:p-8">
                <PageHeader
                    title={bot.name}
                    description="Configure and manage your chatbot settings"
                    onRefresh={loadBot}
                    refreshing={loading}
                    premium
                >
                    <div className="flex items-center gap-3">
                        <Badge
                            variant={bot.isActive ? "default" : "secondary"}
                        >
                            {bot.isActive ? <Eye className="w-3.5 h-3.5 mr-1.5" /> : <EyeOff className="w-3.5 h-3.5 mr-1.5" />}
                            {bot.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges}
                            loading={saving}
                            className="font-bold h-10 px-6"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </PageHeader>

                {hasChanges && (
                    <Card className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="h-1 w-full bg-amber-500 animate-pulse" />
                        <CardContent className="py-4">
                            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="text-sm font-bold tracking-tight">
                                    You have unsaved changes. Don't forget to push your updates!
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                    <TabsHeader>
                        <TabsList variant="pills" className="grid grid-cols-2 md:flex w-full md:w-auto">
                            {[
                                { value: 'configuration', label: 'Configuration', icon: BotIcon },
                                { value: 'knowledge-base', label: 'Knowledge Base', icon: Code },
                                { value: 'channels', label: 'Channels', icon: Palette },
                                { value: 'widget', label: 'Widget', icon: History },
                                { value: 'settings', label: 'Settings', icon: Clock }
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    variant="pills"
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </TabsHeader>

                    <div className="space-y-6">
                        <TabsContent value="configuration" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <BotConfigurationTab formData={formData} onChange={handleChange} workspaceId={bot?.workspaceId} />
                        </TabsContent>

                        <TabsContent value="knowledge-base" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <BotKnowledgeBaseSection
                                botId={botId}
                                workspaceId={bot?.workspaceId}
                                onRefresh={loadBot}
                            />
                        </TabsContent>

                        <TabsContent value="channels" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <BotChannelsSection
                                botId={botId}
                                botChannels={botChannels}
                                onRefresh={loadBot}
                            />
                        </TabsContent>

                        <TabsContent value="widget" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-3">
                                        <Palette className="w-6 h-6 text-primary" />
                                        Widget Appearance
                                    </h2>
                                    <p className="text-sm font-medium text-muted-foreground/60 mb-8">Customize the visual identity and messaging protocol of your chat widget</p>

                                    {!botSettings ? (
                                        <Card className="border-dashed">
                                            <CardContent className="py-16">
                                                <div className="text-center">
                                                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
                                                    <p className="text-sm font-bold text-muted-foreground tracking-tight">Synchronizing appearance protocol...</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <WidgetAppearanceSettings
                                            botId={botId}
                                            currentSettings={{
                                                primaryColor: botSettings.primaryColor,
                                                backgroundColor: botSettings.backgroundColor,
                                                botMessageColor: botSettings.botMessageColor,
                                                botMessageTextColor: botSettings.botMessageTextColor,
                                                fontFamily: botSettings.fontFamily,
                                                widgetPosition: botSettings.widgetPosition,
                                                widgetButtonSize: botSettings.widgetButtonSize,
                                                welcomeMessage: botSettings.welcomeMessage,
                                                placeholderText: botSettings.placeholderText,
                                                showAvatar: botSettings.showAvatar,
                                                showTimestamp: botSettings.showTimestamp,
                                            }}
                                            onSave={handleSaveAppearance}
                                        />
                                    )}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-border/40">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div>
                                            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                                                <Code className="w-5 h-5 text-primary" />
                                                Integration Protocol
                                            </h3>
                                            <p className="text-sm font-medium text-muted-foreground/60 mb-6">Deploy this script to your host environment to enable the widget</p>
                                            <WidgetEmbedCode botId={botId} activeVersion={activeVersion} />
                                        </div>
                                    </div>

                                    <div className="lg:col-span-1 space-y-8">
                                        <div>
                                            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                                                <History className="w-5 h-5 text-primary" />
                                                Version Control
                                            </h3>
                                            <p className="text-sm font-medium text-muted-foreground/60 mb-6">Historical iterations and snapshots</p>
                                            <WidgetVersionsList botId={botId} versions={versions || []} isLoading={versionsLoading} onRefresh={mutateVersions} />
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-primary" />
                                                Deployment Ledger
                                            </h3>
                                            <p className="text-sm font-medium text-muted-foreground/60 mb-6">Recent distribution and traffic activity</p>
                                            <WidgetDeploymentHistory deployments={deployments || []} isLoading={deploymentsLoading} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="settings" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <BotSettingsTab
                                enableAutoLearn={formData.enableAutoLearn}
                                onChange={(enableAutoLearn) => handleChange({ enableAutoLearn })}
                                onDelete={() => {
                                    router.push('/bots');
                                }}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
