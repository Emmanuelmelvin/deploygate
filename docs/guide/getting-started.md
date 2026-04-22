# Getting started

## Prerequisites

- Node.js >= 18

## Install

```sh
npm install deploygate
```

## Setup config file

Create a `deploygate.config.ts` (or `.js` / `.json`) in your project root:

```ts
import { defineConfig } from 'deploygate';

export default defineConfig({
  adapter: 'file',
  dataDir: '.deploygate-data',
  hooks: {
    onBeforeDeploy: async (ctx) => {
      /* infra work */
    },
    onDeploySuccess: async (ctx) => {
      /* notify */
    },
    onPromoteSuccess: async (ctx) => {
      /* infra promote */
    },
  },
});
```

Deploygate automatically loads this config on first use. No need to pass it to every function.

## Your first deployment (library)

```ts
import { createDeployment, startSlot, promote, rollback } from 'deploygate';

// Config is loaded automatically from deploygate.config.ts
const deployment = await createDeployment('build-123', './dist');
await startSlot(deployment.id, 'preview');
await promote(deployment.id);
await rollback(deployment.id);
```

## Your first deployment (CLI)

```sh
deploygate create build-123
# Start preview slot
deploygate start <deploymentId> preview
# Promote to production
deploygate promote <deploymentId>
# Rollback production
deploygate rollback <deploymentId>
```

## Next steps

- [Configuration](./configuration.md)
- [Hooks](../hooks/overview.md)
