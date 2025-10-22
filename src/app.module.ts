import { Module } from '@nestjs/common';
import { WorkflowModule } from './workflow/workflow.module';
import { AppConfigModule } from './config/app-config.module';

@Module({
  imports: [AppConfigModule, WorkflowModule],
  controllers: [],
  providers: []
})
export class AppModule {}
