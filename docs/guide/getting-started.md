# Getting started

## Prerequisites
- Node.js >= 18

## Install
```sh
npm install deploygate
```

## Your first deployment (library)

```ts
import {
  createDeployment,
  startSlot,
  promote,
  rollback
} from 'deploygate'

const config = {
  hooks: {
    onBeforeDeploy: async (ctx) => { /* infra work */ },
    onDeploySuccess: async (ctx) => { /* notify */ },
    onPromoteSuccess: async (ctx) => { /* infra promote */ }
  }
}

const deployment = await createDeployment('build-123', './dist', config)
await startSlot(deployment.id, 'preview', config)
await promote(deployment.id, config)
await rollback(deployment.id, config)
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
