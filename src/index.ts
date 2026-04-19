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
import type { DeploygateConfig, Deployment, Slot, StateStore } from './types';

let globalConfig: DeploygateConfig = {};
let globalDeploymentManager: DeploymentManager;
let globalProcessManager: ProcessManager;
let globalPromoteEngine: PromoteEngine;
let globalDomainManager: DomainManager;

async function initializeManagers(config?: DeploygateConfig) {
  const finalConfig = config || (await loadConfig());
  globalConfig = finalConfig;

  // Use custom store if provided, otherwise create one based on adapter
  let store: StateStore;

  if (finalConfig.store) {
    store = finalConfig.store;
  } else {
    const adapter = finalConfig.adapter || 'memory';
    if (adapter === 'file') {
      store = new FileStore(finalConfig.dataDir);
    } else {
      store = new MemoryStore();
    }
  }

  globalDeploymentManager = new DeploymentManager(store);
  globalProcessManager = new ProcessManager(store);
  globalPromoteEngine = new PromoteEngine(store, finalConfig);
  globalDomainManager = new DomainManager(store, finalConfig);
}

/**
 * Create a new deployment with a given build ID.
 *
 * @param buildId - Unique identifier for the build (e.g., "build-abc123")
 * @param config - Optional configuration object with custom store and hooks
 * @param distPath - Optional path to dist folder containing index.html
 * @returns A new Deployment object with preview and production slots both in 'stopped' state
 * @throws Error if buildId is empty or not a string
 *
 * @example
 * ```typescript
 * // Using default config
 * const deployment = await createDeployment('build-123');
 * console.log(deployment.id); // UUID
 *
 * // With dist path
 * const deployment = await createDeployment('build-123', config, './dist');
 * console.log(deployment.distPath); // './dist'
 * ```
 */
export async function createDeployment(buildId: string, config?: DeploygateConfig, distPath?: string) {
  if (!globalDeploymentManager || config?.store) {
    await initializeManagers(config);
  }
  return globalDeploymentManager.createDeployment(buildId, config, distPath);
}

/**
 * Retrieve a deployment by ID.
 *
 * @param id - The deployment UUID
 * @param config - Optional configuration object with custom store and hooks
 * @returns The Deployment object, or null if not found
 * @throws Error if id is empty or not a string
 *
 * @example
 * ```typescript
 * const deployment = await getDeployment('550e8400-e29b-41d4-a716-446655440000');
 * if (deployment) {
 *   console.log(deployment.slots.preview.status);
 * }
 * ```
 */
export async function getDeployment(id: string, config?: DeploygateConfig) {
  if (!globalDeploymentManager || config?.store) {
    await initializeManagers(config);
  }
  return globalDeploymentManager.getDeployment(id);
}

/**
 * Update a deployment with partial data.
 *
 * @param id - The deployment UUID
 * @param patch - Partial deployment object with fields to update
 * @param config - Optional configuration object with custom store and hooks
 * @returns The updated Deployment object
 * @throws Error if deployment not found or id is invalid
 *
 * @example
 * ```typescript
 * const updated = await updateDeployment(deployment.id, { distPath: './dist' });
 * console.log(updated.distPath);
 * ```
 */
export async function updateDeployment(
  id: string,
  patch: Partial<Deployment>,
  config?: DeploygateConfig
) {
  if (!globalDeploymentManager || config?.store) {
    await initializeManagers(config);
  }
  return globalDeploymentManager.updateDeployment(id, patch);
}

/**
 * List all deployments in the state store.
 *
 * @param config - Optional configuration object with custom store and hooks
 * @returns Array of all Deployment objects
 *
 * @example
 * ```typescript
 * const deployments = await listDeployments();
 * console.log(`Total deployments: ${deployments.length}`);
 * ```
 */
export async function listDeployments(config?: DeploygateConfig) {
  if (!globalDeploymentManager || config?.store) {
    await initializeManagers(config);
  }
  return globalDeploymentManager.listDeployments();
}

/**
 * Start a deployment slot (preview or production).
 *
 * Transitions the slot from 'stopped' or 'crashed' to 'running' status.
 * The platform is responsible for actually spawning processes; this function
 * only updates the slot state.
 *
 * @param deploymentId - The deployment UUID
 * @param slot - The slot to start: 'preview' or 'production'
 * @param portOrConfig - Optional port number (number) or configuration object (DeploygateConfig)
 * @param maybeConfig - Optional configuration object if portOrConfig is a number
 * @throws Error if deploymentId is invalid, slot is invalid, or slot is already running
 *
 * @example
 * ```typescript
 * // With port
 * await startSlot(deployment.id, 'preview', 3000);
 *
 * // With custom store
 * await startSlot(deployment.id, 'preview', undefined, { store: customStore });
 *
 * // With both
 * await startSlot(deployment.id, 'preview', 3000, { store: customStore });
 * ```
 */
export async function startSlot(
  deploymentId: string,
  slot: Slot,
  portOrConfig?: number | DeploygateConfig,
  maybeConfig?: DeploygateConfig
) {
  // Parse arguments: port can be number or config, maybeConfig is config if port was provided
  let port: number | undefined;
  let config: DeploygateConfig | undefined;

  if (typeof portOrConfig === 'number') {
    port = portOrConfig;
    config = maybeConfig;
  } else if (portOrConfig && typeof portOrConfig === 'object') {
    config = portOrConfig;
  }

  if (!globalProcessManager || config?.store) {
    await initializeManagers(config);
  }
  return globalProcessManager.startSlot(deploymentId, slot, port);
}

