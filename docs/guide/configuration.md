# Configuration

The `DeploygateConfig` interface:

| Field    | Type                        | Default   | Description                                      |
|----------|-----------------------------|-----------|--------------------------------------------------|
| adapter  | 'memory' \| 'file'          | 'memory'  | Which built-in adapter to use                     |
| dataDir  | string                      | undefined | Directory for file adapter data                   |
| store    | StateStore                  | undefined | Custom state store implementation                 |
| hooks    | DeploygateHooks             | undefined | Lifecycle hooks for all operations                |

## Example

```ts
import { createDeployment } from 'deploygate'

const config = {
  adapter: 'file',
  dataDir: './deploy-data',
  hooks: { /* ... */ }
}

await createDeployment('build-123', './dist', config)
```

## Choosing an adapter
- **memory**: Default. For dev and testing only. State is lost on restart.
- **file**: Persists to JSON on disk. Single process only. Not safe for concurrent access.
- **custom store**: For production, implement the `StateStore` interface and pass as `store`.
