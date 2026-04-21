# Promote & Rollback API

## promote(deploymentId, config?)

Promote the preview slot to production atomically.

| Parameter     | Type             | Required | Description           |
|---------------|------------------|----------|-----------------------|
| deploymentId  | string           | yes      | Deployment id         |
| config        | DeploygateConfig | no       | Config                |

**Returns:** `Promise<void>`

**State transition:**
```
status: 'running'  → promote() → status: 'promoted'
```

**Atomic operation:**
- `slots.production = { ...slots.preview, status: 'running', startedAt: now }`

```ts
await promote('dep-abc', config)
```

---

## rollback(deploymentId, config?)

Rollback production slot to stopped.

| Parameter     | Type             | Required | Description           |
|---------------|------------------|----------|-----------------------|
| deploymentId  | string           | yes      | Deployment id         |
| config        | DeploygateConfig | no       | Config                |

**Returns:** `Promise&lt;void&gt;`

**State transition:**
```
status: 'promoted' → rollback() → status: 'running'
```

**Atomic operation:**
- `slots.production = { status: 'stopped', stoppedAt: now }`

```ts
await rollback('dep-abc', config)
```
