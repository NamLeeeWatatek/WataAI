"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { CreationJob, CreationJobStatus } from '@/lib/types/creation-job';
import { wsService } from '@/lib/services/websocket-service';
import { useToast } from '@/lib/hooks/use-toast';
import { creationJobsApi } from '@/lib/api/creation-jobs';

interface CreationJobsContextType {
    activeJobs: CreationJob[];
    addJob: (job: CreationJob) => void;
    removeJob: (jobId: string) => void;
    refreshJobs: () => Promise<void>;
    isLoading: boolean;
}

const CreationJobsContext = createContext<CreationJobsContextType | undefined>(undefined);

export function CreationJobsProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [activeJobs, setActiveJobs] = useState<CreationJob[]>([]);
    const [isLoading, setIsLoading] = useState(false); // Can act as general loading state

    // We use a ref to keep track of processed completed jobs to avoid duplicate toasts if re-renders happen
    const processedcompletions = useRef<Set<string>>(new Set());

    // Load initial active jobs? 
    // Ideally, we might want to fetch "pending/processing" jobs from API on mount
    // For now, we'll start empty or rely on WS to populate if the backend sends initial state (unlikely without request)
    // But to be truly persistent across refreshes, we should fetch from API.
    // Let's assume we can fetch active jobs.

    const fetchActiveJobs = useCallback(async () => {
        try {
            // Fetch pending and processing jobs to resume tracking
            const response = await creationJobsApi.findAll({
                status: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], // Fetch recently changed if needed, or just standard
                limit: 10,
                sort: 'updatedAt:desc'
            });

            if (response.data) {
                setActiveJobs(prev => {
                    // Merge logic or replace? For simplicity, we replace but keep existing completions that might be newer
                    return response.data;
                });
            }
        } catch (error) {
            console.error("Failed to fetch active jobs", error);
        }
    }, []);

    useEffect(() => {
        if (session?.user?.id) {
            fetchActiveJobs();
        }
    }, [session?.user?.id, fetchActiveJobs]);

    const addJob = useCallback((job: CreationJob) => {
        setActiveJobs(prev => {
            if (prev.find(j => j.id === job.id)) return prev;
            return [job, ...prev];
        });
    }, []);

    const removeJob = useCallback(async (jobId: string) => {
        try {
            await creationJobsApi.remove(jobId);
            setActiveJobs(prev => prev.filter(job => job.id !== jobId));
        } catch (error) {
            console.error("Failed to delete job", error);
            toast({
                title: "Error",
                description: "Failed to remove job from history",
                variant: "destructive"
            });
        }
    }, [toast]);

    useEffect(() => {
        if (!session?.user?.id || !(session as any)?.accessToken) return;

        wsService.connect('notifications', {
            token: (session as any).accessToken,
            userId: session.user.id
        });

        const unsubscribe = wsService.on('notifications', 'new_notification', (notification: any) => {
            if (notification.type === 'job_progress') {
                setActiveJobs(prev => {
                    const existingJobIndex = prev.findIndex(j => j.id === notification.data.jobId);

                    if (existingJobIndex === -1) {
                        return prev;
                    }

                    const updatedJobs = [...prev];
                    const currentJob = updatedJobs[existingJobIndex];

                    const updatedJob = {
                        ...currentJob,
                        progress: notification.data.progress ?? currentJob.progress,
                        status: notification.data.status ?? currentJob.status,
                        outputData: notification.data.outputData ?? currentJob.outputData,
                        error: notification.data.error ?? currentJob.error,
                        updatedAt: new Date().toISOString()
                    };

                    updatedJobs[existingJobIndex] = updatedJob;

                    const getDisplayName = (job: CreationJob) => {
                        const toolName = job.creationTool?.name || 'Product';
                        const input = job.inputData as any;
                        const subject = input?.prompt || input?.title || input?.name || input?.concept || input?.subject || input?.text;

                        if (subject && typeof subject === 'string') {
                            return subject.length > 50 ? subject.substring(0, 47) + '...' : subject;
                        }

                        return toolName;
                    };

                    if ((updatedJob.status === 'COMPLETED' || updatedJob.status === 'FAILED') &&
                        currentJob.status !== updatedJob.status) {

                        if (!processedcompletions.current.has(updatedJob.id)) {
                            processedcompletions.current.add(updatedJob.id);

                            const displayName = getDisplayName(updatedJob);

                            toast({
                                title: updatedJob.status === 'COMPLETED' ? 'Generation Successful' : 'Generation Failed',
                                description: updatedJob.status === 'COMPLETED'
                                    ? `"${displayName}" is ready for you.`
                                    : `Failed to generate "${displayName}". Please try again.`,
                                variant: updatedJob.status === 'COMPLETED' ? 'default' : 'destructive',
                            });
                        }
                    }

                    return updatedJobs;
                });
            }
        });

        return () => {
            unsubscribe();
        };
    }, [session?.user?.id, toast]);

    return (
        <CreationJobsContext.Provider value={{ activeJobs, addJob, removeJob, refreshJobs: fetchActiveJobs, isLoading }}>
            {children}
        </CreationJobsContext.Provider>
    );
}

export function useCreationJobs() {
    const context = useContext(CreationJobsContext);
    if (context === undefined) {
        throw new Error('useCreationJobs must be used within a CreationJobsProvider');
    }
    return context;
}
