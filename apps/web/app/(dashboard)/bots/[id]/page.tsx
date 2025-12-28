'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoading } from '@/components/ui/PageLoading';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
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
            await axiosClient.patch(`/bots/${botId}/widget/appearance`, {
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
        <div className="h-full overflow-y-auto">
            <div className="max-w-7xl mx-auto p-8">
                <PageHeader
                    title={bot.name}
                    description="Configure and manage your chatbot settings"
                    icon={BotIcon}
                    onRefresh={loadBot}
                    refreshing={loading}
                    premium
                >
                    <div className="flex items-center gap-3">
                        <Badge
                            variant={bot.isActive ? "default" : "secondary"}
                            className={bot.isActive ? "bg-green-500 hover:bg-green-600 px-3 py-1 font-bold" : ""}
                        >
                            {bot.isActive ? <Eye className="w-3.5 h-3.5 mr-1.5" /> : <EyeOff className="w-3.5 h-3.5 mr-1.5" />}
                            {bot.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges}
                            loading={saving}
                            className="rounded-xl shadow-lg shadow-primary/20 h-10 px-6 font-bold"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </PageHeader>

                {hasChanges && (
                    <Card className="mb-8 border-amber-500/20 bg-amber-500/5 backdrop-blur-md rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 group">
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

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
                    <TabsList className="flex flex-wrap h-auto p-1.5 bg-card/30 backdrop-blur-md border border-border/50 gap-1 rounded-2xl shadow-sm">
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
                                className="flex items-center gap-2 px-6 py-3 transition-all data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:ring-1 data-[state=active]:ring-border/50 font-bold text-xs rounded-xl"
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="configuration" className="mt-6">
                        <BotConfigurationTab formData={formData} onChange={handleChange} />
                    </TabsContent>

                    <TabsContent value="knowledge-base" className="mt-6">
                        <BotKnowledgeBaseSection
                            botId={botId}
                            workspaceId={bot?.workspaceId}
                            onRefresh={loadBot}
                        />
                    </TabsContent>

                    <TabsContent value="channels" className="mt-6">
                        <BotChannelsSection
                            botId={botId}
                            botChannels={botChannels}
                            onRefresh={loadBot}
                        />
                    </TabsContent>

                    <TabsContent value="widget" className="mt-6">
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <Palette className="w-6 h-6 text-primary" />
                                    Appearance
                                </h2>
                                <p className="text-muted-foreground mb-6">Customize the visual appearance and messaging of your chat widget</p>

                                {!botSettings ? (
                                    <Card>
                                        <CardContent className="py-8">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                                <p className="text-muted-foreground">Loading appearance settings...</p>
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

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <Code className="w-5 h-5 text-primary" />
                                        Embed Code
                                    </h3>
                                    <p className="text-muted-foreground mb-4">Copy this code to install your widget on any website</p>
                                    <WidgetEmbedCode botId={botId} activeVersion={activeVersion} />
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                            <History className="w-5 h-5 text-primary" />
                                            Versions
                                        </h3>
                                        <WidgetVersionsList botId={botId} versions={versions || []} isLoading={versionsLoading} onRefresh={mutateVersions} />
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-primary" />
                                            Deployments
                                        </h3>
                                        <WidgetDeploymentHistory deployments={deployments || []} isLoading={deploymentsLoading} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="mt-6">
                        <BotSettingsTab
                            enableAutoLearn={formData.enableAutoLearn}
                            onChange={(enableAutoLearn) => handleChange({ enableAutoLearn })}
                            onDelete={() => {
                                router.push('/bots');
                            }}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
