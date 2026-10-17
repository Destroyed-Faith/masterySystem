import { describe, expect, it, vi, beforeEach } from 'vitest';

const masteryRollMock = vi.fn();

vi.mock('../src/dice/roll-handler.js', () => ({
  masteryRoll: (...args: unknown[]) => masteryRollMock(...args),
}));

import {
  FEAR_CHECK_TN_EXTREME,
  FEAR_CHECK_TN_NORMAL,
  applyFearDelta,
  getFear,
  runFearCheck,
  setFear,
} from '../src/combat/fear.js';
import { finalizeRolledPool, shouldApplyFearToPool } from '../src/dice/pool-finalize.js';
import { buildSafeHavenRestUpdates, applyNightRest } from '../src/utils/safe-haven-rest.js';

function actorWithFear(fear: number, opts?: { resolve?: number; weaken?: number }) {
  const statusEffects =
    opts?.weaken != null && opts.weaken > 0
      ? [{ id: 'weaken', name: 'Weaken', value: opts.weaken, source: 'test' }]
      : [];
  return {
    id: 'Actor.test',
    items: [],
    system: {
      fear,
      attributes: {
        resolve: { value: opts?.resolve ?? 8 },
        might: { value: 10 },
      },
      statusEffects,
      health: { bars: [{ current: 10, max: 10, penalty: 0, name: 'Healthy' }], currentBar: 0 },
      encumbrance: { loadZone: 'none' },
      mastery: { rank: 4 },
    },
    async update(data: Record<string, unknown>) {
      for (const [k, v] of Object.entries(data)) {
        if (k === 'system.fear') this.system.fear = v;
      }
    },
  };
}

describe('getFear / setFear / applyFearDelta', () => {
  it('defaults missing fear to 0', () => {
    expect(getFear({ system: {} })).toBe(0);
  });

  it('setFear and applyFearDelta clamp at 0', async () => {
    const actor = actorWithFear(2);
    await setFear(actor, 5);
    expect(actor.system.fear).toBe(5);
    const next = await applyFearDelta(actor, -10);
    expect(next).toBe(0);
    expect(getFear(actor)).toBe(0);
  });
});

describe('shouldApplyFearToPool', () => {
  it('applies on attribute pools and attack/skill kinds', () => {
    expect(shouldApplyFearToPool({ poolAttribute: 'might' })).toBe(true);
    expect(shouldApplyFearToPool({ rollKind: 'attack' })).toBe(true);
    expect(shouldApplyFearToPool({ rollKind: 'skill' })).toBe(true);
  });

  it('skips damage, applyPoolPenalties false, and explicit applyFear false', () => {
    expect(shouldApplyFearToPool({ rollKind: 'damage', poolAttribute: 'might' })).toBe(false);
    expect(
      shouldApplyFearToPool({ poolAttribute: 'might', applyPoolPenalties: false }),
    ).toBe(false);
    expect(shouldApplyFearToPool({ poolAttribute: 'might', applyFear: false })).toBe(false);
  });

  it('skips generic rolls without poolAttribute (e.g. initiative-style)', () => {
    expect(shouldApplyFearToPool({ rollKind: 'generic' })).toBe(false);
  });
});

