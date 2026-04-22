import type { Slot, DeploygateConfig, DomainContext } from '../types';
import type { StateStore } from '../store/index';
import { DeploygateError } from '../errors';
import logger from '../logger';
import {
  assertNonEmptyString,
  assertValidSlot,
  assertValidDomain,
} from '../utils/validate';
import { runHook } from '../hooks';

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

    const context: DomainContext = { deployment, slot, domain };

    // Cancellable before hook
    try {
      await runHook(this.config?.hooks, 'onBeforeDomainBind', context);
    } catch (error) {
      logger.error(error);
      throw error;
    }

    try {
      deployment.slots[slot].domain = domain;
      await this.store.set(deploymentId, deployment);

      logger.info(
        `Domain ${domain} bound to ${slot} slot of deployment ${deploymentId}`
      );

      await runHook(this.config?.hooks, 'onDomainBindSuccess', context);
    } catch (error) {
      await runHook(
        this.config?.hooks,
        'onDomainBindFailed',
        context,
        error as Error
      );
      throw error;
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

    const currentDomain = deployment.slots[slot].domain || '';
    const context: DomainContext = { deployment, slot, domain: currentDomain };

    delete deployment.slots[slot].domain;
    await this.store.set(deploymentId, deployment);

    logger.info(
      `Domain unbound from ${slot} slot of deployment ${deploymentId}`
    );

    await runHook(this.config?.hooks, 'onDomainUnbind', context);
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
