import * as React from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CreationJob, CreationJobStatus } from "@/lib/types/creation-job";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { MoreHorizontal, Trash2, ExternalLink, Copy, Share2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { DataTable } from "@/components/shared/DataTable";
import { ColumnDef } from '@tanstack/react-table';

import { ProductDetailsDialog } from "./ProductDetailsDialog";
import { formatDateTime } from "@/lib/utils/date";
import { toast } from "sonner";
import { Package, Zap } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PaginationInfo } from "@/components/shared/Pagination";
import { Checkbox } from "@/components/ui/Checkbox";
import { TriggerActionDialog } from "./TriggerActionDialog";
import { TriggerAction } from "@/lib/api/creation-tools";

import { creationJobsApi } from "@/lib/api/creation-jobs";
import { DataTableFacetedFilter } from "@/components/shared/data-table/DataTableFacetedFilter";
import { Search } from "@/components/shared/Search";
import { X } from "lucide-react";

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
    statusFilter?: string[];
    onStatusFilterChange?: (status: string[]) => void;
    searchFilter?: string;
    onSearchChange?: (search: string) => void;
    headerActions?: React.ReactNode;
    filterActions?: React.ReactNode;
    actions?: React.ReactNode;
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
    onPageSizeChange,
    statusFilter = [],
    onStatusFilterChange,
    searchFilter = "",
    onSearchChange,
    headerActions,
    filterActions,
    actions,
}: ProductsTableProps) {
    const router = useRouter();
    const [selectedJob, setSelectedJob] = useState<CreationJob | null>(null);

    // New State for Dynamic Actions
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState<TriggerAction | null>(null);
    const [activeJobForAction, setActiveJobForAction] = useState<CreationJob | null>(null);

    const getDisplayName = (job: CreationJob) => {
        const input = job.inputData as any;
        const subject = input?.prompt || input?.title || input?.name || input?.concept || input?.subject || input?.text;

        if (subject && typeof subject === 'string') {
            return subject;
        }

        return job.creationTool?.name || 'Untitled Product';
    };

    const columns = React.useMemo<ColumnDef<CreationJob>[]>(() => [
        {
            id: 'selection',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value: boolean | "indeterminate") => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value: boolean | "indeterminate") => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            id: 'name',
            header: 'Product',
            cell: ({ row }) => {
                const job = row.original;
                if (job.status === CreationJobStatus.FAILED) {
                    return (
                        <div className="flex flex-col">
                            <span className="font-medium text-sm text-destructive line-clamp-2 max-w-[300px]" title={job.error || "Unknown error"}>
                                {job.error ? `Error: ${job.error}` : "Job Failed"}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono uppercase">
                                ID: {job.id.substring(0, 8)}
                            </span>
                        </div>
                    );
                }
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-sm line-clamp-1 max-w-[300px]">
                            {getDisplayName(job)}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono uppercase">
                            ID: {job.id.substring(0, 8)}
                        </span>
                    </div>
                );
            },
            size: 300,
        },
        {
            id: 'creationToolId',
            header: 'Tool Name',
            cell: ({ row, getValue }) => <span className="text-sm font-medium">{row.original.creationTool?.name || (getValue() as React.ReactNode)}</span>,
            size: 150,
        },
        {
            id: 'status',
            header: 'Status',
            accessorKey: 'status',
            cell: ({ getValue }) => (
                <StatusBadge status={getValue() as CreationJobStatus} />
            ),
            size: 120,
        },
        {
            id: 'progress',
            header: 'Progress',
            accessorKey: 'progress',
            cell: ({ getValue }) => {
                const value = getValue() as number;
                return (
                    <div className="flex flex-col gap-1.5 w-full">
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
                );
            },
            size: 150,
        },
        {
            id: 'createdAt',
            header: 'Created At',
            accessorKey: 'createdAt',
            cell: ({ getValue }) => (
                <span className="text-muted-foreground text-sm">
                    {formatDateTime(getValue() as string | Date)}
                </span>
            ),
            size: 180,
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const job = row.original;
                return (
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
                                        navigator.clipboard.writeText(job.id);
                                        toast.success("Job ID copied");
                                    }}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Job ID
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {job.status === CreationJobStatus.COMPLETED && (
                                    <>
                                        <DropdownMenuItem onClick={() => setSelectedJob(job)}>
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            View Details
                                        </DropdownMenuItem>

                                        {/* Dynamic Manual Actions from Tool Config */}
                                        {job.creationTool?.actions?.map((action: TriggerAction) => (
                                            <DropdownMenuItem
                                                key={action.id}
                                                onClick={() => {
                                                    setActiveJobForAction(job);
                                                    setSelectedAction(action);
                                                    setActionDialogOpen(true);
                                                }}
                                            >
                                                <Zap className="mr-2 h-4 w-4 text-primary" />
                                                {action.name}
                                            </DropdownMenuItem>
                                        ))}

                                        {/* Fallback Legacy Post Action (only if no actions defined) */}
                                        {(!job.creationTool?.actions || job.creationTool.actions.length === 0) && (
                                            <DropdownMenuItem onClick={() => {
                                                router.push(`/publishing/${job.id}` as Route);
                                            }}>
                                                <Share2 className="mr-2 h-4 w-4" />
                                                Post to Channels
                                            </DropdownMenuItem>
                                        )}
                                    </>
                                )}
                                <DropdownMenuItem
                                    onClick={() => onDelete?.(job.id)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            }
        }
    ], [onDelete]);



    return (
        <>
            <DataTable
                data={jobs}
                columns={columns}
                loading={isLoading}
                searchable={true}
                searchValue={searchFilter}
                onSearch={onSearchChange}
                searchPlaceholder="Filter products..."
                headerActions={headerActions}
                filterActions={filterActions || (
                    <div className="flex items-center gap-2">
                        {onStatusFilterChange && (
                            <DataTableFacetedFilter
                                title="Status"
                                options={[
                                    { label: "Completed", value: CreationJobStatus.COMPLETED },
                                    { label: "Pending", value: CreationJobStatus.PENDING },
                                    { label: "Processing", value: CreationJobStatus.PROCESSING },
                                    { label: "Failed", value: CreationJobStatus.FAILED },
                                ]}
                                selectedValues={new Set(statusFilter)}
                                onSelect={(values) => onStatusFilterChange(Array.from(values))}
                            />
                        )}
                        {(statusFilter.length > 0 || searchFilter) && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    onStatusFilterChange?.([]);
                                    onSearchChange?.("");
                                }}
                                className="h-8 px-2 lg:px-3"
                            >
                                Reset
                                <X className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}
                actions={actions}
                pagination={pagination}
                onPageChange={onPageChange}
                pageSizeOptions={pageSizeOptions}
                onPageSizeChange={onPageSizeChange}
                selectedIds={selectedIds}
                onSelectionChange={onSelectionChange}
                compact
                noCard
                className="w-full"
                emptyComponent={
                    <EmptyState
                        icon={<Package className="w-12 h-12" />}
                        title="No products found"
                        description="You haven't created any products yet."
                        action={{
                            label: "Explore Tools",
                            onClick: () => window.location.href = '/creation-tools',
                            variant: "default"
                        }}
                    />
                }
            />

            <ProductDetailsDialog
                job={selectedJob}
                open={!!selectedJob}
                onOpenChange={(open: boolean) => !open && setSelectedJob(null)}
            />



            <TriggerActionDialog
                open={actionDialogOpen}
                onOpenChange={(open) => {
                    setActionDialogOpen(open);
                    if (!open) {
                        setSelectedAction(null);
                        setActiveJobForAction(null);
                    }
                }}
                jobId={activeJobForAction?.id || null}
                action={selectedAction}
                productName={activeJobForAction ? getDisplayName(activeJobForAction) : undefined}
            />
        </>
    );
}
