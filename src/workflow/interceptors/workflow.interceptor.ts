import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Observable } from "rxjs";
import { tap, map } from "rxjs/operators";

@Injectable()
export class WorkflowInterceptor implements NestInterceptor {
  constructor(private configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const enableRequestLogging = this.configService.get<boolean>('logging.enableRequestLogging');

    // Log incoming request
    if (enableRequestLogging) {
      console.log(
        `[${new Date().toISOString()}] Workflow request: ${request.method} ${
          request.url
        }`
      );
    }

    return next.handle().pipe(
      tap((data) => {
        // Log successful response
        if (enableRequestLogging) {
          console.log(
            `[${new Date().toISOString()}] Workflow completed successfully`
          );
        }
      }),
      map((data) => {
        // Transform response data
        return {
          success: true,
          timestamp: new Date().toISOString(),
          data: data,
          metadata: {
            executionTime: Date.now() - (request.startTime || Date.now()),
            taskCount: Array.isArray(data) ? Object.keys(data).length : 1,
          },
        };
      })
    );
  }
}
