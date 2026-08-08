import { describe, it, expect } from 'vitest';
import {
  waitForAttackResolution,
  completeAttackResolution,
  isAwaitingAttackResolution,
} from '../src/combat/attack-resolution-wait.js';

describe('attack-resolution-wait', () => {
  it('resolves the waiter when completeAttackResolution is called', async () => {
    const id = 'msg-counter-1';
    const pending = waitForAttackResolution(id);
    expect(isAwaitingAttackResolution(id)).toBe(true);
    completeAttackResolution(id, { status: 'resolved' });
    await expect(pending).resolves.toEqual({ status: 'resolved' });
    expect(isAwaitingAttackResolution(id)).toBe(false);
  });

  it('supports skip status', async () => {
    const id = 'msg-counter-2';
    const pending = waitForAttackResolution(id);
    completeAttackResolution(id, { status: 'skipped' });
    await expect(pending).resolves.toEqual({ status: 'skipped' });
  });

  it('complete is idempotent when nobody is waiting', () => {
    expect(() => completeAttackResolution('nobody', { status: 'resolved' })).not.toThrow();
  });
});
