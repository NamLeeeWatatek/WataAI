"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Folder } from "lucide-react"
import { icons } from "lucide-react"
import { ColumnDef } from '@tanstack/react-table'

import { PageShell } from "@/components/layout/PageShell"
import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
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

    const columns = React.useMemo<ColumnDef<Category>[]>(() => [
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
            actions={
                <Button onClick={() => {
                    setEditingCategory(null)
                    setDialogOpen(true)
                }}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Category
                </Button>
            }
        >
            <DataTable
                data={data}
                columns={columns}
                loading={isLoading}
                searchValue={search}
                onSearch={setSearch}
                pagination={pagination}
                onPageChange={setPage}
                onPageSizeChange={setLimit}
                emptyMessage="No categories found. Create your first category to get started."
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
        </PageShell>
    )
}
