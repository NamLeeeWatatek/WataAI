'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { creationToolsApi, CreationTool } from '@/lib/api/creation-tools';
import { Template, CreateTemplateDto, UpdateTemplateDto } from '@/lib/types/template';
import { useTemplates } from '@/lib/hooks/useTemplates';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader2, Plus, Edit2, Trash2, Sparkles, Filter, icons, X, Folder } from 'lucide-react';
import { Search } from '@/components/ui/Search';
import { AssignToolDialog } from '@/components/features/creation-tools/AssignToolDialog';
import { TemplateDialog } from '@/components/features/creation-tools/TemplateDialog';
import toast from '@/lib/toast';
import { handleApiError } from '@/lib/utils/api-error';
import { PageShell } from '@/components/layout/PageShell';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/Checkbox';
import { BulkActionsToolbar } from '@/components/ui/BulkActionsToolbar';
import { useDebounce } from '@/lib/hooks/useDebounce';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { Pagination } from '@/components/ui/Pagination';
import { TemplateCardMedia } from '@/components/features/templates/TemplateCardMedia';

export default function TemplatesPage() {
    const searchParams = useSearchParams();
    const initialToolId = searchParams.get('toolId');


    const { currentWorkspace } = useWorkspace();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
    const [selectedToolFilter, setSelectedToolFilter] = useState<string>(initialToolId || 'all');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);


    // Bulk Actions State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [bulkDeleteAlertOpen, setBulkDeleteAlertOpen] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);

    // Reset page on search change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);


    // Query for Creation Tools (for filter)
    const { data: toolsData } = useQuery({
        queryKey: ['creation-tools-all'],
        queryFn: () => creationToolsApi.getAllAdmin(),
        initialData: []
    });

    // Query for Templates
    const {
        templates: templatesDataRaw,
        totalCount,
        loading: isLoading,
        refreshTemplates: refetch,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        bulkUpdateTemplates,
        bulkDeleteTemplates
    } = useTemplates({
        page: currentPage,
        limit: pageSize,
        workspaceId: currentWorkspace?.id || '',
        filters: {
            ...(selectedToolFilter !== 'all' ? { creationToolId: selectedToolFilter } : {}),
            ...(debouncedSearch ? { name: debouncedSearch } : {})
        },
    });

    const templatesData = { data: templatesDataRaw, total: totalCount };

    const templates = Array.isArray(templatesData?.data) ? templatesData.data : [];
    const totalItems = templatesData?.total || 0;
    const tools = Array.isArray(toolsData) ? toolsData : [];

    const handleSaveTemplate = async (data: CreateTemplateDto | UpdateTemplateDto) => {
        try {
            if (editingTemplate) {
                await updateTemplate(editingTemplate.id, data as UpdateTemplateDto);
                toast.success('Template updated successfully');
            } else {
                await createTemplate(data as CreateTemplateDto);
                toast.success('Template created successfully');
            }
            await refetch();
        } catch (error) {
            const message = handleApiError(error);
            toast.error(message);
        }
    };

    const confirmDelete = (id: string) => {
        setTemplateToDelete(id);
        setDeleteAlertOpen(true);
    };

    const handleDelete = async () => {
        if (!templateToDelete) return;

        try {
            await deleteTemplate(templateToDelete);
            toast.success('Template deleted successfully');
            await refetch();
        } catch (error) {
            const message = handleApiError(error);
            toast.error(message);
        } finally {
            setTemplateToDelete(null);
            setDeleteAlertOpen(false);
        }
    };

    const getToolName = (toolId: string) => {
        const tool = tools.find((t) => t.id === toolId);
        return tool?.name || 'Unknown Tool';
    };

    // Bulk Actions Handlers
    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleAll = () => {
        const currentPageIds = templates.map(t => t.id);
        const allCurrentPageSelected = currentPageIds.every(id => selectedIds.has(id));

        const newSelected = new Set(selectedIds);
        if (allCurrentPageSelected) {
            // Remove all current page IDs
            currentPageIds.forEach(id => newSelected.delete(id));
        } else {
            // Add all current page IDs
            currentPageIds.forEach(id => newSelected.add(id));
        }
        setSelectedIds(newSelected);
    };

    const handleBulkAssign = async (toolId: string) => {
        try {
            await bulkUpdateTemplates({
                ids: Array.from(selectedIds),
                data: { creationToolId: toolId }
            });
            toast.success(`Successfully assigned ${selectedIds.size} templates`);
            setSelectedIds(new Set());
            await refetch();
        } catch (error) {
            const message = handleApiError(error);
            toast.error('Failed to assign templates: ' + message);
        } finally {
            setAssignDialogOpen(false);
        }
    };

    const handleBulkUnassign = async () => {
        try {
            await bulkUpdateTemplates({
                ids: Array.from(selectedIds),
                data: { creationToolId: null as any }
            });
            toast.success(`Successfully unassigned ${selectedIds.size} templates`);
            setSelectedIds(new Set());
            await refetch();
        } catch (error) {
            const message = handleApiError(error);
            toast.error('Failed to unassign templates: ' + message);
        }
    };

    const handleBulkDelete = async () => {
        setBulkDeleting(true);
        try {
            await bulkDeleteTemplates(Array.from(selectedIds));
            toast.success(`Successfully deleted ${selectedIds.size} templates`);
            setSelectedIds(new Set());
            await refetch();
        } catch (error) {
            const message = handleApiError(error);
            toast.error('Failed to delete templates: ' + message);
        } finally {
            setBulkDeleting(false);
            setBulkDeleteAlertOpen(false);
        }
    };

    return (
        <PageShell
            title="Template Library"
            description="Manage reusable templates for your creation tools"
            actions={
                <Button
                    onClick={() => {
                        setEditingTemplate(null);
                        setTemplateDialogOpen(true);
                    }}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Template
                </Button>
            }
        >
            <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 p-1">
                    <div className="relative flex-1 max-md">
                        <Search
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setSearchQuery(e.target.value);
                            }}
                            onClear={() => {
                                setSearchQuery('')
                            }}
                        />
                    </div>
                    <div className="w-full sm:w-[200px]">
                        <Select value={selectedToolFilter} onValueChange={(val) => {
                            setSelectedToolFilter(val);
                            setCurrentPage(1);
                        }}>
                            <SelectTrigger className="w-[180px] bg-card/50">
                                <div className="flex items-center text-muted-foreground">
                                    <Filter className="w-3.5 h-3.5 mr-2" />
                                    <SelectValue placeholder="All Tools" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tools</SelectItem>
                                {tools.map((tool) => (
                                    <SelectItem key={tool.id} value={tool.id}>
                                        {tool.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <BulkActionsToolbar
                    selectedCount={selectedIds.size}
                    onClearSelection={() => setSelectedIds(new Set())}
                    actions={[
                        {
                            label: 'Assign to Tool',
                            icon: Folder,
                            onClick: () => setAssignDialogOpen(true),
                        },
                        {
                            label: 'Unassign',
                            icon: X,
                            onClick: handleBulkUnassign,
                        },
                        {
                            label: 'Delete',
                            icon: Trash2,
                            onClick: () => setBulkDeleteAlertOpen(true),
                            variant: 'destructive'
                        }
                    ]}
                />

                {/* Templates Grid */}
                {templates.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 border rounded-lg bg-card/30 border-dashed">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-1 ring-primary/20">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-foreground">
                            {searchQuery ? 'No templates found' : 'No templates yet'}
                        </h3>
                        <p className="text-muted-foreground text-center max-w-sm mb-8">
                            {searchQuery
                                ? 'Try adjusting your search or filters'
                                : 'Create your first template to get started with content generation'}
                        </p>
                        {!searchQuery && (
                            <Button
                                onClick={() => {
                                    setEditingTemplate(null);
                                    setTemplateDialogOpen(true);
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Template
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex justify-end px-1 pb-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="select-all"
                                    checked={templates.length > 0 && templates.every(t => selectedIds.has(t.id))}
                                    onCheckedChange={toggleAll}
                                />
                                <label
                                    htmlFor="select-all"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    Select All
                                </label>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {templates.map((template) => (
                                <Card
                                    key={template.id}
                                    className={cn(
                                        "group transition-all duration-300 border-border/60 hover:border-primary/20 overflow-hidden",
                                        "flex flex-col h-full bg-card relative",
                                        selectedIds.has(template.id) ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:shadow-xl hover:-translate-y-1"
                                    )}
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (!target.closest('button') && !target.closest('.no-select')) {
                                            toggleSelection(template.id);
                                        }
                                    }}
                                >
                                    <div className="absolute top-3 left-3 z-10">
                                        <Checkbox
                                            checked={selectedIds.has(template.id)}
                                            onCheckedChange={() => toggleSelection(template.id)}
                                            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-white/50 bg-black/20 backdrop-blur-sm"
                                        />
                                    </div>

                                    <div className="aspect-video w-full bg-muted relative overflow-hidden shrink-0">
                                        <TemplateCardMedia
                                            thumbnailUrl={template.thumbnailUrl}
                                            name={template.name}
                                            aspectRatio="video"
                                            className="w-full h-full"
                                            autoPlayOnHover={true}
                                            icon={template.icon}
                                        />
                                        <div className="absolute top-3 right-3 z-10">
                                            <Badge variant="secondary" className="backdrop-blur-md bg-black/40 text-white border-white/20 shadow-sm hover:bg-black/60">
                                                {getToolName(template.creationToolId || '')}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex flex-col flex-1 p-5">
                                        <div className="flex-1 space-y-2">
                                            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                                                {template.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                {template.description || 'No description provided'}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border/50 no-select">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1 h-8 text-xs font-medium"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingTemplate(template);
                                                    setTemplateDialogOpen(true);
                                                }}
                                            >
                                                <Edit2 className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 px-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    confirmDelete(template.id)
                                                }}
                                                disabled={deletingId === template.id}
                                            >
                                                {deletingId === template.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <div className="py-8">
                            <Pagination
                                pagination={{
                                    page: currentPage,
                                    limit: pageSize,
                                    total: totalItems,
                                    totalPages: Math.ceil(totalItems / pageSize),
                                    hasNextPage: currentPage * pageSize < totalItems
                                }}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={(newSize) => {
                                    setPageSize(newSize);
                                    setCurrentPage(1);
                                }}
                                pageSizeOptions={[10, 20, 30, 50]}
                            />
                        </div>
                    </>
                )}

                <TemplateDialog
                    open={templateDialogOpen}
                    onOpenChange={(open) => {
                        setTemplateDialogOpen(open);
                        if (!open) {
                            setEditingTemplate(null);
                        }
                    }}
                    template={editingTemplate}
                    creationToolId={editingTemplate?.creationToolId}
                    onSave={async (data) => {
                        await handleSaveTemplate(data as unknown as CreateTemplateDto | UpdateTemplateDto);
                        setTemplateDialogOpen(false);
                        setEditingTemplate(null);
                    }}
                />
            </div>

            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the template and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deletingId ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AssignToolDialog
                open={assignDialogOpen}
                onOpenChange={setAssignDialogOpen}
                onAssign={handleBulkAssign}
                count={selectedIds.size}
            />

            <AlertDialog open={bulkDeleteAlertOpen} onOpenChange={setBulkDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedIds.size} templates?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the selected templates. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleBulkDelete();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {bulkDeleting ? 'Deleting...' : 'Delete All'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageShell >
    );
}
