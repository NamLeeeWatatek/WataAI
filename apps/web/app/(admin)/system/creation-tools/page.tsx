'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreationTool } from '@/lib/api/creation-tools';
import { useCreationTools } from '@/lib/hooks/features/useCreationTools';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader2, Plus, Edit2, Trash2, Settings, Wrench, LayoutTemplate, icons, Download, Upload } from 'lucide-react';
import { Search } from '@/components/shared/Search';
import { PageLoading } from '@/components/shared/PageLoading';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/utils/api-error';
import { PageShell } from '@/components/layout/PageShell';
import { useRef } from 'react';
import { Pagination } from '@/components/shared/Pagination';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useCategories } from '@/lib/hooks/useCategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
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
import { Checkbox } from '@/components/ui/Checkbox';
import { BulkActionsToolbar } from '@/components/shared/BulkActionsToolbar';
import { cn } from '@/lib/utils';
import { Category } from '@/lib/api/categories';


function AdminCategoryItems() {
    const { data: categories = [] } = useCategories('creation-tool');
    return (
        <>
            {categories.map((cat: Category) => (
                <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                </SelectItem>
            ))}
        </>
    );
}

export default function CreationToolsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [toolToDelete, setToolToDelete] = useState<string | null>(null);

    // Bulk Actions
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [bulkDeleteAlertOpen, setBulkDeleteAlertOpen] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset to page 1 when search or category changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, selectedCategory]);


    const {
        data: response,
        isLoading: loading,
        refetch,
        deleteTool,
        exportTools,
        importTools,
        isMutating
    } = useCreationTools({
        page: currentPage,
        limit: pageSize,
        filters: {
            ...(debouncedSearch ? { name: debouncedSearch } : {}),
            ...(selectedCategory !== 'all' ? { categoryId: selectedCategory } : {})
        }
    })

    const tools = response && Array.isArray(response.data)
        ? response.data
        : (Array.isArray(response) ? response : []);

    const totalItems = response && response.total ? response.total : (Array.isArray(response) ? response.length : 0);

    const confirmDelete = (id: string) => {
        setToolToDelete(id);
        setDeleteAlertOpen(true);
    };

    const handleDelete = async () => {
        if (!toolToDelete) return;
        const id = toolToDelete;

        try {
            await deleteTool(id);
            toast.success('Tool deleted successfully');
            await refetch();
        } catch (error) {
            const message = handleApiError(error);
            toast.error(message);
        } finally {
            setDeleteAlertOpen(false);
            setToolToDelete(null);
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true);
        try {
            // Assuming there's a bulk delete in api or just loop
            for (const id of Array.from(selectedIds)) {
                await deleteTool(id);
            }
            toast.success(`Deleted ${selectedIds.size} tools successfully`);
            setSelectedIds(new Set());
            await refetch();
        } catch (error) {
            toast.error('Failed to delete some tools');
        } finally {
            setIsBulkDeleting(false);
            setBulkDeleteAlertOpen(false);
        }
    };

    const handleExport = async (ids?: string[]) => {
        try {
            // Add a small delay for better UX if the response is too fast
            const start = Date.now();
            const data = await exportTools(ids);

            if (!data || (Array.isArray(data) && data.length === 0)) {
                toast.error('No tools found to export');
                return;
            }

            const elapsed = Date.now() - start;
            if (elapsed < 600) {
                await new Promise(resolve => setTimeout(resolve, 600 - elapsed));
            }

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `creation-tools-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success(`Successfully exported ${Array.isArray(data) ? data.length : ''} tools`);
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export tools');
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const tools = JSON.parse(content);
                if (!Array.isArray(tools)) {
                    toast.error('Invalid file format. Expected an array of tools.');
                    return;
                }
                await importTools(tools);
                if (fileInputRef.current) fileInputRef.current.value = '';
                await refetch();
            } catch (error) {
                toast.error('Failed to import tools. Check file format.');
            }
        };
        reader.readAsText(file);
    };



    if (loading && tools.length === 0) return <PageLoading message="Loading tools..." />;

    return (
        <PageShell
            title="Creation Tools"
            description="Configure and manage your AI creation tools"
        >
            <div className="space-y-6">
                {/* Unified Toolbar */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="p-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative flex-1 w-full max-w-md">
                                <Search
                                    placeholder="Search tools..."
                                    value={searchQuery}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        setSearchQuery(e.target.value);
                                    }}
                                    onClear={() => {
                                        setSearchQuery('')
                                    }}
                                />
                            </div>
                            <div className="w-[180px]">
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        <AdminCategoryItems />
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImport}
                                    accept=".json"
                                    className="hidden"
                                />
                                <Button
                                    variant="default"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isMutating}
                                    className="shadow-primary/20 shadow-lg"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Import
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleExport()}
                                    disabled={isMutating}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export All
                                </Button>
                                <Button
                                    onClick={() => router.push('/system/creation-tools/new')}
                                    className="shadow-sm"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Tool
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <BulkActionsToolbar
                    selectedCount={selectedIds.size}
                    onClearSelection={() => setSelectedIds(new Set())}
                    actions={[
                        {
                            label: 'Delete',
                            icon: Trash2,
                            onClick: () => setBulkDeleteAlertOpen(true),
                            variant: 'destructive'
                        },
                        {
                            label: 'Export',
                            icon: Download,
                            onClick: () => handleExport(Array.from(selectedIds)),
                            variant: 'default'
                        }
                    ]}
                />

                {/* Tools Grid */}
                {tools.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center py-16 border rounded-lg bg-card/30 border-dashed">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-1 ring-primary/20">
                            <Wrench className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-foreground">
                            {searchQuery ? 'No tools found' : 'No creation tools yet'}
                        </h3>
                        <p className="text-muted-foreground text-center max-w-sm mb-8">
                            {searchQuery
                                ? 'Try different search terms'
                                : 'Create your first AI creation tool'}
                        </p>
                        {!searchQuery && (
                            <Button
                                onClick={() => router.push('/system/creation-tools/new')}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Tool
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-2">
                            {tools.map((tool) => (
                                <Card
                                    key={tool.id}
                                    className={cn(
                                        "group hover:bg-card/70 transition-all duration-300 border-border/60 hover:border-border/80",
                                        "overflow-hidden flex flex-col h-full bg-card relative",
                                        selectedIds.has(tool.id) ? "ring-2 ring-primary border-primary bg-primary/5" : ""
                                    )}
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (!target.closest('button') && !target.closest('.no-select')) {
                                            toggleSelection(tool.id);
                                        }
                                    }}
                                >
                                    <div className={cn(
                                        "absolute top-3 left-3 z-10 transition-opacity",
                                        selectedIds.has(tool.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                                    )}>
                                        <Checkbox
                                            checked={selectedIds.has(tool.id)}
                                            onCheckedChange={() => toggleSelection(tool.id)}
                                            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-border bg-card/20 backdrop-blur-sm"
                                        />
                                    </div>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-4 ml-7">
                                            <div className="p-2.5 rounded-lg bg-primary/5 ring-1 ring-primary/10 group-hover:bg-primary/10 transition-colors">
                                                {tool.icon && (icons as Record<string, React.ElementType>)[tool.icon] ? (
                                                    (() => {
                                                        const IconComponent = (icons as Record<string, React.ElementType>)[tool.icon];
                                                        return <IconComponent className="w-5 h-5 text-primary" />;
                                                    })()
                                                ) : (
                                                    <Wrench className="w-5 h-5 text-primary" />
                                                )}
                                            </div>
                                            <Badge variant={tool.isActive ? 'default' : 'secondary'} className={tool.isActive ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20' : ''}>
                                                {tool.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <div className="pt-4 space-y-1.5">
                                            <CardTitle className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
                                                {tool.name}
                                            </CardTitle>
                                            <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                                                {tool.description || 'No description provided'}
                                            </CardDescription>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="mt-auto pt-0 pb-5 px-5">
                                        <div className="flex gap-1.5 flex-wrap mb-4">
                                            {(tool.categories || []).length > 0 ? (
                                                (tool.categories || []).map((cat: Category) => (
                                                    <Badge key={cat.id} variant="outline" className="text-[10px] font-normal text-muted-foreground bg-secondary/30">
                                                        {cat.name}
                                                    </Badge>
                                                ))
                                            ) : (
                                                tool.category && (
                                                    <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground bg-secondary/30">
                                                        {tool.category.name}
                                                    </Badge>
                                                )
                                            )}
                                        </div>

                                        <div className="flex gap-2 pt-4 border-t border-border/50">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1 h-8 text-xs font-medium bg-secondary/80 hover:bg-secondary"
                                                onClick={() => router.push(`/system/creation-tools/${tool.id}`)}
                                            >
                                                <Edit2 className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 px-0"
                                                onClick={() => router.push(`/system/templates?toolId=${tool.id}`)}
                                                title="View Templates"
                                            >
                                                <LayoutTemplate className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 px-0"
                                                onClick={() => router.push(`/creation-tools/${tool.slug}`)}
                                                title="Configure Tool"
                                            >
                                                <Settings className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 px-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => confirmDelete(tool.id)}
                                                disabled={deletingId === tool.id}
                                            >
                                                {deletingId === tool.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="py-4">
                            <Pagination
                                pagination={{
                                    page: currentPage,
                                    limit: pageSize,
                                    total: totalItems,
                                    totalPages: Math.ceil(totalItems / pageSize),
                                    hasNextPage: currentPage < Math.ceil(totalItems / pageSize)
                                }}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={setPageSize}
                                pageSizeOptions={[10, 20, 30, 50]}
                            />
                        </div>
                    </>
                )}


                <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the creation tool and all its associated templates.
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

                <AlertDialog open={bulkDeleteAlertOpen} onOpenChange={setBulkDeleteAlertOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete {selectedIds.size} tools?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the selected tools and all their templates. This action cannot be undone.
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
                                {isBulkDeleting ? 'Deleting...' : 'Delete All'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </PageShell >
    );
}
