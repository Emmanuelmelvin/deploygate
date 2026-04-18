# Example: Setting Up a Hosting Platform with deploygate

This guide shows how to build a simple hosting platform that uses deploygate for managing deployments.

## Step 1: Create Your Platform App

```bash
mkdir my-hosting-platform
cd my-hosting-platform
npm init -y
npm install express deploygate axios dotenv
npm install -D typescript ts-node @types/express @types/node
```

## Step 2: Create TypeScript Config

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

## Step 3: Create deploygate Config

**deploygate.config.ts:**
```typescript
import type { DeploygateConfig } from 'deploygate';

export default {
  // Use file storage to persist deployments
  adapter: 'file',
  dataDir: './data/deployments',

  hooks: {
    onCreated: async (deployment) => {
      console.log(`✅ Created deployment ${deployment.id} for build ${deployment.buildId}`);
      // Could send webhook, email notification, etc.
    },

    onPromoted: async (deployment) => {
      console.log(`🚀 Promoted ${deployment.id} to production!`);
      // Trigger DNS update, cache clear, analytics
      // Example: await notificationService.sendSlackMessage(...)
    },

    onRollback: async (deployment) => {
      console.log(`⏮️  Rolled back ${deployment.id}`);
      // Trigger rollback notifications, alerts
    },

    onDomainBound: async (deployment, slot, domain) => {
      console.log(`🌐 Bound ${domain} to ${slot} slot of ${deployment.id}`);
      // Could trigger DNS provisioning, cert generation
    },
  },
} as DeploygateConfig;
```

## Step 4: Create the Platform Server

**src/server.ts:**
```typescript
import express, { Request, Response } from 'express';
import {
  createDeployment,
  getDeployment,
  listDeployments,
  startSlot,
  stopSlot,
  promote,
  rollback,
  bindDomain,
  unbindDomain,
  getDomain,
  DeploygateError,
  logger,
} from 'deploygate';

const app = express();
app.use(express.json());

// Error handler middleware
const asyncHandler = (fn: Function) => (req: Request, res: Response) =>
  Promise.resolve(fn(req, res)).catch((err) => {
    logger.error(`API Error: ${err.message}`);
    if (err instanceof DeploygateError) {
      return res.status(err.statusCode || 500).json({
        error: err.code,
        message: err.message,
        details: err.details,
      });
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  });

// ============= DEPLOYMENT ENDPOINTS =============

// POST /api/deployments - Create a new deployment
app.post(
  '/api/deployments',
  asyncHandler(async (req: Request, res: Response) => {
    const { buildId } = req.body;

    if (!buildId) {
      return res.status(400).json({ error: 'buildId required' });
    }

    const deployment = await createDeployment(buildId);
    logger.info(`Created deployment ${deployment.id}`);
    res.status(201).json(deployment);
  })
);

// GET /api/deployments - List all deployments
app.get(
  '/api/deployments',
  asyncHandler(async (req: Request, res: Response) => {
    const deployments = await listDeployments();
    res.json(deployments);
  })
);

// GET /api/deployments/:id - Get deployment details
app.get(
  '/api/deployments/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const deployment = await getDeployment(req.params.id);
    if (!deployment) {
      return res.status(404).json({ error: 'DEPLOYMENT_NOT_FOUND' });
    }
    res.json(deployment);
  })
);

// ============= PROCESS MANAGEMENT =============

// POST /api/deployments/:id/slots/:slot/start - Start a slot
app.post(
  '/api/deployments/:id/slots/:slot/start',
  asyncHandler(async (req: Request, res: Response) => {
    const { id, slot } = req.params;

    if (slot !== 'preview' && slot !== 'production') {
      return res.status(400).json({ error: 'Invalid slot' });
    }

    await startSlot(id, slot as 'preview' | 'production');
    const deployment = await getDeployment(id);
    logger.info(`Started ${slot} slot for deployment ${id}`);
    res.json(deployment);
  })
);

// POST /api/deployments/:id/slots/:slot/stop - Stop a slot
app.post(
  '/api/deployments/:id/slots/:slot/stop',
  asyncHandler(async (req: Request, res: Response) => {
    const { id, slot } = req.params;

    if (slot !== 'preview' && slot !== 'production') {
      return res.status(400).json({ error: 'Invalid slot' });
    }

    await stopSlot(id, slot as 'preview' | 'production');
    const deployment = await getDeployment(id);
    logger.info(`Stopped ${slot} slot for deployment ${id}`);
    res.json(deployment);
  })
);

// ============= PROMOTION & ROLLBACK =============

// POST /api/deployments/:id/promote - Promote preview to production
app.post(
  '/api/deployments/:id/promote',
  asyncHandler(async (req: Request, res: Response) => {
    const deployment = await promote(req.params.id);
    logger.info(`Promoted deployment ${req.params.id} to production`);
    res.json(deployment);
  })
);

// POST /api/deployments/:id/rollback - Rollback production
app.post(
  '/api/deployments/:id/rollback',
  asyncHandler(async (req: Request, res: Response) => {
    const deployment = await rollback(req.params.id);
    logger.info(`Rolled back deployment ${req.params.id}`);
    res.json(deployment);
  })
);

// ============= DOMAIN MANAGEMENT =============

// POST /api/deployments/:id/slots/:slot/domain - Bind domain
app.post(
  '/api/deployments/:id/slots/:slot/domain',
  asyncHandler(async (req: Request, res: Response) => {
    const { id, slot } = req.params;
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'domain required' });
    }

    if (slot !== 'preview' && slot !== 'production') {
      return res.status(400).json({ error: 'Invalid slot' });
    }

    await bindDomain(id, slot as 'preview' | 'production', domain);
    const deployment = await getDeployment(id);
    logger.info(`Bound domain ${domain} to ${slot} of deployment ${id}`);
    res.json(deployment);
  })
);

// DELETE /api/deployments/:id/slots/:slot/domain - Unbind domain
app.delete(
  '/api/deployments/:id/slots/:slot/domain',
  asyncHandler(async (req: Request, res: Response) => {
    const { id, slot } = req.params;

    if (slot !== 'preview' && slot !== 'production') {
      return res.status(400).json({ error: 'Invalid slot' });
    }

    await unbindDomain(id, slot as 'preview' | 'production');
    const deployment = await getDeployment(id);
    logger.info(`Unbound domain from ${slot} of deployment ${id}`);
    res.json(deployment);
  })
);

// GET /api/deployments/:id/slots/:slot/domain - Get domain
app.get(
  '/api/deployments/:id/slots/:slot/domain',
  asyncHandler(async (req: Request, res: Response) => {
    const { id, slot } = req.params;

    if (slot !== 'preview' && slot !== 'production') {
      return res.status(400).json({ error: 'Invalid slot' });
    }

    const domain = await getDomain(id, slot as 'preview' | 'production');
    res.json({ deploymentId: id, slot, domain: domain || null });
  })
);

// ============= HEALTH CHECK =============

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 Hosting platform server running on port ${PORT}`);
});
```

## Step 5: Update package.json with scripts

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/server.ts",
    "start": "node dist/server.js"
  }
}
```

