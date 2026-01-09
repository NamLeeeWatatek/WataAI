"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Folder, RefreshCw } from "lucide-react"
import { icons } from "lucide-react"
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from "@/components/ui/Checkbox"
import { BulkActionsToolbar } from "@/components/ui/BulkActionsToolbar"

import { PageShell } from "@/components/layout/PageShell"
import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { CategoryDialog } from "@/components/features/categories/CategoryDialog"
import { Category } from "@/lib/api/categories"
import { useCategories } from "@/lib/hooks/features/useCategories"
import { PaginationInfo } from "@/components/ui/Pagination"
import { useDebounce } from "@/lib/hooks/useDebounce"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/AlertDialog"

export default function CategoriesPage() {
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 500)

    // Bulk Actions
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)
    const [bulkDeleteAlertOpen, setBulkDeleteAlertOpen] = useState(false)

    // Reset page 1 when search changes
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch])


    const {
        data: response,
        isLoading,
        refetch,
        deleteCategory
    } = useCategories({ page, limit, search: debouncedSearch })

    const data = response?.data || []
    const total = response?.total || 0

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await deleteCategory(deleteId)
            // Success handled in hook
            refetch()
        } catch (error) {
            // Error handled in hook
        } finally {
            setDeleteId(null)
        }
    }

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true)
        try {
            for (const id of selectedIds) {
                await deleteCategory(id)
            }
            toast.success(`Deleted ${selectedIds.length} categories successfully`)
            setSelectedIds([])
            refetch()
        } catch (error) {
            toast.error('Failed to delete some categories')
        } finally {
            setIsBulkDeleting(false)
            setBulkDeleteAlertOpen(false)
        }
    }

    const columns = React.useMemo<ColumnDef<Category>[]>(() => [
        {
            id: 'selection',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            id: "name",
            header: "Name",
            accessorKey: "name",
            cell: ({ row }) => {
                const category = row.original;
                const IconComponent = category.icon && (icons as Record<string, React.ElementType>)[category.icon]
                    ? (icons as Record<string, React.ElementType>)[category.icon]
                    : Folder;
                return (
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{category.name}</span>
                    </div>
                )
            }
        },
        {
            id: "slug",
            header: "Slug",
            accessorKey: "slug",
            cell: ({ getValue }) => (
                <span className="text-muted-foreground font-mono text-sm">{getValue() as string}</span>
            )
        },
        {
            id: "description",
            header: "Description",
            accessorKey: "description",
            cell: ({ getValue }) => (
                <span className="text-muted-foreground text-sm line-clamp-1">{getValue() as string || "—"}</span>
            )
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setEditingCategory(row.original)
                            setDialogOpen(true)
                        }}
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(row.original.id)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    ], [])

    const pagination: PaginationInfo = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total
    }

    return (
        <PageShell
            title="Categories"
            description="Manage your product and content categories"
        >
            <DataTable
                data={data}
                columns={columns}
                loading={isLoading}
                searchable={true}
                searchValue={search}
                onSearch={setSearch}
                pagination={pagination}
                onPageChange={setPage}
                onPageSizeChange={(newLimit) => {
                    setLimit(newLimit)
                    setPage(1)
                }}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                gridClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                renderGridItem={(category) => (
                    <Card className="flex flex-col h-full hover:shadow-md transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    {icons[category.icon as keyof typeof icons] ? (
                                        React.createElement(icons[category.icon as keyof typeof icons], { className: "w-4 h-4" })
                                    ) : (
                                        <Folder className="w-4 h-4" />
                                    )}
                                </div>
                                <CardTitle className="text-sm font-bold">{category.name}</CardTitle>
                            </div>
                            <Badge variant="outline">{(category as any)._count?.products || 0}</Badge>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <p className="text-xs text-muted-foreground line-clamp-3">
                                {category.description || "No description provided."}
                            </p>
                        </CardContent>
                        <CardFooter className="pt-2 flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setEditingCategory(category)
                                    setDialogOpen(true)
                                }}
                            >
                                <Pencil className="w-3 h-3 mr-1" /> Edit
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteId(category.id)}
                            >
                                <Trash2 className="w-3 h-3 mr-1" /> Delete
                            </Button>
                        </CardFooter>
                    </Card>
                )}
                actions={
                    <Button onClick={() => {
                        setEditingCategory(null)
                        setDialogOpen(true)
                    }}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Category
                    </Button>
                }
            />

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

            <CategoryDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                category={editingCategory}
                onSuccess={() => {
                    refetch()
                    setDialogOpen(false)
                }}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the category.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={bulkDeleteAlertOpen} onOpenChange={setBulkDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedIds.length} categories?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the selected categories? This action cannot be undone.
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
        </PageShell>
    )
}
