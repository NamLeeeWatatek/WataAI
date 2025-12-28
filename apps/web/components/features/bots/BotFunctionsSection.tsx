'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Zap } from 'lucide-react';
import type { BotFunction } from '@/lib/types/bots';
import { BotFunctionCard } from './BotFunctionCard';

interface Props {
    botFunctions: BotFunction[];
    onAdd: () => void;
    onEdit: (func: BotFunction) => void;
    onDelete: (functionId: string) => void;
}

export function BotFunctionsSection({ botFunctions, onAdd, onEdit, onDelete }: Props) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" />
                            <CardTitle>Functions</CardTitle>
                        </div>
                        <CardDescription>
                            Extend your bot's capabilities with custom functions
                        </CardDescription>
                    </div>
                    <Button onClick={onAdd} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Function
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {botFunctions.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No functions yet</h3>
                        <p className="text-muted-foreground mb-4 text-sm">
                            Add functions to enable document access, auto-fill, and AI suggestions
                        </p>
                        <Button onClick={onAdd} variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Function
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {botFunctions.map((func) => (
                            <BotFunctionCard
                                key={func.id}
                                botFunction={func}
                                onEdit={() => onEdit(func)}
                                onDelete={() => onDelete(func.id)}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

