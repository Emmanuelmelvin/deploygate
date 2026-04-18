import type { Deployment, DeploygateConfig } from '../types';
import type { StateStore } from '../store/index';
import { DeploygateError } from '../errors';
import logger from '../logger';

export class PromoteEngine {
  constructor(
    private store: StateStore,
    private config?: DeploygateConfig
  ) {}

  async promote(deploymentId: string): Promise<Deployment> {
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

    const previewSlot = deployment.slots.preview;
    if (previewSlot.status !== 'running') {
      const error = new DeploygateError(
        `Cannot promote: preview slot is not running (status: ${previewSlot.status})`,
        'PROMOTION_FAILED',
        400,
        { deploymentId, slotStatus: previewSlot.status }
      );
      logger.error(error);
      throw error;
    }

    deployment.status = 'promoting';
    await this.store.set(deploymentId, deployment);

    // Copy preview state to production
    deployment.slots.production = { ...previewSlot };
    deployment.status = 'promoted';

    await this.store.set(deploymentId, deployment);

    logger.info(`Deployment ${deploymentId} promoted to production`);

    if (this.config?.hooks?.onPromoted) {
      await this.config.hooks.onPromoted(deployment);
    }

    return deployment;
  }

  async rollback(deploymentId: string): Promise<Deployment> {
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

    deployment.slots.production.status = 'stopped';
    deployment.slots.production.stoppedAt = new Date();
    deployment.status = 'running';

    await this.store.set(deploymentId, deployment);

    logger.info(`Deployment ${deploymentId} rolled back from production`);

    if (this.config?.hooks?.onRollback) {
      await this.config.hooks.onRollback(deployment);
    }

    return deployment;
  }
}
