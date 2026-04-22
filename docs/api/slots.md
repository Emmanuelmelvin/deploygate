# Slots API

## startSlot(deploymentId, slot, port?)

Start a slot for a deployment.

| Parameter    | Type                        | Required | Description       |
| ------------ | --------------------------- | -------- | ----------------- |
| deploymentId | string                      | yes      | Deployment id     |
| slot         | `'preview' \| 'production'` | yes      | Slot to start     |
| port         | number                      | no       | Optional port     |

**Returns:** `Promise<void>`

**State transitions:**

- startSlot: only allowed from 'stopped' or 'crashed' → 'running'
- stopSlot: only allowed from 'running' or 'starting' → 'stopped'

> Config is automatically loaded from `deploygate.config.ts`

```ts
await startSlot('dep-abc', 'preview', 3000);
```

---

## stopSlot(deploymentId, slot)

Stop a slot for a deployment.

| Parameter    | Type                        | Required | Description   |
| ------------ | --------------------------- | -------- | ------------- |
| deploymentId | string                      | yes      | Deployment id |
| slot         | `'preview' \| 'production'` | yes      | Slot to stop  |

**Returns:** `Promise<void>`

```ts
await stopSlot('dep-abc', 'preview');
```
