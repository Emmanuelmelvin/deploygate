# deploygate

A TypeScript library and CLI tool for hosting platforms to manage preview/production deployment slots with atomic promotion. deploygate enables hosting platforms to safely manage multiple deployment environments, promote changes from preview to production, and rollback if needed—all with a clean typed API and command-line interface. Deploygate is basically a deployment lifecycle manager. It takes a build, creates two slots (preview and production), manages the state transitions between them, and tells the platform what happened via hooks. Everything outside that — projects, users, processes, databases, logs, domains infrastructure — belongs to the platform.

## Install

```bash
npm install deploygate
```

Requires Node.js >= 18.

## Quick Start

### Library Usage

```typescript
import { createDeployment, startSlot, promote, bindDomain } from 'deploygate';

// Create a new deployment
const deployment = await createDeployment('build-abc123');
console.log(deployment.id); // UUID of the deployment

// Start the preview slot
await startSlot(deployment.id, 'preview');

// Bind a domain to the preview slot
await bindDomain(deployment.id, 'preview', 'preview.example.com');

// Once preview is tested, promote to production
await promote(deployment.id);

// If something is wrong, rollback
await rollback(deployment.id);
```

### CLI Usage

```bash
# Create deployment
deploygate create build-123

# List all deployments
deploygate list

# Get deployment details
deploygate get <deploymentId>

# Start a slot
deploygate start <deploymentId> preview
deploygate start <deploymentId> production

# Stop a slot
deploygate stop <deploymentId> preview

# Promote preview → production
deploygate promote <deploymentId>

# Rollback production
deploygate rollback <deploymentId>

# Manage domains
deploygate domain bind <deploymentId> preview preview.example.com
deploygate domain unbind <deploymentId> preview
deploygate domain get <deploymentId> preview
```

## Config File

Create a `deploygate.config.ts`, `deploygate.config.js`, or `deploygate.config.json` in your project root:

```typescript
// deploygate.config.ts
import type { DeploygateConfig } from 'deploygate';

export default {
  // Storage adapter: 'memory' (default) or 'file'
  adapter: 'file',

  // Data directory for file adapter (default: ./deploygate-data)
  dataDir: './data/deployments',

  // Lifecycle hooks
  hooks: {
    // Deployment hooks
    onBeforeDeploy: async (context) => {
      // Runs before a deployment is created
      // Throw to cancel the deployment
      console.log(`Creating deployment for build ${context.buildId}`);
    },
    onDeployStart: async (deployment) => {
      // Runs after deployment is created but before it's marked as active
      console.log(`Deployment ${deployment.id} created, initializing slots `);
    },
    onDeploySuccess: async (deployment) => {
      // Runs after deployment is fully initialized
      console.log(`Deployment ${deployment.id} ready`);
    },
    onDeployFailed: async (context, error) => {
      // Runs if deployment fails at any step
      console.error(`Deployment failed: ${error.message}`);
    },
    onDeployPaused: async (deployment) => {
      // Runs when deployment is paused
      console.log(`Deployment ${deployment.id} paused`);
    },

    // Slot lifecycle hooks
    onBeforeSlotStart: async (context) => {
      // Runs before a slot is started
      // Throw to cancel starting the slot
      console.log(`Starting ${context.slot} slot on port ${context.port}`);
    },
    onSlotStart: async (context) => {
      // Runs after a slot has successfully started
      console.log(`${context.slot} slot started`);
    },
    onSlotStop: async (context) => {
      // Runs after a slot has been stopped
      console.log(`${context.slot} slot stopped`);
    },
    onSlotCrashed: async (context, error) => {
      // Runs if a slot fails to start
      console.error(`${context.slot} slot crashed: ${error.message}`);
    },

    // Promotion lifecycle hooks
    onBeforePromote: async (context) => {
      // Runs before promotion
      // Throw to cancel the promotion
      console.log(`Promoting deployment ${context.deployment.id} to production`);
    },
    onPromoteSuccess: async (deployment) => {
      // Runs after successful promotion
      console.log(`Successfully promoted ${deployment.id}`);
      // Trigger notifications, analytics, etc.
    },
    onPromoteFailed: async (context, error) => {
      // Runs if promotion fails
      console.error(`Promotion failed: ${error.message}`);
    },
    onRollbackStart: async (deployment) => {
      // Runs before rollback begins
      console.log(`Rolling back deployment ${deployment.id}`);
    },
    onRollbackSuccess: async (deployment) => {
      // Runs after successful rollback
      console.log(`Successfully rolled back ${deployment.id}`);
    },
    onRollbackFailed: async (deployment, error) => {
      // Runs if rollback fails
      console.error(`Rollback failed: ${error.message}`);
    },

    // Domain lifecycle hooks
    onBeforeDomainBind: async (context) => {
      // Runs before domain binding
      // Throw to cancel the binding
      console.log(`Binding ${context.domain} to ${context.slot} slot`);
    },
    onDomainBindSuccess: async (context) => {
      // Runs after successful domain binding
      console.log(`Successfully bound ${context.domain}`);
    },
    onDomainBindFailed: async (context, error) => {
      // Runs if domain binding fails
      console.error(`Domain binding failed: ${error.message}`);
    },
    onDomainUnbind: async (context) => {
      // Runs after domain unbinding
      console.log(`Unbound ${context.domain} from ${context.slot} slot`);
    },
  },
} as DeploygateConfig;
```

