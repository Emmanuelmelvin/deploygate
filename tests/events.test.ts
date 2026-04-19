import { describe, it, expect } from 'vitest';
import { createEmitter, DeploygateEmitter } from '../src/events';
import type { EventMap } from '../src/types';

describe('DeploygateEmitter', () => {
  it('on() registers a handler', () => {
    const emitter = createEmitter<{ test: () => Promise<void> }>();
    let called = false;

    emitter.on('test', async () => {
      called = true;
    });

    expect(called).toBe(false);
  });

  it('emit() calls all registered handlers in order', async () => {
    interface MyEvents extends EventMap {
      event1: (value: number) => Promise<void>;
    }

    const emitter = createEmitter<MyEvents>();
    const order: number[] = [];

    emitter.on('event1', async (value) => {
      order.push(1);
    });

    emitter.on('event1', async (value) => {
      order.push(2);
    });

    emitter.on('event1', async (value) => {
      order.push(3);
    });

    await emitter.emit('event1', 42);
    expect(order).toEqual([1, 2, 3]);
  });

  it('emit() with typed EventMap only accepts declared event names', async () => {
    interface MyEvents extends EventMap {
      validEvent: () => Promise<void>;
    }

    const emitter = createEmitter<MyEvents>();
    emitter.on('validEvent', async () => {});

    // emit() should only accept 'validEvent', not arbitrary strings
    // This is a TypeScript compile-time check, so we just verify it works
    await emitter.emit('validEvent');
  });

  it('off() removes a specific handler', async () => {
    const emitter = createEmitter<{ test: () => Promise<void> }>();
    const calls: number[] = [];

    const handler1 = async () => calls.push(1);
    const handler2 = async () => calls.push(2);

    emitter.on('test', handler1);
    emitter.on('test', handler2);

    await emitter.emit('test');
    expect(calls).toEqual([1, 2]);

    calls.length = 0;
    emitter.off('test', handler1);

    await emitter.emit('test');
    expect(calls).toEqual([2]);
  });

  it('offAll() removes all handlers for an event', async () => {
    const emitter = createEmitter<{ test: () => Promise<void> }>();
    const calls: number[] = [];

    emitter.on('test', async () => calls.push(1));
    emitter.on('test', async () => calls.push(2));

    await emitter.emit('test');
    expect(calls).toEqual([1, 2]);

    calls.length = 0;
    emitter.offAll('test');

    await emitter.emit('test');
    expect(calls).toEqual([]);
  });

  it('emit() bubbles handler errors to caller', async () => {
    const emitter = createEmitter<{ test: () => Promise<void> }>();

    emitter.on('test', async () => {
      throw new Error('Handler error');
    });

    emitter.on('test', async () => {
      // This handler should not be called if the first one throws
    });

    await expect(emitter.emit('test')).rejects.toThrow('Handler error');
  });

  it('multiple event types can be registered', async () => {
    interface MyEvents extends EventMap {
      eventA: (msg: string) => Promise<void>;
      eventB: (num: number) => Promise<void>;
    }

    const emitter = createEmitter<MyEvents>();
    const calls: string[] = [];

    emitter.on('eventA', async (msg) => {
      calls.push(`A: ${msg}`);
    });

    emitter.on('eventB', async (num) => {
      calls.push(`B: ${num}`);
    });

    await emitter.emit('eventA', 'hello');
    await emitter.emit('eventB', 42);

    expect(calls).toEqual(['A: hello', 'B: 42']);
  });

  it('no-op when emitting event with no handlers', async () => {
    const emitter = createEmitter<{ test: () => Promise<void> }>();

    // Should not throw
    await emitter.emit('test');
  });

  it('no-op when off() is called for non-existent handler', async () => {
    const emitter = createEmitter<{ test: () => Promise<void> }>();
    const handler = async () => {};

    // Should not throw
    emitter.off('test', handler);
  });
});
