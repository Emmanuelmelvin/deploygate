# Domains API

## bindDomain(deploymentId, slot, domain, config?)

Bind a domain to a slot.

| Parameter     | Type                | Required | Description           |
|---------------|---------------------|----------|-----------------------|
| deploymentId  | string              | yes      | Deployment id         |
| slot          | `'preview' \| 'production'` | yes | Slot                  |
| domain        | string              | yes      | Domain to bind        |
| config        | DeploygateConfig    | no       | Config                |

**Returns:** `Promise&lt;void&gt;`

**Domain format validation:**
- Must match: `/^(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.[A-Za-z]{2,}$/`

> deploygate stores the domain string. Your platform is responsible for provisioning DNS, SSL certificates, and reverse proxy configuration.

```ts
await bindDomain('dep-abc', 'production', 'example.com', config)
```

---

## unbindDomain(deploymentId, slot, config?)

Unbind a domain from a slot.

| Parameter     | Type                | Required | Description           |
|---------------|---------------------|----------|-----------------------|
| deploymentId  | string              | yes      | Deployment id         |
| slot          | `'preview' \| 'production'` | yes | Slot                  |
| config        | DeploygateConfig    | no       | Config                |

**Returns:** `Promise&lt;void&gt;`

```ts
await unbindDomain('dep-abc', 'preview', config)
```

---

## getDomain(deploymentId, slot, config?)

Get the domain bound to a slot.

| Parameter     | Type                | Required | Description           |
|---------------|---------------------|----------|-----------------------|
| deploymentId  | string              | yes      | Deployment id         |
| slot          | `'preview' \| 'production'` | yes | Slot                  |
| config        | DeploygateConfig    | no       | Config                |

**Returns:** `Promise&lt;string | null&gt;`

```ts
const domain = await getDomain('dep-abc', 'production', config)
```
