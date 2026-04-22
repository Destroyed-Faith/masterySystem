/**
 * Unit tests for the Phasing subsystem.
 *
 * Verifies the shape and gating rules laid down in the plan:
 *   - Passive `grantPhasingCharges` sets the base pool once per combat
 *     (idempotent; repeated calls in the same combat are no-ops).
 *   - Buff `augmentPhasingCharges` only stacks when a passive base already
 *     exists, and is idempotent per ActiveEffect.
 *   - `removeAugmentCharges` reverts a buff's contribution without refunding
 *     charges already consumed.
 *   - `consumePhasingCharge` decrements until the pool hits 0.
 *   - `triggerGhostSlipReaction` grants and consumes a single charge
 *     independent of passive gating.
 *   - `clearPhasingOnCombatEnd` wipes state for the matching combat only.
 */
import { describe, it, expect } from 'vitest';
import {
  augmentPhasingCharges,
  clearPhasingOnCombatEnd,
  consumePhasingCharge,
  getPhasingCharges,
  grantPhasingCharges,
  removeAugmentCharges,
  triggerGhostSlipReaction,
} from '../src/combat/phasing';

// ---------------------------------------------------------------------------
// Actor stub: mutable `flags['mastery-system'].phasingCharges` + an update()
// that merges the dot-path patch used by the production code.
// ---------------------------------------------------------------------------

function makeActor(id = 'a1') {
  const actor: any = {
    id,
    flags: { 'mastery-system': {} },
    async update(patch: Record<string, unknown>) {
      for (const [dot, value] of Object.entries(patch)) {
        const parts = dot.split('.');
        let cur: any = actor;
        for (let i = 0; i < parts.length - 1; i++) {
          const seg = parts[i];
          if (cur[seg] == null || typeof cur[seg] !== 'object') cur[seg] = {};
          cur = cur[seg];
        }
        cur[parts[parts.length - 1]!] = value;
      }
    },
  };
  return actor;
}

function makeCombat(id = 'c1') {
  return { id };
}

describe('grantPhasingCharges', () => {
  it('sets the base pool and is idempotent in the same combat', async () => {
    const actor = makeActor();
    const combat = makeCombat();
    await grantPhasingCharges(actor, combat, 2, {
      ownerKind: 'passive',
      ownerId: 'p-ghostform',
      name: 'Ghostform',
    });
    let state = getPhasingCharges(actor);
    expect(state.max).toBe(2);
    expect(state.current).toBe(2);
    expect(state.combatId).toBe('c1');

    await grantPhasingCharges(actor, combat, 2, {
      ownerKind: 'passive',
      ownerId: 'p-ghostform',
      name: 'Ghostform',
    });
    state = getPhasingCharges(actor);
    expect(state.max).toBe(2);
    expect(state.current).toBe(2);
  });

  it('resets across combats: a new combatId wipes stale state before granting', async () => {
    const actor = makeActor();
    await grantPhasingCharges(actor, makeCombat('c1'), 3, {
      ownerKind: 'passive',
      ownerId: 'p-ghostform',
      name: 'Ghostform',
    });
    // Consume one so we can see reset behaviour.
    await consumePhasingCharge(actor);
    expect(getPhasingCharges(actor).current).toBe(2);

    await grantPhasingCharges(actor, makeCombat('c2'), 3, {
      ownerKind: 'passive',
      ownerId: 'p-ghostform',
      name: 'Ghostform',
    });
    const state = getPhasingCharges(actor);
    expect(state.combatId).toBe('c2');
    expect(state.max).toBe(3);
    expect(state.current).toBe(3);
  });
});

describe('augmentPhasingCharges (buff)', () => {
  it('refuses to stack without a passive base', async () => {
    const actor = makeActor();
    const combat = makeCombat();
    await augmentPhasingCharges(actor, combat, 1, {
      ownerKind: 'buff',
      ownerId: 'eff-mantle-1',
      name: 'Ghost Mantle',
    });
    const state = getPhasingCharges(actor);
    expect(state.max).toBe(0);
    expect(state.current).toBe(0);
  });

  it('stacks on top of the passive base and is idempotent per effect id', async () => {
    const actor = makeActor();
    const combat = makeCombat();
    await grantPhasingCharges(actor, combat, 2, {
      ownerKind: 'passive',
      ownerId: 'p-ghostform',
      name: 'Ghostform',
    });
    await augmentPhasingCharges(actor, combat, 1, {
      ownerKind: 'buff',
      ownerId: 'eff-mantle-1',
      name: 'Ghost Mantle',
    });
    let state = getPhasingCharges(actor);
    expect(state.max).toBe(3);
    expect(state.current).toBe(3);

    // Second call for same effect id is a no-op.
    await augmentPhasingCharges(actor, combat, 1, {
      ownerKind: 'buff',
      ownerId: 'eff-mantle-1',
      name: 'Ghost Mantle',
    });
    state = getPhasingCharges(actor);
    expect(state.max).toBe(3);
  });
});

