'use client';

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Database, Search } from 'lucide-react';
import { useKnowledgeBases } from '@/lib/hooks/use-kb'

// Mock workspace ID for now, or get from context
const WORKSPACE_ID = 'default-workspace';

export function KBRetrievalNode({ data, isConnectable }: any) {
    const { knowledgeBases: kbs } = useKnowledgeBases(WORKSPACE_ID);

    return (
        <Card className="min-w-[300px] border-2 border-indigo-500/50 shadow-xl bg-card/95 backdrop-blur-sm">
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-indigo-500 border-2 border-white"
            />

            <CardHeader className="p-3 bg-indigo-500/10 border-b border-indigo-500/20">
                <div className="flex items-center gap-2 text-indigo-500">
                    <Database className="h-4 w-4" />
                    <span className="font-semibold text-sm">KB Retrieval</span>
                </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Select Knowledge Base
                    </label>
                    <Select
                        value={data.kbId}
                        onValueChange={(val) => data.onChange?.(val)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a KB..." />
                        </SelectTrigger>
                        <SelectContent>
                            {kbs?.map((kb: any) => (
                                <SelectItem key={kb.id} value={kb.id}>
                                    {kb.name}
                                </SelectItem>
                            ))}
                            {(!kbs || kbs.length === 0) && (
                                <SelectItem value="none" disabled>No KBs found</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground flex gap-2 items-center">
                    <Search className="h-3 w-3" />
                    <span>Inputs: Query String</span>
                </div>
            </CardContent>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-indigo-500 border-2 border-white"
            />
        </Card>
    );
}

export const MemoizedKBRetrievalNode = memo(KBRetrievalNode);
