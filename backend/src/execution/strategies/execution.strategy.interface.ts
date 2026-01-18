export interface IExecutionStrategy {
  execute(
    config: any,
    inputs: any,
    context?: { workspaceId?: string; userId?: string; jobId?: string },
  ): Promise<any>;
}
