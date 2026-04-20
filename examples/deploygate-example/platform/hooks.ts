import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import type {
  DeploygateHooks,
  Deployment,
  DeploymentContext,
  SlotContext,
  PromotionContext,
  DomainContext,
  EventMap,
} from 'deploygate';
import { logger } from './logger';
import { startServer, stopServer } from './server';

// ============================================================
// INFRASTRUCTURE STATE MANAGEMENT
// ============================================================

// Track server instances (port → server)
const portServers = new Map<number, http.Server>();

// ============================================================
// CUSTOM EVENTS
// ============================================================

export interface PlatformEvents extends EventMap {
  'ssl:provisioned': (domain: string) => Promise<void>;
  'notifications:sent': (deploymentId: string, event: string) => Promise<void>;
  'analytics:tracked': (deploymentId: string, action: string) => Promise<void>;
}

// ============================================================
// HOOKS IMPLEMENTATION
// ============================================================

export const hooks: DeploygateHooks = {
  onBeforeDeploy: async (context: DeploymentContext) => {

    if (!fs.existsSync(context.distPath)) {
      throw new Error(`Dist path does not exist: ${context.distPath}`);
    }

    if (!fs.existsSync(path.join(context.distPath, 'index.html'))) {
      throw new Error(`Dist path must contain index.html: ${context.distPath}`);
    }

    logger.info(`🚀 Preparing deployment for build ${context.buildId}`);
  },

  onDeployStart: async (deployment: Deployment) => {
    logger.success(`✓ Deployment ${deployment.id} created`);
    logger.indent(`Build ID: ${deployment.buildId}`);
  },

  onDeploySuccess: async (deployment: Deployment) => {
      // Start preview server
      try{
        const server = await startServer(3000, deployment.distPath);
        portServers.set(3000, server);
      }catch(error: any){
        logger.error(`✗ Failed to start preview server on port 3000`);
        logger.indent(`Error: ${error instanceof Error ? error.message : String(error)}`);
        return;
      }

    logger.success(`✓ Deployment ready`);
    logger.indent(`Preview slot: ${deployment.slots.preview.status}`);
    logger.indent(`Preview URL: http://localhost:3000`);
  },

  onDeployFailed: async (context: DeploymentContext, error: Error) => {
    logger.error(`✗ Deployment failed for build ${context.buildId}`);
    logger.indent(`Reason: ${error.message}`);
  },

  onDeployPaused: async (deployment: Deployment) => {
    logger.warn(`⊘ Deployment ${deployment.id} paused`);
  },

  // ============================================================
  // SLOT LIFECYCLE HOOKS
  // ============================================================

  onBeforeSlotStart: async (context: SlotContext) => {
    logger.info(`🔧 Slot about to start: ${context.slot}`);
  },

  onSlotStart: async (context: SlotContext) => {
    if (context.slot === 'production') {
      const distPath = context.deployment.distPath;
      if (distPath) {
        const server = await startServer(3001, distPath);
        portServers.set(3001, server);
      }
    }
    // Preview slot already started in onDeploySuccess

    logger.success(`✓ ${context.slot} slot started`);
  },

  onSlotStop: async (context: SlotContext) => {
    const port = context.slot === 'production' ? 3001 : 3000;
    const server = portServers.get(port);
    if (server) {
      await stopServer(server);
      portServers.delete(port);
    }

    logger.info(`⊗ ${context.slot} slot stopped`);
  },

  onSlotCrashed: async (context: SlotContext, error: Error) => {
    logger.error(`✗ ${context.slot} slot crashed`);
    logger.indent(`Error: ${error.message}`);
  },

  // ============================================================
  // PROMOTION LIFECYCLE HOOKS
  // ============================================================

  onBeforePromote: async (context: PromotionContext) => {
    logger.info(`📤 Validating promotion for ${context.deployment.id}`);
  },

  onPromoteSuccess: async (deployment: Deployment) => {
    const distPath = deployment?.distPath;
    if (!distPath) {
      logger.error(`✗ Cannot start production server: distPath not found for ${deployment.id}`);
      return;
    }

    try {
      const server = await startServer(3001, distPath);
      portServers.set(3001, server);
    } catch (error) {
      logger.error(`✗ Failed to start production server on port 3001`);
      logger.indent(`Error: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }

    logger.success(`✓ Promotion complete!`);
    logger.indent(`Production URL: http://localhost:3001`);
    logger.indent(`Rollback with : platform rollback ${deployment.id}`);
  },

  onPromoteFailed: async (_context: PromotionContext, error: Error) => {
    logger.error(`✗ Promotion failed`);
    logger.indent(`Reason: ${error.message}`);
    logger.indent(`Preview still available at http://localhost:3000`);
  },

  onRollbackStart: async (deployment: Deployment) => {
    logger.info(`🔄 Starting rollback for ${deployment.id}`);
  },

  onRollbackSuccess: async (deployment: Deployment) => {
    const server = portServers.get(3001);
    if (server) {
      await stopServer(server);
      portServers.delete(3001);
    }
    logger.success(`✓ Production rolled back`);
    logger.indent(`Preview still available at http://localhost:3000`);
  },

  onRollbackFailed: async (deployment: Deployment, error: Error) => {
    logger.error(`✗ Rollback failed`);
    logger.indent(`Error: ${error.message}`);
  },

  // ============================================================
  // DOMAIN LIFECYCLE HOOKS
  // ============================================================

  onBeforeDomainBind: async (context: DomainContext) => {
    logger.info(`🔗 Binding domain ${context.domain} to ${context.slot}`);
  },

  onDomainBindSuccess: async (context: DomainContext) => {
    const port = context.slot === 'production' ? 3001 : 3000;
    logger.success(`✓ Domain ${context.domain} bound to ${context.slot} slot`);
    logger.indent(
      `In a real platform, update your reverse proxy to point ${context.domain} → localhost:${port}`
    );
  },

  onDomainBindFailed: async (context: DomainContext, error: Error) => {
    logger.error(`✗ Failed to bind domain ${context.domain}`);
    logger.indent(`Error: ${error.message}`);
  },

  onDomainUnbind: async (context: DomainContext) => {
    logger.info(`🔓 Domain ${context.domain} unbound from ${context.slot}`);
  },
};

