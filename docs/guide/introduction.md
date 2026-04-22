# Introduction

deploygate is a deployment lifecycle manager for hosting platforms. It provides a robust, pluggable state machine and hook system that lets platforms implement preview → production workflows in minutes. You drop it into your backend, implement the hooks, and deploygate tracks state and calls your code at every lifecycle stage.

The core model is two slots per deployment: preview and production. You create a deployment, start the preview slot, and when ready, promote it atomically to production. All infrastructure work is handled by your platform via hooks — deploygate just manages state and orchestrates the flow.

```
build → preview slot (auto-updated)
            ↓ (you approve)
       production slot (promoted atomically)
```

deploygate intentionally does not provision servers, manage DNS, or handle authentication. This separation of concerns lets you keep full control over your infrastructure, while deploygate ensures state is tracked and hooks are fired at the right moments.

**Who is deploygate for?**

- Hosting platforms
- PaaS builders
- Internal deployment tooling teams
