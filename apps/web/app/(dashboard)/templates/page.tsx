'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTemplates } from '@/lib/hooks/useTemplates'
import { useWorkspace } from '@/lib/hooks/useWorkspace'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Edit, Trash2 } from 'lucide-react'
import { PageLoading } from '@/components/ui/PageLoading'
import toast from '@/lib/toast'
import { TemplateDialog } from '@/components/features/creation-tools/TemplateDialog'
import { Template } from '@/lib/types/template'
import { Pagination } from '@/components/ui/Pagination'
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm'

export default function TemplatesPage() {
    const router = useRouter()
    const { currentWorkspace } = useWorkspace()
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);

    const {
        templates,
        loading,
        refreshTemplates,
        deleteTemplate,
        updateTemplate,
        createTemplate,
        totalCount
    } = useTemplates({
        workspaceId: currentWorkspace?.id || '',
        page: currentPage,
        limit: pageSize
    })

    const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const handleDelete = (id: string) => {
        setDeleteId(id)
    }

    const confirmDelete = async () => {
        if (!deleteId) return
        try {
            await deleteTemplate(deleteId);
            toast.success('Template deleted');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to delete template';
            toast.error(message);
        } finally {
            setDeleteId(null)
        }
    }

    const handleSaveTemplate = async (data: Partial<Template>) => {
        try {
            if (data.id) {
                await updateTemplate(data.id, data as any);
            } else {
                await createTemplate(data as any);
            }
            toast.success(data.id ? 'Template updated' : 'Template created');
            setTemplateDialogOpen(false);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to save template';
            toast.error(message);
        }
    }

    if (loading && templates.length === 0) return <PageLoading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="My Templates"
                description="Manage and reuse your saved creation templates."
                onRefresh={refreshTemplates}
                refreshing={loading}
                className="px-1"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                    <Card key={template.id} className="p-6 space-y-4 hover:shadow-lg transition-all group border-border/40 bg-card/50 backdrop-blur-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{template.name}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">{template.description}</p>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-4 border-t border-border/10">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setEditingTemplate(template);
                                    setTemplateDialogOpen(true);
                                }}
                                className="h-8 w-8 p-0"
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(template.id)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {totalCount > 0 && (
                <div className="py-4">
                    <Pagination
                        pagination={{
                            page: currentPage,
                            limit: pageSize,
                            total: totalCount,
                            totalPages: Math.ceil(totalCount / pageSize),
                            hasNextPage: currentPage * pageSize < totalCount
                        }}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        pageSizeOptions={[9, 18, 27, 36]}
                    />
                </div>
            )}

            {templates.length === 0 && !loading && (
                <div className="text-center py-20 bg-muted/5 rounded-3xl border border-dashed border-border/60">
                    <p className="text-muted-foreground">No templates found. Templates are created through Creation Tools.</p>
                </div>
            )}

            {/* Template Dialog */}
            <TemplateDialog
                open={templateDialogOpen}
                onOpenChange={(open) => {
                    setTemplateDialogOpen(open);
                    if (!open) setEditingTemplate(null);
                }}
                template={editingTemplate}
                creationToolId={editingTemplate?.creationToolId || ''}
                onSave={handleSaveTemplate}
            />

            <AlertDialogConfirm
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Delete Template"
                description="Are you sure you want to delete this template? This action cannot be undone."
                onConfirm={confirmDelete}
                variant="destructive"
                confirmText="Delete"
            />
        </div>
    )
}