/**
 * Stop a deployment slot (preview or production).
 *
 * Transitions the slot from 'running' or 'starting' to 'stopped' status.
 * The platform is responsible for actually terminating processes.
 *
 * @param deploymentId - The deployment UUID
 * @param slot - The slot to stop: 'preview' or 'production'
 * @param config - Optional configuration object with custom store and hooks
 * @throws Error if deploymentId is invalid, slot is invalid, or slot is not running
 *
 * @example
 * ```typescript
 * await stopSlot(deployment.id, 'preview');
 * ```
 */
export async function stopSlot(deploymentId: string, slot: Slot, config?: DeploygateConfig) {
  if (!globalProcessManager || config?.store) {
    await initializeManagers(config);
  }
  return globalProcessManager.stopSlot(deploymentId, slot);
}

/**
 * Promote a deployment from preview slot to production slot.
 *
 * Atomically copies the entire preview slot state (including domain bindings)
 * to the production slot and marks the deployment as 'promoted'. Fails if
 * the preview slot is not in 'running' state.
 *
 * Calls the onPromoted hook if configured.
 *
 * @param deploymentId - The deployment UUID
 * @param config - Optional configuration object with custom store and hooks
 * @returns The updated Deployment object with production slot now containing preview's state
 * @throws Error if deployment not found, preview slot not running, or promotion fails
 *
 * @example
 * ```typescript
 * const promoted = await promote(deployment.id);
 * console.log('Production slot:', promoted.slots.production);
 * ```
 */
export async function promote(deploymentId: string, config?: DeploygateConfig) {
  if (!globalPromoteEngine || config?.store) {
    await initializeManagers(config);
  }
  return globalPromoteEngine.promote(deploymentId);
}

/**
 * Rollback a promoted deployment by stopping the production slot.
 *
 * Transitions the production slot to 'stopped' status and sets the deployment
 * status back to 'running'. Only allowed if deployment status is 'promoted'.
 *
 * Calls the onRollback hook if configured.
 *
 * @param deploymentId - The deployment UUID
 * @param config - Optional configuration object with custom store and hooks
 * @returns The updated Deployment object with production slot now in 'stopped' state
 * @throws Error if deployment not found, deployment not promoted, or rollback fails
 *
 * @example
 * ```typescript
 * const rolled = await rollback(deployment.id);
 * console.log('Production slot stopped:', rolled.slots.production.status);
 * ```
 */
export async function rollback(deploymentId: string, config?: DeploygateConfig) {
  if (!globalPromoteEngine || config?.store) {
    await initializeManagers(config);
  }
  return globalPromoteEngine.rollback(deploymentId);
}

/**
 * Bind a custom domain to a deployment slot.
 *
 * Stores the domain string on the specified slot. The platform is responsible
 * for actually provisioning DNS records or certificates.
 *
 * Calls the onDomainBound hook if configured.
 *
 * @param deploymentId - The deployment UUID
 * @param slot - The slot to bind to: 'preview' or 'production'
 * @param domain - The domain name (e.g., 'example.com', 'api.example.com')
 * @param config - Optional configuration object with custom store and hooks
 * @throws Error if deploymentId invalid, slot invalid, domain format invalid, or deployment not found
 *
 * @example
 * ```typescript
 * await bindDomain(deployment.id, 'preview', 'preview.example.com');
 * ```
 */
export async function bindDomain(
  deploymentId: string,
  slot: Slot,
  domain: string,
  config?: DeploygateConfig
) {
  if (!globalDomainManager || config?.store) {
    await initializeManagers(config);
  }
  return globalDomainManager.bindDomain(deploymentId, slot, domain);
}

/**
 * Unbind a domain from a deployment slot.
 *
 * Removes the domain binding from the specified slot. The platform is responsible
 * for cleaning up DNS records or certificates.
 *
 * @param deploymentId - The deployment UUID
 * @param slot - The slot to unbind from: 'preview' or 'production'
 * @param config - Optional configuration object with custom store and hooks
 * @throws Error if deploymentId invalid, slot invalid, or deployment not found
 *
 * @example
 * ```typescript
 * await unbindDomain(deployment.id, 'preview');
 * ```
 */
export async function unbindDomain(deploymentId: string, slot: Slot, config?: DeploygateConfig) {
  if (!globalDomainManager || config?.store) {
    await initializeManagers(config);
  }
  return globalDomainManager.unbindDomain(deploymentId, slot);
}

/**
 * Get the domain bound to a deployment slot, if any.
 *
 * @param deploymentId - The deployment UUID
 * @param slot - The slot to query: 'preview' or 'production'
 * @param config - Optional configuration object with custom store and hooks
 * @returns The domain string if bound, or undefined if no domain is bound
 * @throws Error if deploymentId invalid, slot invalid, or deployment not found
 *
 * @example
 * ```typescript
 * const domain = await getDomain(deployment.id, 'preview');
 * console.log(domain); // 'preview.example.com' or undefined
 * ```
 */
export async function getDomain(deploymentId: string, slot: Slot, config?: DeploygateConfig) {
  if (!globalDomainManager || config?.store) {
    await initializeManagers(config);
  }
  return globalDomainManager.getDomain(deploymentId, slot);
}
