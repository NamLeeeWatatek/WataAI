import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useBotForm } from '@/lib/hooks/useBotForm'
import { Bot } from '@/lib/types/bots';
import { Badge } from '@/components/ui/Badge';
import { Tag, Plus, X } from 'lucide-react';
import { UnifiedAvatarUpload } from '@/components/shared/UnifiedFileUpload';

interface BotDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    bot?: Bot | null
    workspaceId: string
}

import { useTranslation } from 'react-i18next'

export function BotDialog({ open, onOpenChange, bot, workspaceId }: BotDialogProps) {
    const { t } = useTranslation()
    const { form, handleSubmit, isSubmitting, errors } = useBotForm(workspaceId, bot || undefined)

    const onSubmit = async (data: any) => {
        await handleSubmit(data)
        form.reset()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{bot ? t('bots.editBot', { defaultValue: 'Edit Bot' }) : t('bots.createNewAgent', { defaultValue: 'Create New Bot' })}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        {form.formState.errors.root && (
                            <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-sm text-destructive">
                                <span className="font-medium">Error:</span>
                                {form.formState.errors.root.message}
                            </div>
                        )}
                        <FormField
                            control={form.control}
                            name="avatarUrl"
                            render={({ field }) => (
                                <FormItem className="flex flex-col items-center justify-center mb-6">
                                    <div className="w-32 h-32">
                                        <UnifiedAvatarUpload
                                            value={field.value}
                                            onChange={(url) => field.onChange(url as string)}
                                            className="w-full h-full"
                                        />
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('bots.botName', { defaultValue: 'Name' })}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('bots.botNamePlaceholder', { defaultValue: 'Customer Support Bot' })} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('bots.descriptionLabel', { defaultValue: 'Description' })}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('bots.descriptionPlaceholder', { defaultValue: 'Handles customer inquiries...' })}
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="defaultLanguage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('bots.language', { defaultValue: 'Language' })}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="en" {...field} />
                                        </FormControl>
                                        <FormDescription>Default: en</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="timezone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('bots.timezone', { defaultValue: 'Timezone' })}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="UTC" {...field} />
                                        </FormControl>
                                        <FormDescription>Default: UTC</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="tags"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('bot_config.purpose_tags', { defaultValue: 'Purpose Tags' })}</FormLabel>
                                    <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px] p-2 border border-border/40 rounded-xl bg-muted/10">
                                        {field.value?.map((tag: string) => (
                                            <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-0.5 gap-1 text-[10px] font-bold bg-primary/5 hover:bg-primary/10 border-primary/20 transition-all">
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => field.onChange(field.value.filter((t: string) => t !== tag))}
                                                    className="p-0.5 hover:bg-destructive/20 rounded-full transition-colors"
                                                >
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </Badge>
                                        ))}
                                        {(!field.value || field.value.length === 0) && (
                                            <span className="text-[10px] text-muted-foreground/50 self-center px-1 italic">{t('bot_config.no_tags', { defaultValue: 'No tags added yet' })}</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder={t('bot_config.tags_placeholder', { defaultValue: 'Support, Marketing, Sales...' })}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const val = e.currentTarget.value.trim();
                                                    if (val && !field.value.includes(val)) {
                                                        field.onChange([...field.value, val]);
                                                        e.currentTarget.value = '';
                                                    }
                                                }
                                            }}
                                            className="h-9 text-xs bg-background/50"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/60 italic pl-1">{t('bot_config.press_enter_tags', { defaultValue: 'Press Enter to add tags quickly' })}</p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                {t('bots.cancel', { defaultValue: 'Cancel' })}
                            </Button>
                            <Button type="submit" loading={form.formState.isSubmitting}>
                                {bot ? t('bots.update', { defaultValue: 'Update' }) : t('bots.createAgent', { defaultValue: 'Create' })}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
