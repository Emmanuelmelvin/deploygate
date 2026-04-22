# deploygate Example: Minimal Hosting Platform

This example demonstrates how a hosting platform would integrate the deploygate library and CLI. It's a minimal platform that manages preview and production deployment slots for a React app, using deploygate to orchestrate the deployment lifecycle.

The platform script (`platform/index.ts`) is the consumer of deploygate. It receives a built React app, manages slots, serves static files, and coordinates with deploygate to track state. The React app itself knows nothing about deploygate — it's just a regular Vite + React build that gets deployed.

## Prerequisites

- Node.js >= 18
- deploygate installed locally

## Installation

```bash
npm install
```

## End-to-End Usage

### Step 1: Build the React app

```bash
npm run build:app
```

This installs dependencies and builds the React app to `react-app/dist/`.

### Step 2: Deploy to preview

```bash
npm run platform deploy react-app/dist
```

Expected output:

```
[1/4] Validating build output...
[2/4] Creating deployment...
[ok] Deployment <id> created for build build-<timestamp>
  Preview slot: running (port 3000)
[3/4] Starting preview slot...
[ok] Server running on http://localhost:3000
[4/4] Preview server running

  Deployment ID : <id>
  Preview URL   : http://localhost:3000
  Promote with  : platform promote <id>
```

**Open http://localhost:3000** and verify the app loads with the current time updating every second.

### Step 3: Promote to production

```bash
npm run platform promote <deploymentId>
```

Expected output:

```
[1/3] Promoting preview to production...
[ok] Preview promoted to production for deployment <id>
  Production slot: running
  Production port: 3001
[2/3] Starting production slot...
[ok] Server running on http://localhost:3001
[3/3] Production server running

  Deployment ID    : <id>
  Production URL   : http://localhost:3001
  Rollback with    : platform rollback <id>
```

**Open http://localhost:3001** and verify the same app loads.

### Step 4: Check status

```bash
npm run platform status <deploymentId>
```

Prints the full deployment state as JSON.

### Step 5: List deployments

```bash
npm run platform list
```

Prints a table of all deployments.

### Step 6: Bind a domain

```bash
npm run platform domain <deploymentId> production yourdomain.com
```

### Step 7: Rollback

```bash
npm run platform rollback <deploymentId>
```

Expected output:

```
[ok] Deployment <id> rolled back
  Preview slot: running
  Production slot: stopped
[ok] Production rolled back
  Preview still available at http://localhost:3000
```

## What the hooks are doing

The `platform/hooks.ts` file exports a DeploygateHooks object that deploygate calls at key lifecycle events:

- **onCreated**: Fired when a new deployment is created. In a real platform, this is where you'd notify your CI/CD system or log metrics.
- **onPromoted**: Fired when preview is promoted to production. This is where you'd update your reverse proxy, CDN cache, or notify downstream services.
- **onRollback**: Fired when production is rolled back. This is where you'd revert infrastructure changes or trigger incident response.
- **onDomainBound**: Fired when a domain is bound to a slot. This is where you'd provision DNS records, generate SSL certificates, or update your ingress controller.

In this example, the hooks just log colored output. In a real platform, they would make API calls to your infrastructure.

## Using the deploygate CLI directly

The platform script wraps deploygate's CLI. You can also call deploygate directly:

```bash
# Create a deployment
npx deploygate create build-my-app

# Start the preview slot
npx deploygate start <deploymentId> preview --port 3000

# Promote to production
npx deploygate promote <deploymentId>

# Start the production slot
npx deploygate start <deploymentId> production --port 3001

# Bind a domain
npx deploygate domain bind <deploymentId> production example.com

# Check status
npx deploygate get <deploymentId>

# List all
npx deploygate list

# Rollback
npx deploygate rollback <deploymentId>
```

## State Persistence

This example uses the file adapter (`adapter: 'file'`) so deployment state persists in `.deploygate-data/` between terminal sessions. To reset, delete the `.deploygate-data` folder:

```bash
rm -rf .deploygate-data
```

## Project Structure

```
deploygate-example/
├── platform/
│   ├── index.ts          # Main CLI — the platform script
│   ├── server.ts         # SPA-aware static file server
│   ├── hooks.ts          # Deploygate lifecycle hooks
│   └── logger.ts         # Colored console logger
├── react-app/            # Minimal React + Vite app
│   ├── src/
│   │   ├── App.tsx       # Component showing current time
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── package.json
├── tsconfig.json
└── README.md
```

## Notes

- The static file server uses Node.js built-in `http` module only — no express, no serve.
- The logger uses ANSI color codes only — no external dependencies.
- Each platform module is under 120 lines.
- All code is TypeScript with strict mode enabled.
- The React app is completely independent of deploygate — it's just a regular Vite build.
