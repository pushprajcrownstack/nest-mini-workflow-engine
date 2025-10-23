import 'reflect-metadata';

export const TASK_METADATA = 'custom:task';

export interface TaskMeta {
  id: string;
  dependencies?: string[];
  retries?: number;
  timeoutMs?: number;
  parallel?: boolean;
  fanout?: boolean;
  maxConcurrency?: number;
}

export function TaskStep(meta: TaskMeta) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(TASK_METADATA, meta, descriptor.value);
    return descriptor;
  };
}
