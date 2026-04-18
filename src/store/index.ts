import type { Deployment } from '../types.js';

export interface StateStore {
  get(id: string): Promise<Deployment | null>;
  set(id: string, deployment: Deployment): Promise<void>;
  list(): Promise<Deployment[]>;
  delete(id: string): Promise<void>;
}
