import { Module } from '@nestjs/common';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowController } from './workflow.controller';

@Module({
  providers: [WorkflowEngineService],
  controllers: [WorkflowController],
  exports: [WorkflowEngineService]
})
export class WorkflowModule {}
