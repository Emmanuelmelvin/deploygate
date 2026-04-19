import type { Deployment, DeploygateConfig } from '../types';
import type { StateStore } from '../store/index';
import { DeploygateError } from '../errors';
import logger from '../logger';
import { assertNonEmptyString } from '../utils/validate';

export class PromoteEngine {
  constructor(
    private store: StateStore,
    private config?: DeploygateConfig
  ) {}

  async promote(deploymentId: string): Promise<Deployment> {
    assertNonEmptyString(deploymentId, 'deploymentId');
    const deployment = await this.store.get(deploymentId);
    if (!deployment) {
      const error = new DeploygateError(
        `Deployment with id ${deploymentId} not found`,
        'DEPLOYMENT_NOT_FOUND',
        404,
        { deploymentId }
      );
      logger.error(error);
      throw error;
    }

    // Validate deployment state transition: only 'active' deployments can be promoted
    if (deployment.status !== 'active') {
      const error = new DeploygateError(
        `Cannot promote deployment ${deploymentId}: current status is '${deployment.status}'. Only deployments with status 'active' can be promoted.`,
        'PROMOTION_FAILED',
        400,
        { deploymentId, currentStatus: deployment.status }
      );
      logger.error(error);
      throw error;
    }

    const previewSlot = deployment.slots.preview;
    if (previewSlot.status !== 'running') {
      const error = new DeploygateError(
        `Cannot promote deployment ${deploymentId}: preview slot is not running (status: ${previewSlot.status})`,
        'PROMOTION_FAILED',
        400,
        { deploymentId, slotStatus: previewSlot.status }
      );
      logger.error(error);
      throw error;
    }

    // Compute all state mutations in memory before persisting
    deployment.slots.production = { ...previewSlot };
    deployment.status = 'promoted';

    // Commit all mutations in a single atomic write
    await this.store.set(deploymentId, deployment);

    logger.info(`Deployment ${deploymentId} promoted to production`);

    if (this.config?.hooks?.onPromoted) {
      await this.config.hooks.onPromoted(deployment);
    }

    return deployment;
  }

  async rollback(deploymentId: string): Promise<Deployment> {
    assertNonEmptyString(deploymentId, 'deploymentId');
    const deployment = await this.store.get(deploymentId);
    if (!deployment) {
      const error = new DeploygateError(
        `Deployment with id ${deploymentId} not found`,
        'DEPLOYMENT_NOT_FOUND',
        404,
        { deploymentId }
      );
      logger.error(error);
      throw error;
    }

    // Validate deployment state transition: only 'promoted' deployments can be rolled back
    if (deployment.status !== 'promoted') {
      const error = new DeploygateError(
        `Cannot rollback deployment ${deploymentId}: current status is '${deployment.status}'. Only deployments with status 'promoted' can be rolled back.`,
        'ROLLBACK_FAILED',
        400,
        { deploymentId, currentStatus: deployment.status }
      );
      logger.error(error);
      throw error;
    }

    // Compute all state mutations in memory before persisting
    deployment.slots.production.status = 'stopped';
    deployment.slots.production.stoppedAt = new Date();
    deployment.status = 'active';

    // Commit all mutations in a single atomic write
    await this.store.set(deploymentId, deployment);

    logger.info(`Deployment ${deploymentId} rolled back from production`);

    if (this.config?.hooks?.onRollback) {
      await this.config.hooks.onRollback(deployment);
    }

    return deployment;
  }
}
