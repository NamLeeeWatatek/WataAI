"use client"

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Folder } from "lucide-react"
import { icons } from "lucide-react"

import { PageShell } from "@/components/layout/PageShell"
import { DataTable, Column } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { CategoryDialog } from "@/components/features/categories/CategoryDialog"
import { categoriesApi, Category } from "@/lib/api/categories"
import { PaginationInfo } from "@/components/ui/Pagination"
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
    const [querySearch, setQuerySearch] = useState('')
    const searchTimerRef = useRef<NodeJS.Timeout>()

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
        }
    }, [])

    // Reset page 1 when search changes


    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ['categories', page, limit, querySearch],
        queryFn: () => categoriesApi.findAll({ page, limit, search: querySearch }),
        placeholderData: keepPreviousData,
    })

    const data = response?.data || []
    const total = response?.total || 0

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await categoriesApi.delete(deleteId)
            toast.success("Category deleted")
            refetch()
        } catch (error) {
            toast.error("Failed to delete category")
        } finally {
            setDeleteId(null)
        }
    }

    const columns: Column<Category>[] = [
        {
            key: "name",
            label: "Name",
            sortable: true,
            render: (value, row) => {
                const IconComponent = row.icon && (icons as any)[row.icon]
                    ? (icons as any)[row.icon]
                    : Folder;
                return (
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{value}</span>
                    </div>
                )
            }
        },
        {
            key: "slug",
            label: "Slug",
            className: "text-muted-foreground font-mono text-sm"
        },
        {
            key: "description",
            label: "Description",
            className: "text-muted-foreground max-w-xs truncate",
            render: (value) => <span className="truncate block" title={value}>{value || "-"}</span>
        },
        {
            key: "type",
            label: "Type",
            render: (value) => (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground capitalize">
                    {value || "system"}
                </span>
            )
        },
        {
            key: "createdAt",
            label: "Created At",
            render: (value) => new Date(value).toLocaleDateString()
        },
        {
            key: "actions",
            label: "Actions",
            width: 100,
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                            e.stopPropagation()
                            setEditingCategory(row)
                            setDialogOpen(true)
                        }}
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation()
                            setDeleteId(row.id)
                        }}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    ]

    const pagination: PaginationInfo = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit)
    }

    return (
        <PageShell
            title="Categories"
            description="Manage system-wide categories for tools and content."
            icon={Folder}
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
                pagination={pagination}
                onPageChange={setPage}
                onPageSizeChange={(newLimit) => {
                    setLimit(newLimit)
                    setPage(1)
                }}
                searchable={true}
                searchPlaceholder="Search categories..."
                searchValue={search}
                onSearch={(value) => {
                    setSearch(value);

                    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
                    searchTimerRef.current = setTimeout(() => {
                        setQuerySearch(value)
                        setPage(1)
                    }, 500)
                }}
            />

            <CategoryDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                category={editingCategory}
                onSuccess={() => refetch()}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the category. Tools assigned to this category may need to be updated.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageShell >
    )
}
