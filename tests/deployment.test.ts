import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStore } from '../src/store/memory.js';
import { DeploymentManager } from '../src/modules/deployment.js';

describe('DeploymentManager', () => {
  let store: MemoryStore;
  let manager: DeploymentManager;

  beforeEach(() => {
    store = new MemoryStore();
    manager = new DeploymentManager(store);
  });

  it('createDeployment creates a deployment with correct initial shape', async () => {
    const buildId = 'build-123';
    const deployment = await manager.createDeployment(buildId);

    expect(deployment).toBeDefined();
    expect(deployment.id).toBeTruthy();
    expect(deployment.buildId).toBe(buildId);
    expect(deployment.createdAt).toBeInstanceOf(Date);
    expect(deployment.status).toBe('building');
    expect(deployment.slots.preview).toBeDefined();
    expect(deployment.slots.production).toBeDefined();
    expect(deployment.slots.preview.status).toBe('stopped');
    expect(deployment.slots.production.status).toBe('stopped');
  });

  it('getDeployment retrieves a created deployment', async () => {
    const buildId = 'build-456';
    const created = await manager.createDeployment(buildId);

    const retrieved = await manager.getDeployment(created.id);
    expect(retrieved).toEqual(created);
  });

  it('getDeployment returns null for non-existent deployment', async () => {
    const result = await manager.getDeployment('non-existent-id');
    expect(result).toBeNull();
  });

  it('listDeployments returns all deployments', async () => {
    const d1 = await manager.createDeployment('build-1');
    const d2 = await manager.createDeployment('build-2');

    const list = await manager.listDeployments();
    expect(list).toHaveLength(2);
    expect(list).toContainEqual(d1);
    expect(list).toContainEqual(d2);
  });

  it('updateDeployment modifies a deployment', async () => {
    const created = await manager.createDeployment('build-789');

    const updated = await manager.updateDeployment(created.id, {
      status: 'running',
    });

    expect(updated.status).toBe('running');
    expect(updated.id).toBe(created.id);
  });

  it('updateDeployment throws for non-existent deployment', async () => {
    await expect(
      manager.updateDeployment('non-existent', { status: 'running' })
    ).rejects.toThrow();
  });

  it('onBeforeDeploy hook can cancel deployment by throwing', async () => {
    const config = {
      hooks: {
        onBeforeDeploy: async () => {
          throw new Error('Deployment cancelled');
        },
      },
    };

    await expect(
      manager.createDeployment('build-cancelled', config)
    ).rejects.toThrow('Deployment cancelled');

    // Verify deployment was never stored
    const list = await manager.listDeployments();
    expect(list).toHaveLength(0);
  });

  it('onDeployStart and onDeploySuccess hooks are called on successful deployment', async () => {
    const hookCalls: string[] = [];
    const config = {
      hooks: {
        onDeployStart: async () => {
          hookCalls.push('start');
        },
        onDeploySuccess: async () => {
          hookCalls.push('success');
        },
      },
    };

    const deployment = await manager.createDeployment('build-success', config);
    expect(deployment.status).toBe('active');
    expect(hookCalls).toEqual(['start', 'success']);
  });

  it('onDeployFailed hook is called when deployment fails', async () => {
    let failedError: Error | null = null;
    const config = {
      hooks: {
        onDeployFailed: async (context, error) => {
          failedError = error;
        },
      },
    };

    // Create a scenario where store.set fails
    const failingStore = {
      get: async () => null,
      set: async () => {
        throw new Error('Store operation failed');
      },
      list: async () => [],
      delete: async () => {},
    };

    const failingManager = new DeploymentManager(failingStore);
    await expect(
      failingManager.createDeployment('build-failed', config)
    ).rejects.toThrow('Store operation failed');

    expect(failedError).toBeDefined();
    expect(failedError?.message).toBe('Store operation failed');
  });

  it('pauseDeployment sets status to paused and calls onDeployPaused', async () => {
    const hookCalls: string[] = [];
    const config = {
      hooks: {
        onDeployPaused: async () => {
          hookCalls.push('paused');
        },
      },
    };

    const created = await manager.createDeployment('build-pause', config);
    const paused = await manager.pauseDeployment(created.id, config);

    expect(paused.status).toBe('paused');
    expect(hookCalls).toEqual(['paused']);
  });
});
