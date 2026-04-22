# Promote & Rollback API

## promote(deploymentId)

Promote the preview slot to production atomically.

| Parameter    | Type   | Required | Description   |
| ------------ | ------ | -------- | ------------- |
| deploymentId | string | yes      | Deployment id |

**Returns:** `Promise<void>`

**State transition:**

::: raw
```
status: 'running'  → promote() → status: 'promoted'
```
:::

**Atomic operation:**

- `slots.production = { ...slots.preview, status: 'running', startedAt: now }`

::: raw
```ts
await promote('dep-abc');
```
:::

---

## rollback(deploymentId)

Rollback production slot to stopped.

| Parameter    | Type   | Required | Description   |
| ------------ | ------ | -------- | ------------- |
| deploymentId | string | yes      | Deployment id |

**Returns:** `Promise<void>`

**State transition:**

::: raw
```
status: 'promoted' → rollback() → status: 'running'
```
:::

**Atomic operation:**

- `slots.production = { status: 'stopped', stoppedAt: now }`

::: raw
```ts
await rollback('dep-abc');
```
:::
