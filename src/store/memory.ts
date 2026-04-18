import type { Deployment } from '../types';
import type { StateStore } from './index';

export class MemoryStore implements StateStore {
  private store: Map<string, Deployment> = new Map();

  async get(id: string): Promise<Deployment | null> {
    const deployment = this.store.get(id);
    return deployment || null;
  }

  async set(id: string, deployment: Deployment): Promise<void> {
    this.store.set(id, deployment);
  }

  async list(): Promise<Deployment[]> {
    return Array.from(this.store.values());
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
