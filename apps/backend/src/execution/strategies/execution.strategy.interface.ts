export interface IExecutionStrategy {
  execute(config: any, inputs: any): Promise<any>;
}