## Lifecycle Hooks

Deploygate provides a comprehensive hook system for integrating with your hosting platform. All hooks are optional — omit any you don't need.

### Hook lifecycle table

| Hook | Stage | Cancellable | Receives |
|------|-------|-------------|----------|
| `onBeforeDeploy` | Before deployment creation | ✓ Yes (throw) | `DeploymentContext` |
| `onDeployStart` | After deployment created | ✗ No | `Deployment` |
| `onDeploySuccess` | After deployment ready | ✗ No | `Deployment` |
| `onDeployFailed` | On deployment error | ✗ No | `DeploymentContext`, `Error` |
| `onDeployPaused` | After pause | ✗ No | `Deployment` |
| `onBeforeSlotStart` | Before slot starts | ✓ Yes (throw) | `SlotContext` |
| `onSlotStart` | After slot started | ✗ No | `SlotContext` |
| `onSlotStop` | After slot stopped | ✗ No | `SlotContext` |
| `onSlotCrashed` | On slot start failure | ✗ No | `SlotContext`, `Error` |
| `onBeforePromote` | Before promotion | ✓ Yes (throw) | `PromotionContext` |
| `onPromoteSuccess` | After promotion | ✗ No | `Deployment` |
| `onPromoteFailed` | On promotion error | ✗ No | `PromotionContext`, `Error` |
| `onRollbackStart` | Before rollback | ✗ No | `Deployment` |
| `onRollbackSuccess` | After rollback | ✗ No | `Deployment` |
| `onRollbackFailed` | On rollback error | ✗ No | `Deployment`, `Error` |
| `onBeforeDomainBind` | Before domain bind | ✓ Yes (throw) | `DomainContext` |
| `onDomainBindSuccess` | After domain bind | ✗ No | `DomainContext` |
| `onDomainBindFailed` | On domain bind error | ✗ No | `DomainContext`, `Error` |
| `onDomainUnbind` | After domain unbind | ✗ No | `DomainContext` |

### Cancellable hooks

**Before hooks** (`onBeforeDeploy`, `onBeforeSlotStart`, `onBeforePromote`, `onBeforeDomainBind`) can cancel operations by throwing an error:

```typescript
const config: DeploygateConfig = {
  hooks: {
    onBeforeDeploy: async (context) => {
      // Validate build ID before creating deployment
      if (!context.buildId.startsWith('build-')) {
        throw new Error('Invalid build ID format');
      }
      // If we throw, createDeployment() will reject with this error
      // and the deployment will not be created
    },
  },
};

try {
  const deployment = await createDeployment('invalid-build', config);
} catch (error) {
  console.error(error.message); // "Invalid build ID format"
}
```

### Context types

Hooks receive rich context objects without exposing internal state:

