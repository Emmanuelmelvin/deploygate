#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
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
import type { DeploygateConfig, Slot } from 'deploygate';
import { logger } from './logger';
import { hooks } from './hooks';
import { startServer, stopServer } from './server';

const config: DeploygateConfig = {
  adapter: 'file',
  dataDir: '.deploygate-data',
  hooks,
};

const distPaths = new Map<string, string>();

const program = new Command();
program.name('platform').description('Minimal hosting platform using deploygate').version('1.0.0');

program
  .command('deploy <distPath>')
  .description('Deploy preview slot from dist folder')
  .action(async (distPath: string) => {
    logger.step(1, 4, 'Validating build output...');

    if (!fs.existsSync(distPath) || !fs.existsSync(path.join(distPath, 'index.html'))) {
      logger.error(`Invalid dist path: ${distPath} must exist and contain index.html`);
      process.exit(1);
    }

    logger.step(2, 4, 'Creating deployment...');
    const buildId = `build-${Date.now()}`;
    const deployment = await createDeployment(buildId, config);

    logger.step(3, 4, 'Starting preview slot...');
    await startSlot(deployment.id, 'preview', 3000, config);
    distPaths.set(deployment.id, distPath);

    logger.step(4, 4, 'Preview server running');
    logger.blank();
    logger.indent(`Deployment ID : ${deployment.id}`);
    logger.indent(`Preview URL   : http://localhost:3000`);
    logger.indent(`Promote with  : platform promote ${deployment.id}`);
    await startServer(3000, distPath);
  });

program
  .command('promote <deploymentId>')
  .description('Promote preview → production')
  .action(async (deploymentId: string) => {
    const deployment = await getDeployment(deploymentId, config);
    if (!deployment) {
      logger.error(`Deployment ${deploymentId} not found`);
      process.exit(1);
    }

    const distPath = distPaths.get(deploymentId);
    if (!distPath) {
      logger.error(`Dist path not found for deployment ${deploymentId}`);
      process.exit(1);
    }

    logger.step(1, 3, 'Promoting preview to production...');
    await promote(deploymentId, config);

    logger.step(2, 3, 'Starting production slot...');
    await startSlot(deploymentId, 'production', 3001, config);

    logger.step(3, 3, 'Production server running');
    logger.blank();
    logger.indent(`Deployment ID    : ${deploymentId}`);
    logger.indent(`Production URL   : http://localhost:3001`);
    logger.indent(`Rollback with    : platform rollback ${deploymentId}`);
    await startServer(3001, distPath);
  });

program
  .command('rollback <deploymentId>')
  .description('Rollback production to stopped')
  .action(async (deploymentId: string) => {
    const deployment = await getDeployment(deploymentId, config);
    if (!deployment) {
      logger.error(`Deployment ${deploymentId} not found`);
      process.exit(1);
    }

    await rollback(deploymentId, config);
    await stopSlot(deploymentId, 'production', config);

    logger.success('Production rolled back');
    logger.indent(`Preview still available at http://localhost:3000`);
  });

program
  .command('status <deploymentId>')
  .description('Show deployment status')
  .action(async (deploymentId: string) => {
    const deployment = await getDeployment(deploymentId, config);
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
    const deployments = await listDeployments(config);
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

    await bindDomain(deploymentId, slot as Slot, domain, config);
  });

program.parse();
