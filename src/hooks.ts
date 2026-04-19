import type { DeploygateHooks } from './types';

export async function runHook<T extends keyof DeploygateHooks>(
  hooks: DeploygateHooks | undefined,
  hookName: T,
  ...args: Parameters<NonNullable<DeploygateHooks[T]>>
): Promise<void> {
  if (!hooks) return;

  const hook = hooks[hookName];
  if (!hook) return;

  await (hook as Function)(...args);
}
