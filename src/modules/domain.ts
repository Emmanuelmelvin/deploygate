import type { Slot, DeploygateConfig } from '../types';
import type { StateStore } from '../store/index';
import { DeploygateError } from '../errors';
import logger from '../logger';
import { assertNonEmptyString, assertValidSlot, assertValidDomain } from '../utils/validate';

export class DomainManager {
  constructor(
    private store: StateStore,
    private config?: DeploygateConfig
  ) {}

  async bindDomain(
    deploymentId: string,
    slot: Slot,
    domain: string
  ): Promise<void> {
    assertNonEmptyString(deploymentId, 'deploymentId');
    assertValidSlot(slot);
    assertValidDomain(domain);
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

    deployment.slots[slot].domain = domain;
    await this.store.set(deploymentId, deployment);

    logger.info(
      `Domain ${domain} bound to ${slot} slot of deployment ${deploymentId}`
    );

    if (this.config?.hooks?.onDomainBound) {
      await this.config.hooks.onDomainBound(deployment, slot, domain);
    }
  }

  async unbindDomain(deploymentId: string, slot: Slot): Promise<void> {
    assertNonEmptyString(deploymentId, 'deploymentId');
    assertValidSlot(slot);
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

    delete deployment.slots[slot].domain;
    await this.store.set(deploymentId, deployment);

    logger.info(
      `Domain unbound from ${slot} slot of deployment ${deploymentId}`
    );
  }

  async getDomain(
    deploymentId: string,
    slot: Slot
  ): Promise<string | undefined> {
    assertNonEmptyString(deploymentId, 'deploymentId');
    assertValidSlot(slot);
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

    return deployment.slots[slot].domain;
  }
}
