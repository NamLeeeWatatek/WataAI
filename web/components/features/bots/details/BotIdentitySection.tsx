'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings2, Eye, EyeOff, Plus, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { UnifiedFileUpload } from '@/components/shared/UnifiedFileUpload';
import { BotStatus } from '@/lib/types/bots';

interface BotFormData {
    name: string;
    description: string;
    avatarUrl: string | null;
    status: BotStatus;
    tags: string[];
}

interface BotIdentitySectionProps {
    formData: BotFormData;
    onChange: (updates: Partial<BotFormData>) => void;
}

export function BotIdentitySection({ formData, onChange }: BotIdentitySectionProps) {
    const { t } = useTranslation();
    const [currentTag, setCurrentTag] = useState('');
    const isOnline = formData.status === 'active';

    const handleAddTag = () => {
        if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
            onChange({ tags: [...formData.tags, currentTag.trim()] });
            setCurrentTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        onChange({ tags: formData.tags.filter(t => t !== tagToRemove) });
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    return (
        <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <Settings2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">{t('bot_config.identity', 'Identity')}</CardTitle>
                        <CardDescription className="text-xs font-medium text-muted-foreground/60">{t('bot_config.identity_desc', 'Basic personality and status')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid gap-8 pt-2">
                <div className="grid gap-6">
                    <div className="space-y-2.5">
                        <Label htmlFor="avatar" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{t('bot_config.avatar', 'Avatar')}</Label>
                        <div className="flex gap-6 items-center">
                            <UnifiedFileUpload
                                variant="avatar"
                                value={formData.avatarUrl}
                                onChange={(value) => {
                                    if (typeof value === 'string') onChange({ avatarUrl: value });
                                    else if (Array.isArray(value) && value.length > 0) onChange({ avatarUrl: value[0] });
                                    else onChange({ avatarUrl: null });
                                }}
                                maxSize={2 * 1024 * 1024}
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                className="h-24 w-24"
                            />
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground/80 lowercase">
                                    {t('bot_config.supported_formats', 'PNG, JPEG, WebP, SVG')}
                                </p>
                                <p className="text-[10px] text-muted-foreground/60 italic">
                                    {t('bot_config.max_size', 'Max 2MB')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{t('bot_config.name', 'Bot Name')}</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => onChange({ name: e.target.value })}
                            placeholder={t('bot_config.name_placeholder', 'Enter bot name...')}
                            className="bg-background/50 h-11"
                        />
                    </div>

                    <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{t('bot_config.protocol_status', 'Status')}</Label>
                            <Badge variant={isOnline ? "default" : "secondary"} className="font-black px-2 py-0.5">
                                {t(`bots.${formData.status}`, formData.status).toUpperCase()}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 border border-border/40 rounded-2xl bg-muted/20">
                            <div className="space-y-1">
                                <span className="text-sm font-bold tracking-tight flex items-center gap-2">
                                    {isOnline ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    {t('bot_config.online_visibility', 'Online Visibility')}
                                </span>
                                <p className="text-[10px] font-medium text-muted-foreground/70">{t('bot_config.visibility_desc', 'Switch bot status')}</p>
                            </div>
                            <Switch
                                id="status"
                                checked={isOnline}
                                onCheckedChange={(checked) => onChange({ status: checked ? 'active' : 'paused' })}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2.5">
                    <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{t('bot_config.description', 'Description')}</Label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => onChange({ description: e.target.value })}
                        placeholder={t('bot_config.description_placeholder', 'Brief description...')}
                        className="resize-none min-h-[120px] bg-background/50"
                        rows={2}
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{t('bot_config.purpose_tags', 'Purpose Tags')}</Label>
                    <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px] p-2 border border-border/40 rounded-xl bg-muted/10">
                        {formData.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-0.5 gap-1 text-[10px] font-bold bg-primary/5 hover:bg-primary/10 border-primary/20 transition-all">
                                {tag}
                                <button
                                    onClick={() => handleRemoveTag(tag)}
                                    className="p-0.5 hover:bg-destructive/20 rounded-full transition-colors"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            </Badge>
                        ))}
                        {(!formData.tags || formData.tags.length === 0) && (
                            <span className="text-[10px] text-muted-foreground/50 self-center px-1 italic">{t('bot_config.no_tags', 'No tags')}</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={currentTag}
                            onChange={(e) => setCurrentTag(e.target.value)}
                            onKeyDown={handleTagInputKeyDown}
                            placeholder={t('bot_config.tags_placeholder', 'Add a tag...')}
                            className="h-9 text-xs bg-background/50"
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleAddTag}
                            className="h-9 px-3 border-dashed"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 italic pl-1">{t('bot_config.press_enter_tags', 'Press Enter to add')}</p>
                </div>
            </CardContent>
        </Card>
    );
}
