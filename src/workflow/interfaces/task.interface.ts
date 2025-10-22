export interface TaskDefinition<T = any> {
  id: string;
  handler: () => Promise<T> | T;
  dependencies?: string[];
  retries?: number; // default 0
  timeoutMs?: number; // optional
}

export type TaskState = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
