import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStore } from '../src/store/memory';
import { DeploymentManager } from '../src/modules/deployment';
import { DomainManager } from '../src/modules/domain';

describe('DomainManager', () => {
  let store: MemoryStore;
  let deploymentManager: DeploymentManager;
  let domainManager: DomainManager;

  beforeEach(() => {
    store = new MemoryStore();
    deploymentManager = new DeploymentManager(store);
    domainManager = new DomainManager(store);
  });

  it('bindDomain sets the domain on the correct slot', async () => {
    const deployment = await deploymentManager.createDeployment('build-123');

    await domainManager.bindDomain(
      deployment.id,
      'preview',
      'preview.example.com'
    );

    const updated = await store.get(deployment.id);
    expect(updated?.slots.preview.domain).toBe('preview.example.com');
    expect(updated?.slots.production.domain).toBeUndefined();
  });

  it('unbindDomain clears the domain', async () => {
    const deployment = await deploymentManager.createDeployment('build-456');

    await domainManager.bindDomain(
      deployment.id,
      'production',
      'prod.example.com'
    );
    let updated = await store.get(deployment.id);
    expect(updated?.slots.production.domain).toBe('prod.example.com');

    await domainManager.unbindDomain(deployment.id, 'production');
    updated = await store.get(deployment.id);
    expect(updated?.slots.production.domain).toBeUndefined();
  });

  it('getDomain returns the domain for a slot', async () => {
    const deployment = await deploymentManager.createDeployment('build-789');

    await domainManager.bindDomain(deployment.id, 'preview', 'preview.app.com');

    const domain = await domainManager.getDomain(deployment.id, 'preview');
    expect(domain).toBe('preview.app.com');
  });

  it('getDomain returns undefined if no domain is bound', async () => {
    const deployment =
      await deploymentManager.createDeployment('build-no-domain');

    const domain = await domainManager.getDomain(deployment.id, 'preview');
    expect(domain).toBeUndefined();
  });

  it('calls onDomainBound hook when provided', async () => {
    let hookCalls: string[] = [];
    const config = {
      hooks: {
        onDomainBindSuccess: async () => {
          hookCalls.push('success');
        },
      },
    };

    const manager = new DomainManager(store, config);
    const deployment = await deploymentManager.createDeployment('build-hook');

    await manager.bindDomain(deployment.id, 'production', 'prod.hook.com');

    expect(hookCalls).toEqual(['success']);
  });

  it('onBeforeDomainBind hook can cancel binding by throwing', async () => {
    const config = {
      hooks: {
        onBeforeDomainBind: async () => {
          throw new Error('Domain binding cancelled');
        },
      },
    };

    const manager = new DomainManager(store, config);
    const deployment = await deploymentManager.createDeployment(
      'build-cancel-domain'
    );

    await expect(
      manager.bindDomain(deployment.id, 'preview', 'cancel.example.com')
    ).rejects.toThrow('Domain binding cancelled');

    // Verify domain was not stored
    const domain = await manager.getDomain(deployment.id, 'preview');
    expect(domain).toBeUndefined();
  });

  it('onDomainBindFailed hook is called when binding fails', async () => {
    let failedError: Error | null = null;
    const config = {
      hooks: {
        onDomainBindFailed: async (context, error) => {
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
          status: 'active',
          slots: { preview: {}, production: {} },
        };
      },
      set: async () => {
        throw new Error('Domain bind store set failed');
      },
      list: async () => [],
      delete: async () => {},
    };

    const manager = new DomainManager(failingStore, config);
    await expect(
      manager.bindDomain('test-id', 'preview', 'fail.example.com')
    ).rejects.toThrow('Domain bind store set failed');

    expect(failedError).toBeDefined();
    expect(failedError?.message).toBe('Domain bind store set failed');
  });

  it('onDomainUnbind hook is called when domain is unbound', async () => {
    let hookCalls: string[] = [];
    const config = {
      hooks: {
        onDomainUnbind: async () => {
          hookCalls.push('unbound');
        },
      },
    };

    const manager = new DomainManager(store, config);
    const deployment = await deploymentManager.createDeployment('build-unbind');

    await manager.bindDomain(deployment.id, 'preview', 'preview.example.com');
    hookCalls.length = 0; // Reset

    await manager.unbindDomain(deployment.id, 'preview');

    expect(hookCalls).toEqual(['unbound']);
  });
});
