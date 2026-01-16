'use client';

import { useState, useCallback } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    BackgroundVariant,
    Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { Save, Play } from 'lucide-react';
import { MemoizedKBRetrievalNode } from '@/components/features/workflows/nodes/KBRetrievalNode';

// Define custom node types
const nodeTypes = {
    kbRetrieval: MemoizedKBRetrievalNode,
};

// Initial Nodes for demo
const initialNodes: Node[] = [
    {
        id: '1',
        type: 'input',
        data: { label: 'User Query Input' },
        position: { x: 250, y: 50 },
        className: 'border-2 border-primary/50 shadow-lg'
    },
    {
        id: '2',
        type: 'kbRetrieval',
        data: { kbId: '' },
        position: { x: 200, y: 200 }
    },
    {
        id: '3',
        type: 'output',
        data: { label: 'LLM Response Generation' },
        position: { x: 250, y: 500 },
        className: 'border-2 border-green-500/50 shadow-lg'
    },
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e2-3', source: '2', target: '3', animated: true },
];

import { useWorkflow } from '@/lib/hooks/features/useWorkflows';
import { use, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function WorkflowEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: workflow, isLoading, update, isSaving } = useWorkflow(id);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const onSave = async () => {
        await update({
            graph: { nodes, edges }
        });
    };

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    if (isLoading) return <div className="p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <PageShell
            title={`Workflow Editor: ${id}`}
            description="Design your AI pipeline."
            fullWidth
            contentClassName="h-[calc(100vh-140px)]"
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={onSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save
                    </Button>
                    <Button className="gap-2 bg-green-600 hover:bg-green-700">
                        <Play className="h-4 w-4" />
                        Run
                    </Button>
                </div>
            }
        >
            <div className="h-full w-full border rounded-2xl overflow-hidden bg-muted/10 shadow-inner">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    proOptions={{ hideAttribution: true }}
                >
                    <Controls className="bg-white/90 border-0 shadow-lg" />
                    <MiniMap className="bg-white/90 border-0 shadow-lg" zoomable pannable />
                    <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                </ReactFlow>
            </div>
        </PageShell>
    );
}
