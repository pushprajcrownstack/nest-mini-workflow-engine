import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  WorkflowInterceptor,
  WorkflowErrorInterceptor,
  PerformanceInterceptor,
} from './workflow/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  const port = configService.get<number>('port');
  const nodeEnv = configService.get<string>('nodeEnv');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('NestJS Workflow Engine API')
    .setDescription('A robust workflow engine with task orchestration, dependency management, retry mechanisms, and comprehensive event tracking')
    .setVersion('1.0.0')
    .addTag('workflow', 'Workflow execution and management')
    .addServer(`http://localhost:${port}`, 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Workflow Engine API',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css',
    ],
  });

  // Apply interceptors globally
  app.useGlobalInterceptors(
    new PerformanceInterceptor(configService),
    new WorkflowInterceptor(configService),
    new WorkflowErrorInterceptor()
  );

  await app.listen(port);
  console.log(`Application started on http://localhost:${port}`);
  console.log(`Environment: ${nodeEnv}`);
  console.log(`Swagger documentation available at http://localhost:${port}/api`);
}
bootstrap();