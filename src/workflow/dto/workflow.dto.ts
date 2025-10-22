import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, IsBoolean } from 'class-validator';

export class TaskDefinitionDto {
  @ApiProperty({
    description: 'Unique identifier for the task',
    example: 'fetchData',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Array of task IDs this task depends on',
    example: ['validateInput'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependencies?: string[];

  @ApiProperty({
    description: 'Number of retry attempts if task fails',
    example: 2,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  retries?: number;

  @ApiProperty({
    description: 'Maximum execution time in milliseconds',
    example: 5000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  timeoutMs?: number;
}

export class WorkflowRunDto {
  @ApiProperty({
    description: 'Array of task definitions to execute',
    type: [TaskDefinitionDto],
    example: [
      {
        id: 'fetchData',
        handler: 'async () => await fetchFromAPI()',
        retries: 2,
        timeoutMs: 5000,
      },
      {
        id: 'processData',
        dependencies: ['fetchData'],
        handler: 'async () => await processData()',
        retries: 1,
      },
    ],
  })
  @IsArray()
  workflow: TaskDefinitionDto[];
}

export class TaskResultDto {
  @ApiProperty({
    description: 'Current state of the task',
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'],
    example: 'COMPLETED',
  })
  state: string;

  @ApiProperty({
    description: 'Result returned by the task handler',
    example: 'Data processed successfully',
    required: false,
  })
  result?: any;

  @ApiProperty({
    description: 'Error message if task failed',
    example: 'Connection timeout',
    required: false,
  })
  error?: string;
}

export class WorkflowResponseDto {
  @ApiProperty({
    description: 'Indicates if the workflow execution was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Timestamp when the response was generated',
    example: '2025-10-22T07:56:06.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Results of all tasks in the workflow',
    type: 'object',
    additionalProperties: {
      $ref: '#/components/schemas/TaskResultDto',
    },
    example: {
      fetchData: {
        state: 'COMPLETED',
        result: 'Data fetched successfully',
      },
      processData: {
        state: 'COMPLETED',
        result: 'Data processed successfully',
      },
    },
  })
  data: Record<string, TaskResultDto>;

  @ApiProperty({
    description: 'Additional metadata about the workflow execution',
    example: {
      executionTime: 1250,
      taskCount: 2,
    },
  })
  metadata: {
    executionTime: number;
    taskCount: number;
  };
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Error type',
    example: 'Validation Error',
  })
  error: string;

  @ApiProperty({
    description: 'Detailed error message',
    example: 'Task IDs must be unique',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: '2025-10-22T07:56:06.000Z',
  })
  timestamp: string;
}
