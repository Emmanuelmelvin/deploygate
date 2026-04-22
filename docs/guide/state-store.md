# State store

deploygate uses a pluggable `StateStore` interface for all state persistence. You can use the built-in memory or file adapters, or bring your own for production.

## StateStore interface

- `get(id): Promise<Deployment | null>` — Return deployment or null if not found (never throw for missing)
- `set(id, deployment): Promise<void>` — Store or update deployment
- `list(): Promise<Deployment[]>` — List all deployments
- `delete(id): Promise<void>` — Remove deployment

All methods should be atomic from the caller's perspective.

> ⚠️ The file adapter is for development only. Do not use in production.

## Example: custom store

::: raw
```ts
import { defineConfig } from 'deploygate';

class MyCustomStore implements StateStore {
  private map = new Map<string, Deployment>()
  async get(id) { return this.map.get(id) ?? null }
  async set(id, deployment) { this.map.set(id, deployment) }
  async list() { return [...this.map.values()] }
  async delete(id) { this.map.delete(id) }
}

export default defineConfig({
  store: new MyCustomStore(),
  hooks: {
    // your hooks here
  },
});
```
:::

Then use deploygate normally — the custom store is automatically used:

```ts
import { createDeployment } from 'deploygate';

await createDeployment('build-123', './dist');
```
