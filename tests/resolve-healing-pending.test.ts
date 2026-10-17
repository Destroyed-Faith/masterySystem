import { describe, expect, it } from 'vitest';
import {
  armResolveHealingPending,
  isResolveHealingPendingExpired,
  isResolveHealingPendingLive,
  pendingHealingChatContent,
  pendingHealingLegalTargetIds,
  pendingHealingRound,
  readResolveHealingPending,
  triggerResolveHealing,
  type ResolveHealingPending,
} from '../src/stones/resolve-healing-pending';
import type { HealthSnapshot, StoneTargetCandidate } from '../src/stones/stone-resolution';

const combat = { id: 'c1', round: 2 };
const candidates: StoneTargetCandidate[] = [
  { id: 'self', name: 'Caster', self: true, distanceM: 0 },
  { id: 'near', name: 'Near', self: false, distanceM: 1.5 },
  { id: 'far', name: 'Far', self: false, distanceM: 40 },
];

function wounded(): HealthSnapshot {
  return { bars: [{ current: 1, max: 20 } as any], currentBar: 0 };
}

describe('Resolve Healing pending (R-05 §8)', () => {
  it('arming creates an unspent pending heal for the current Round and rolls nothing', () => {
    const pending = armResolveHealingPending(null, 'c1', 2, 3);
    expect(pending).toEqual({ combatId: 'c1', round: 2, rank: 3, spent: false });
    expect(isResolveHealingPendingLive(pending, combat)).toBe(true);
  });

  it('Preparation (round 0) counts as Round 1', () => {
    expect(pendingHealingRound({ id: 'c1', round: 0 })).toBe(1);
    const pending = armResolveHealingPending(null, 'c1', 0, 1);
    expect(isResolveHealingPendingLive(pending, { id: 'c1', round: 0 })).toBe(true);
    expect(isResolveHealingPendingLive(pending, { id: 'c1', round: 1 })).toBe(true);
    expect(isResolveHealingPendingLive(pending, { id: 'c1', round: 2 })).toBe(false);
  });

  it('a second payment before use keeps the higher rank; a spent one re-arms', () => {
    const first = armResolveHealingPending(null, 'c1', 2, 3);
    expect(armResolveHealingPending(first, 'c1', 2, 1).rank).toBe(3);
    expect(armResolveHealingPending(first, 'c1', 2, 4).rank).toBe(4);
    const spent = { ...first, spent: true };
    expect(armResolveHealingPending(spent, 'c1', 2, 1)).toMatchObject({ rank: 1, spent: false });
  });

  it('expires when the Round moves on, the combat differs, or it was spent', () => {
    const pending = armResolveHealingPending(null, 'c1', 2, 2);
    expect(isResolveHealingPendingExpired(pending, combat)).toBe(false);
    expect(isResolveHealingPendingExpired(pending, { id: 'c1', round: 3 })).toBe(true);
    expect(isResolveHealingPendingExpired(pending, { id: 'c2', round: 2 })).toBe(true);
    expect(isResolveHealingPendingExpired(pending, null)).toBe(true);
    expect(isResolveHealingPendingExpired({ ...pending, spent: true }, combat)).toBe(true);
    expect(isResolveHealingPendingLive(pending, { id: 'c1', round: 3 })).toBe(false);
  });

  it('readResolveHealingPending rejects junk', () => {
    expect(readResolveHealingPending(null)).toBeNull();
    expect(readResolveHealingPending({ rank: 2 })).toBeNull();
    expect(readResolveHealingPending({ combatId: 'c1', rank: 0 })).toBeNull();
    expect(readResolveHealingPending({ combatId: 'c1', round: 2, rank: 9 })).toMatchObject({ rank: 4 });
  });

  it('legal damage-hook targets are self plus allies inside the rank range', () => {
    const rank1 = armResolveHealingPending(null, 'c1', 2, 1);
    const ids = pendingHealingLegalTargetIds(rank1, candidates);
    expect(ids).toContain('self');
    expect(ids).toContain('near');
    expect(ids).not.toContain('far');
  });

  it('chat card advertises the pending heal with a trigger button', () => {
    const html = pendingHealingChatContent({ sourceName: 'Kai <b>', rank: 2, round: 2, actorId: 'x' });
    expect(html).toContain('mastery-resolve-healing-use');
    expect(html).toContain('Kai &lt;b&gt;');
    expect(html).toContain('Nothing is rolled yet');
  });

  async function trigger(
    pending: ResolveHealingPending | null,
    overrides: Partial<Parameters<typeof triggerResolveHealing>[0]> = {},
  ) {
    const health: Record<string, HealthSnapshot> = { self: wounded(), near: wounded() };
    const persisted: ResolveHealingPending[] = [];
    const rolls: string[] = [];
    const chats: string[] = [];
    const result = await triggerResolveHealing({
      pending,
      combat,
      sourceName: 'Caster',
      candidates,
      choose: async () => 'near',
      roll: async (formula) => {
        rolls.push(formula);
        return 6;
      },
      healthOf: (id) => health[id] ?? null,
      writeHealth: (id, next) => {
        health[id] = next;
      },
      chat: (c) => {
        chats.push(c);
      },
      persist: (next) => {
        persisted.push(next);
      },
      ...overrides,
    });
    return { result, health, persisted, rolls, chats };
  }

  it('triggering rolls at trigger time, heals the current bar and marks spent once', async () => {
    const pending = armResolveHealingPending(null, 'c1', 2, 1);
    const { result, health, persisted, rolls } = await trigger(pending);
    expect(rolls).toEqual(['4d8']);
    expect(result).toMatchObject({ ok: true, targetId: 'near', restored: 6 });
    expect(health.near.bars[0].current).toBe(7);
    expect(persisted).toEqual([{ ...pending, spent: true }]);

    const again = await trigger(persisted[0]);
    expect(again.result).toMatchObject({ ok: false, reason: 'spent' });
    expect(again.rolls).toEqual([]);
  });

  it('the damage hook can force the damaged target without prompting', async () => {
    const pending = armResolveHealingPending(null, 'c1', 2, 1);
    let asked = 0;
    const { result, health } = await trigger(pending, {
      preselectedTargetId: 'self',
      choose: async () => {
        asked += 1;
        return 'near';
      },
    });
    expect(asked).toBe(0);
    expect(result).toMatchObject({ ok: true, targetId: 'self' });
    expect(health.self.bars[0].current).toBe(7);
    expect(health.near.bars[0].current).toBe(1);
  });

  it('an out-of-range forced target heals nothing and keeps the heal pending', async () => {
    const pending = armResolveHealingPending(null, 'c1', 2, 1);
    const { result, persisted, rolls } = await trigger(pending, { preselectedTargetId: 'far' });
    expect(result).toMatchObject({ ok: false, reason: 'cancelled' });
    expect(persisted).toEqual([]);
    expect(rolls).toEqual([]);
  });

  it('cancelling target choice keeps the heal pending', async () => {
    const pending = armResolveHealingPending(null, 'c1', 2, 2);
    const { result, persisted } = await trigger(pending, { choose: async () => null });
    expect(result.ok).toBe(false);
    expect(persisted).toEqual([]);
  });

  it('an expired pending heal cannot be triggered', async () => {
    const pending = armResolveHealingPending(null, 'c1', 1, 2);
    const { result, rolls } = await trigger(pending);
    expect(result).toMatchObject({ ok: false, reason: 'expired' });
    expect(rolls).toEqual([]);
  });

  it('no pending flag means nothing happens', async () => {
    const { result } = await trigger(null);
    expect(result).toMatchObject({ ok: false, reason: 'none' });
  });
});
