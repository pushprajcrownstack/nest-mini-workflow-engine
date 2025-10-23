import { Injectable } from '@nestjs/common';
import { TASK_METADATA, TaskMeta } from '../decorators/task-step.decorator';
import { TaskDefinition } from '../interfaces/task.interface';

@Injectable()
export class TaskDefinitionService {
  /**
   * Extract task definitions from decorated methods in a class instance
   */
  extractTaskDefinitions(instance: any): TaskDefinition[] {
    const tasks: TaskDefinition[] = [];
    const prototype = Object.getPrototypeOf(instance);
    
    // Get all method names from the instance
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      name => name !== 'constructor' && typeof prototype[name] === 'function'
    );
    
    for (const methodName of methodNames) {
      const method = prototype[methodName];
      const metadata: TaskMeta = Reflect.getMetadata(TASK_METADATA, method);
      
      if (metadata) {
        tasks.push({
          id: metadata.id,
          handler: () => method.call(instance),
          dependencies: metadata.dependencies,
          retries: metadata.retries,
          timeoutMs: metadata.timeoutMs,
          parallel: metadata.parallel,
          fanout: metadata.fanout,
          maxConcurrency: metadata.maxConcurrency,
        });
      }
    }
    
    return tasks;
  }
  
  /**
   * Create a workflow from decorated class methods
   */
  createWorkflowFromClass(instance: any): TaskDefinition[] {
    return this.extractTaskDefinitions(instance);
  }
}
