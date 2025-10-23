import { Module } from '@nestjs/common';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowController } from './workflow.controller';
import { TaskDefinitionService } from './services/task-definition.service';
import { ExampleWorkflowService } from './examples/example-workflow.service';

@Module({
  providers: [WorkflowEngineService, TaskDefinitionService, ExampleWorkflowService],
  controllers: [WorkflowController],
  exports: [WorkflowEngineService, TaskDefinitionService]
})
export class WorkflowModule {}
