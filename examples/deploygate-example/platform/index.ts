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
} from 'deploygate';
import type { Slot } from 'deploygate';
import { logger } from './logger';


const program = new Command();
program
  .name('platform')
  .description('Minimal hosting platform using deploygate')
  .version('1.0.0');

program
  .command('deploy <distPath> <port>')
  .description('Deploy preview slot from dist folder')
  .action(async (distPath: string, port: number) => {
    logger.step(1, 4, 'Validating build output...');
    const buildId = `build-${Date.now()}`;

    logger.step(2, 4, 'Creating deployment...');
    const deployment = await createDeployment(buildId, distPath);

    logger.step(3, 4, 'Starting preview slot...');
    await startSlot(deployment.id, 'preview', port);

    logger.step(4, 4, 'Done');
    logger.blank();
    logger.indent(`Deployment ID : ${deployment.id}`);
    logger.indent(`Promote with  : platform promote ${deployment.id}`);
  });

program
  .command('promote <deploymentId>')
  .description('Promote preview → production')
  .action(async (deploymentId: string) => {
    logger.step(1, 2, 'Promoting preview to production...');
    await promote(deploymentId);

    logger.step(2, 2, 'Done');
    logger.blank();
    logger.indent(`Deployment ID : ${deploymentId}`);
  });

program
  .command('rollback <deploymentId>')
  .description('Rollback production to stopped')
  .action(async (deploymentId: string) => {
    await rollback(deploymentId);
    await stopSlot(deploymentId, 'production');
    logger.success('Production rolled back');
  });

program
  .command('status <deploymentId>')
  .description('Show deployment status')
  .action(async (deploymentId: string) => {
    const deployment = await getDeployment(deploymentId);
    if (!deployment) {
      logger.error(`Deployment ${deploymentId} not found`);
      process.exit(1);
    }
    console.log(JSON.stringify(deployment, null, 2));
  });

program
  .command('list')
  .description('List all deployments')
  .action(async () => {
    const deployments = await listDeployments();
    if (deployments.length === 0) {
      logger.info('No deployments found');
      return;
    }

    console.log('');
    console.log(
      'ID'.padEnd(20) +
        'Build'.padEnd(20) +
        'Status'.padEnd(15) +
        'Preview'.padEnd(12) +
        'Production'.padEnd(12)
    );
    console.log('-'.repeat(79));

    for (const d of deployments) {
      console.log(
        d.id.slice(0, 19).padEnd(20) +
          d.buildId.slice(0, 19).padEnd(20) +
          d.status.slice(0, 14).padEnd(15) +
          d.slots.preview.status.padEnd(12) +
          d.slots.production.status.padEnd(12)
      );
    }
    console.log('');
  });

program
  .command('domain <deploymentId> <slot> <domain>')
  .description('Bind domain to slot')
  .action(async (deploymentId: string, slot: string, domain: string) => {
    if (slot !== 'preview' && slot !== 'production') {
      logger.error('Slot must be preview or production');
      process.exit(1);
    }

    await bindDomain(deploymentId, slot as Slot, domain);
  });

program.parse();
