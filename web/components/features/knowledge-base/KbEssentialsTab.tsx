import { UseFormReturn } from 'react-hook-form'
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Switch } from '@/components/ui/Switch'
import { KbFormValues } from './schema'

interface KbEssentialsTabProps {
    form: UseFormReturn<KbFormValues>
}

import { useTranslation } from 'react-i18next'

export function KbEssentialsTab({ form }: KbEssentialsTabProps) {
    const { t } = useTranslation()
    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <div className="flex-1">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('knowledgeBase.nameLabel', { defaultValue: 'Knowledge Name' })}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t('knowledgeBase.namePlaceholder', { defaultValue: 'E.g., Engineering Docs' })} {...field} className="h-11 font-bold" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="w-24">
                    <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('knowledgeBase.themeColor', { defaultValue: 'Theme' })}</FormLabel>
                                <div className="flex relative">
                                    <Input
                                        type="color"
                                        {...field}
                                        className="w-full h-11 p-1 cursor-pointer absolute opacity-0"
                                    />
                                    <div
                                        className="w-full h-11 rounded-md border shadow-sm flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                                        style={{ backgroundColor: field.value }}
                                    >
                                        <span className="text-[10px] font-mono mix-blend-difference text-white/80">{field.value}</span>
                                    </div>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('knowledgeBase.descriptionLabel', { defaultValue: 'Description' })}</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder={t('knowledgeBase.descriptionPlaceholder', { defaultValue: 'What knowledge does this engine contain?' })}
                                className="resize-none min-h-[120px] leading-relaxed"
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 border rounded-xl bg-muted/30 space-y-0">
                        <div className="space-y-1">
                            <FormLabel className="text-sm font-bold">{t('knowledgeBase.accessLevel', { defaultValue: 'Public Access' })}</FormLabel>
                            <p className="text-[11px] text-muted-foreground font-medium pr-4">
                                {t('knowledgeBase.accessPublic', { defaultValue: 'Allow this knowledge base to be queried by other workspaces or public agents.' })}
                            </p>
                        </div>
                        <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-primary"
                            />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    )
}
