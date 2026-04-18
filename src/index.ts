// Types
export {
  type Deployment,
  type Slot,
  type SlotState,
  type ProcessStatus,
  type DeploymentStatus,
  type DeploygateConfig,
  type DeploygateHooks,
} from './types';

// State Store
export { type StateStore } from './store/index';
export { MemoryStore } from './store/memory';
export { FileStore } from './store/file';

// Managers
export { DeploymentManager } from './modules/deployment';
export { ProcessManager } from './modules/process';
export { PromoteEngine } from './modules/promote';
export { DomainManager } from './modules/domain';

// Errors and Logger
export { DeploygateError } from './errors';
export { default as logger } from './logger';

// Config
export { loadConfig } from './config';

// Convenience factory and functions
import { MemoryStore } from './store/memory';
import { FileStore } from './store/file';
import { DeploymentManager } from './modules/deployment';
import { ProcessManager } from './modules/process';
import { PromoteEngine } from './modules/promote';
import { DomainManager } from './modules/domain';
import { loadConfig } from './config';
import type {
  DeploygateConfig,
  Slot,
} from './types';

let globalConfig: DeploygateConfig = {};
let globalDeploymentManager: DeploymentManager;
let globalProcessManager: ProcessManager;
let globalPromoteEngine: PromoteEngine;
let globalDomainManager: DomainManager;

async function initializeManagers(config?: DeploygateConfig) {
  const finalConfig = config || (await loadConfig());
  globalConfig = finalConfig;

  const adapter = finalConfig.adapter || 'memory';
  let store;

  if (adapter === 'file') {
    store = new FileStore(finalConfig.dataDir);
  } else {
    store = new MemoryStore();
  }

  globalDeploymentManager = new DeploymentManager(store);
  globalProcessManager = new ProcessManager(store);
  globalPromoteEngine = new PromoteEngine(store, finalConfig);
  globalDomainManager = new DomainManager(store, finalConfig);
}

export async function createDeployment(buildId: string) {
  if (!globalDeploymentManager) {
    await initializeManagers();
  }
  return globalDeploymentManager.createDeployment(buildId, globalConfig);
}

export async function getDeployment(id: string) {
  if (!globalDeploymentManager) {
    await initializeManagers();
  }
  return globalDeploymentManager.getDeployment(id);
}

export async function listDeployments() {
  if (!globalDeploymentManager) {
    await initializeManagers();
  }
  return globalDeploymentManager.listDeployments();
}

export async function startSlot(deploymentId: string, slot: Slot) {
  if (!globalProcessManager) {
    await initializeManagers();
  }
  return globalProcessManager.startSlot(deploymentId, slot);
}

export async function stopSlot(deploymentId: string, slot: Slot) {
  if (!globalProcessManager) {
    await initializeManagers();
  }
  return globalProcessManager.stopSlot(deploymentId, slot);
}

export async function promote(deploymentId: string) {
  if (!globalPromoteEngine) {
    await initializeManagers();
  }
  return globalPromoteEngine.promote(deploymentId);
}

export async function rollback(deploymentId: string) {
  if (!globalPromoteEngine) {
    await initializeManagers();
  }
  return globalPromoteEngine.rollback(deploymentId);
}

export async function bindDomain(
  deploymentId: string,
  slot: Slot,
  domain: string
) {
  if (!globalDomainManager) {
    await initializeManagers();
  }
  return globalDomainManager.bindDomain(deploymentId, slot, domain);
}

export async function unbindDomain(deploymentId: string, slot: Slot) {
  if (!globalDomainManager) {
    await initializeManagers();
  }
  return globalDomainManager.unbindDomain(deploymentId, slot);
}

export async function getDomain(deploymentId: string, slot: Slot) {
  if (!globalDomainManager) {
    await initializeManagers();
  }
  return globalDomainManager.getDomain(deploymentId, slot);
}
