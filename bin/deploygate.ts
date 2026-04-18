#!/usr/bin/env node

import { Command } from 'commander';
import {
  createDeployment,
  getDeployment,
  listDeployments,
  startSlot,
  stopSlot,
  promote,
  rollback,
  bindDomain,
  unbindDomain,
  getDomain,
  DeploygateError,
  logger,
} from '../src/index';

const program = new Command();

program
  .name('deploygate')
  .description('Manage deployment slots')
  .version('0.1.0');

program
  .command('create <buildId>')
  .description('Create a new deployment')
  .action(async (buildId: string) => {
    try {
      logger.info(`Creating deployment for build ${buildId}`);
      const deployment = await createDeployment(buildId);
      logger.info(`Successfully created deployment ${deployment.id}`);
      logger.info(JSON.stringify(deployment, null, 2));
    } catch (error) {
      if (error instanceof DeploygateError) {
        logger.error(`Error [${error.code}]: ${error.message}`);
      } else {
        logger.error(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      process.exit(1);
    }
  });

program
  .command('get <deploymentId>')
  .description('Get a deployment by ID')
  .action(async (deploymentId: string) => {
    try {
      logger.info(`Fetching deployment ${deploymentId}`);
      const deployment = await getDeployment(deploymentId);
      if (!deployment) {
        logger.error(`Deployment ${deploymentId} not found`);
        process.exit(1);
      }
      logger.info(JSON.stringify(deployment, null, 2));
    } catch (error) {
      if (error instanceof DeploygateError) {
        logger.error(`Error [${error.code}]: ${error.message}`);
      } else {
        logger.error(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all deployments')
  .action(async () => {
    try {
      logger.info('Listing all deployments');
      const deployments = await listDeployments();
      logger.info(JSON.stringify(deployments, null, 2));
    } catch (error) {
      if (error instanceof DeploygateError) {
        logger.error(`Error [${error.code}]: ${error.message}`);
      } else {
        logger.error(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      process.exit(1);
    }
  });

program
  .command('start <deploymentId> <slot>')
  .description('Start a slot (preview or production)')
  .option('--port <number>', 'Optional port number to store in slot state')
  .action(async (deploymentId: string, slot: string, options: { port?: string }) => {
    try {
      if (slot !== 'preview' && slot !== 'production') {
        logger.error('Slot must be either "preview" or "production"');
        process.exit(1);
      }
      const port = options.port ? parseInt(options.port, 10) : undefined;
      if (options.port && isNaN(port!)) {
        logger.error('Port must be a valid number');
        process.exit(1);
      }
      logger.info(`Starting ${slot} slot for deployment ${deploymentId}`);
      await startSlot(deploymentId, slot as 'preview' | 'production', port);
      const deployment = await getDeployment(deploymentId);
      logger.info(JSON.stringify(deployment, null, 2));
    } catch (error) {
      if (error instanceof DeploygateError) {
        logger.error(`Error [${error.code}]: ${error.message}`);
      } else {
        logger.error(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      process.exit(1);
    }
  });

program
  .command('stop <deploymentId> <slot>')
  .description('Stop a slot (preview or production)')
  .action(async (deploymentId: string, slot: string) => {
    try {
      if (slot !== 'preview' && slot !== 'production') {
        logger.error('Slot must be either "preview" or "production"');
        process.exit(1);
      }
      logger.info(`Stopping ${slot} slot for deployment ${deploymentId}`);
      await stopSlot(deploymentId, slot as 'preview' | 'production');
      const deployment = await getDeployment(deploymentId);
      logger.info(JSON.stringify(deployment, null, 2));
    } catch (error) {
      if (error instanceof DeploygateError) {
        logger.error(`Error [${error.code}]: ${error.message}`);
      } else {
        logger.error(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      process.exit(1);
    }
  });

program
  .command('promote <deploymentId>')
  .description('Promote preview slot to production')
  .action(async (deploymentId: string) => {
    try {
      logger.info(`Promoting deployment ${deploymentId}`);
      const deployment = await promote(deploymentId);
      logger.info(JSON.stringify(deployment, null, 2));
    } catch (error) {
      if (error instanceof DeploygateError) {
        logger.error(`Error [${error.code}]: ${error.message}`);
      } else {
        logger.error(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      process.exit(1);
    }
  });

program
  .command('rollback <deploymentId>')
  .description('Rollback production slot to stopped state')
  .action(async (deploymentId: string) => {
    try {
      logger.info(`Rolling back deployment ${deploymentId}`);
      const deployment = await rollback(deploymentId);
      logger.info(JSON.stringify(deployment, null, 2));
    } catch (error) {
      if (error instanceof DeploygateError) {
        logger.error(`Error [${error.code}]: ${error.message}`);
      } else {
        logger.error(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      process.exit(1);
    }
  });

const domainCommand = program
  .command('domain')
  .description('Manage domains for slots');

domainCommand
  .command('bind <deploymentId> <slot> <domain>')
  .description('Bind a domain to a slot')
  .action(async (deploymentId: string, slot: string, domain: string) => {
    try {
      if (slot !== 'preview' && slot !== 'production') {
        logger.error('Slot must be either "preview" or "production"');
        process.exit(1);
      }
      logger.info(
        `Binding domain ${domain} to ${slot} slot of deployment ${deploymentId}`
      );
      await bindDomain(deploymentId, slot as 'preview' | 'production', domain);
      const deployment = await getDeployment(deploymentId);
      logger.info(JSON.stringify(deployment, null, 2));
    } catch (error) {
      if (error instanceof DeploygateError) {
        logger.error(`Error [${error.code}]: ${error.message}`);
      } else {
        logger.error(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      process.exit(1);
    }
  });

domainCommand
  .command('unbind <deploymentId> <slot>')
  .description('Unbind a domain from a slot')
  .action(async (deploymentId: string, slot: string) => {
    try {
      if (slot !== 'preview' && slot !== 'production') {
        logger.error('Slot must be either "preview" or "production"');
        process.exit(1);
      }
      logger.info(
        `Unbinding domain from ${slot} slot of deployment ${deploymentId}`
      );
      await unbindDomain(deploymentId, slot as 'preview' | 'production');
      const deployment = await getDeployment(deploymentId);
      logger.info(JSON.stringify(deployment, null, 2));
    } catch (error) {
      if (error instanceof DeploygateError) {
        logger.error(`Error [${error.code}]: ${error.message}`);
      } else {
        logger.error(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      process.exit(1);
    }
  });

domainCommand
  .command('get <deploymentId> <slot>')
  .description('Get domain bound to a slot')
  .action(async (deploymentId: string, slot: string) => {
    try {
      if (slot !== 'preview' && slot !== 'production') {
        logger.error('Slot must be either "preview" or "production"');
        process.exit(1);
      }
      logger.info(
        `Getting domain for ${slot} slot of deployment ${deploymentId}`
      );
      const domain = await getDomain(
        deploymentId,
        slot as 'preview' | 'production'
      );
      logger.info(JSON.stringify({ deploymentId, slot, domain }, null, 2));
    } catch (error) {
      if (error instanceof DeploygateError) {
        logger.error(`Error [${error.code}]: ${error.message}`);
      } else {
        logger.error(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      process.exit(1);
    }
  });

program.parse(process.argv);
