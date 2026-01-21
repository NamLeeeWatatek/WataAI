import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Palette, Rocket, History, Code, Plus } from 'lucide-react';
import { WidgetAppearanceSettings } from '@/components/features/widget/WidgetAppearanceSettings';
import { WidgetEmbedCode } from '@/components/features/widget/WidgetEmbedCode';
import { WidgetVersionsList } from '@/components/features/widget/WidgetVersionsList';
import { WidgetDeploymentHistory } from '@/components/features/widget/WidgetDeploymentHistory';
import { useWidgetVersions, useWidgetDeployments, useWidgetVersionActions } from '@/lib/hooks/use-widget-versions';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { toast } from '@/lib/toast';

interface Props {
    botId: string;
    formData: any;
    onChange: (updates: any) => void;
}

export function BotGlobalInterfaceTab({ botId, formData, onChange }: Props) {
    const { t } = useTranslation();
    const [subTab, setSubTab] = useState('identity');
    const { versions, isLoading: versionsLoading, mutate: mutateVersions } = useWidgetVersions(botId);
    const { deployments, isLoading: deploymentsLoading } = useWidgetDeployments(botId);
    const { createVersion, isSubmitting } = useWidgetVersionActions(botId);

    const activeVersion = versions?.find(v => v.isActive && v.status === 'published');

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newVersion, setNewVersion] = useState('');
    const [changelog, setChangelog] = useState('');

    const handleCreateVersion = async () => {
        if (!newVersion) {
            toast.error('Version identifier is required');
            return;
        }

        try {
            await createVersion({
                version: newVersion,
                config: formData,
                changelog: changelog
            });
            setIsCreateOpen(false);
            setNewVersion('');
            setChangelog('');
            mutateVersions();
            // Optional: Switch to deployment tab to see it
        } catch (error) { }
    };

    return (
        <Tabs value={subTab} onValueChange={setSubTab} className="w-full flex flex-col space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        {subTab === 'identity' ? <Palette className="w-5 h-5 text-primary" /> : <Rocket className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight mb-1 text-foreground">
                            {subTab === 'identity' && 'Interface Identity'}
                            {subTab === 'deployment' && 'Deployment Operations'}
                        </h2>
                        <p className="text-xs font-medium text-muted-foreground/60">
                            {subTab === 'identity' && 'Synchronize the visual aesthetics and messaging protocols of the public widget'}
                            {subTab === 'deployment' && 'Manage deployment versions, rollbacks, and integration scripts'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {subTab === 'deployment' && (
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="font-bold shadow-lg shadow-primary/20">
                                    <Plus className="w-4 h-4 mr-2" />
                                    {t('ai.snapshotVersion', 'Snapshot Version')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{t('ai.createSnapshot', 'Create Version Snapshot')}</DialogTitle>
                                    <DialogDescription>
                                        {t('ai.createSnapshotDesc', 'Create a frozen snapshot of the current interface configuration.')}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>{t('ai.versionIdentifier', 'Version Identifier')}</Label>
                                        <Input
                                            placeholder="e.g. v1.0.2-beta"
                                            value={newVersion}
                                            onChange={(e) => setNewVersion(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('ai.changelog', 'Changelog / Notes')}</Label>
                                        <Textarea
                                            placeholder={t('ai.changelogPlaceholder', 'Describe changes in this version...')}
                                            value={changelog}
                                            onChange={(e) => setChangelog(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
                                    <Button onClick={handleCreateVersion} disabled={isSubmitting} loading={isSubmitting}>{t('ai.create', 'Create Snapshot')}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                    <TabsList variant="pills" className="bg-muted/50">
                        <TabsTrigger value="identity" variant="pills">
                            <Palette className="w-3.5 h-3.5 mr-2" />
                            <span className="font-bold text-xs">{t('common.appearance', 'Designer')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="deployment" variant="pills">
                            <Rocket className="w-3.5 h-3.5 mr-2" />
                            <span className="font-bold text-xs">{t('dashboard.deployment', 'Deployment')}</span>
                        </TabsTrigger>
                    </TabsList>
                </div>
            </div>

            <TabsContent value="identity" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                <WidgetAppearanceSettings
                    botId={botId}
                    currentSettings={formData}
                    onSave={(updated) => onChange(updated)}
                />
            </TabsContent>

            <TabsContent value="deployment" className="m-0 focus-visible:outline-none space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Integration Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Code className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-black text-sm uppercase tracking-wider text-muted-foreground">Integration Matrix</h3>
                    </div>
                    <WidgetEmbedCode botId={botId} activeVersion={activeVersion} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-12 border-t border-border/10">
                    {/* Version Management */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-secondary/10 rounded-lg">
                                <History className="w-4 h-4 text-secondary-foreground" />
                            </div>
                            <h3 className="font-black text-sm uppercase tracking-wider text-muted-foreground">Version Control</h3>
                        </div>
                        <WidgetVersionsList
                            botId={botId}
                            versions={versions || []}
                            isLoading={versionsLoading}
                            onRefresh={mutateVersions}
                        />
                    </div>

                    {/* Ledger / History */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-muted rounded-lg">
                                <History className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <h3 className="font-black text-sm uppercase tracking-wider text-muted-foreground">Deployment Ledger</h3>
                        </div>
                        <WidgetDeploymentHistory
                            deployments={deployments || []}
                            isLoading={deploymentsLoading}
                        />
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    );
}
