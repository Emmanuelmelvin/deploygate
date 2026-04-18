import type { Slot } from '../types';
import type { StateStore } from '../store/index';
import { DeploygateError } from '../errors';
import logger from '../logger';

export class ProcessManager {
  constructor(private store: StateStore) {}

  async startSlot(
    deploymentId: string,
    slot: Slot,
    port?: number
  ): Promise<void> {
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

    // Validate slot state transition: only 'stopped' or 'crashed' slots can be started
    if (slotState.status !== 'stopped' && slotState.status !== 'crashed') {
      const error = new DeploygateError(
        `Cannot start ${slot} slot of deployment ${deploymentId}: current status is '${slotState.status}'. Only slots with status 'stopped' or 'crashed' can be started.`,
        'SLOT_START_FAILED',
        400,
        { deploymentId, slot, currentStatus: slotState.status }
      );
      logger.error(error);
      throw error;
    }

    slotState.status = 'running';
    slotState.startedAt = new Date();
    if (port !== undefined) {
      slotState.port = port;
    }

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

    // Validate slot state transition: only 'running' or 'starting' slots can be stopped
    if (slotState.status !== 'running' && slotState.status !== 'starting') {
      const error = new DeploygateError(
        `Cannot stop ${slot} slot of deployment ${deploymentId}: current status is '${slotState.status}'. Only slots with status 'running' or 'starting' can be stopped.`,
        'SLOT_STOP_FAILED',
        400,
        { deploymentId, slot, currentStatus: slotState.status }
      );
      logger.error(error);
      throw error;
    }

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
