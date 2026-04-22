export type Slot = 'preview' | 'production';
export type DeploymentStatus =
  | 'building'
  | 'active'
  | 'promoting'
  | 'promoted'
  | 'paused'
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
  distPath: string;
}

// Context types for hooks
export interface DeploymentContext {
  buildId: string;
  distPath: string;
  config?: DeploygateConfig;
}

export interface SlotContext {
  deployment: Deployment;
  slot: Slot;
  port?: number;
}

export interface PromotionContext {
  deployment: Deployment;
}

export interface DomainContext {
  deployment: Deployment;
  slot: Slot;
  domain: string;
}

// Grouped hook interfaces
export interface DeploymentHooks {
  onBeforeDeploy?: (context: DeploymentContext) => Promise<void>;
  onDeployStart?: (deployment: Deployment) => Promise<void>;
  onDeploySuccess?: (deployment: Deployment) => Promise<void>;
  onDeployFailed?: (context: DeploymentContext, error: Error) => Promise<void>;
  onDeployPaused?: (deployment: Deployment) => Promise<void>;
}

export interface SlotHooks {
  onBeforeSlotStart?: (context: SlotContext) => Promise<void>;
  onSlotStart?: (context: SlotContext) => Promise<void>;
  onSlotStop?: (context: SlotContext) => Promise<void>;
  onSlotCrashed?: (context: SlotContext, error: Error) => Promise<void>;
}

export interface PromotionHooks {
  onBeforePromote?: (context: PromotionContext) => Promise<void>;
  onPromoteSuccess?: (deployment: Deployment) => Promise<void>;
  onPromoteFailed?: (context: PromotionContext, error: Error) => Promise<void>;
  onRollbackStart?: (deployment: Deployment) => Promise<void>;
  onRollbackSuccess?: (deployment: Deployment) => Promise<void>;
  onRollbackFailed?: (deployment: Deployment, error: Error) => Promise<void>;
}

export interface DomainHooks {
  onBeforeDomainBind?: (context: DomainContext) => Promise<void>;
  onDomainBindSuccess?: (context: DomainContext) => Promise<void>;
  onDomainBindFailed?: (context: DomainContext, error: Error) => Promise<void>;
  onDomainUnbind?: (context: DomainContext) => Promise<void>;
}

export interface DeploygateHooks
  extends DeploymentHooks, SlotHooks, PromotionHooks, DomainHooks {}

export type EventMap = {
  [eventName: string]: (...args: any[]) => Promise<void>;
};

export interface StateStore {
  get(id: string): Promise<Deployment | null>;
  set(id: string, deployment: Deployment): Promise<void>;
  list(): Promise<Deployment[]>;
  delete(id: string): Promise<void>;
}

export interface DeploygateConfig<TEvents extends EventMap = {}> {
  adapter?: 'memory' | 'file';
  dataDir?: string;
  store?: StateStore;
  hooks?: DeploygateHooks;
  customEvents?: TEvents;
}
