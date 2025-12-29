import { useState } from "react";
import { cn } from "@/lib/utils";
import { CreationJob, CreationJobStatus } from "@/lib/types/creation-job";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { MoreHorizontal, Trash2, ExternalLink, Copy } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { DataTable, Column } from "@/components/ui/DataTable";
import { ProductDetailsDialog } from "./ProductDetailsDialog";
import { AlertDialogConfirm } from "@/components/ui/AlertDialogConfirm";
import { formatDateTime } from "@/lib/utils/date";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginationInfo } from "@/components/ui/Pagination";

import { creationJobsApi } from "@/lib/api/creation-jobs";
import { BulkActionsToolbar } from "@/components/ui/BulkActionsToolbar";

interface ProductsTableProps {
    jobs: CreationJob[];
    isLoading: boolean;
    onDelete?: (id: string) => void;
    onRefresh?: () => void;
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
    pagination?: PaginationInfo;
    onPageChange?: (page: number) => void;
    pageSizeOptions?: number[];
    onPageSizeChange?: (pageSize: number) => void;
}

export function ProductsTable({
    jobs,
    isLoading,
    onDelete,
    onRefresh,
    selectedIds = [],
    onSelectionChange,
    pagination,
    onPageChange,
    pageSizeOptions,
    onPageSizeChange
}: ProductsTableProps) {
    const [selectedJob, setSelectedJob] = useState<CreationJob | null>(null);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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

    const getDisplayName = (job: CreationJob) => {
        const input = job.inputData as any;
        const subject = input?.prompt || input?.title || input?.name || input?.concept || input?.subject || input?.text;

        if (subject && typeof subject === 'string') {
            return subject;
        }

        return job.creationTool?.name || 'Untitled Product';
    };

    const columns: Column<CreationJob>[] = [
        {
            key: 'selection',
            label: '',
        },
        {
            key: 'name',
            label: 'Product',
            render: (_, row) => {
                if (row.status === CreationJobStatus.FAILED) {
                    return (
                        <div className="flex flex-col">
                            <span className="font-medium text-sm text-destructive line-clamp-2 max-w-[300px]" title={row.error || "Unknown error"}>
                                {row.error ? `Error: ${row.error}` : "Job Failed"}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono uppercase">
                                ID: {row.id.substring(0, 8)}
                            </span>
                        </div>
                    );
                }
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-sm line-clamp-1 max-w-[300px]">
                            {getDisplayName(row)}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono uppercase">
                            ID: {row.id.substring(0, 8)}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'creationToolId',
            label: 'Tool Name',
            render: (value, row) => <span className="text-sm font-medium">{row.creationTool?.name || value}</span>
        },
        {
            key: 'status',
            label: 'Status',
            render: (value, row) => (
                <Badge
                    variant={
                        row.status === CreationJobStatus.COMPLETED
                            ? "default"
                            : row.status === CreationJobStatus.FAILED
                                ? "destructive"
                                : "outline"
                    }
                    className="capitalize"
                >
                    {row.status.toLowerCase()}
                </Badge>
            )
        },
        {
            key: 'progress',
            label: 'Progress',
            render: (value) => (
                <div className="flex flex-col gap-1.5 w-32">
                    <div className="flex justify-between text-[9px] uppercase font-bold tracking-tighter text-muted-foreground">
                        <span>{value}%</span>
                    </div>
                    <Progress
                        value={value}
                        className="h-1.5 bg-secondary border border-border/50 shadow-inner"
                        indicatorClassName={cn(
                            "transition-all duration-500",
                            value === 100
                                ? "bg-green-500"
                                : "bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500"
                        )}
                    />
                </div>
            )
        },
        {
            key: 'createdAt',
            label: 'Created At',
            render: (value) => (
                <span className="text-muted-foreground text-sm">
                    {formatDateTime(value)}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            render: (_, row) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => {
                                    navigator.clipboard.writeText(row.id);
                                    toast.success("Job ID copied");
                                }}
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Job ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {row.status === CreationJobStatus.COMPLETED && (
                                <DropdownMenuItem onClick={() => setSelectedJob(row)}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View Details
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => onDelete?.(row.id)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ];

    if (jobs.length === 0 && !isLoading) {
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
            <DataTable
                data={jobs}
                columns={columns}
                loading={isLoading}
                searchable={false}
                pagination={pagination}
                onPageChange={onPageChange}
                pageSizeOptions={pageSizeOptions}
                onPageSizeChange={onPageSizeChange}
                selectedIds={selectedIds}
                onSelectionChange={onSelectionChange}
                compact
            />

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

            <ProductDetailsDialog
                job={selectedJob}
                open={!!selectedJob}
                onOpenChange={(open: boolean) => !open && setSelectedJob(null)}
            />
        </>
    );
}
