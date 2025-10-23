import { Injectable } from '@nestjs/common';
import { TaskStep } from '../decorators/task-step.decorator';

@Injectable()
export class ExampleWorkflowService {
  
  @TaskStep({
    id: 'fetchData',
    retries: 2,
    timeoutMs: 5000,
    parallel: true
  })
  async fetchData(): Promise<string> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return 'Data fetched successfully';
  }

  @TaskStep({
    id: 'processData',
    dependencies: ['fetchData'],
    retries: 1,
    timeoutMs: 3000
  })
  async processData(): Promise<string> {
    // Simulate data processing
    await new Promise(resolve => setTimeout(resolve, 500));
    return 'Data processed successfully';
  }

  @TaskStep({
    id: 'fanoutTask',
    dependencies: ['processData'],
    retries: 1,
    timeoutMs: 2000,
    fanout: true,
    maxConcurrency: 3
  })
  async fanoutTask(): Promise<string> {
    // Simulate parallel processing
    await new Promise(resolve => setTimeout(resolve, 200));
    return `Fanout instance ${Math.random()}`;
  }

  @TaskStep({
    id: 'saveResult',
    dependencies: ['fanoutTask'],
    retries: 0
  })
  async saveResult(): Promise<string> {
    // Simulate saving results
    await new Promise(resolve => setTimeout(resolve, 300));
    return 'Results saved successfully';
  }
}
