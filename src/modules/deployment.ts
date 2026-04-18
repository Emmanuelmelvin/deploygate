import { v4 as uuidv4 } from 'uuid';
import type { Deployment, DeploygateConfig, ProcessStatus } from '../types.js';
import type { StateStore } from '../store/index.js';
import { DeploygateError } from '../errors.js';
import logger from '../logger.js';

export class DeploymentManager {
  constructor(private store: StateStore) {}

  async createDeployment(
    buildId: string,
    config?: DeploygateConfig
  ): Promise<Deployment> {
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
    };

    await this.store.set(deployment.id, deployment);

    if (config?.hooks?.onCreated) {
      await config.hooks.onCreated(deployment);
    }

    return deployment;
  }

  async getDeployment(id: string): Promise<Deployment | null> {
    return this.store.get(id);
  }

  async listDeployments(): Promise<Deployment[]> {
    return this.store.list();
  }

  async updateDeployment(
    id: string,
    patch: Partial<Deployment>
  ): Promise<Deployment> {
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
