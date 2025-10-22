# NestJS Workflow Engine

A lightweight workflow engine built with NestJS that provides task orchestration, dependency management, retry mechanisms, and comprehensive event tracking.

## Features

### Core Capabilities

- **Task Orchestration**: Execute tasks with complex dependency chains
- **Parallel Execution**: Independent tasks run concurrently for optimal performance
- **Retry Logic**: Configurable retry attempts with exponential backoff
- **Timeout Management**: Prevent tasks from running indefinitely
- **Event System**: Real-time lifecycle events with external listener support
- **State Tracking**: Complete task state management (PENDING, RUNNING, COMPLETED, FAILED)

### Advanced Features

- **Decorator Support**: Define tasks using `@TaskStep()` decorators
- **TypeScript Integration**: Full type safety and IntelliSense support
- **NestJS Integration**: Seamless integration with NestJS modules and services
- **Interceptor Support**: Request/response modification and centralized error handling
- **Comprehensive Testing**: 25+ unit tests covering all scenarios
- **Error Handling**: Graceful failure handling with detailed error reporting

## Quick Start

### Step-by-Step Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm run start:dev
   ```

3. **Verify the application is running:**

   ```bash
   curl http://localhost:3000/workflow/test -X POST
   ```

4. **Access Swagger documentation:**
   Open http://localhost:3000/api in your browser

5. **Run tests to verify everything works:**
   ```bash
   npm test
   ```

```bash
npm install
```

### Build Commands

```bash
# Build the application for production
npm run build

```

### Testing Commands

```bash
# Run all unit tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- workflow-engine.service.spec.ts

```

### Code Quality Commands

```bash
# Run ESLint and fix issues
npm run lint

# Run ESLint without fixing
npm run lint -- --no-fix

```

### API Testing Commands

```bash
# Test the workflow API endpoints
curl -X POST http://localhost:3000/workflow/test

# Test with custom workflow (requires function handlers)
curl -X POST http://localhost:3000/workflow/run \
  -H "Content-Type: application/json" \
  -d '[]'

# Access Swagger documentation
open http://localhost:3000/api
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Set environment variables
export PORT=3000
export NODE_ENV=development
```

### Basic Usage

```typescript
import { WorkflowEngineService } from "./workflow/workflow-engine.service";

const workflow = [
  {
    id: "fetchData",
    handler: () => fetchFromRemoteAPI(),
    retries: 2,
    timeoutMs: 1000,
  },
  {
    id: "processData",
    dependencies: ["fetchData"],
    handler: () => processDataLocally(),
    retries: 1,
  },
  {
    id: "saveResult",
    dependencies: ["processData"],
    handler: () => persistToDatabase(),
  },
];

const results = await workflowEngine.run(workflow);
```

### Task States

- `PENDING`: Task is waiting to be executed
- `RUNNING`: Task is currently executing
- `COMPLETED`: Task finished successfully
- `FAILED`: Task failed and won't be retried

### Events

The workflow engine emits the following events:

- `TASK_STARTED`: Task execution began
- `TASK_COMPLETED`: Task completed successfully
- `TASK_FAILED`: Task failed
- `TASK_RETRY`: Task is being retried

## Performance Considerations

- **Parallel Execution**: Independent tasks run concurrently, significantly improving performance
- **Memory Efficient**: In-memory execution with minimal overhead
- **Configurable Timeouts**: Prevent resource leaks from hanging tasks
- **Exponential Backoff**: Built-in retry delay prevents overwhelming failing services

## Environment Variables

The application supports the following environment variables:

```bash
# Server Configuration
PORT=3000                    # Server port (default: 3000)
NODE_ENV=development         # Environment (development/production)

# Workflow Configuration
WORKFLOW_PERFORMANCE_WARNING_THRESHOLD=1000  # Performance warning threshold in ms

# Logging Configuration
LOGGING_ENABLE_REQUEST_LOGGING=true          # Enable request logging
LOGGING_ENABLE_PERFORMANCE_LOGGING=true      # Enable performance logging
```

### Environment Setup

Create a `.env` file in the root directory:

```bash
# .env
PORT=3000
NODE_ENV=development
WORKFLOW_PERFORMANCE_WARNING_THRESHOLD=1000
LOGGING_ENABLE_REQUEST_LOGGING=true
LOGGING_ENABLE_PERFORMANCE_LOGGING=true
```

## Error Handling

The workflow engine provides comprehensive error handling:

- **Dependency Failures**: Tasks depending on failed tasks are automatically marked as failed
- **Timeout Handling**: Tasks exceeding their timeout are terminated and marked as failed
- **Retry Exhaustion**: After all retry attempts are exhausted, tasks are marked as failed
- **Circular Dependencies**: Detected and handled gracefully (tasks remain PENDING)

## Project Structure

```
src/
├── config/                 # Configuration modules
│   ├── app.config.ts      # App configuration schema
│   └── app-config.module.ts # Config module setup
├── workflow/               # Workflow engine core
│   ├── decorators/        # Task decorators
│   ├── dto/              # Data transfer objects
│   ├── enums/            # Workflow enums
│   ├── interceptors/     # Request/response interceptors
│   ├── interfaces/       # TypeScript interfaces
│   ├── workflow.controller.ts    # REST API controller
│   ├── workflow-engine.service.ts # Core workflow logic
│   └── workflow.module.ts        # Workflow module
├── app.module.ts          # Root application module
└── main.ts               # Application entry point
```
