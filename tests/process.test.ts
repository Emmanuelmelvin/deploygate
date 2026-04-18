import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStore } from '../src/store/memory';
import { DeploymentManager } from '../src/modules/deployment';
import { ProcessManager } from '../src/modules/process';

describe('ProcessManager', () => {
  let store: MemoryStore;
  let deploymentManager: DeploymentManager;
  let processManager: ProcessManager;

  beforeEach(() => {
    store = new MemoryStore();
    deploymentManager = new DeploymentManager(store);
    processManager = new ProcessManager(store);
  });

  it('startSlot sets status to running and assigns port', async () => {
    const deployment = await deploymentManager.createDeployment('build-123');

    await processManager.startSlot(deployment.id, 'preview');

    const updated = await store.get(deployment.id);
    expect(updated?.slots.preview.status).toBe('running');
    expect(updated?.slots.preview.port).toBe(3000); // preview port
    expect(updated?.slots.preview.startedAt).toBeDefined();
  });

  it('startSlot assigns correct port for production slot', async () => {
    const deployment = await deploymentManager.createDeployment('build-456');

    await processManager.startSlot(deployment.id, 'production');

    const updated = await store.get(deployment.id);
    expect(updated?.slots.production.status).toBe('running');
    expect(updated?.slots.production.port).toBe(3001); // production port
  });

  it('stopSlot sets status to stopped', async () => {
    const deployment = await deploymentManager.createDeployment('build-789');

    await processManager.startSlot(deployment.id, 'preview');
    await processManager.stopSlot(deployment.id, 'preview');

    const updated = await store.get(deployment.id);
    expect(updated?.slots.preview.status).toBe('stopped');
    expect(updated?.slots.preview.stoppedAt).toBeDefined();
  });

  it('getSlotStatus returns the current slot state', async () => {
    const deployment = await deploymentManager.createDeployment('build-status');

    await processManager.startSlot(deployment.id, 'preview');
    const status = await processManager.getSlotStatus(deployment.id, 'preview');

    expect(status.status).toBe('running');
    expect(status.port).toBe(3000);
  });

  it('getLogs returns mock log lines', async () => {
    const deployment = await deploymentManager.createDeployment('build-logs');

    const logs = await processManager.getLogs(deployment.id, 'preview');

    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]).toContain(deployment.id);
  });

  it('throws error for non-existent deployment', async () => {
    await expect(
      processManager.startSlot('non-existent', 'preview')
    ).rejects.toThrow();
  });
});
