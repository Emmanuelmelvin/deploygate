import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStore } from '../src/store/memory';
import { DeploymentManager } from '../src/modules/deployment';
import { PromoteEngine } from '../src/modules/promote';

describe('PromoteEngine', () => {
  let store: MemoryStore;
  let deploymentManager: DeploymentManager;
  let promoteEngine: PromoteEngine;

  beforeEach(() => {
    store = new MemoryStore();
    deploymentManager = new DeploymentManager(store);
    promoteEngine = new PromoteEngine(store);
  });

  it('promote throws if preview slot is not running', async () => {
    const deployment = await deploymentManager.createDeployment('build-123');

    await expect(promoteEngine.promote(deployment.id)).rejects.toThrow(
      /preview slot is not running/
    );
  });

  it('promote successfully copies preview state to production', async () => {
    const deployment = await deploymentManager.createDeployment('build-456');

    // Start preview slot
    await store.set(deployment.id, {
      ...deployment,
      slots: {
        ...deployment.slots,
        preview: {
          ...deployment.slots.preview,
          status: 'running',
          port: 3000,
          startedAt: new Date(),
        },
      },
    });

    const promoted = await promoteEngine.promote(deployment.id);

    expect(promoted.status).toBe('promoted');
    expect(promoted.slots.production.status).toBe('running');
    expect(promoted.slots.production.port).toBe(3000);
    expect(promoted.slots.production.startedAt).toBeDefined();
  });

  it('rollback resets production slot', async () => {
    const deployment = await deploymentManager.createDeployment('build-789');

    // Set up a promoted state
    const promoted = {
      ...deployment,
      status: 'promoted' as const,
      slots: {
        preview: {
          status: 'running' as const,
          port: 3000,
          startedAt: new Date(),
        },
        production: {
          status: 'running' as const,
          port: 3000,
          startedAt: new Date(),
        },
      },
    };

    await store.set(deployment.id, promoted);

    const rolledBack = await promoteEngine.rollback(deployment.id);

    expect(rolledBack.status).toBe('running');
    expect(rolledBack.slots.production.status).toBe('stopped');
    expect(rolledBack.slots.production.stoppedAt).toBeDefined();
  });

  it('calls onPromoted hook when provided', async () => {
    let hookCalls: string[] = [];
    const config = {
      hooks: {
        onPromoteSuccess: async () => {
          hookCalls.push('success');
        },
      },
    };

    const engine = new PromoteEngine(store, config);
    const deployment = await deploymentManager.createDeployment('build-hook');

    // Set up running preview
    await store.set(deployment.id, {
      ...deployment,
      slots: {
        ...deployment.slots,
        preview: {
          ...deployment.slots.preview,
          status: 'running',
        },
      },
    });

    await engine.promote(deployment.id);
    expect(hookCalls).toEqual(['success']);
  });

  it('onBeforePromote hook can cancel promotion by throwing', async () => {
    let hookCalls: string[] = [];
    const config = {
      hooks: {
        onBeforePromote: async () => {
          hookCalls.push('before');
          throw new Error('Promotion cancelled');
        },
      },
    };

    const engine = new PromoteEngine(store, config);
    const deployment = await deploymentManager.createDeployment('build-cancel-promote');

    // Set up running preview
    await store.set(deployment.id, {
      ...deployment,
      slots: {
        ...deployment.slots,
        preview: {
          ...deployment.slots.preview,
          status: 'running',
        },
      },
    });

    await expect(engine.promote(deployment.id)).rejects.toThrow('Promotion cancelled');
    expect(hookCalls).toEqual(['before']);
  });

  it('onPromoteFailed hook is called when promotion fails', async () => {
    let failedError: Error | null = null;
    const config = {
      hooks: {
        onPromoteFailed: async (context, error) => {
          failedError = error;
        },
      },
    };

    const failingStore = {
      get: async (id: string) => {
        if (id === 'test-id') {
          return {
            id: 'test-id',
            buildId: 'build-123',
            createdAt: new Date(),
            status: 'active',
            slots: {
              preview: { status: 'running' },
              production: { status: 'stopped' },
            },
          };
        }
        return null;
      },
      set: async () => {
        throw new Error('Store set failed');
      },
      list: async () => [],
      delete: async () => {},
    };

    const engine = new PromoteEngine(failingStore, config);
    await expect(engine.promote('test-id')).rejects.toThrow('Store set failed');
    expect(failedError).toBeDefined();
    expect(failedError?.message).toBe('Store set failed');
  });

  it('calls onRollback hook when provided', async () => {
    let hookCalls: string[] = [];
    const config = {
      hooks: {
        onRollbackStart: async () => {
          hookCalls.push('start');
        },
        onRollbackSuccess: async () => {
          hookCalls.push('success');
        },
      },
    };

    const engine = new PromoteEngine(store, config);
    const deployment =
      await deploymentManager.createDeployment('build-rollback');

    // Set up promoted state
    const promoted = {
      ...deployment,
      status: 'promoted' as const,
      slots: {
        preview: {
          status: 'running' as const,
          port: 3000,
        },
        production: {
          status: 'running' as const,
          port: 3000,
        },
      },
    };

    await store.set(deployment.id, promoted);

    await engine.rollback(deployment.id);
    expect(hookCalls).toEqual(['start', 'success']);
  });

  it('onRollbackFailed hook is called when rollback fails', async () => {
    let failedError: Error | null = null;
    const config = {
      hooks: {
        onRollbackFailed: async (deployment, error) => {
          failedError = error;
        },
      },
    };

    const failingStore = {
      get: async (id: string) => {
        return {
          id,
          buildId: 'build-123',
          createdAt: new Date(),
          status: 'promoted',
          slots: {
            preview: { status: 'running' },
            production: { status: 'running' },
          },
        };
      },
      set: async () => {
        throw new Error('Rollback store set failed');
      },
      list: async () => [],
      delete: async () => {},
    };

    const engine = new PromoteEngine(failingStore, config);
    await expect(engine.rollback('test-id')).rejects.toThrow('Rollback store set failed');
    expect(failedError).toBeDefined();
    expect(failedError?.message).toBe('Rollback store set failed');
  });
});
