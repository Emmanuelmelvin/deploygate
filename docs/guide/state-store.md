# State store

deploygate uses a pluggable `StateStore` interface for all state persistence. You can use the built-in memory or file adapters, or bring your own for production.

## StateStore interface

- `get(id): Promise&lt;Deployment | null&gt;` — Return deployment or null if not found (never throw for missing)
- `set(id, deployment): Promise&lt;void&gt;` — Store or update deployment
- `list(): Promise&lt;Deployment[]&gt;` — List all deployments
- `delete(id): Promise&lt;void&gt;` — Remove deployment

All methods should be atomic from the caller's perspective.

> ⚠️ The file adapter is for development only. Do not use in production.

## Example: custom store

```ts
class MyCustomStore implements StateStore {
  private map = new Map&lt;string, Deployment&gt;()
  async get(id) { return this.map.get(id) ?? null }
  async set(id, deployment) { this.map.set(id, deployment) }
  async list() { return [...this.map.values()] }
  async delete(id) { this.map.delete(id) }
}

await createDeployment('build-123', './dist', { store: new MyCustomStore() })
```
