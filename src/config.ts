import { existsSync } from 'fs';
import { join } from 'path';
import type { DeploygateConfig } from './types.js';
import logger from './logger.js';

const CONFIG_FILENAMES = [
  'deploygate.config.ts',
  'deploygate.config.js',
  'deploygate.config.json',
];

export async function loadConfig(
  configPath?: string
): Promise<DeploygateConfig> {
  const searchDir = configPath || process.cwd();

  for (const filename of CONFIG_FILENAMES) {
    const fullPath = join(searchDir, filename);

    if (!existsSync(fullPath)) {
      continue;
    }

    if (filename.endsWith('.json')) {
      try {
        const content = await import(fullPath, { assert: { type: 'json' } });
        logger.info(`Loaded config from ${fullPath}`);
        return content.default || content;
      } catch (error) {
        logger.warn(`Failed to load config from ${fullPath}`, error);
        continue;
      }
    }

    if (filename.endsWith('.ts') || filename.endsWith('.js')) {
      try {
        const module = await import(fullPath);
        logger.info(`Loaded config from ${fullPath}`);
        return module.default || module;
      } catch (error) {
        logger.warn(`Failed to load config from ${fullPath}`, error);
        continue;
      }
    }
  }

  logger.debug('No config file found, using empty config');
  return {};
}
