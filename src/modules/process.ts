import type { Slot } from '../types';
import type { StateStore } from '../store/index';
import { DeploygateError } from '../errors';
import logger from '../logger';

const PREVIEW_PORT = 3000;
const PRODUCTION_PORT = 3001;

export class ProcessManager {
  constructor(private store: StateStore) {}

  async startSlot(deploymentId: string, slot: Slot): Promise<void> {
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

    const slotState = deployment.slots[slot];
    const port = slot === 'preview' ? PREVIEW_PORT : PRODUCTION_PORT;

    slotState.status = 'running';
    slotState.startedAt = new Date();
    slotState.port = port;

    await this.store.set(deploymentId, deployment);
  }

  async stopSlot(deploymentId: string, slot: Slot): Promise<void> {
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

    const slotState = deployment.slots[slot];
    slotState.status = 'stopped';
    slotState.stoppedAt = new Date();

    await this.store.set(deploymentId, deployment);
  }

  async getSlotStatus(deploymentId: string, slot: Slot) {
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

    return deployment.slots[slot];
  }

  async getLogs(deploymentId: string, slot: Slot): Promise<string[]> {
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

    // TODO: Integrate with real process management to fetch actual logs
    return [
      `[${deployment.id}] Starting ${slot} slot`,
      `[${deployment.id}] Process initialized`,
      `[${deployment.id}] Ready to accept connections`,
    ];
  }
}
