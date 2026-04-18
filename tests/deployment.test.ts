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

  it('calls onCreated hook when provided', async () => {
    let hookCalled = false;
    const config = {
      hooks: {
        onCreated: async () => {
          hookCalled = true;
        },
      },
    };

    await manager.createDeployment('build-with-hook', config);
    expect(hookCalled).toBe(true);
  });
});
