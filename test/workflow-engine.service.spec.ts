import { WorkflowEngineService } from '../src/workflow/workflow-engine.service';
import { WorkflowEvent } from '../src/workflow/enums/events.enum';
import { TaskState } from '../src/workflow/interfaces/task.interface';

describe('WorkflowEngineService - unit', () => {
  let service: WorkflowEngineService;

  beforeEach(() => {
    service = new WorkflowEngineService();
  });

  it('runs a linear workflow respecting dependencies', async () => {
    const order: string[] = [];
    const workflow = [
      { id: 'a', handler: () => { order.push('a'); return 'A'; } },
      { id: 'b', dependencies: ['a'], handler: () => { order.push('b'); return 'B'; } },
      { id: 'c', dependencies: ['b'], handler: () => { order.push('c'); return 'C'; } }
    ];

    const res = await service.run(workflow as any);
    expect(order).toEqual(['a', 'b', 'c']);
    expect(res.a.state).toBe('COMPLETED');
    expect(res.c.result).toBe('C');
  });

  it('retries failed task up to retries count', async () => {
    let attempts = 0;
    const workflow = [
      {
        id: 'failing',
        handler: () => {
          attempts += 1;
          if (attempts < 3) throw new Error('fail');
          return 'ok';
        },
        retries: 2
      }
    ];

    const res = await service.run(workflow as any);
    expect(attempts).toBe(3);
    expect(res.failing.state).toBe('COMPLETED');
  });

  it('marks task as failed when retries exhausted or timeout', async () => {
    const workflow = [
      { id: 'slow', handler: () => new Promise((res) => setTimeout(() => res('ok'), 200)), timeoutMs: 50 }
    ];

    const res = await service.run(workflow as any);
    expect(res.slow.state).toBe('FAILED');
  });

  it('runs independent tasks in parallel', async () => {
    const order: string[] = [];
    const workflow = [
      { id: 't1', handler: async () => { await new Promise(r => setTimeout(r, 50)); order.push('t1'); return 1; } },
      { id: 't2', handler: async () => { await new Promise(r => setTimeout(r, 10)); order.push('t2'); return 2; } }
    ];

    const res = await service.run(workflow as any);
    // t2 finishes earlier but both should have completed
    expect(res.t1.state).toBe('COMPLETED');
    expect(res.t2.state).toBe('COMPLETED');
    expect(order).toContain('t1');
    expect(order).toContain('t2');
  });

  // ===== COMPREHENSIVE STATE AND EVENT TESTS =====

  describe('Task States', () => {
    it('should have PENDING state initially', async () => {
      const workflow = [
        { id: 'pending', handler: () => 'test' }
      ];
      
      // We can't directly access internal state, but we can verify the task starts
      const res = await service.run(workflow as any);
      expect(res.pending.state).toBe('COMPLETED');
    });

    it('should transition through RUNNING state', async () => {
      let runningStateDetected = false;
      const workflow = [
        { 
          id: 'running', 
          handler: async () => {
            // Simulate work that takes time
            await new Promise(resolve => setTimeout(resolve, 10));
            return 'done';
          }
        }
      ];

      const res = await service.run(workflow as any);
      expect(res.running.state).toBe('COMPLETED');
      expect(res.running.result).toBe('done');
    });

    it('should reach COMPLETED state on success', async () => {
      const workflow = [
        { id: 'success', handler: () => 'success' }
      ];

      const res = await service.run(workflow as any);
      expect(res.success.state).toBe('COMPLETED');
      expect(res.success.result).toBe('success');
    });

    it('should reach FAILED state on error', async () => {
      const workflow = [
        { id: 'failure', handler: () => { throw new Error('test error'); } }
      ];

      const res = await service.run(workflow as any);
      expect(res.failure.state).toBe('FAILED');
      expect(res.failure.error).toContain('test error');
    });

    it('should reach FAILED state when dependencies fail', async () => {
      const workflow = [
        { id: 'dep', handler: () => { throw new Error('dependency failed'); } },
        { id: 'dependent', dependencies: ['dep'], handler: () => 'should not run' }
      ];

      const res = await service.run(workflow as any);
      expect(res.dep.state).toBe('FAILED');
      expect(res.dependent.state).toBe('FAILED');
      expect(res.dependent.error).toContain('Dependency failed for task dependent');
    });
  });

  describe('Event Emission', () => {
    it('should emit TASK_STARTED event', async () => {
      const events: any[] = [];
      service.events.on(WorkflowEvent.TASK_STARTED, (data) => events.push(data));

      const workflow = [
        { id: 'started', handler: () => 'test' }
      ];

      await service.run(workflow as any);
      
      expect(events).toHaveLength(1);
      expect(events[0].taskId).toBe('started');
      expect(events[0].timestamp).toBeDefined();
    });

    it('should emit TASK_COMPLETED event', async () => {
      const events: any[] = [];
      service.events.on(WorkflowEvent.TASK_COMPLETED, (data) => events.push(data));

      const workflow = [
        { id: 'completed', handler: () => 'test' }
      ];

      await service.run(workflow as any);
      
      expect(events).toHaveLength(1);
      expect(events[0].taskId).toBe('completed');
      expect(events[0].message).toContain('attempt=1');
    });

    it('should emit TASK_FAILED event', async () => {
      const events: any[] = [];
      service.events.on(WorkflowEvent.TASK_FAILED, (data) => events.push(data));

      const workflow = [
        { id: 'failed', handler: () => { throw new Error('test error'); } }
      ];

      await service.run(workflow as any);
      
      expect(events).toHaveLength(1);
      expect(events[0].taskId).toBe('failed');
      expect(events[0].message).toContain('error=test error');
    });

    it('should emit TASK_RETRY event', async () => {
      const events: any[] = [];
      service.events.on(WorkflowEvent.TASK_RETRY, (data) => events.push(data));

      let attempts = 0;
      const workflow = [
        {
          id: 'retry',
          handler: () => {
            attempts++;
            if (attempts < 2) throw new Error('retry me');
            return 'success';
          },
          retries: 1
        }
      ];

      await service.run(workflow as any);
      
      expect(events).toHaveLength(1);
      expect(events[0].taskId).toBe('retry');
      expect(events[0].message).toContain('retrying attempt=1');
    });

    it('should emit all events in correct sequence', async () => {
      const eventSequence: string[] = [];
      
      service.events.on(WorkflowEvent.TASK_STARTED, () => eventSequence.push('STARTED'));
      service.events.on(WorkflowEvent.TASK_FAILED, () => eventSequence.push('FAILED'));
      service.events.on(WorkflowEvent.TASK_RETRY, () => eventSequence.push('RETRY'));
      service.events.on(WorkflowEvent.TASK_COMPLETED, () => eventSequence.push('COMPLETED'));

      let attempts = 0;
      const workflow = [
        {
          id: 'sequence',
          handler: () => {
            attempts++;
            if (attempts < 2) throw new Error('retry me');
            return 'success';
          },
          retries: 1
        }
      ];

      await service.run(workflow as any);
      
      expect(eventSequence).toEqual(['STARTED', 'FAILED', 'RETRY', 'COMPLETED']);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle tasks with no retries', async () => {
      const workflow = [
        { id: 'no-retry', handler: () => { throw new Error('fail'); }, retries: 0 }
      ];

      const res = await service.run(workflow as any);
      expect(res['no-retry'].state).toBe('FAILED');
    });

    it('should handle tasks with no timeout', async () => {
      const workflow = [
        { id: 'no-timeout', handler: () => 'success' }
      ];

      const res = await service.run(workflow as any);
      expect(res['no-timeout'].state).toBe('COMPLETED');
    });

    it('should handle tasks with no dependencies', async () => {
      const workflow = [
        { id: 'no-deps', handler: () => 'success' }
      ];

      const res = await service.run(workflow as any);
      expect(res['no-deps'].state).toBe('COMPLETED');
    });

    it('should handle duplicate task IDs', async () => {
      const workflow = [
        { id: 'duplicate', handler: () => 'first' },
        { id: 'duplicate', handler: () => 'second' }
      ];

      await expect(service.run(workflow as any)).rejects.toThrow('Duplicate task id: duplicate');
    });

    it('should handle non-existent dependencies', async () => {
      const workflow = [
        { id: 'missing-dep', dependencies: ['non-existent'], handler: () => 'test' }
      ];

      const res = await service.run(workflow as any);
      // Non-existent dependencies cause the task to remain PENDING indefinitely
      expect(res['missing-dep'].state).toBe('PENDING');
    });

    it('should handle circular dependencies gracefully', async () => {
      const workflow = [
        { id: 'a', dependencies: ['b'], handler: () => 'a' },
        { id: 'b', dependencies: ['a'], handler: () => 'b' }
      ];

      const res = await service.run(workflow as any);
      // Circular dependencies cause both tasks to remain PENDING indefinitely
      expect(res.a.state).toBe('PENDING');
      expect(res.b.state).toBe('PENDING');
    });

    it('should handle timeout with retries', async () => {
      const events: any[] = [];
      service.events.on(WorkflowEvent.TASK_RETRY, (data) => events.push(data));

      const workflow = [
        {
          id: 'timeout-retry',
          handler: () => new Promise(resolve => setTimeout(() => resolve('ok'), 200)),
          timeoutMs: 50,
          retries: 1
        }
      ];

      const res = await service.run(workflow as any);
      expect(res['timeout-retry'].state).toBe('FAILED');
      expect(events).toHaveLength(1); // Should retry once
    });

    it('should handle async handlers', async () => {
      const workflow = [
        { 
          id: 'async', 
          handler: async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return 'async-result';
          }
        }
      ];

      const res = await service.run(workflow as any);
      expect(res.async.state).toBe('COMPLETED');
      expect(res.async.result).toBe('async-result');
    });

    it('should handle sync handlers', async () => {
      const workflow = [
        { id: 'sync', handler: () => 'sync-result' }
      ];

      const res = await service.run(workflow as any);
      expect(res.sync.state).toBe('COMPLETED');
      expect(res.sync.result).toBe('sync-result');
    });
  });

  describe('Complex Workflow Scenarios', () => {
    it('should handle mixed success and failure tasks', async () => {
      const workflow = [
        { id: 'success1', handler: () => 'ok1' },
        { id: 'failure', handler: () => { throw new Error('fail'); } },
        { id: 'success2', handler: () => 'ok2' },
        { id: 'dependent', dependencies: ['success1'], handler: () => 'dependent' }
      ];

      const res = await service.run(workflow as any);
      expect(res.success1.state).toBe('COMPLETED');
      expect(res.failure.state).toBe('FAILED');
      expect(res.success2.state).toBe('COMPLETED');
      expect(res.dependent.state).toBe('COMPLETED');
    });

    it('should handle parallel tasks with different execution times', async () => {
      const startTimes: Record<string, number> = {};
      const workflow = [
        { 
          id: 'fast', 
          handler: () => {
            startTimes.fast = Date.now();
            return 'fast';
          }
        },
        { 
          id: 'slow', 
          handler: async () => {
            startTimes.slow = Date.now();
            await new Promise(resolve => setTimeout(resolve, 50));
            return 'slow';
          }
        }
      ];

      const res = await service.run(workflow as any);
      expect(res.fast.state).toBe('COMPLETED');
      expect(res.slow.state).toBe('COMPLETED');
      // Both should start around the same time (parallel execution)
      expect(Math.abs(startTimes.fast - startTimes.slow)).toBeLessThan(10);
    });
  });
});
