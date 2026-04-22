# Domains API

## bindDomain(deploymentId, slot, domain)

Bind a domain to a slot.

| Parameter    | Type                        | Required | Description    |
| ------------ | --------------------------- | -------- | -------------- |
| deploymentId | string                      | yes      | Deployment id  |
| slot         | `'preview' \| 'production'` | yes      | Slot           |
| domain       | string                      | yes      | Domain to bind |

**Returns:** `Promise<void>`

**Domain format validation:**

- Must match: `/^(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.[A-Za-z]{2,}$/`

> deploygate stores the domain string. Your platform is responsible for provisioning DNS, SSL certificates, and reverse proxy configuration.

```ts
await bindDomain('dep-abc', 'production', 'example.com');
```

---

## unbindDomain(deploymentId, slot)

Unbind a domain from a slot.

| Parameter    | Type                        | Required | Description   |
| ------------ | --------------------------- | -------- | ------------- |
| deploymentId | string                      | yes      | Deployment id |
| slot         | `'preview' \| 'production'` | yes      | Slot          |

**Returns:** `Promise<void>`

```ts
await unbindDomain('dep-abc', 'preview');
```

---

## getDomain(deploymentId, slot)

Get the domain bound to a slot.

| Parameter    | Type                        | Required | Description   |
| ------------ | --------------------------- | -------- | ------------- |
| deploymentId | string                      | yes      | Deployment id |
| slot         | `'preview' \| 'production'` | yes      | Slot          |

**Returns:** `Promise<string | null>`

```ts
const domain = await getDomain('dep-abc', 'production');
```