## Step 6: Test the Platform

### Using the API

```bash
# Create a deployment
curl -X POST http://localhost:3000/api/deployments \
  -H "Content-Type: application/json" \
  -d '{"buildId":"build-001"}'

# Response: { "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479", ... }

# List deployments
curl http://localhost:3000/api/deployments

# Start preview
curl -X POST http://localhost:3000/api/deployments/f47ac10b-58cc-4372-a567-0e02b2c3d479/slots/preview/start

# Bind domain to preview
curl -X POST http://localhost:3000/api/deployments/f47ac10b-58cc-4372-a567-0e02b2c3d479/slots/preview/domain \
  -H "Content-Type: application/json" \
  -d '{"domain":"preview.example.com"}'

# Promote to production
curl -X POST http://localhost:3000/api/deployments/f47ac10b-58cc-4372-a567-0e02b2c3d479/promote

# Rollback
curl -X POST http://localhost:3000/api/deployments/f47ac10b-58cc-4372-a567-0e02b2c3d479/rollback
```

## How deploygate Fits Into Your Platform

```
┌─────────────────────────────────────────────────────┐
│         Your Hosting Platform API                    │
└────────────┬────────────────────────────────────────┘
             │
             └──→ ┌──────────────────────────────┐
                 │  deploygate Library           │
                 │  ├─ DeploymentManager         │
                 │  ├─ ProcessManager            │
                 │  ├─ PromoteEngine             │
                 │  ├─ DomainManager             │
                 │  └─ StateStore (File/Memory)  │
                 └──────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐  ┌───────▼───────┐  ┌──▼────────┐
    │ Preview │  │  Production   │  │ Data Store│
    │ Process │  │  Process      │  │ (JSON)    │
    │ :3000   │  │  :3001        │  │           │
    └─────────┘  └───────────────┘  └───────────┘
```

## Advanced: Custom State Store

If you want to store deployments in a database (MongoDB, PostgreSQL, etc.), implement the `StateStore` interface:

```typescript
import { type StateStore, type Deployment } from 'deploygate';

export class MongoDBStore implements StateStore {
  async get(key: string): Promise<Deployment | null> {
    return await db.collection('deployments').findOne({ id: key });
  }

  async set(key: string, value: Deployment): Promise<void> {
    await db.collection('deployments').updateOne(
      { id: key },
      { $set: value },
      { upsert: true }
    );
  }

  async list(): Promise<Deployment[]> {
    return await db.collection('deployments').find({}).toArray();
  }

  async delete(key: string): Promise<void> {
    await db.collection('deployments').deleteOne({ id: key });
  }
}

// Then use it:
import { DeploymentManager } from 'deploygate';

const store = new MongoDBStore();
const deploymentManager = new DeploymentManager(store);
```

## Next Steps

1. Add authentication/authorization to your API
2. Implement actual process management (spawn child processes, Docker containers, etc.)
3. Add DNS/domain provisioning via your DNS provider
4. Setup webhook notifications for deployment events
5. Create a dashboard frontend to visualize deployments
6. Add build artifact storage and serving
