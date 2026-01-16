'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { WorkflowCard } from '@/components/features/workflows/WorkflowCard';
import { useState } from 'react';

import { useWorkflows } from '@/lib/hooks/features/useWorkflows';
import { PageLoading } from '@/components/shared/PageLoading';

export default function WorkflowsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const { data: workflows, isLoading } = useWorkflows();

    const filteredWorkflows = workflows?.filter((w: any) =>
        w.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (isLoading) {
        return (
            <div className="page-container">
                <PageLoading message="Loading workflows..." />
            </div>
        )
    }

    return (
        <div className="page-container space-y-6">
            <PageHeader
                title="Workflow Library"
                description="Discover and execute powerful AI pipelines."
            >
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                    </Button>
                    <Button className="gap-2 shadow-lg shadow-primary/20">
                        <Plus className="h-4 w-4" />
                        New Workflow
                    </Button>
                </div>
            </PageHeader>

            {/* Content Options */}
            <div className="flex w-full max-w-sm items-center space-x-2 pb-2">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search workflows..."
                        className="pl-9 bg-muted/40 border-transparent focus:bg-background focus:border-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                {filteredWorkflows.map((workflow: any, index: number) => (
                    <div key={workflow.id} className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both" style={{ animationDelay: `${index * 100}ms` }}>
                        <WorkflowCard workflow={workflow} />
                    </div>
                ))}
            </div>

            {filteredWorkflows.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                    <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No workflows found</h3>
                    <p className="max-w-md">Try adjusting your search terms or create a new workflow to get started.</p>
                </div>
            )}
        </div>
    );
}