describe('removeAugmentCharges (buff cleanup)', () => {
  it('removes unused augment charges when the buff is deleted', async () => {
    const actor = makeActor();
    const combat = makeCombat();
    await grantPhasingCharges(actor, combat, 2, {
      ownerKind: 'passive',
      ownerId: 'p-ghostform',
      name: 'Ghostform',
    });
    await augmentPhasingCharges(actor, combat, 1, {
      ownerKind: 'buff',
      ownerId: 'eff-mantle-1',
      name: 'Ghost Mantle',
    });
    expect(getPhasingCharges(actor).max).toBe(3);

    await removeAugmentCharges(actor, 'eff-mantle-1');
    const state = getPhasingCharges(actor);
    expect(state.max).toBe(2);
    expect(state.current).toBe(2);
  });

  it('does not refund charges that were already consumed', async () => {
    const actor = makeActor();
    const combat = makeCombat();
    await grantPhasingCharges(actor, combat, 1, {
      ownerKind: 'passive',
      ownerId: 'p-ghostform',
      name: 'Ghostform',
    });
    await augmentPhasingCharges(actor, combat, 1, {
      ownerKind: 'buff',
      ownerId: 'eff-mantle-1',
      name: 'Ghost Mantle',
    });
    // Consume 2 charges (one of them is the augment).
    await consumePhasingCharge(actor);
    await consumePhasingCharge(actor);
    expect(getPhasingCharges(actor).current).toBe(0);

    await removeAugmentCharges(actor, 'eff-mantle-1');
    const state = getPhasingCharges(actor);
    expect(state.max).toBe(1);
    expect(state.current).toBe(0);
  });
});

describe('consumePhasingCharge', () => {
  it('decrements current and returns true while charges remain', async () => {
    const actor = makeActor();
    await grantPhasingCharges(actor, makeCombat(), 2, {
      ownerKind: 'passive',
      ownerId: 'p-ghostform',
      name: 'Ghostform',
    });
    expect(await consumePhasingCharge(actor)).toBe(true);
    expect(await consumePhasingCharge(actor)).toBe(true);
    expect(await consumePhasingCharge(actor)).toBe(false);
    expect(getPhasingCharges(actor).current).toBe(0);
  });
});

describe('triggerGhostSlipReaction', () => {
  it('grants 1 charge and immediately consumes it (no passive base required)', async () => {
    const actor = makeActor();
    const combat = makeCombat();
    const consumed = await triggerGhostSlipReaction(actor, combat);
    expect(consumed).toBe(true);
    const state = getPhasingCharges(actor);
    expect(state.current).toBe(0);
    expect(state.max).toBe(1);
  });
});

describe('clearPhasingOnCombatEnd', () => {
  it('wipes the pool for the matching combat', async () => {
    const actor = makeActor();
    const combat = makeCombat('c1');
    await grantPhasingCharges(actor, combat, 2, {
      ownerKind: 'passive',
      ownerId: 'p-ghostform',
      name: 'Ghostform',
    });
    await clearPhasingOnCombatEnd(actor, combat);
    const state = getPhasingCharges(actor);
    expect(state.max).toBe(0);
    expect(state.current).toBe(0);
    expect(Object.keys(state.sources)).toHaveLength(0);
  });

  it('keeps state that belongs to a different combat id', async () => {
    const actor = makeActor();
    await grantPhasingCharges(actor, makeCombat('c1'), 2, {
      ownerKind: 'passive',
      ownerId: 'p-ghostform',
      name: 'Ghostform',
    });
    await clearPhasingOnCombatEnd(actor, makeCombat('c2'));
    expect(getPhasingCharges(actor).max).toBe(2);
  });
});
