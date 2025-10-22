import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();

    // Add start time to request for later use
    request.startTime = startTime;

    const performanceWarningThreshold = this.configService.get<number>('workflow.performanceWarningThreshold');
    const enablePerformanceLogging = this.configService.get<boolean>('logging.enablePerformanceLogging');

    return next.handle().pipe(
      tap(() => {
        if (!enablePerformanceLogging) return;

        const executionTime = Date.now() - startTime;

        // Log performance metrics
        console.log(
          `[PERFORMANCE] Workflow execution completed in ${executionTime}ms`
        );

        // Alert on slow executions
        if (executionTime > performanceWarningThreshold) {
          console.warn(
            `[PERFORMANCE WARNING] Slow workflow execution: ${executionTime}ms`
          );
        }
      })
    );
  }
}
