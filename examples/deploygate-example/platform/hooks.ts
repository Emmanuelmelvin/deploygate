import type { DeploygateHooks, Deployment, Slot } from 'deploygate';
import { logger } from './logger';

export const hooks: DeploygateHooks = {
  onCreated: async (deployment: Deployment) => {
    logger.success(`Deployment ${deployment.id} created for build ${deployment.buildId}`);
    logger.indent(
      `Preview slot: ${deployment.slots.preview.status}${deployment.slots.preview.port ? ` (port ${deployment.slots.preview.port})` : ''}`
    );
  },

  onPromoted: async (deployment: Deployment) => {
    logger.success(`Preview promoted to production for deployment ${deployment.id}`);
    logger.indent(`Production slot: ${deployment.slots.production.status}`);
    if (deployment.slots.production.port) {
      logger.indent(`Production port: ${deployment.slots.production.port}`);
    }
  },

  onRollback: async (deployment: Deployment) => {
    logger.success(`Deployment ${deployment.id} rolled back`);
    logger.indent(`Preview slot: ${deployment.slots.preview.status}`);
    logger.indent(`Production slot: ${deployment.slots.production.status}`);
  },

  onDomainBound: async (deployment: Deployment, slot: Slot, domain: string) => {
    logger.info(`Domain ${domain} bound to ${slot} slot`);
    logger.indent(`${Colors.Gray}In a real platform, update your reverse proxy:${Colors.Reset}`);
    const port = deployment.slots[slot].port || (slot === 'preview' ? 3000 : 3001);
    logger.indent(`${domain} → http://localhost:${port}`);
  },
};

const Colors = {
  Gray: '\x1b[90m',
  Reset: '\x1b[0m',
};
