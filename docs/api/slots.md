# Slots API

## startSlot(deploymentId, slot, portOrConfig?, maybeConfig?)

Start a slot for a deployment.

**Overloads:**
- `startSlot(id, slot)`
- `startSlot(id, slot, port)`
- `startSlot(id, slot, config)`
- `startSlot(id, slot, port, config)`

| Parameter      | Type                | Required | Description                       |
|---------------|---------------------|----------|-----------------------------------|
| deploymentId  | string              | yes      | Deployment id                     |
| slot          | `'preview' \| 'production'` | yes | Slot to start                     |
| portOrConfig  | `number \| DeploygateConfig` | no | Port or config                    |
| maybeConfig   | DeploygateConfig     | no       | Config if port is provided        |

**Returns:** `Promise&lt;void&gt;`

**State transitions:**
- startSlot: only allowed from 'stopped' or 'crashed' → 'running'
- stopSlot: only allowed from 'running' or 'starting' → 'stopped'

```ts
await startSlot('dep-abc', 'preview', 3000, config)
```

---

## stopSlot(deploymentId, slot, config?)

Stop a slot for a deployment.

| Parameter      | Type                | Required | Description                       |
|---------------|---------------------|----------|-----------------------------------|
| deploymentId  | string              | yes      | Deployment id                     |
| slot          | `'preview' \| 'production'` | yes | Slot to stop                      |
| config        | DeploygateConfig     | no       | Config                            |

**Returns:** `Promise&lt;void&gt;`

```ts
await stopSlot('dep-abc', 'preview', config)
```
