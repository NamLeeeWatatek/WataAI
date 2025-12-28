'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { creationToolsApi, CreationTool } from '@/lib/api/creation-tools';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loader2, Plus, Edit2, Trash2, Settings, Search, Wrench, LayoutTemplate } from 'lucide-react';
import { ToolDialog } from '@/components/features/creation-tools/ToolDialog';
import { PageLoading } from '@/components/ui/PageLoading';
import toast from '@/lib/toast';
import { handleApiError } from '@/lib/utils/api-error';
import { PageShell } from '@/components/layout/PageShell';
import { Pagination } from '@/components/ui/Pagination';
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


import { keepPreviousData, useQuery } from '@tanstack/react-query';

export default function CreationToolsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [toolDialogOpen, setToolDialogOpen] = useState(false);
    const [editingTool, setEditingTool] = useState<CreationTool | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [toolToDelete, setToolToDelete] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);


    const [querySearch, setQuerySearch] = useState('')
    const searchTimerRef = useRef<NodeJS.Timeout>()

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
        }
    }, [])

    // Reset to page 1 when search changes


    const { data: response, isLoading: loading, refetch } = useQuery({
        queryKey: ['creation-tools', currentPage, pageSize, querySearch],
        queryFn: () => creationToolsApi.getAll({
            page: currentPage,
            limit: pageSize,
            filters: querySearch ? { name: querySearch } : undefined
        }),
        placeholderData: keepPreviousData,
    })

    const tools = response && Array.isArray(response.data)
        ? response.data
        : (Array.isArray(response) ? response : []);

    const totalItems = response && response.total ? response.total : (Array.isArray(response) ? response.length : 0);

    const handleSaveTool = async (data: Partial<CreationTool>) => {
        try {
            if (data.id) {
                await creationToolsApi.update(data.id, data);
                toast.success('Tool updated successfully');
            } else {
                await creationToolsApi.create(data);
                toast.success('Tool created successfully');
            }
            await refetch();
        } catch (error) {
            const message = handleApiError(error);
            toast.error(message);
            throw error;
        }
    };

    const confirmDelete = (id: string) => {
        setToolToDelete(id);
        setDeleteAlertOpen(true);
    };

    const handleDelete = async () => {
        if (!toolToDelete) return;
        const id = toolToDelete;

        try {
            setDeletingId(id);
            await creationToolsApi.delete(id);
            toast.success('Tool deleted successfully');
            await refetch();
        } catch (error) {
            const message = handleApiError(error);
            toast.error(message);
        } finally {
            setDeletingId(null);
            setDeleteAlertOpen(false);
            setToolToDelete(null);
        }
    };



    if (loading && tools.length === 0) return <PageLoading message="Loading tools..." />;

    return (
        <PageShell
            title="Creation Tools"
            description="Configure and manage your AI creation tools"
            icon={Wrench}
            actions={
                <Button
                    onClick={() => {
                        setEditingTool(null);
                        setToolDialogOpen(true);
                    }}
                    className="shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Tool
                </Button>
            }
        >
            <div className="space-y-6">
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-4 p-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tools..."
                            value={searchQuery}
                            onChange={(e) => {
                                const value = e.target.value
                                setSearchQuery(value);

                                if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
                                searchTimerRef.current = setTimeout(() => {
                                    setQuerySearch(value)
                                    setCurrentPage(1)
                                }, 500)
                            }}
                            className="pl-9 bg-card/50"
                        />
                    </div>
                </div>

                {/* Tools Grid */}
                {tools.length === 0 && !loading ? (
                    // ... No Results UI
                    <div className="flex flex-col items-center justify-center py-16 border rounded-lg bg-card/30 border-dashed">
                        {/* ... content ... */}
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
                                onClick={() => {
                                    setEditingTool(null);
                                    setToolDialogOpen(true);
                                }}
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
                                    className="group hover:shadow-xl transition-all duration-300 border-border/60 hover:border-primary/20 hover:-translate-y-1 overflow-hidden flex flex-col h-full bg-card"
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="p-2.5 rounded-lg bg-primary/5 ring-1 ring-primary/10 group-hover:bg-primary/10 transition-colors">
                                                <Wrench className="w-5 h-5 text-primary" />
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
                                        <div className="flex gap-2 mb-4">
                                            {tool.category && (
                                                <Badge variant="outline" className="text-xs font-normal text-muted-foreground bg-secondary/30">
                                                    {tool.category.name}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex gap-2 pt-4 border-t border-border/50">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1 h-8 text-xs font-medium bg-secondary/80 hover:bg-secondary"
                                                onClick={() => {
                                                    setEditingTool(tool);
                                                    setToolDialogOpen(true);
                                                }}
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

                <ToolDialog
                    open={toolDialogOpen}
                    onOpenChange={(open) => {
                        setToolDialogOpen(open);
                        if (!open) {
                            setEditingTool(null);
                        }
                    }}
                    tool={editingTool}
                    onSave={async (data) => {
                        await handleSaveTool(data);
                        setToolDialogOpen(false);
                        setEditingTool(null);
                    }}
                />

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
            </div>
        </PageShell>
    );
}
