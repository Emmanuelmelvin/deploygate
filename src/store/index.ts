import type { Deployment } from '../types.js';

/**
 * StateStore: Interface for deployment state persistence.
 *
 * All deploygate managers (DeploymentManager, ProcessManager, PromoteEngine,
 * DomainManager) delegate all state reads and writes to a StateStore
 * implementation. This allows deployment state to be persisted in any backend:
 * PostgreSQL, MongoDB, Redis, S3, or any other data store.
 *
 * INTERFACE CONTRACT:
 *
 * - get(id): Must return the Deployment object if found, or null if not found.
 *           Never throw an error for "not found" cases.
 *
 * - set(id, deployment): Must atomically write the complete deployment state.
 *                        All mutations should be committed in a single write.
 *                        Call this only when state is fully computed and ready.
 *
 * - list(): Must return all stored deployments as an array.
 *
 * - delete(id): Must remove a deployment from storage.
 *
 * IMPLEMENTATION GUIDELINES:
 *
 * 1. Atomicity: Each operation (get/set/delete) should be atomic from the
 *    caller's perspective. If set() is called, the entire new state is written.
 *
 * 2. Data Integrity: Ensure that concurrent calls to the same deployment ID
 *    do not cause state corruption or loss.
 *
 * 3. Schema: Store Deployment objects exactly as passed; do not transform
 *    or normalize data without explicit reason.
 *
 * See README.md for example implementations.
 */
export interface StateStore {
  get(id: string): Promise<Deployment | null>;
  set(id: string, deployment: Deployment): Promise<void>;
  list(): Promise<Deployment[]>;
  delete(id: string): Promise<void>;
}
