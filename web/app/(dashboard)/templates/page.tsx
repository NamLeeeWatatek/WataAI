'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTemplates } from '@/lib/hooks/useTemplates'
import { useWorkspace } from '@/lib/hooks/useWorkspace'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Edit, Trash2, Search as SearchIcon, Upload, Download } from 'lucide-react'
import { PageLoading } from '@/components/shared/PageLoading'
import toast from '@/lib/toast'
import { TemplateDialog } from '@/components/features/creation-tools/TemplateDialog'
import { TemplateImportExport } from '@/components/features/templates/TemplateImportExport'
import { Template } from '@/lib/types/template'
import { Pagination } from '@/components/shared/Pagination'
import { Search } from '@/components/shared/Search'
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm'

export default function TemplatesPage() {
    const router = useRouter()
    const { currentWorkspace } = useWorkspace()
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);

    const {
        templates,
        loading,
        refreshTemplates,
        deleteTemplate,
        updateTemplate,
        createTemplate,
        importTemplates,
        exportTemplates,
        bulkDeleteTemplates, // added
        totalCount
    } = useTemplates({
        workspaceId: currentWorkspace?.id || '',
        page: currentPage,
        limit: pageSize,
        filters: debouncedSearch ? { name: debouncedSearch } : undefined
    })

    const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

    // Reset page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch])

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



    const handleBulkDelete = async () => {
        try {
            await bulkDeleteTemplates(selectedTemplates);
            toast.success(`Deleted ${selectedTemplates.length} templates`);
            setSelectedTemplates([]);
            setBulkDeleteOpen(false);
            refreshTemplates();
        } catch (err) {
            toast.error('Failed to delete selected templates');
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
        <div className="page-container space-y-6">
            {/* Header */}
            <PageHeader
                title="My Templates"
                description="Manage and reuse your saved creation templates."
                onRefresh={refreshTemplates}
                refreshing={loading}
                className="px-1"
            />

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="max-w-md w-full sm:w-auto flex-1">
                    <Search
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e: any) => setSearchQuery(e.target.value)}
                        onClear={() => setSearchQuery('')}
                    />
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 rounded-lg border border-border/50">
                        <input
                            type="checkbox"
                            id="select-all-checkbox"
                            checked={templates.length > 0 && selectedTemplates.length === templates.length}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedTemplates(templates.map(t => t.id));
                                } else {
                                    setSelectedTemplates([]);
                                }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                        <label htmlFor="select-all-checkbox" className="text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer">Select All</label>
                    </div>
                    <TemplateImportExport
                        onImport={importTemplates}
                        onExport={exportTemplates}
                        onRefresh={refreshTemplates}
                        templatesToExport={templates.map(t => t.id)}
                        disabled={loading}
                    />
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedTemplates.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background border border-border shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
                    <span className="text-sm font-medium">{selectedTemplates.length} selected</span>
                    <div className="h-4 w-px bg-border" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:bg-primary/10"
                        onClick={async () => {
                            try {
                                const data = await exportTemplates(selectedTemplates);
                                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `templates_export_${new Date().toISOString().split('T')[0]}.json`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                toast.success(`Exported ${data.length} templates`);
                                setSelectedTemplates([]);
                            } catch (err) {
                                toast.error("Failed to export templates");
                            }
                        }}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setBulkDeleteOpen(true)}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTemplates([])}
                    >
                        Cancel
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                    <Card key={template.id} className={`p-6 space-y-4 hover:shadow-lg transition-all group border-border/40 bg-card/50 backdrop-blur-sm relative ${selectedTemplates.includes(template.id) ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}`}>
                        <div className="absolute top-4 left-4 z-10">
                            <input
                                type="checkbox"
                                checked={selectedTemplates.includes(template.id)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedTemplates(prev => [...prev, template.id]);
                                    } else {
                                        setSelectedTemplates(prev => prev.filter(id => id !== template.id));
                                    }
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                aria-label={`Select template ${template.name}`}
                            />
                        </div>
                        <div className="flex justify-between items-start pl-6">
                            <div>
                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{template.name}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">{template.description}</p>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-4 border-t border-border/10">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                    try {
                                        const data = await exportTemplates([template.id]);
                                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `template_${template.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                        toast.success('Template exported');
                                    } catch (err) {
                                        toast.error("Failed to export template");
                                    }
                                }}
                                className="h-8 w-8 p-0"
                                title="Export"
                            >
                                <Download className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setEditingTemplate(template);
                                    setTemplateDialogOpen(true);
                                }}
                                className="h-8 w-8 p-0"
                                title="Edit"
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(template.id)}
                                title="Delete"
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

            <AlertDialogConfirm
                open={bulkDeleteOpen}
                onOpenChange={setBulkDeleteOpen}
                title="Delete Multiple Templates"
                description={`Are you sure you want to delete ${selectedTemplates.length} templates? This action cannot be undone.`}
                onConfirm={handleBulkDelete}
                variant="destructive"
                confirmText="Delete Selected"
            />
        </div>
    )
}
