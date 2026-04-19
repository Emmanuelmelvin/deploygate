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

/**
 * Custom events for this platform
 */
export interface PlatformEvents extends EventMap {
  'ssl:provisioned': (domain: string) => Promise<void>;
  'notifications:sent': (deploymentId: string, event: string) => Promise<void>;
  'analytics:tracked': (deploymentId: string, action: string) => Promise<void>;
}

export const hooks: DeploygateHooks = {
  // ============================================================
  // DEPLOYMENT LIFECYCLE HOOKS
  // ============================================================

  onBeforeDeploy: async (context: DeploymentContext) => {
    logger.info(`🚀 Preparing deployment for build ${context.buildId}`);
    // In a real platform, you'd validate the build ID, check resources, etc.
  },

  onDeployStart: async (deployment: Deployment) => {
    logger.success(`✓ Deployment ${deployment.id} created`);
    logger.indent(`Build ID: ${deployment.buildId}`);
  },

  onDeploySuccess: async (deployment: Deployment) => {
    logger.success(`✓ Deployment ready and waiting for activation`);
    logger.indent(`Preview slot: ${deployment.slots.preview.status}`);
    logger.indent(`Production slot: ${deployment.slots.production.status}`);
  },

  onDeployFailed: async (context: DeploymentContext, error: Error) => {
    logger.error(`✗ Deployment failed for build ${context.buildId}`);
    logger.indent(`Reason: ${error.message}`);
  },

  onDeployPaused: async (deployment: Deployment) => {
    logger.warn(`⊘ Deployment ${deployment.id} paused`);
    logger.indent(`All slots frozen at current state`);
  },

  // ============================================================
  // SLOT LIFECYCLE HOOKS
  // ============================================================

  onBeforeSlotStart: async (context: SlotContext) => {
    logger.info(
      `🔧 Preparing to start ${context.slot} slot on port ${context.port || 'auto'}`
    );
    // In a real platform, allocate resources, setup networking, etc.
  },

  onSlotStart: async (context: SlotContext) => {
    logger.success(
      `✓ ${context.slot} slot started on port ${context.port || 'unknown'}`
    );
    logger.indent(`Deployment: ${context.deployment.id}`);
  },

  onSlotStop: async (context: SlotContext) => {
    logger.info(`⊗ ${context.slot} slot stopped`);
    logger.indent(`Deployment: ${context.deployment.id}`);
  },

  onSlotCrashed: async (context: SlotContext, error: Error) => {
    logger.error(
      `✗ ${context.slot} slot failed to start on port ${context.port || 'unknown'}`
    );
    logger.indent(`Error: ${error.message}`);
    // In a real platform, cleanup allocated resources, alert ops, etc.
  },

  // ============================================================
  // PROMOTION LIFECYCLE HOOKS
  // ============================================================

  onBeforePromote: async (context: PromotionContext) => {
    logger.info(`📤 Validating promotion for deployment ${context.deployment.id}`);
    logger.indent('Checking: preview slot is running...');
    // In a real platform, run smoke tests, security checks, etc.
  },

  onPromoteSuccess: async (deployment: Deployment) => {
    logger.success(`✓ Promotion complete! ${deployment.id} is now in production`);
    logger.indent(`Preview slot: ${deployment.slots.preview.status}`);
    logger.indent(`Production slot: ${deployment.slots.production.status}`);
    logger.indent(
      `Production running on port ${deployment.slots.production.port || 'unknown'}`
    );
  },

  onPromoteFailed: async (context: PromotionContext, error: Error) => {
    logger.error(`✗ Promotion failed for deployment ${context.deployment.id}`);
    logger.indent(`Reason: ${error.message}`);
    logger.indent('Preview slot remains in production, no changes made');
  },

  onRollbackStart: async (deployment: Deployment) => {
    logger.info(`🔄 Starting rollback for deployment ${deployment.id}`);
    logger.indent(`This will stop the production slot and revert to preview`);
  },

  onRollbackSuccess: async (deployment: Deployment) => {
    logger.success(`✓ Rollback complete!`);
    logger.indent(`Deployment: ${deployment.id}`);
    logger.indent(`Preview slot: ${deployment.slots.preview.status}`);
    logger.indent(`Production slot: ${deployment.slots.production.status}`);
  },

  onRollbackFailed: async (deployment: Deployment, error: Error) => {
    logger.error(`✗ Rollback failed for deployment ${deployment.id}`);
    logger.indent(`Error: ${error.message}`);
    logger.indent('⚠️  Manual intervention may be required');
  },

  // ============================================================
  // DOMAIN LIFECYCLE HOOKS
  // ============================================================

  onBeforeDomainBind: async (context: DomainContext) => {
    logger.info(
      `🔗 Preparing to bind domain ${context.domain} to ${context.slot} slot`
    );
  },

  onDomainBindSuccess: async (context: DomainContext) => {
    logger.success(`✓ Domain ${context.domain} bound to ${context.slot} slot`);
    logger.indent(`${Colors.Gray}In a real platform, update your reverse proxy:${Colors.Reset}`);
    const port = context.deployment.slots[context.slot].port || (context.slot === 'preview' ? 3000 : 3001);
    logger.indent(`${context.domain} → http://localhost:${port}`);

    // Emit custom event: SSL provisioning would happen here
    logger.indent(
      `${Colors.Gray}[custom event] emitting: ssl:provisioned for ${context.domain}${Colors.Reset}`
    );
  },

  onDomainBindFailed: async (context: DomainContext, error: Error) => {
    logger.error(
      `✗ Failed to bind domain ${context.domain} to ${context.slot} slot`
    );
    logger.indent(`Error: ${error.message}`);
  },

  onDomainUnbind: async (context: DomainContext) => {
    logger.info(`🔓 Domain ${context.domain} unbound from ${context.slot} slot`);
    logger.indent(
      `${Colors.Gray}In a real platform, remove the reverse proxy entry${Colors.Reset}`
    );
  },
};

const Colors = {
  Gray: '\x1b[90m',
  Reset: '\x1b[0m',
};

