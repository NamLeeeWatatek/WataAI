import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/Sheet'
import { useTranslation } from 'react-i18next'
import type { KnowledgeBase } from '@/lib/types/knowledge-base'
import { KbSettingsForm, type KbFormValues } from './KbSettingsForm'

interface KBSettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    knowledgeBase: KnowledgeBase | null
    workspaceId?: string
    onSave: (data: KbFormValues) => Promise<void>
}

export function KBSettingsDialog({ open, onOpenChange, knowledgeBase, workspaceId, onSave }: KBSettingsDialogProps) {
    const { t } = useTranslation()
    const handleSubmit = async (values: KbFormValues) => {
        await onSave(values)
        onOpenChange(false)
    }

    const isEditing = !!knowledgeBase

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-[540px] p-0 flex flex-col gap-0 bg-background border-l border-border/40 shadow-2xl">
                <SheetHeader className="px-6 py-5 border-b border-border/40 bg-muted/10">
                    <SheetTitle className="text-xl font-bold tracking-tight">
                        {isEditing ? t('knowledgeBase.editKB', { defaultValue: 'Edit Knowledge Base' }) : t('knowledgeBase.createKB', { defaultValue: 'Create Knowledge Base' })}
                    </SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground/80 font-medium uppercase tracking-wider">
                        {t('knowledgeBase.configureDesc', { defaultValue: 'Configure your AI intelligence engine' })}
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-hidden">
                    <KbSettingsForm
                        initialData={knowledgeBase}
                        workspaceId={workspaceId}
                        onSubmit={handleSubmit}
                        onCancel={() => onOpenChange(false)}
                        submitLabel={isEditing ? t('knowledgeBase.saveChanges', { defaultValue: "Save Changes" }) : t('knowledgeBase.createEngine', { defaultValue: "Create Engine" })}
                    />
                </div>
            </SheetContent>
        </Sheet>
    )
}
