import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
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
    const handleSubmit = async (values: KbFormValues) => {
        await onSave(values)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-4 border-b">
                    <DialogTitle className="text-xl font-bold">Knowledge Base Settings</DialogTitle>
                </DialogHeader>
                <div className="pt-6">
                    <KbSettingsForm
                        initialData={knowledgeBase}
                        workspaceId={workspaceId}
                        onSubmit={handleSubmit}
                        onCancel={() => onOpenChange(false)}
                        submitLabel="Save Changes"
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