describe('finalizeRolledPool — Fear reduction order', () => {
  it('subtracts Fear after Weaken and before Health penalty', () => {
    const actor = actorWithFear(3, { weaken: 2 });
    const withHealth = finalizeRolledPool(actor, 12, 4, {
      rollKind: 'attack',
      poolAttribute: 'might',
      applyPoolPenalties: true,
    });
    expect(withHealth.notes.some((n) => /Weaken/.test(n))).toBe(true);
    expect(withHealth.notes.some((n) => /Fear/.test(n))).toBe(true);
    const fearIdx = withHealth.notes.findIndex((n) => /Fear/.test(n));
    const healthIdx = withHealth.notes.findIndex((n) => /Health penalty/.test(n));
    expect(fearIdx).toBeGreaterThanOrEqual(0);
    if (healthIdx >= 0) {
      expect(fearIdx).toBeLessThan(healthIdx);
    }

    const flatOnly = finalizeRolledPool(actor, 12, 4, {
      rollKind: 'attack',
      poolAttribute: 'might',
      applyPoolPenalties: false,
      applyFear: true,
    });
    expect(flatOnly.numDice).toBe(7);
  });

  it('does not reduce damage pools', () => {
    const actor = actorWithFear(5);
    const result = finalizeRolledPool(actor, 8, 4, { rollKind: 'damage', poolAttribute: 'might' });
    expect(result.numDice).toBe(8);
    expect(result.notes.some((n) => /Fear/.test(n))).toBe(false);
  });

  it('does not change keep — only numDice (caller keeps keepDice separate)', () => {
    const actor = actorWithFear(4);
    const keep = 4;
    const result = finalizeRolledPool(actor, 10, keep, {
      rollKind: 'skill',
      poolAttribute: 'resolve',
      applyPoolPenalties: true,
    });
    expect(result.numDice).toBe(6);
    expect(keep).toBe(4);
  });
});

describe('Fear Check TN constants', () => {
  it('uses TN 8 normal and TN 12 extreme', () => {
    expect(FEAR_CHECK_TN_NORMAL).toBe(8);
    expect(FEAR_CHECK_TN_EXTREME).toBe(12);
  });
});

describe('runFearCheck', () => {
  beforeEach(() => {
    masteryRollMock.mockReset();
  });

  it('accumulates +1 Fear on failure', async () => {
    const actor = actorWithFear(1, { resolve: 8 });
    masteryRollMock.mockResolvedValue({ total: 3, kept: [3], skill: 0, tn: 8 });
    const result = await runFearCheck(actor, FEAR_CHECK_TN_NORMAL);
    expect(result.success).toBe(false);
    expect(result.fearBefore).toBe(1);
    expect(result.fearAfter).toBe(2);
    expect(getFear(actor)).toBe(2);
  });

  it('does not add Fear on success', async () => {
    const actor = actorWithFear(2, { resolve: 8 });
    masteryRollMock.mockResolvedValue({ total: 12, kept: [8], skill: 0, tn: 12 });
    const result = await runFearCheck(actor, FEAR_CHECK_TN_EXTREME);
    expect(result.success).toBe(true);
    expect(result.fearAfter).toBe(2);
    expect(result.tn).toBe(12);
  });

  it('applies existing Fear to the Resolve pool before rolling', async () => {
    const actor = actorWithFear(3, { resolve: 8 });
    masteryRollMock.mockImplementation(async (opts: { numDice: number }) => {
      expect(opts.numDice).toBe(5);
      expect(opts.keepDice).toBe(1);
      expect(opts.applyFear).toBe(false);
      expect(opts.applyPoolPenalties).toBe(false);
      return { total: 8, kept: [8], skill: 0, tn: 8 };
    });
    await runFearCheck(actor, FEAR_CHECK_TN_NORMAL);
    expect(masteryRollMock).toHaveBeenCalledOnce();
  });

  it('fails and adds Fear when the reduced pool is 0', async () => {
    const actor = actorWithFear(10, { resolve: 8 });
    const result = await runFearCheck(actor, FEAR_CHECK_TN_NORMAL);
    expect(result.success).toBe(false);
    expect(result.poolDice).toBe(0);
    expect(getFear(actor)).toBe(11);
    expect(masteryRollMock).not.toHaveBeenCalled();
  });
});

describe('Safe Haven and Night Rest', () => {
  it('Safe Haven Rest clears Fear', () => {
    const updates = buildSafeHavenRestUpdates({ mastery: { rank: 2 }, fear: 4 });
    expect(updates['system.fear']).toBe(0);
  });

  it('Night Rest does not clear Fear', async () => {
    const actor = actorWithFear(3);
    await applyNightRest(actor);
    expect(getFear(actor)).toBe(3);
  });
});
