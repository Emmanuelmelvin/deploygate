# Deployment API

## createDeployment(buildId, distPath)

Creates a new deployment and returns the deployment object.

| Parameter | Type   | Required | Description                 |
| --------- | ------ | -------- | --------------------------- |
| buildId   | string | yes      | Unique build identifier     |
| distPath  | string | yes      | Path to static build output |

**Returns:** `Promise<Deployment>`

**Throws:** Error if buildId already exists or invalid

> Config is automatically loaded from `deploygate.config.ts`

::: raw
```ts
const deployment = await createDeployment('build-123', './dist');
```
:::

---

## getDeployment(id)

Fetch a deployment by id.

| Parameter | Type   | Required | Description   |
| --------- | ------ | -------- | ------------- |
| id        | string | yes      | Deployment id |

**Returns:** `Promise<Deployment | null>`

::: raw
```ts
const deployment = await getDeployment('dep-abc');
```
:::

---

## listDeployments()

List all deployments.

**Returns:** `Promise<Deployment[]>`

::: raw
```ts
const deployments = await listDeployments();
```
:::

---

## updateDeployment(id, patch)

Update a deployment with a partial patch.

| Parameter | Type                      | Required | Description      |
| --------- | ------------------------- | -------- | ---------------- |
| id        | string                    | yes      | Deployment id    |
| patch     | Partial<Deployment>       | yes      | Fields to update |

**Returns:** `Promise<Deployment>`

::: raw
```ts
await updateDeployment('dep-abc', { meta: { foo: 'bar' } });
```
:::

---

## pauseDeployment(deploymentId)

Pause a deployment.

| Parameter    | Type   | Required | Description   |
| ------------ | ------ | -------- | ------------- |
| deploymentId | string | yes      | Deployment id |

**Returns:** `Promise<void>`

::: raw
```ts
await pauseDeployment('dep-abc');
```
:::
