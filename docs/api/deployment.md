# Deployment API

## createDeployment(buildId, distPath, config?)

Creates a new deployment and returns the deployment object.

| Parameter   | Type                | Required | Description                       |
|-------------|---------------------|----------|-----------------------------------|
| buildId     | string              | yes      | Unique build identifier           |
| distPath    | string              | yes      | Path to static build output       |
| config      | DeploygateConfig    | no       | Configuration and hooks           |

**Returns:** `Promise<Deployment>`

**Throws:** Error if buildId already exists or invalid

```ts
const deployment = await createDeployment('build-123', './dist', config)
```

---

## getDeployment(id, config?)

Fetch a deployment by id.

| Parameter | Type             | Required | Description           |
|-----------|------------------|----------|-----------------------|
| id        | string           | yes      | Deployment id         |
| config    | DeploygateConfig | no       | Config                |

**Returns:** `Promise<Deployment | null>`

```ts
const deployment = await getDeployment('dep-abc', config)
```

---

## listDeployments(config?)

List all deployments.

| Parameter | Type             | Required | Description           |
|-----------|------------------|----------|-----------------------|
| config    | DeploygateConfig | no       | Config                |

**Returns:** `Promise<Deployment[]>`

```ts
const deployments = await listDeployments(config)
```

---

## updateDeployment(id, patch, config?)

Update a deployment with a partial patch.

| Parameter | Type             | Required | Description           |
|-----------|------------------|----------|-----------------------|
| id        | string           | yes      | Deployment id         |
| patch     | Partial<Deployment> | yes   | Fields to update      |
| config    | DeploygateConfig | no       | Config                |

**Returns:** `Promise<Deployment>`

```ts
await updateDeployment('dep-abc', { meta: { foo: 'bar' } }, config)
```

---

## pauseDeployment(deploymentId, config?)

Pause a deployment.

| Parameter     | Type             | Required | Description           |
|---------------|------------------|----------|-----------------------|
| deploymentId  | string           | yes      | Deployment id         |
| config        | DeploygateConfig | no       | Config                |

**Returns:** `Promise<void>`

```ts
await pauseDeployment('dep-abc', config)
```
