export type Slot = 'preview' | 'production';
export type DeploymentStatus =
  | 'building'
  | 'active'
  | 'promoting'
  | 'promoted'
  | 'failed'
  | 'stopped';
export type ProcessStatus = 'starting' | 'running' | 'stopped' | 'crashed';

export interface SlotState {
  status: ProcessStatus;
  domain?: string;
  port?: number;
  pid?: number;
  startedAt?: Date;
  stoppedAt?: Date;
}

export interface Deployment {
  id: string;
  buildId: string;
  createdAt: Date;
  status: DeploymentStatus;
  slots: Record<Slot, SlotState>;
  distPath?: string;
}

export interface DeploygateHooks {
  onCreated?: (deployment: Deployment) => Promise<void>;
  onPromoted?: (deployment: Deployment) => Promise<void>;
  onRollback?: (deployment: Deployment) => Promise<void>;
  onDomainBound?: (
    deployment: Deployment,
    slot: Slot,
    domain: string
  ) => Promise<void>;
}

export interface StateStore {
  get(id: string): Promise<Deployment | null>;
  set(id: string, deployment: Deployment): Promise<void>;
  list(): Promise<Deployment[]>;
  delete(id: string): Promise<void>;
}

export interface DeploygateConfig {
  adapter?: 'memory' | 'file';
  dataDir?: string;
  store?: StateStore;
  hooks?: DeploygateHooks;
}
