# Configuration

Deploygate loads config automatically from `deploygate.config.ts`, `deploygate.config.js`, or `deploygate.config.json` in your project root.

## The `DeploygateConfig` interface:

| Field   | Type               | Default   | Description                        |
| ------- | ------------------ | --------- | ---------------------------------- |
| adapter | 'memory' \| 'file' | 'memory'  | Which built-in adapter to use      |
| dataDir | string             | undefined | Directory for file adapter data    |
| store   | StateStore         | undefined | Custom state store implementation  |
| hooks   | DeploygateHooks    | undefined | Lifecycle hooks for all operations |

## Example config file

```ts
// deploygate.config.ts
import { defineConfig } from 'deploygate';

export default defineConfig({
  adapter: 'file',
  dataDir: './.deploygate-data',
  hooks: {
    onBeforeDeploy: async (ctx) => {
      console.log('Preparing deployment...');
    },
    onDeploySuccess: async (ctx) => {
      console.log('Deployment successful!');
    },
    onPromoteSuccess: async (ctx) => {
      console.log('Promoted to production!');
    },
  },
});
```

Once configured, call functions without passing config:

```ts
import { createDeployment } from 'deploygate';

// Config is automatically loaded from deploygate.config.ts
const deployment = await createDeployment('build-123', './dist');
```

## Choosing an adapter

- **memory**: Default. For dev and testing only. State is lost on restart.
- **file**: Persists to JSON on disk. Single process only. Not safe for concurrent access.
- **custom store**: For production, implement the `StateStore` interface and pass as `store` in config.
