import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
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
// import { formatDateTime } from "@/lib/utils/date"; // Removed
import { format } from "date-fns";
import { useDateLocale } from "@/lib/hooks/use-date-locale";
import { toast } from "sonner";
import { Package, Zap, RotateCcw } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PaginationInfo } from "@/components/shared/Pagination";
import { Checkbox } from "@/components/ui/Checkbox";
import { TriggerActionDialog } from "./TriggerActionDialog";
import { TriggerAction } from "@/lib/api/creation-tools";

import { creationJobsApi } from "@/lib/api/creation-jobs";
import { DataTableFacetedFilter } from "@/components/shared/data-table/DataTableFacetedFilter";
import { Search } from "@/components/shared/Search";
import { X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";

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
    const { t } = useTranslation();
    const [selectedJob, setSelectedJob] = useState<CreationJob | null>(null);

    // New State for Dynamic Actions
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState<TriggerAction | null>(null);
    const [activeJobForAction, setActiveJobForAction] = useState<CreationJob | null>(null);
    const locale = useDateLocale();

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
                    aria-label={`Select product ${getDisplayName(row.original)}`}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            id: 'name',
            header: t('products_table.header.product'),
            cell: ({ row }) => {
                const job = row.original;
                if (job.status === CreationJobStatus.FAILED) {
                    const errorMsg = job.error ? `Error: ${job.error}` : "Job Failed";
                    return (
                        <div className="flex flex-col">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="font-medium text-sm text-destructive truncate max-w-[200px] cursor-help">
                                            {errorMsg}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-[300px] break-words">
                                        {errorMsg}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <span className="text-[10px] text-muted-foreground font-mono uppercase">
                                ID: {job.id.substring(0, 8)}
                            </span>
                        </div>
                    );
                }
                const displayName = getDisplayName(job);
                return (
                    <div className="flex flex-col">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="font-medium text-sm truncate max-w-[200px] cursor-help">
                                        {displayName}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-[300px] break-words">
                                    {displayName}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <span className="text-[10px] text-muted-foreground font-mono uppercase">
                            ID: {job.id.substring(0, 8)}
                        </span>
                    </div>
                );
            },
            size: 200,
        },
        {
            id: 'creationToolId',
            header: t('products_table.header.tool_name'),
            cell: ({ row, getValue }) => {
                const toolName = row.original.creationTool?.name || (getValue() as string) || '';
                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className={cn(
                                    "text-sm font-medium cursor-help block truncate",
                                    "max-w-[150px]"
                                )}>
                                    {toolName}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                {toolName}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            },
            size: 150,
        },
        {
            id: 'status',
            header: t('products_table.header.status'),
            accessorKey: 'status',
            cell: ({ getValue }) => (
                <StatusBadge status={getValue() as CreationJobStatus} />
            ),
            size: 120,
        },
        {
            id: 'progress',
            header: t('products_table.header.progress'),
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
                                    : "bg-gradient-to-r from-blue-600 via-teal-500 to-cyan-500"
                            )}
                        />
                    </div>
                );
            },
            size: 150,
        },
        {
            id: 'createdAt',
            header: t('products_table.header.created_at'),
            accessorKey: 'createdAt',
            cell: ({ getValue }) => (
                <span className="text-muted-foreground text-sm">
                    {getValue() ? format(new Date(getValue() as string), 'PPpp', { locale }) : 'N/A'}
                </span>
            ),
            size: 180,
        },
        {
            id: 'actions',
            header: t('products_table.header.actions'),
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
                                <DropdownMenuLabel>{t('products_table.actions.label')}</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => {
                                        navigator.clipboard.writeText(job.id);
                                        toast.success("Job ID copied");
                                    }}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    {t('products_table.actions.copy_job_id')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {job.status === CreationJobStatus.COMPLETED && (
                                    <>
                                        <DropdownMenuItem onClick={() => setSelectedJob(job)}>
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            {t('products_table.actions.view_details')}
                                        </DropdownMenuItem>

                                        {job.creationTool?.slug && (
                                            <DropdownMenuItem onClick={() => {
                                                router.push(`/creation-tools/${job.creationTool!.slug}?recreateFrom=${job.id}` as Route);
                                            }}>
                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                {t('products_table.actions.recreate')}
                                            </DropdownMenuItem>
                                        )}

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
                                                {t('products_table.actions.post_to_channels')}
                                            </DropdownMenuItem>
                                        )}
                                    </>
                                )}
                                <DropdownMenuItem
                                    onClick={() => onDelete?.(job.id)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t('common.delete')}
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
                searchPlaceholder={t('products_table.search_placeholder')}
                headerActions={headerActions}
                filterActions={filterActions || (
                    <div className="flex items-center gap-2">
                        {onStatusFilterChange && (
                            <DataTableFacetedFilter
                                title={t('products_table.filters.status')}
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
                                {t('common.reset')}
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
