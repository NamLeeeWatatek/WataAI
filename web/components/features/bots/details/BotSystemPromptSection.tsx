'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';

interface BotSystemPromptSectionProps {
    systemPrompt: string;
    onChange: (systemPrompt: string) => void;
}

export function BotSystemPromptSection({ systemPrompt, onChange }: BotSystemPromptSectionProps) {
    const { t } = useTranslation();

    return (
        <Card className="lg:col-span-2 border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden flex flex-col">
            <CardHeader className="flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">{t('bot_config.system_prompt', 'System Prompt')}</CardTitle>
                        <CardDescription className="text-xs font-medium text-muted-foreground/60">{t('bot_config.prompt_desc', 'Set rules and personality')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pt-2 min-h-[450px]">
                <Textarea
                    value={systemPrompt}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={t('bot_config.prompt_placeholder', 'You are a helpful assistant...')}
                    className="flex-1 resize-none font-mono text-sm p-5 bg-background/30 scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-primary/30 border-none outline-none ring-0 focus-visible:ring-0"
                />
            </CardContent>
        </Card>
    );
}
