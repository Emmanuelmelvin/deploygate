# Platform integration example

This walkthrough demonstrates the `deploygate-example` project, showing how to integrate deploygate into a real platform backend.

## Folder structure

```
examples/deploygate-example/
  package.json
  README.md
  tsconfig.json
  platform/
    hooks.ts
    index.ts
    logger.ts
    server.ts
  react-app/
    index.html
    package.json
    tsconfig.json
    vite.config.ts
    src/
      App.css
      App.tsx
      index.css
      main.tsx
```

## CLI to library mapping

- `platform deploy ./react-app/dist` → `createDeployment()`
- `platform promote <deploymentId>` → `promote()`
- `platform rollback <deploymentId>` → `rollback()`
- `platform domain bind <deploymentId> production yourdomain.com` → `bindDomain()`

## hooks.ts

This file implements all deploygate hooks. In a real platform, each hook would provision infra, update DNS, or notify users.

```ts
export const hooks = {
  onBeforeDeploy: async (ctx) => {
    // Validate build, check quota, etc.
  },
  onDeploySuccess: async (ctx) => {
    // Notify, update dashboard, etc.
  },
  onPromoteSuccess: async (ctx) => {
    // Switch traffic, update infra
  },
  onDomainBindSuccess: async (ctx) => {
    // Provision SSL, update DNS
  },
};
```

## Separation of concerns

- `index.ts` — CLI only, zero infrastructure
- `hooks.ts` — infrastructure only, zero CLI
- `server.ts` — static file serving, no deploygate knowledge

## End-to-end walkthrough

1. Build the React app
2. `platform deploy ./react-app/dist`
3. Open `http://localhost:3000`
4. `platform promote <deploymentId>`
5. Open `http://localhost:3001`
6. `platform rollback <deploymentId>`

## Using deploygate CLI directly

You can also use the deploygate CLI without the platform wrapper:

```sh
deploygate create <buildId>
deploygate start <deploymentId> preview
deploygate promote <deploymentId>
deploygate rollback <deploymentId>
deploygate domain bind <deploymentId> production yourdomain.com
deploygate list
deploygate status <deploymentId>
```
