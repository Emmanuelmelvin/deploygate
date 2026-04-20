import { v4 as uuidv4 } from 'uuid';
import type { Deployment, DeploygateConfig, ProcessStatus, DeploymentContext } from '../types';
import type { StateStore } from '../store/index';
import { DeploygateError } from '../errors';
import logger from '../logger';
import { assertNonEmptyString } from '../utils/validate';
import { runHook } from '../hooks';

export class DeploymentManager {
  constructor(private store: StateStore) {}

  async createDeployment(
    buildId: string,
    distPath: string,
    config?: DeploygateConfig,
  ): Promise<Deployment> {
    assertNonEmptyString(buildId, 'buildId');
    const context: DeploymentContext = { buildId, config, distPath };

    // Cancellable before hook
    try {
      await runHook(config?.hooks, 'onBeforeDeploy', context);
    } catch (error) {
      logger.error(error);
      throw error;
    }

    const deployment: Deployment = {
      id: uuidv4(),
      buildId,
      createdAt: new Date(),
      status: 'building',
      slots: {
        preview: {
          status: 'stopped' as ProcessStatus,
        },
        production: {
          status: 'stopped' as ProcessStatus,
        },
      },
      distPath,
    };

    try {
      await this.store.set(deployment.id, deployment);
      await runHook(config?.hooks, 'onDeployStart', deployment);
      
      deployment.status = 'active';
      await this.store.set(deployment.id, deployment);
      
      await runHook(config?.hooks, 'onDeploySuccess', deployment);
    } catch (error) {
      if (deployment.id) {
        try {
          const failed = await this.store.get(deployment.id);
          if (failed) {
            failed.status = 'failed';
            await this.store.set(deployment.id, failed);
          }
        } catch {
          // Ignore cleanup errors
        }
      }
      await runHook(config?.hooks, 'onDeployFailed', context, error as Error);
      throw error;
    }

    return deployment;
  }

  async pauseDeployment(id: string, config?: DeploygateConfig): Promise<Deployment> {
    assertNonEmptyString(id, 'deploymentId');
    const deployment = await this.store.get(id);
    if (!deployment) {
      const error = new DeploygateError(
        `Deployment with id ${id} not found`,
        'DEPLOYMENT_NOT_FOUND',
        404,
        { deploymentId: id }
      );
      logger.error(error);
      throw error;
    }

    deployment.status = 'paused';
    await this.store.set(id, deployment);
    await runHook(config?.hooks, 'onDeployPaused', deployment);

    return deployment;
  }

  async getDeployment(id: string): Promise<Deployment | null> {
    assertNonEmptyString(id, 'deploymentId');
    return this.store.get(id);
  }

  async listDeployments(): Promise<Deployment[]> {
    return this.store.list();
  }

  async updateDeployment(
    id: string,
    patch: Partial<Deployment>
  ): Promise<Deployment> {
    assertNonEmptyString(id, 'deploymentId');
    const deployment = await this.store.get(id);
    if (!deployment) {
      const error = new DeploygateError(
        `Deployment with id ${id} not found`,
        'DEPLOYMENT_NOT_FOUND',
        404,
        { deploymentId: id }
      );
      logger.error(error);
      throw error;
    }

    const updated = { ...deployment, ...patch };
    await this.store.set(id, updated);
    return updated;
  }
}
