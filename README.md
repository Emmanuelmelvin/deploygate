# deploygate

A TypeScript library and CLI tool for hosting platforms to manage preview/production deployment slots with atomic promotion. deploygate enables hosting platforms to safely manage multiple deployment environments, promote changes from preview to production, and rollback if needed—all with a clean typed API and command-line interface.

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
    onCreated: async (deployment) => {
      console.log(`Created deployment ${deployment.id}`);
    },
    onPromoted: async (deployment) => {
      console.log(`Promoted ${deployment.id} to production`);
      // Trigger notifications, analytics, etc.
    },
    onRollback: async (deployment) => {
      console.log(`Rolled back deployment ${deployment.id}`);
    },
    onDomainBound: async (deployment, slot, domain) => {
      console.log(`Bound ${domain} to ${slot} slot`);
    },
  },
} as DeploygateConfig;
```

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
