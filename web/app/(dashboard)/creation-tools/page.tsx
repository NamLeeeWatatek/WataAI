'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { creationToolsApi } from '@/lib/api/creation-tools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Sparkles, icons, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useCategories } from '@/lib/hooks/useCategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { PageHeader } from '@/components/shared/PageHeader';
import { Pagination } from '@/components/shared/Pagination';
import { Search } from '@/components/shared/Search';
import { PageLoading } from '@/components/shared/PageLoading';
import { EmptyState } from '@/components/shared/EmptyState';

function CategoryItems() {
    const { data: categories = [] } = useCategories('creation-tool');
    return (
        <>
            {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                </SelectItem>
            ))}
        </>
    );
}

export default function CreationToolsPage() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const debouncedSearch = useDebounce(searchQuery, 500);

    const { data: toolsData, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['creation-tools', currentPage, pageSize, debouncedSearch, selectedCategory],
        queryFn: () => creationToolsApi.getAll({
            page: currentPage,
            limit: pageSize,
            filters: {
                isActive: true,
                ...(debouncedSearch ? { name: debouncedSearch } : {}),
                ...(selectedCategory !== 'all' ? { categoryId: selectedCategory } : {})
            }
        }),
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Reset page on search or category change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, selectedCategory]);

    const items = toolsData?.data || [];
    const totalItems = toolsData?.total || 0;

    const handleRefresh = () => {
        refetch();
    };

    if (isLoading && items.length === 0) {
        return (
            <div className="page-container">
                <PageLoading message="Loading tools..." />
            </div>
        );
    }

    return (
        <div className="page-container space-y-6">
            <PageHeader
                title="Creation Tools"
                description="Choose a tool to start creating amazing content with AI"
                onRefresh={handleRefresh}
                refreshing={isLoading || isFetching}
            />

            {/* Premium Header Controls */}
            <div className="glass-card flex flex-col md:flex-row items-center gap-4 p-1.5 rounded-2xl backdrop-blur-sm">
                <div className="flex-1 w-full relative group">
                    <Search
                        placeholder="Search tools..."
                        value={searchQuery}
                        onChange={(e: any) => setSearchQuery(e.target.value)}
                        onClear={() => setSearchQuery('')}
                    // Assuming Search component accepts className for customization, if not we wrap it or styled it globally, 
                    // but here we rely on existing props. If Search is rigid, we might need to adjust it later.
                    />
                </div>
                <div className="w-full md:w-[240px]">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full bg-background/50 border-transparent hover:bg-background hover:border-border/50 focus:ring-0 transition-all font-medium">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <CategoryItems />
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Premium Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((tool) => (
                    <Card
                        key={tool.id}
                        className="group relative overflow-hidden cursor-pointer border-0 bg-transparent shadow-none hover:shadow-none transition-all duration-300"
                        onClick={() => router.push(`/creation-tools/${tool.slug}`)}
                    >
                        {/* Image Container */}
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border/50 bg-muted/20">
                            {tool.coverImage ? (
                                <img
                                    src={tool.coverImage}
                                    alt={tool.name}
                                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted/50 via-muted/30 to-muted/10 group-hover:from-primary/5 group-hover:to-primary/10 transition-colors duration-500">
                                    <div className="p-4 rounded-2xl bg-background/50 backdrop-blur-sm shadow-sm border border-white/10 group-hover:scale-110 transition-transform duration-500">
                                        {tool.icon && (icons as any)[tool.icon] ? (
                                            (() => {
                                                const ToolIcon = (icons as any)[tool.icon];
                                                return <ToolIcon className="w-8 h-8 text-muted-foreground/60 group-hover:text-primary transition-colors duration-500" />;
                                            })()
                                        ) : (
                                            <Sparkles className="w-8 h-8 text-muted-foreground/60 group-hover:text-primary transition-colors duration-500" />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Cinematic Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                            {/* Hover Overlay - Primary Tint */}
                            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay" />

                            {/* Top Badges */}
                            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                <div className="flex flex-wrap gap-2 max-w-[70%]">
                                    {(tool.categories || [])
                                        .slice(0, 2)
                                        .map((cat) => (
                                            <Badge
                                                key={cat.id}
                                                variant="secondary"
                                                className="h-6 px-2.5 text-[10px] font-bold uppercase tracking-wider bg-black/40 backdrop-blur-md text-white border border-white/10 shadow-lg"
                                            >
                                                {cat.name}
                                            </Badge>
                                        ))}
                                </div>

                                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-75">
                                    <ArrowRight className="w-4 h-4 text-white" />
                                </div>
                            </div>

                            {/* Bottom Content (Inside Image) */}
                            <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <h3 className="text-xl font-bold tracking-tight text-white mb-2 line-clamp-1 drop-shadow-md">
                                    {tool.name}
                                </h3>
                                <p className="text-sm text-white/80 font-medium line-clamp-2 leading-relaxed mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 h-0 group-hover:h-auto">
                                    {tool.description || "Create amazing content with AI."}
                                </p>

                                {/* Action Button */}
                                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 delay-100">
                                    <Button size="sm" className="w-full rounded-xl font-bold bg-white text-black hover:bg-white/90 border-0 shadow-xl">
                                        Open Tool
                                    </Button>
                                </div>
                            </div>
                        </div>
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
                <div className="py-20">
                    <EmptyState
                        icon={<Sparkles className="w-12 h-12 text-muted-foreground/50" />}
                        title="No creation tools available"
                        description="We couldn't find any active creation tools in this workspace. Check back later."
                    />
                </div>
            )}
        </div>
    );
}
