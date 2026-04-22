# Hooks overview

Hooks let your platform run custom logic at every stage of the deployment lifecycle. deploygate tracks state and orchestrates the flow, but your hooks do the infrastructure work: provisioning, cleanup, notifications, and more.

Hooks are passed via the `hooks` field in your config object.

## Cancellation contract

Throwing from any before hook aborts the operation. The error propagates to the original caller. No state is written to the store.

## Minimal hooks example

```ts
const config = {
  hooks: {
    onBeforeDeploy: async (ctx) => {
      // Check quota, validate build, etc.
      if (!ctx.buildId) throw new Error('Missing buildId');
    },
    onDeploySuccess: async (ctx) => {
      // Notify, update dashboard, etc.
    },
  },
};
```
