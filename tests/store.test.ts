import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileStore } from '../src/store/file';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

describe('FileStore', () => {
  const testDir = './test-deploygate-data';
  let store: FileStore;

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    store = new FileStore(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  it('creates dataDir if it does not exist', async () => {
    await store.set('test-id', {
      id: 'test-id',
      buildId: 'build-1',
      createdAt: new Date(),
      status: 'building',
      slots: {
        preview: { status: 'stopped' },
        production: { status: 'stopped' },
      },
    });

    expect(existsSync(testDir)).toBe(true);
  });

  it('persists and reads back deployments correctly', async () => {
    const deployment = {
      id: 'persist-test',
      buildId: 'build-persist',
      createdAt: new Date('2024-01-01'),
      status: 'running' as const,
      slots: {
        preview: {
          status: 'running' as const,
          port: 3000,
          domain: 'preview.test.com',
        },
        production: {
          status: 'stopped' as const,
        },
      },
    };

    await store.set(deployment.id, deployment);

    const retrieved = await store.get(deployment.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(deployment.id);
    expect(retrieved?.buildId).toBe(deployment.buildId);
    expect(retrieved?.status).toBe(deployment.status);
    expect(retrieved?.slots.preview.port).toBe(3000);
    expect(retrieved?.slots.preview.domain).toBe('preview.test.com');
  });

  it('list returns all stored deployments', async () => {
    const d1 = {
      id: 'd1',
      buildId: 'build-1',
      createdAt: new Date(),
      status: 'building' as const,
      slots: {
        preview: { status: 'stopped' as const },
        production: { status: 'stopped' as const },
      },
    };

    const d2 = {
      id: 'd2',
      buildId: 'build-2',
      createdAt: new Date(),
      status: 'running' as const,
      slots: {
        preview: { status: 'stopped' as const },
        production: { status: 'stopped' as const },
      },
    };

    await store.set(d1.id, d1);
    await store.set(d2.id, d2);

    const list = await store.list();

    expect(list).toHaveLength(2);
    expect(list.map((d) => d.id)).toContain('d1');
    expect(list.map((d) => d.id)).toContain('d2');
  });

  it('delete removes a deployment', async () => {
    const deployment = {
      id: 'delete-test',
      buildId: 'build-delete',
      createdAt: new Date(),
      status: 'building' as const,
      slots: {
        preview: { status: 'stopped' as const },
        production: { status: 'stopped' as const },
      },
    };

    await store.set(deployment.id, deployment);
    let retrieved = await store.get(deployment.id);
    expect(retrieved).toBeDefined();

    await store.delete(deployment.id);
    retrieved = await store.get(deployment.id);
    expect(retrieved).toBeNull();
  });

  it('get returns null for non-existent deployment', async () => {
    const result = await store.get('non-existent-id');
    expect(result).toBeNull();
  });
});
