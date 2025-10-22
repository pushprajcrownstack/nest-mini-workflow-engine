import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

@Injectable()
export class WorkflowErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Centralized error handling
        console.error(`[${new Date().toISOString()}] Workflow error:`, error);

        // Transform different error types
        if (error.message?.includes("Duplicate task id")) {
          return throwError(
            () =>
              new HttpException(
                {
                  error: "Validation Error",
                  message: "Task IDs must be unique",
                  statusCode: HttpStatus.BAD_REQUEST,
                  timestamp: new Date().toISOString(),
                },
                HttpStatus.BAD_REQUEST
              )
          );
        }

        if (error.message?.includes("Task timed out")) {
          return throwError(
            () =>
              new HttpException(
                {
                  error: "Timeout Error",
                  message: "One or more tasks exceeded their timeout limit",
                  statusCode: HttpStatus.REQUEST_TIMEOUT,
                  timestamp: new Date().toISOString(),
                },
                HttpStatus.REQUEST_TIMEOUT
              )
          );
        }

        if (error.message?.includes("Invalid workflow payload")) {
          return throwError(
            () =>
              new HttpException(
                {
                  error: "Validation Error",
                  message: "Workflow must be an array of task definitions",
                  statusCode: HttpStatus.BAD_REQUEST,
                  timestamp: new Date().toISOString(),
                },
                HttpStatus.BAD_REQUEST
              )
          );
        }

        // Generic error handling
        return throwError(
          () =>
            new HttpException(
              {
                error: "Workflow Execution Error",
                message: error.message || "An unexpected error occurred",
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                timestamp: new Date().toISOString(),
              },
              HttpStatus.INTERNAL_SERVER_ERROR
            )
        );
      })
    );
  }
}
