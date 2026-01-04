'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTemplates } from '@/lib/hooks/useTemplates'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Edit, Trash2, LayoutGrid } from 'lucide-react'
import { PageLoading } from '@/components/ui/PageLoading'
import toast from '@/lib/toast'
import { TemplateDialog } from '@/components/features/creation-tools/TemplateDialog'
import { Template } from '@/lib/types/template'
import { templatesApi } from '@/lib/api/templates'
import { Pagination } from '@/components/ui/Pagination'
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm'

// ...
export default function TemplatesPage() {
    const router = useRouter()
    const { templates, loading, refreshTemplates, deleteTemplate } = useTemplates()
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    useEffect(() => {
        refreshTemplates()
    }, [refreshTemplates])

    const handleDelete = (id: string) => {
        setDeleteId(id)
    }

    const confirmDelete = async () => {
        if (!deleteId) return
        try {
            await templatesApi.delete(deleteId);
            toast.success('Template deleted');
            await refreshTemplates();
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete template');
        } finally {
            setDeleteId(null)
        }
    }

    const handleSaveTemplate = async (data: Partial<Template>) => {
        try {
            if (data.id) {
                await templatesApi.update(data.id, data);
            } else {
                await templatesApi.create(data);
            }
            toast.success(data.id ? 'Template updated' : 'Template created');
            await refreshTemplates();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save template');
        }
    }

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);

    const paginatedTemplates = templates.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    if (loading) return <PageLoading />

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
                {paginatedTemplates.map(template => (
                    // ... Card Render
                    <Card key={template.id} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg">{template.name}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-4 border-t">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setEditingTemplate(template);
                                    setTemplateDialogOpen(true);
                                }}
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(template.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {templates.length > 0 && (
                <div className="py-4">
                    <Pagination
                        pagination={{
                            page: currentPage,
                            limit: pageSize,
                            total: templates.length,
                            totalPages: Math.ceil(templates.length / pageSize),
                            hasNextPage: currentPage < Math.ceil(templates.length / pageSize)
                        }}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        pageSizeOptions={[9, 18, 27, 36]}
                    />
                </div>
            )}

            {templates.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No templates found. Templates are created through Creation Tools.
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
