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

    await domainManager.bindDomain(deployment.id, 'preview', 'preview.example.com');

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
    const deployment = await deploymentManager.createDeployment('build-no-domain');

    const domain = await domainManager.getDomain(deployment.id, 'preview');
    expect(domain).toBeUndefined();
  });

  it('calls onDomainBound hook when provided', async () => {
    let hookCalled = false;
    let hookDomain = '';
    const config = {
      hooks: {
        onDomainBound: async (_deployment: any, _slot: any, domain: string) => {
          hookCalled = true;
          hookDomain = domain;
        },
      },
    };

    const manager = new DomainManager(store, config);
    const deployment = await deploymentManager.createDeployment('build-hook');

    await manager.bindDomain(deployment.id, 'production', 'prod.hook.com');

    expect(hookCalled).toBe(true);
    expect(hookDomain).toBe('prod.hook.com');
  });
});
