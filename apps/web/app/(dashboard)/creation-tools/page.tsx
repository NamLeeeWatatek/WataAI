'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { creationToolsApi } from '@/lib/api/creation-tools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Sparkles, Search as SearchIcon, icons } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Search } from '@/components/ui/Search';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useCategories } from '@/lib/hooks/useCategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

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

            <div className="flex flex-col sm:flex-row gap-4 items-center max-w-2xl">
                <div className="flex-1 w-full">
                    <Search
                        placeholder="Search tools..."
                        value={searchQuery}
                        onChange={(e: any) => setSearchQuery(e.target.value)}
                        onClear={() => setSearchQuery('')}
                    />
                </div>
                <div className="w-full sm:w-[200px]">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full bg-card/50 backdrop-blur-sm border-border/40 font-bold">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {/* We should ideally fetch these, but for now we can extract from data or fetch separately. 
                                Let's use the hook to fetch them properly. */}
                            <CategoryItems />
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((tool) => (
                    <Card
                        key={tool.id}
                        className="cursor-pointer group hover:bg-card/70 transition-all duration-300 border-border/40 bg-card/50 backdrop-blur-sm"
                        onClick={() => router.push(`/creation-tools/${tool.slug}`)}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 mb-4 transition-transform group-hover:scale-110 duration-500">
                                    {tool.icon && (icons as any)[tool.icon] ? (
                                        (() => {
                                            const ToolIcon = (icons as any)[tool.icon];
                                            return <ToolIcon className="w-6 h-6 text-white" />;
                                        })()
                                    ) : (
                                        <Sparkles className="w-6 h-6 text-white" />
                                    )}
                                </div>
                                <div className="flex gap-1.5 flex-wrap justify-end max-w-[65%]">
                                    {(tool.categories || [])
                                        .slice(0, 5)
                                        .map((cat) => (
                                            <Badge
                                                key={cat.id}
                                                variant="secondary"
                                                className="text-[9px] px-2 h-5 font-bold uppercase tracking-wider bg-primary/10 text-primary border-none hover:bg-primary/20 transition-colors"
                                            >
                                                {cat.name}
                                            </Badge>
                                        ))}
                                    {(tool.categories || []).length > 5 && (
                                        <Badge variant="outline" className="text-[9px] px-1.5 h-5 font-bold border-dashed opacity-70">
                                            +{(tool.categories || []).length - 5}
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
