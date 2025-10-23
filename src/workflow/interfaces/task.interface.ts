export interface TaskDefinition<T = any> {
  id: string;
  handler: () => Promise<T> | T;
  dependencies?: string[];
  retries?: number; // default 0
  timeoutMs?: number; // optional
  parallel?: boolean; // execute in parallel with other tasks
  fanout?: boolean; // fanout execution for multiple instances
  maxConcurrency?: number; // maximum concurrent executions for fanout
}

export type TaskState = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
