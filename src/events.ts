import type { EventMap } from './types';

export class DeploygateEmitter<TEvents extends EventMap = {}> {
  private handlers: Map<string, Function[]>;

  constructor() {
    this.handlers = new Map();
  }

  on<K extends keyof TEvents>(event: K, handler: TEvents[K]): void {
    const eventName = String(event);
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler as Function);
  }

  async emit<K extends keyof TEvents>(
    event: K,
    ...args: Parameters<TEvents[K]>
  ): Promise<void> {
    const eventName = String(event);
    const handlers = this.handlers.get(eventName) || [];

    for (const handler of handlers) {
      await (handler as Function)(...args);
    }
  }

  off<K extends keyof TEvents>(event: K, handler: TEvents[K]): void {
    const eventName = String(event);
    const handlers = this.handlers.get(eventName);
    if (!handlers) return;

    const index = handlers.indexOf(handler as Function);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  offAll(event: keyof TEvents): void {
    const eventName = String(event);
    this.handlers.delete(eventName);
  }
}

export function createEmitter<TEvents extends EventMap = {}>(): DeploygateEmitter<TEvents> {
  return new DeploygateEmitter<TEvents>();
}