```typescript
// DeploymentContext
interface DeploymentContext {
  buildId: string;
  config?: DeploygateConfig;
}

// SlotContext
interface SlotContext {
  deployment: Deployment;
  slot: Slot;
  port?: number;
}

// PromotionContext
interface PromotionContext {
  deployment: Deployment;
}

// DomainContext
interface DomainContext {
  deployment: Deployment;
  slot: Slot;
  domain: string;
}
```

### Complete example

```typescript
import { createDeployment, startSlot, promote, rollback, bindDomain } from 'deploygate';
import type { DeploygateConfig } from 'deploygate';

const config: DeploygateConfig = {
  adapter: 'file',
  dataDir: './deployments',
  hooks: {
    onBeforeDeploy: async (context) => {
      console.log(`[deployment] Creating for build ${context.buildId}`);
      // Validate, prepare infrastructure, etc.
    },
    onDeploySuccess: async (deployment) => {
      console.log(`[deployment] Ready: ${deployment.id}`);
      // Notify team, log metrics, etc.
    },
    onBeforeSlotStart: async (context) => {
      console.log(`[slot] Starting ${context.slot} on :${context.port}`);
      // Allocate resources, setup networking, etc.
    },
    onSlotStart: async (context) => {
      console.log(`[slot] ${context.slot} is running`);
      // Run smoke tests, warmup, etc.
    },
    onBeforePromote: async (context) => {
      console.log(`[promotion] Promoting ${context.deployment.id}`);
      // Final pre-promotion validation
    },
    onPromoteSuccess: async (deployment) => {
      console.log(`[promotion] Complete: now on production`);
      // Send notifications, update dashboard, etc.
    },
  },
};

// Create deployment
const deployment = await createDeployment('build-abc123', config);

// Start preview
await startSlot(deployment.id, 'preview', 3000, config);

// After testing in preview...
await promote(deployment.id, config);

// If needed, rollback
await rollback(deployment.id, config);
```

### Custom events (advanced)

For platform-specific events beyond the standard lifecycle, use custom events:

```typescript
import { createEmitter } from 'deploygate';
import type { EventMap } from 'deploygate';

// Declare your custom event map
interface MyPlatformEvents extends EventMap {
  'ssl:provisioned': (domain: string) => Promise<void>;
  'analytics:tracked': (deploymentId: string, event: string) => Promise<void>;
}

// Create a typed emitter
const emitter = createEmitter<MyPlatformEvents>();

// Register handlers
emitter.on('ssl:provisioned', async (domain) => {
  console.log(`SSL certificate provisioned for ${domain}`);
});

emitter.on('analytics:tracked', async (deploymentId, event) => {
  console.log(`Event: ${event} for deployment ${deploymentId}`);
});

// Emit events
await emitter.emit('ssl:provisioned', 'example.com');
await emitter.emit('analytics:tracked', deployment.id, 'promoted');

// Remove handlers
emitter.off('ssl:provisioned', handler);
emitter.offAll('analytics:tracked');
```



## Implementing a Custom Store Adapter

The built-in `FileStore` and `MemoryStore` adapters are provided for convenience during development and testing, but they are **not recommended for production use**.

### Why implement a custom adapter?

A production deployment system should persist state in a reliable, scalable database:
- **Multi-instance deployments** require shared state accessible across multiple processes/servers
- **High availability** requires replication and automated failover
- **Data integrity** requires ACID guarantees and backup/recovery capabilities
- **Scalability** requires efficient querying and indexing of large deployment datasets
- **Observability** requires audit logs and transaction history

By implementing the `StateStore` interface, you can integrate any database backend without modifying deploygate.

### Minimal example: PostgreSQL adapter

Here's a complete, working example of a minimal custom adapter using PostgreSQL:

```typescript
// my-postgres-store.ts
import type { Deployment } from 'deploygate';
import type { StateStore } from 'deploygate';
import { Pool } from 'pg';

export class PostgresStore implements StateStore {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async get(id: string): Promise<Deployment | null> {
    const result = await this.pool.query(
      'SELECT deployment FROM deployments WHERE id = $1',
      [id]
    );
    return result.rows[0]?.deployment || null;
  }

  async set(id: string, deployment: Deployment): Promise<void> {
    await this.pool.query(
      'INSERT INTO deployments (id, deployment) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET deployment = $2',
      [id, JSON.stringify(deployment)]
    );
  }

  async list(): Promise<Deployment[]> {
    const result = await this.pool.query('SELECT deployment FROM deployments');
    return result.rows.map(row => row.deployment);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM deployments WHERE id = $1', [id]);
  }
}
```

