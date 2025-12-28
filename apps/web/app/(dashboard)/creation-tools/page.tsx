'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { creationToolsApi, CreationTool } from '@/lib/api/creation-tools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Sparkles } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { PageHeader } from '@/components/ui/PageHeader';

export default function CreationToolsPage() {
    const router = useRouter();
    const [items, setItems] = useState<CreationTool[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        loadTools();
    }, [currentPage, pageSize]);

    const loadTools = async () => {
        try {
            setLoading(true);
            const response = await creationToolsApi.getAll({
                page: currentPage,
                limit: pageSize,
                filters: { isActive: true }
            });
            setItems(response.data);
            setTotalItems(response.total);
        } catch (error) {
            console.error('Failed to load creation tools:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && items.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Creation Tools"
                description="Choose a tool to start creating amazing content with AI"
                onRefresh={loadTools}
                refreshing={loading}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((tool) => (
                    <Card
                        key={tool.id}
                        className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                        onClick={() => router.push(`/creation-tools/${tool.slug}`)}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                {tool.name}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                                {tool.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full group-hover:scale-105 transition-transform" size="lg">
                                Start Creating
                                <Sparkles className="w-4 h-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {totalItems > 0 && (
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
            )}

            {(!items || items.length === 0) && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No creation tools available yet.</p>
                </div>
            )}
        </div>
    );
}
