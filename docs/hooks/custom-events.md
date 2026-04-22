# Custom events

Custom events let your platform extend deploygate's lifecycle with your own event types. Use them for platform-specific workflows, notifications, or integrations.

## Declaring events

Define a typed `EventMap` interface:

::: raw
```ts
interface MyPlatformEvents {
  'ssl:provisioned': (deployment: Deployment, domain: string) => Promise<void>;
  'cache:cleared': (deployment: Deployment) => Promise<void>;
  'health:failed': (deployment: Deployment, error: Error) => Promise<void>;
}
```
:::

## Creating an emitter

::: raw
```ts
const emitter = createEmitter<MyPlatformEvents>()
```
:::

## Registering handlers

```ts
emitter.on('ssl:provisioned', async (deployment, domain) => {
  await updateLoadBalancer(domain, deployment.slots.production.port);
});
```

## Emitting events

```ts
await emitter.emit('ssl:provisioned', deployment, domain);
```

## Removing handlers

```ts
emitter.off('ssl:provisioned', handler);
emitter.offAll('ssl:provisioned');
```

## Error propagation

If a handler throws, `emit()` will bubble the error to the caller.

## Real-world example

::: raw
```ts
interface MyPlatformEvents {
  'ssl:provisioned': (deployment: Deployment, domain: string) => Promise<void>
  'cache:cleared': (deployment: Deployment) => Promise<void>
  'health:failed': (deployment: Deployment, error: Error) => Promise<void>
}

const emitter = createEmitter<MyPlatformEvents>()

emitter.on('ssl:provisioned', async (deployment, domain) => {
  await updateLoadBalancer(domain, deployment.slots.production.port)
})

// Inside onDomainBindSuccess hook:
onDomainBindSuccess: async (ctx) => {
  await provisionSSL(ctx.domain)
  await emitter.emit('ssl:provisioned', ctx.deployment, ctx.domain)
}
```
:::
