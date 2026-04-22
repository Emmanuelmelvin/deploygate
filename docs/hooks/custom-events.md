# Custom events

Custom events let your platform extend deploygate's lifecycle with your own event types. Use them for platform-specific workflows, notifications, or integrations.

## Declaring events

Define a typed `EventMap` interface:

```ts
interface MyPlatformEvents {
  'ssl:provisioned': (deployment: Deployment, domain: string) => Promise<void>;
  'cache:cleared': (deployment: Deployment) => Promise<void>;
  'health:failed': (deployment: Deployment, error: Error) => Promise<void>;
}
```

## Creating an emitter

```ts
const emitter = createEmitter<MyPlatformEvents>()
```

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

```ts
interface MyPlatformEvents {
  'ssl:provisioned': (deployment: Deployment, domain: string) =&gt; Promise&lt;void&gt;
  'cache:cleared': (deployment: Deployment) =&gt; Promise&lt;void&gt;
  'health:failed': (deployment: Deployment, error: Error) =&gt; Promise&lt;void&gt;
}

const emitter = createEmitter&lt;MyPlatformEvents&gt;()

emitter.on('ssl:provisioned', async (deployment, domain) => {
  await updateLoadBalancer(domain, deployment.slots.production.port)
})

// Inside onDomainBindSuccess hook:
onDomainBindSuccess: async (ctx) => {
  await provisionSSL(ctx.domain)
  await emitter.emit('ssl:provisioned', ctx.deployment, ctx.domain)
}
```