### Using your custom adapter

Pass your store instance to the config:

```typescript
import { createDeployment } from 'deploygate';
import { PostgresStore } from './my-postgres-store';

const store = new PostgresStore(process.env.DATABASE_URL!);

// Create a deployment with the custom store
const deployment = await createDeployment('build-123', { store });
```

Or configure it globally:

```typescript
// deploygate.config.ts
import type { DeploygateConfig } from 'deploygate';
import { PostgresStore } from './my-postgres-store';

export default {
  store: new PostgresStore(process.env.DATABASE_URL!),
  hooks: {
    // ...
  },
} as DeploygateConfig;
```

### Built-in adapters

Deploygate includes two adapters for development and testing:

- **MemoryStore**: Stores deployments in a JavaScript Map. State is lost when the process exits. (Default)
- **FileStore**: Persists deployments to a JSON file. Single-process only, not safe for concurrent access.

Both are provided for convenience but should not be used in production environments.

## State Store Adapters

### Memory Store (default)

Best for testing and development. All state is lost when the process exits.

```typescript
import { MemoryStore } from 'deploygate';

const store = new MemoryStore();
```

### File Store

Persists deployments to JSON on disk.

```typescript
import { FileStore } from 'deploygate';

const store = new FileStore('./data/deployments');
```

## Implementing a Custom Adapter

Implement the `StateStore` interface to create a custom adapter (e.g., database-backed):

```typescript
import type { StateStore, Deployment } from 'deploygate';

class DatabaseStore implements StateStore {
  async get(id: string): Promise<Deployment | null> {
    // Query database
    return await db.getDeployment(id);
  }

  async set(id: string, deployment: Deployment): Promise<void> {
    // Upsert to database
    await db.saveDeployment(id, deployment);
  }

  async list(): Promise<Deployment[]> {
    // Query all deployments
    return await db.listDeployments();
  }

  async delete(id: string): Promise<void> {
    // Delete from database
    await db.deleteDeployment(id);
  }
}

// Use it
const store = new DatabaseStore();
```

## Core Types

```typescript
type Slot = 'preview' | 'production';

type DeploymentStatus =
  | 'building'
  | 'running'
  | 'promoting'
  | 'promoted'
  | 'failed'
  | 'stopped';

type ProcessStatus = 'starting' | 'running' | 'stopped' | 'crashed';

interface Deployment {
  id: string;
  buildId: string;
  createdAt: Date;
  status: DeploymentStatus;
  slots: Record<Slot, SlotState>;
}

interface SlotState {
  status: ProcessStatus;
  domain?: string;
  port?: number;
  pid?: number;
  startedAt?: Date;
  stoppedAt?: Date;
}
```

## API Reference

### Functions

- `createDeployment(buildId: string): Promise<Deployment>`
- `getDeployment(id: string): Promise<Deployment | null>`
- `listDeployments(): Promise<Deployment[]>`
- `startSlot(deploymentId: string, slot: Slot): Promise<void>`
- `stopSlot(deploymentId: string, slot: Slot): Promise<void>`
- `promote(deploymentId: string): Promise<Deployment>`
- `rollback(deploymentId: string): Promise<Deployment>`
- `bindDomain(deploymentId: string, slot: Slot, domain: string): Promise<void>`
- `unbindDomain(deploymentId: string, slot: Slot): Promise<void>`
- `getDomain(deploymentId: string, slot: Slot): Promise<string | undefined>`

### Classes

- `DeploymentManager` — Create, retrieve, and manage deployments
- `ProcessManager` — Start, stop, and monitor slot processes
- `PromoteEngine` — Promote preview to production, rollback
- `DomainManager` — Bind and manage custom domains per slot
- `MemoryStore` — In-memory state adapter
- `FileStore` — File-based JSON state adapter

## Scripts

```bash
# Build
npm run build

# Build in watch mode
npm run dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint

# Format
npm run format
```

## License

MIT
