'use client';

import React from 'react';
import { WorkspaceSwitcher } from '@/components/features/workspace/WorkspaceSwitcher';
import { Briefcase } from 'lucide-react';
import { Separator } from '@/components/ui/Separator';

export function WorkspaceTab() {
    return (
        <div className="w-full animate-in fade-in duration-500">
            <div className="space-y-12">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="flex-1 space-y-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Briefcase className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-lg font-bold tracking-tight text-foreground">Workspace Management</h3>
                                    <p className="text-sm text-muted-foreground">Switch between your workspaces to manage their specific settings.</p>
                                </div>
                            </div>

                            <Separator className="opacity-50" />

                            <div className="max-w-md pt-2 space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Current Workspace
                                    </label>
                                    <WorkspaceSwitcher />
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Select the workspace you want to view or configure.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
