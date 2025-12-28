import { CreationJob } from '@/lib/types/creation-job';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Package } from 'lucide-react';

import { useState } from 'react';
import { BulkActionsToolbar } from '@/components/shared/BulkActionsToolbar';
import { creationJobsApi } from '@/lib/api/creation-jobs';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm';

interface ProductsGridProps {
    jobs: CreationJob[];
    isLoading: boolean;
    onDelete?: (id: string) => void;
    onRefresh?: () => void;
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
}

export function ProductsGrid({
    jobs,
    isLoading,
    onDelete,
    onRefresh,
    selectedIds = [],
    onSelectionChange
}: ProductsGridProps) {
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleSelectRow = (id: string, isSelected: boolean) => {
        if (!onSelectionChange) return;
        if (isSelected) {
            onSelectionChange([...selectedIds, id]);
        } else {
            onSelectionChange(selectedIds.filter(idx => idx !== id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        setIsDeletingBulk(true);
        try {
            await creationJobsApi.removeMany(selectedIds);
            toast.success(`Successfully deleted ${selectedIds.length} items`);
            onSelectionChange?.([]);
            onRefresh?.();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete items");
        } finally {
            setIsDeletingBulk(false);
        }
    };
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <EmptyState
                icon={<Package className="w-12 h-12" />}
                title="No products found"
                description="You haven't created any products yet. Start by using one of our creation tools."
                action={{
                    label: "Explore Tools",
                    onClick: () => window.location.href = '/creation-tools',
                    variant: "default"
                }}
            />
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {jobs.map((job) => (
                    <ProductCard
                        key={job.id}
                        job={job}
                        onDelete={onDelete}
                        isSelected={selectedIds.includes(job.id)}
                        onSelect={(isSelected) => handleSelectRow(job.id, isSelected)}
                    />
                ))}
            </div>

            <AlertDialogConfirm
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                title="Are you sure?"
                description={`This will permanently delete ${selectedIds.length} items. This action cannot be undone.`}
                confirmText={isDeletingBulk ? "Deleting..." : "Delete"}
                variant="destructive"
                onConfirm={handleBulkDelete}
            />

            <BulkActionsToolbar
                selectedCount={selectedIds.length}
                onClearSelection={() => onSelectionChange?.([])}
                actions={[
                    {
                        label: isDeletingBulk ? 'Deleting...' : 'Delete & Cancel',
                        icon: Trash2,
                        onClick: () => setIsConfirmOpen(true),
                        variant: 'destructive'
                    }
                ]}
            />
        </>
    );
}
