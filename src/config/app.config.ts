export interface AppConfig {
  port: number;
  nodeEnv: string;
  workflow: {
    maxRetries: number;
    defaultTimeout: number;
    performanceWarningThreshold: number;
  };
  logging: {
    level: string;
    enablePerformanceLogging: boolean;
    enableRequestLogging: boolean;
  };
  cors: {
    enabled: boolean;
    origin: string;
  };
  rateLimit: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
}

export const appConfig = (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  workflow: {
    maxRetries: parseInt(process.env.WORKFLOW_MAX_RETRIES || '5', 10),
    defaultTimeout: parseInt(process.env.WORKFLOW_DEFAULT_TIMEOUT || '30000', 10),
    performanceWarningThreshold: parseInt(process.env.WORKFLOW_PERFORMANCE_WARNING_THRESHOLD || '5000', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enablePerformanceLogging: process.env.ENABLE_PERFORMANCE_LOGGING === 'true',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',
  },
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
    origin: process.env.CORS_ORIGIN || '*',
  },
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  },
});
