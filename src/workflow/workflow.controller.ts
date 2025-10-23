import { 
  Controller, 
  Post, 
  Body, 
  BadRequestException, 
  UseInterceptors,
  HttpStatus,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { WorkflowEngineService } from './workflow-engine.service';
import { TaskDefinitionService } from './services/task-definition.service';
import { TaskDefinition } from './interfaces/task.interface';
import { WorkflowInterceptor } from './interceptors/workflow.interceptor';
import { ExampleWorkflowService } from './examples/example-workflow.service';
import { 
  WorkflowRunDto, 
  WorkflowResponseDto, 
  ErrorResponseDto 
} from './dto/workflow.dto';

@ApiTags('workflow')
@Controller('workflow')
@UseInterceptors(WorkflowInterceptor)
export class WorkflowController {
  constructor(
    private readonly engine: WorkflowEngineService,
    private readonly taskDefinitionService: TaskDefinitionService,
    private readonly exampleWorkflowService: ExampleWorkflowService
  ) {}

  @Post('run')
  @ApiOperation({
    summary: 'Execute a workflow',
    description: 'Runs a workflow with the provided task definitions. Tasks will be executed respecting dependencies, retries, and timeouts.',
  })
  @ApiBody({
    type: WorkflowRunDto,
    description: 'Workflow definition containing an array of tasks to execute',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow executed successfully',
    type: WorkflowResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid workflow payload or validation errors',
    type: ErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error during workflow execution',
    type: ErrorResponseDto,
  })
  async run(@Body() workflow: TaskDefinition[]) {
    if (!Array.isArray(workflow)) {
      throw new BadRequestException('Invalid workflow payload');
    }
    return this.engine.run(workflow as any);
  }

  @Post('test')
  @ApiOperation({
    summary: 'Test workflow with predefined handlers',
    description: 'Runs a test workflow using predefined handlers for demonstration purposes.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test workflow executed successfully',
    type: WorkflowResponseDto,
  })
  async testWorkflow() {
    const testWorkflow: TaskDefinition[] = [
      {
        id: 'task1',
        handler: () => Promise.resolve('Task 1 completed successfully'),
        retries: 0
      },
      {
        id: 'task2',
        handler: () => Promise.resolve('Task 2 completed successfully'),
        dependencies: ['task1'],
        retries: 1
      },
      {
        id: 'task3',
        handler: () => Promise.resolve('Task 3 completed successfully'),
        dependencies: ['task1'],
        retries: 0
      },
      {
        id: 'failingTask',
        handler: () => Promise.reject(new Error('This task is designed to fail')),
        retries: 2
      }
    ];
    
    return this.engine.run(testWorkflow);
  }

  @Post('decorated')
  @ApiOperation({
    summary: 'Execute workflow using task decorators',
    description: 'Runs a workflow using task definitions extracted from decorated methods.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Decorated workflow executed successfully',
    type: WorkflowResponseDto,
  })
  async runDecoratedWorkflow() {
    // Extract task definitions from decorated methods
    const workflow = this.taskDefinitionService.createWorkflowFromClass(this.exampleWorkflowService);
    
    // Run with fanout instances
    return this.engine.run(workflow, 5);
  }

  @Post('parallel')
  @ApiOperation({
    summary: 'Execute parallel workflow',
    description: 'Runs a workflow with parallel execution enabled for independent tasks.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parallel workflow executed successfully',
    type: WorkflowResponseDto,
  })
  async runParallelWorkflow() {
    const parallelWorkflow: TaskDefinition[] = [
      {
        id: 'task1',
        handler: () => Promise.resolve('Task 1 completed'),
        retries: 0,
        parallel: true
      },
      {
        id: 'task2',
        handler: () => Promise.resolve('Task 2 completed'),
        retries: 0,
        parallel: true
      },
      {
        id: 'task3',
        handler: () => Promise.resolve('Task 3 completed'),
        dependencies: ['task1', 'task2'],
        retries: 0
      }
    ];
    
    return this.engine.run(parallelWorkflow);
  }

  @Post('fanout')
  @ApiOperation({
    summary: 'Execute fanout workflow',
    description: 'Runs a workflow with fanout execution for multiple instances.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fanout workflow executed successfully',
    type: WorkflowResponseDto,
  })
  async runFanoutWorkflow() {
    const fanoutWorkflow: TaskDefinition[] = [
      {
        id: 'fanoutTask',
        handler: () => Promise.resolve(`Fanout instance ${Math.random()}`),
        retries: 1,
        timeoutMs: 1000,
        fanout: true,
        maxConcurrency: 3
      }
    ];
    
    return this.engine.run(fanoutWorkflow, 5);
  }
}
