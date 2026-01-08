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

export default function MyProductsPage() {
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Products"
                description="Manage and view your generated content and products."
                onRefresh={handleRefresh}
                refreshing={isLoading || isRefetching}
            >
                <div className="flex items-center gap-2">
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                    <div className="border border-border/40 rounded-lg p-1 flex items-center gap-1 bg-muted/20">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 rounded-md transition-all",
                                viewMode === 'grid' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
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
                                viewMode === 'table' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setViewMode('table')}
                            title="Table View"
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </PageHeader>

            {viewMode === 'grid' ? (
                <>
                    <ProductsGrid
                        jobs={jobs}
                        isLoading={isLoading}
                        onDelete={handleDelete}
                        onRefresh={handleRefresh}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                    />
                    <div className="mt-4">
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
                </>
            ) : (
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
                />
            )}
        </div>
    );
}
