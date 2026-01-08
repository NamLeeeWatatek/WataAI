'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { creationToolsApi } from '@/lib/api/creation-tools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Sparkles } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

export default function CreationToolsPage() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    const { data: toolsData, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['creation-tools', currentPage, pageSize],
        queryFn: () => creationToolsApi.getAll({
            page: currentPage,
            limit: pageSize,
            filters: { isActive: true }
        }),
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const items = toolsData?.data || [];
    const totalItems = toolsData?.total || 0;

    const handleRefresh = () => {
        refetch();
    };

    if (isLoading && items.length === 0) {
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
                onRefresh={handleRefresh}
                refreshing={isLoading || isFetching}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((tool) => (
                    <Card
                        key={tool.id}
                        className="cursor-pointer group hover:shadow-xl transition-all duration-300 border-border/40 bg-card/50 backdrop-blur-sm"
                        onClick={() => router.push(`/creation-tools/${tool.slug}`)}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 mb-4 shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex gap-2 flex-wrap justify-end max-w-[60%]">
                                    {(tool.categories || [])
                                        .slice(0, 3)
                                        .map((cat) => (
                                            <Badge
                                                key={cat.id}
                                                variant="secondary"
                                                className="text-[10px] px-2 h-5 font-bold uppercase tracking-wider"
                                            >
                                                {cat.name}
                                            </Badge>
                                        ))}
                                    {(tool.categories || []).length > 3 && (
                                        <Badge variant="outline" className="text-[10px] px-1 h-5 font-bold">
                                            +{(tool.categories || []).length - 3}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <CardTitle className="text-xl group-hover:text-primary transition-colors font-black tracking-tight">
                                {tool.name}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 font-medium">
                                {tool.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-all" size="lg">
                                Start Creating
                                <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
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
                        onPageSizeChange={(newSize) => {
                            setPageSize(newSize);
                            setCurrentPage(1);
                        }}
                        pageSizeOptions={[12, 24, 48]}
                    />
                </div>
            )}

            {items.length === 0 && !isLoading && (
                <div className="text-center py-20 bg-muted/5 rounded-3xl border border-dashed border-border/60">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-muted-foreground opacity-20" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">No creation tools available</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">We couldn't find any active creation tools in this workspace. Check back later.</p>
                </div>
            )}
        </div>
    );
}
