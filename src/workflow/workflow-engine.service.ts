import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { TaskDefinition, TaskState } from './interfaces/task.interface';
import { WorkflowEvent } from './enums/events.enum';

interface InternalTask<T = any> {
  def: TaskDefinition<T>;
  state: TaskState;
  attempts: number;
  result?: T;
  error?: any;
}

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);
  public readonly events = new EventEmitter();

  /**
   * Run a workflow definition in-memory.
   * Supports dependencies, retries, timeouts and parallel execution for independent tasks.
   */
  async run(workflow: TaskDefinition[]) {
    const map = new Map<string, InternalTask>();
    for (const t of workflow) {
      if (map.has(t.id)) {
        throw new Error(`Duplicate task id: ${t.id}`);
      }
      map.set(t.id, { def: t, state: 'PENDING', attempts: 0 });
    }

    const results = new Map<string, any>();

    // helper: emit event + log
    const emit = (event: WorkflowEvent, taskId: string, message?: string) => {
      const payload = { taskId, timestamp: new Date().toISOString(), message };
      this.logger.log(`${payload.timestamp} ${event}: ${taskId} ${message ?? ''}`);
      this.events.emit(event, payload);
    };

    // run tasks while any pending exist and progress can be made
    let progress = true;
    while (progress) {
      progress = false;
      // collect runnable tasks: pending and dependencies satisfied
      const runnable: InternalTask[] = [];
      for (const task of map.values()) {
        if (task.state !== 'PENDING') continue;
        const deps = task.def.dependencies ?? [];
        const ready = deps.every((d) => map.has(d) && map.get(d)!.state === 'COMPLETED');
        // if any dependency is failed, mark this as failed too (cannot proceed)
        const depFailed = deps.some((d) => map.has(d) && map.get(d)!.state === 'FAILED');
        if (depFailed) {
          task.state = 'FAILED';
          task.error = new Error(`Dependency failed for task ${task.def.id}`);
          emit(WorkflowEvent.TASK_FAILED, task.def.id, 'dependency failed');
          progress = true;
          continue;
        }
        if (ready) runnable.push(task);
      }

      if (runnable.length === 0) break;

      progress = true;
      // Execute runnable tasks in parallel (all independent ready tasks)
      await Promise.all(runnable.map((task) => this.executeTask(task, map, results, emit)));
    }

    // after loop, produce final state
    const final = {} as Record<string, any>;
    for (const [id, task] of map.entries()) {
      final[id] = { state: task.state, result: task.result, error: task.error?.message ?? task.error };
    }

    return final;
  }

  private async executeTask(
    task: InternalTask,
    map: Map<string, InternalTask>,
    results: Map<string, any>,
    emit: (e: WorkflowEvent, id: string, msg?: string) => void
  ) {
    const id = task.def.id;
    task.state = 'RUNNING';
    emit(WorkflowEvent.TASK_STARTED, id);

    const maxRetries = task.def.retries ?? 0;
    const timeoutMs = task.def.timeoutMs ?? 0;

    while (true) {
      task.attempts += 1;
      try {
        const res = timeoutMs > 0 ? await this.runWithTimeout(() => task.def.handler(), timeoutMs) : await Promise.resolve(task.def.handler());
        task.state = 'COMPLETED';
        task.result = res;
        emit(WorkflowEvent.TASK_COMPLETED, id, `attempt=${task.attempts}`);
        return;
      } catch (err: any) {
        task.error = err;
        emit(WorkflowEvent.TASK_FAILED, id, `attempt=${task.attempts} error=${err?.message ?? err}`);
        if (task.attempts - 1 < maxRetries) {
          emit(WorkflowEvent.TASK_RETRY, id, `retrying attempt=${task.attempts}`);
          // simple backoff
          await this.delay(50 * task.attempts);
          continue;
        }
        task.state = 'FAILED';
        return;
      }
    }
  }

  private runWithTimeout<T>(fn: () => Promise<T> | T, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let finished = false;
      const done = (v: T) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve(v);
      };
      const fail = (e: any) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        reject(e);
      };

      const timer = setTimeout(() => {
        if (finished) return;
        finished = true;
        reject(new Error('Task timed out'));
      }, timeoutMs);

      try {
        const r = fn();
        Promise.resolve(r).then(done).catch(fail);
      } catch (err) {
        fail(err);
      }
    });
  }

  private delay(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }
}
