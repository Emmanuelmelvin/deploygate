# Hook lifecycle reference

| Hook                  | Stage      | Cancellable | Arguments         |
|-----------------------|------------|-------------|-------------------|
| onBeforeDeploy        | deploy     | yes         | ctx               |
| onDeployStart         | deploy     | no          | ctx               |
| onDeploySuccess       | deploy     | no          | ctx               |
| onDeployFailed        | deploy     | no          | ctx, error        |
| onDeployPaused        | deploy     | no          | ctx               |
| onBeforeSlotStart     | slot       | yes         | ctx               |
| onSlotStart           | slot       | no          | ctx               |
| onSlotStop            | slot       | no          | ctx               |
| onSlotCrashed         | slot       | no          | ctx, error        |
| onBeforePromote       | promote    | yes         | ctx               |
| onPromoteSuccess      | promote    | no          | ctx               |
| onPromoteFailed       | promote    | no          | ctx, error        |
| onRollbackStart       | promote    | no          | ctx               |
| onRollbackSuccess     | promote    | no          | ctx               |
| onRollbackFailed      | promote    | no          | ctx, error        |
| onBeforeDomainBind    | domain     | yes         | ctx               |
| onDomainBindSuccess   | domain     | no          | ctx               |
| onDomainBindFailed    | domain     | no          | ctx, error        |
| onDomainUnbind        | domain     | no          | ctx               |

---

## Hook details

### onBeforeDeploy
- Fires before a deployment is created
- Arguments: `{ buildId, distPath, ... }`
- Throwing cancels the operation
- Example:
```ts
onBeforeDeploy: async (ctx) => {
  if (!ctx.buildId) throw new Error('Missing buildId')
}
```

### onDeployStart
- Fires when deployment starts
- Arguments: `ctx`
- Not cancellable

### onDeploySuccess
- Fires when deployment succeeds
- Arguments: `ctx`
- Not cancellable

### onDeployFailed
- Fires when deployment fails
- Arguments: `ctx, error`
- Not cancellable

### onDeployPaused
- Fires when deployment is paused
- Arguments: `ctx`
- Not cancellable

### onBeforeSlotStart
- Fires before a slot starts
- Arguments: `ctx`
- Throwing cancels the operation
- Example:
```ts
onBeforeSlotStart: async (ctx) => {
  if (ctx.slot === 'production' && !ctx.approved) throw new Error('Not approved')
}
```

### onSlotStart
- Fires when slot starts
- Arguments: `ctx`
- Not cancellable

### onSlotStop
- Fires when slot stops
- Arguments: `ctx`
- Not cancellable

### onSlotCrashed
- Fires when slot crashes
- Arguments: `ctx, error`
- Not cancellable

### onBeforePromote
- Fires before promotion
- Arguments: `ctx`
- Throwing cancels the operation
- Example:
```ts
onBeforePromote: async (ctx) => {
  if (!ctx.canPromote) throw new Error('Promotion not allowed')
}
```

### onPromoteSuccess
- Fires when promotion succeeds
- Arguments: `ctx`
- Not cancellable

### onPromoteFailed
- Fires when promotion fails
- Arguments: `ctx, error`
- Not cancellable

### onRollbackStart
- Fires when rollback starts
- Arguments: `ctx`
- Not cancellable

### onRollbackSuccess
- Fires when rollback succeeds
- Arguments: `ctx`
- Not cancellable

### onRollbackFailed
- Fires when rollback fails
- Arguments: `ctx, error`
- Not cancellable

### onBeforeDomainBind
- Fires before domain is bound
- Arguments: `ctx`
- Throwing cancels the operation
- Example:
```ts
onBeforeDomainBind: async (ctx) => {
  if (!ctx.domain.endsWith('.com')) throw new Error('Only .com domains allowed')
}
```

### onDomainBindSuccess
- Fires when domain is bound
- Arguments: `ctx`
- Not cancellable

### onDomainBindFailed
- Fires when domain binding fails
- Arguments: `ctx, error`
- Not cancellable

### onDomainUnbind
- Fires when domain is unbound
- Arguments: `ctx`
- Not cancellable
