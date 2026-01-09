'use client';

import { useState } from 'react';
import { ProductsGrid } from '@/components/features/products/ProductsGrid';
import { ProductsTable } from '@/components/features/products/ProductsTable';
import { Package, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { useCreationJobs } from '@/lib/hooks/features/useCreationJobs';
import { PageHeader } from '@/components/ui/PageHeader';
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Trash2, RotateCcw } from 'lucide-react';
import { BulkActionsToolbar } from '@/components/ui/BulkActionsToolbar';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/Card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Search } from "@/components/ui/Search";

export default function MyProductsPage() {
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [bulkDeleteAlertOpen, setBulkDeleteAlertOpen] = useState(false);

    const {
        jobs,
        total,
        hasNextPage,
        isLoading,
        isRefetching,
        page,
        pageSize,
        dateRange,
        statusFilter,
        searchFilter,
        setPage,
        setPageSize,
        setDateRange,
        setStatusFilter,
        setSearchFilter,
        refresh,
        deleteJob
    } = useCreationJobs({
        page: 1,
        pageSize: 12,
        dateRange: {
            from: subDays(new Date(), 30),
            to: new Date(),
        }
    });

    const handleRefresh = () => {
        refresh();
    };
    const handleDelete = async (id: string) => {
        const success = await deleteJob(id);
        if (success) {
            toast.success("Job deleted");
        } else {
            toast.error("Failed to delete job");
        }
    };

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true);
        try {
            for (const id of selectedIds) {
                await deleteJob(id);
            }
            toast.success(`Deleted ${selectedIds.length} jobs successfully`);
            setSelectedIds([]);
            refresh();
        } catch (error) {
            toast.error('Failed to delete some jobs');
        } finally {
            setIsBulkDeleting(false);
            setBulkDeleteAlertOpen(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">My Products</h1>
                <p className="text-muted-foreground">Manage and view your generated content and products.</p>
            </div>

            <Card className="overflow-hidden flex flex-col border-border/50 bg-card/30 backdrop-blur-sm">
                <CardContent className="p-0 flex-1">
                    {viewMode === 'grid' ? (
                        <div className="flex flex-col">
                            {/* Unified Toolbar for Grid View */}
                            <div className="px-6 py-4 border-b bg-card/50 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                {/* Left Side: Context & Filters */}
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                                    </div>
                                </div>

                                {/* Right Side: Interaction */}
                                <div className="flex items-center gap-3">
                                    <div className="relative w-full sm:w-[300px]">
                                        <Search
                                            placeholder="Search products..."
                                            value={searchFilter}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchFilter(e.target.value)}
                                            onClear={() => setSearchFilter('')}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pr-2 border-r border-border/40 mr-1 last:border-0 last:pr-0 last:mr-0">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handleRefresh}
                                            disabled={isLoading || isRefetching}
                                            className="h-9 w-9"
                                            title="Refresh"
                                        >
                                            <RotateCcw className={cn("h-4 w-4", (isLoading || isRefetching) && "animate-spin")} />
                                        </Button>
                                    </div>

                                    <div className="border border-border/40 rounded-lg p-1 flex items-center gap-1 bg-muted/20">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-8 w-8 rounded-md transition-all",
                                                "bg-background shadow-sm text-primary"
                                            )}
                                            onClick={() => setViewMode('grid')}
                                            title="Grid View"
                                        >
                                            <LayoutGrid className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-8 w-8 rounded-md transition-all",
                                                "text-muted-foreground hover:text-foreground"
                                            )}
                                            onClick={() => setViewMode('table')}
                                            title="Table View"
                                        >
                                            <List className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <ProductsGrid
                                    jobs={jobs}
                                    isLoading={isLoading}
                                    onDelete={handleDelete}
                                    onRefresh={handleRefresh}
                                    selectedIds={selectedIds}
                                    onSelectionChange={setSelectedIds}
                                />
                                <div className="mt-6 border-t pt-6">
                                    <Pagination
                                        pagination={{
                                            page,
                                            limit: pageSize,
                                            total: total,
                                            totalPages: Math.ceil(total / pageSize),
                                            hasNextPage
                                        }}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                        pageSizeOptions={[12, 24, 48]}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6">
                            <ProductsTable
                                jobs={jobs}
                                isLoading={isLoading}
                                onDelete={handleDelete}
                                onRefresh={handleRefresh}
                                selectedIds={selectedIds}
                                onSelectionChange={setSelectedIds}
                                pagination={{
                                    page,
                                    limit: pageSize,
                                    total: total,
                                    totalPages: Math.ceil(total / pageSize),
                                    hasNextPage
                                }}
                                onPageChange={setPage}
                                onPageSizeChange={setPageSize}
                                pageSizeOptions={[12, 24, 48]}
                                statusFilter={statusFilter}
                                onStatusFilterChange={setStatusFilter}
                                searchFilter={searchFilter}
                                onSearchChange={setSearchFilter}
                                headerActions={<DatePickerWithRange date={dateRange} setDate={setDateRange} />}
                                actions={
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 pr-2 border-r border-border/40 mr-1 last:border-0 last:pr-0 last:mr-0">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={handleRefresh}
                                                disabled={isLoading || isRefetching}
                                                className="h-9 w-9"
                                                title="Refresh"
                                            >
                                                <RotateCcw className={cn("h-4 w-4", (isLoading || isRefetching) && "animate-spin")} />
                                            </Button>
                                        </div>
                                        <div className="border border-border/40 rounded-lg p-1 flex items-center gap-1 bg-muted/20">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "h-8 w-8 rounded-md transition-all",
                                                    "text-muted-foreground hover:text-foreground"
                                                )}
                                                onClick={() => setViewMode('grid')}
                                                title="Grid View"
                                            >
                                                <LayoutGrid className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "h-8 w-8 rounded-md transition-all",
                                                    "bg-background shadow-sm text-primary"
                                                )}
                                                onClick={() => setViewMode('table')}
                                                title="Table View"
                                            >
                                                <List className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                }
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <BulkActionsToolbar
                selectedCount={selectedIds.length}
                onClearSelection={() => setSelectedIds([])}
                actions={[
                    {
                        label: 'Delete',
                        icon: Trash2,
                        onClick: () => setBulkDeleteAlertOpen(true),
                        variant: 'destructive'
                    }
                ]}
            />

            <AlertDialog open={bulkDeleteAlertOpen} onOpenChange={setBulkDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedIds.length} Items?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the selected items? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isBulkDeleting ? 'Deleting...' : 'Delete All'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
