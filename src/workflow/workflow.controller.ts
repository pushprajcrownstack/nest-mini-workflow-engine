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
import { TaskDefinition } from './interfaces/task.interface';
import { WorkflowInterceptor } from './interceptors/workflow.interceptor';
import { 
  WorkflowRunDto, 
  WorkflowResponseDto, 
  ErrorResponseDto 
} from './dto/workflow.dto';

@ApiTags('workflow')
@Controller('workflow')
@UseInterceptors(WorkflowInterceptor)
export class WorkflowController {
  constructor(private readonly engine: WorkflowEngineService) {}

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
}
