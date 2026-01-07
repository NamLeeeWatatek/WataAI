"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { CreationJob, CreationJobStatus } from '@/lib/types/creation-job';
import { useSocketConnection } from '@/lib/hooks/use-socket-connection';
import { useToast } from '@/lib/hooks/use-toast';
import { creationJobsApi } from '@/lib/api/creation-jobs';
import { Notification, JobStatus } from '@/lib/types/notification';

interface CreationJobsContextType {
    activeJobs: CreationJob[];
    addJob: (job: CreationJob) => void;
    removeJob: (jobId: string) => void;
    cancelJob: (jobId: string) => void;
    refreshJobs: () => Promise<void>;
    isLoading: boolean;
}

import { useAuth } from '@/lib/hooks/useAuth';

const CreationJobsContext = createContext<CreationJobsContextType | undefined>(undefined);

export function CreationJobsProvider({ children }: { children: React.ReactNode }) {
    const { user, accessToken } = useAuth();
    const { toast } = useToast();
    const [activeJobs, setActiveJobs] = useState<CreationJob[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchActiveJobs = useCallback(async () => {
        try {
            // Fetch pending and processing jobs to resume tracking
            const response = await creationJobsApi.findAll({
                status: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED'],
                limit: 10,
                sort: 'updatedAt:desc'
            });

            if (response.data) {
                setActiveJobs(prev => response.data);
            }
        } catch (error) {
            console.error("Failed to fetch active jobs", error);
        }
    }, []);

    useEffect(() => {
        if (user?.id) {
            fetchActiveJobs();
        }
    }, [user?.id, fetchActiveJobs]);

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

    const cancelJob = useCallback(async (jobId: string) => {
        try {
            // Optimistic update
            setActiveJobs(prev => prev.map(job =>
                job.id === jobId ? { ...job, status: CreationJobStatus.CANCELED } : job
            ));

            await creationJobsApi.cancel(jobId);

            toast({
                title: "Job Canceled",
                description: "The generation process has been stopped.",
            });
        } catch (error) {
            console.error("Failed to cancel job", error);
            toast({
                title: "Error",
                description: "Failed to cancel job",
                variant: "destructive"
            });
            fetchActiveJobs();
        }
    }, [fetchActiveJobs, toast]);

    // Unified socket connection using the hook
    const { on, isConnected } = useSocketConnection({
        namespace: 'notifications',
        enabled: !!user?.id && !!accessToken,
        auth: { token: accessToken },
        query: { userId: user?.id }
    });

    useEffect(() => {
        if (!isConnected) return;

        const unsubscribe = on('new_notification', (notification: Notification) => {
            let jobId: string | undefined;
            let newStatus: string | undefined;
            let newProgress: number | undefined;
            let newData: any | undefined;

            if (notification.type === 'job_progress') {
                jobId = notification.data?.jobId;
                newStatus = notification.data?.status;
                newProgress = notification.data?.progress;
                newData = notification.data;
            } else if ((notification.type === 'success' || notification.type === 'error') && notification.metadata?.resourceType === 'creation_job') {
                jobId = notification.metadata.resourceId;
                newStatus = notification.metadata.status; // COMPLETED or FAILED
                // For completion, ensure 100% progress
                if (newStatus === JobStatus.COMPLETED) newProgress = 100;
            }

            if (jobId) {
                setActiveJobs(prev => {
                    const existingJobIndex = prev.findIndex(j => j.id === jobId);

                    if (existingJobIndex === -1) {
                        return prev;
                    }

                    const updatedJobs = [...prev];
                    const currentJob = updatedJobs[existingJobIndex];

                    const updatedJob = {
                        ...currentJob,
                        progress: newProgress ?? currentJob.progress,
                        status: (newStatus as any) ?? currentJob.status,
                        outputData: newData?.outputData ?? currentJob.outputData,
                        error: newData?.error ?? currentJob.error,
                        updatedAt: new Date().toISOString()
                    };

                    updatedJobs[existingJobIndex] = updatedJob;


                    const isJobProgressEvent = notification.type === 'job_progress';

                    if (isJobProgressEvent && (updatedJob.status === 'COMPLETED' || updatedJob.status === 'FAILED') &&
                        currentJob.status !== updatedJob.status) {
                        // Logic removed to prevent double-toasting; handled by global notification system
                    }

                    return updatedJobs;
                });
            }
        });

        return () => {
            unsubscribe();
        };
    }, [isConnected, on, toast]);

    return (
        <CreationJobsContext.Provider value={{ activeJobs, addJob, removeJob, cancelJob, refreshJobs: fetchActiveJobs, isLoading }}>
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
