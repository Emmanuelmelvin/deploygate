# deploygate

deploygate is a TypeScript library and CLI tool for hosting platforms. It manages deployment lifecycle state — create, preview, promote, production — and provides a full lifecycle hook system for platforms to implement their own infrastructure logic. The pluggable StateStore interface lets you bring your own database adapter for production use.

## Install

```sh
npm install deploygate
```

## How it works

deploygate uses a two-slot model: every deployment has a preview and production slot. Promotion is atomic — preview promotes to production in a single store write. All infrastructure work is handled by your hooks.

Create a `deploygate.config.ts` in your project root:

```ts
import { defineConfig } from 'deploygate';

export default defineConfig({
  adapter: 'file',
  dataDir: '.deploygate-data',
  hooks: {
    onBeforeDeploy: async (ctx) => {
      // Validate build, check quota, etc.
    },
    onDeploySuccess: async (ctx) => {
      // Notify, update dashboard, etc.
    },
    onPromoteSuccess: async (ctx) => {
      // Switch traffic, update infra
    },
    onDomainBindSuccess: async (ctx) => {
      // Provision SSL, update DNS
    },
  },
});
```

Then call functions without passing config — it's automatically loaded:

```ts
import { createDeployment, startSlot, promote, bindDomain } from 'deploygate';

const deployment = await createDeployment('build-123', './dist');
await startSlot(deployment.id, 'preview');
await promote(deployment.id);
await bindDomain(deployment.id, 'production', 'yourdomain.com');
```

## CLI

- `deploygate create <buildId> <distPath>` # Create a new deployment
- `deploygate start <deploymentId> preview` # Start the preview slot
- `deploygate promote <deploymentId>` # Promote preview to production
- `deploygate rollback <deploymentId>` # Rollback production slot
- `deploygate domain bind <deploymentId> production yourdomain.com` # Bind a domain
- `deploygate list` # List all deployments
- `deploygate status <deploymentId>` # Show deployment status

## What deploygate does not do

deploygate does not spawn processes, provision servers, manage DNS, handle authentication, or aggregate logs. Those responsibilities belong to your platform. deploygate tracks state and calls your hooks at the right moment — your platform does the rest.

## Documentation

Full documentation, API reference, hook lifecycle, and examples:
(here) [https://EmmanuelMelvin.github.io/deploygate]

## License

MIT
