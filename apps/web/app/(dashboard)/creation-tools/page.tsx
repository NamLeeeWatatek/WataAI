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
import { EmptyState } from '@/components/shared/EmptyState';
import { ToolCardSkeleton } from '@/components/shared/Skeletons';


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
                        loading={isFetching && searchQuery !== debouncedSearch}
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
                {isLoading && items.length === 0 ? (
                    Array.from({ length: 12 }).map((_, i) => <ToolCardSkeleton key={i} />)
                ) : (
                    items.map((tool) => {
                        const analysis = (() => {
                            const fields = tool.formConfig?.fields || [];
                            const hasFiles = fields.some(f => ['file', 'files', 'image', 'video'].includes(f.type));
                            const hasTemplate = fields.some(f => f.type === 'template-selector');

                            const name = tool.name.toLowerCase();
                            const slug = tool.slug.toLowerCase();

                            const isVideo = name.includes('video') || slug.includes('video');
                            const isImage = !isVideo && (name.includes('hình ảnh') || name.includes('image') || slug.includes('image'));

                            const input = tool.metadata?.inputLabel || (hasFiles ? "Assets" : (hasTemplate ? "Template" : "Input"));
                            const output = tool.metadata?.outputLabel || (isVideo ? "Video" : (isImage ? "Image" : "Result"));
                            const cta = tool.formConfig?.submitLabel || tool.metadata?.actionLabel || (isVideo ? "Create Video" : (isImage ? "Generate Image" : "Open Tool"));

                            let description = tool.description;
                            if (!description || description.includes("Specialized AI agent")) {
                                if (isVideo) description = "Transform assets into high-energy UGC videos.";
                                else if (isImage) description = "Generate marketing visuals from templates or text.";
                                else description = "Accelerate creation with high-performance AI.";
                            }

                            return { input, output, cta, description, type: isVideo ? 'video' : (isImage ? 'image' : 'text') };
                        })();

                        return (
                            <Card
                                key={tool.id}
                                className="group flex flex-col h-full cursor-pointer bg-card border border-border/40 rounded-[32px] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20"
                                onClick={() => router.push(`/creation-tools/${tool.slug}`)}
                            >
                                {/* Visual Header - Image remains the Hero */}
                                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5 dark:bg-white/5">
                                    {tool.coverImage ? (
                                        <>
                                            <img
                                                src={tool.coverImage}
                                                alt={tool.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-60" />
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-muted/10 group-hover:from-primary/10 transition-colors duration-500" />
                                    )}

                                    {/* Subtle Floating Glass Icon - Moved to side to show more image */}
                                    <div className="absolute bottom-4 right-4 z-10">
                                        <div className="p-3 rounded-2xl bg-background/60 backdrop-blur-xl border border-white/20 shadow-lg group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                                            {tool.icon && (icons as any)[tool.icon] ? (
                                                (() => {
                                                    const ToolIcon = (icons as any)[tool.icon];
                                                    return <ToolIcon className="w-5 h-5 text-foreground group-hover:text-white transition-colors" />;
                                                })()
                                            ) : (
                                                <icons.Sparkles className="w-5 h-5 text-foreground" />
                                            )}
                                        </div>

                                        {/* Small Type Label */}
                                        <div className="absolute -top-2 -right-2 p-1.5 rounded-lg bg-primary text-white shadow-lg scale-90">
                                            {analysis.type === 'video' ? <icons.Play className="w-2.5 h-2.5 fill-current" /> : (analysis.type === 'image' ? <icons.Camera className="w-2.5 h-2.5" /> : <icons.FileText className="w-2.5 h-2.5" />)}
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="absolute top-4 left-4 z-20">
                                        {(tool.categories || []).slice(0, 1).map((cat) => (
                                            <Badge key={cat.id} className="bg-background/40 backdrop-blur-md border border-white/10 text-[9px] text-foreground font-bold uppercase tracking-wider h-6">
                                                {cat.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Refined Content Area - Clean & Airy */}
                                <div className="flex flex-col flex-1 p-6 pt-7">
                                    <div className="mb-6">
                                        <h3 className="text-lg font-bold tracking-tight text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                                            {tool.name}
                                        </h3>
                                        <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2 h-10 font-medium">
                                            {analysis.description}
                                        </p>
                                    </div>

                                    {/* Logic Data - Compact & Minimal */}
                                    <div className="mb-8 flex items-center gap-3">
                                        <div className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-muted/30 border border-border/40">
                                            <span className="text-[9px] font-bold text-muted-foreground/40 uppercase">In</span>
                                            <span className="text-[10px] font-bold text-foreground/70">{analysis.input}</span>
                                        </div>
                                        <div className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-primary/5 border border-primary/10">
                                            <span className="text-[9px] font-bold text-primary/40 uppercase">Out</span>
                                            <span className="text-[10px] font-bold text-primary/70">{analysis.output}</span>
                                        </div>
                                    </div>

                                    {/* Standardized CTA */}
                                    <Button
                                        className="w-full h-11 rounded-2xl font-bold uppercase tracking-[0.1em] text-[10px] bg-secondary hover:bg-primary hover:text-white transition-all duration-300"
                                    >
                                        {analysis.cta}
                                    </Button>
                                </div>
                            </Card>
                        );
                    })
                )}
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
