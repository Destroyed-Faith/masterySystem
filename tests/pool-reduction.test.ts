import { describe, expect, it } from 'vitest';
import {
  applyCleanseToList,
  attributePoolReduction,
  challengePoolReduction,
  mergeChallengeEntry,
  readChallengeState,
} from '../src/system/pool-reduction.js';
import { finalizeRolledPool } from '../src/dice/pool-finalize.js';

function actorWithSpecials(entries: Array<{ id: string; value: number; sourceUuid?: string; source?: string }>) {
  return {
    system: {
      statusEffects: entries.map((e) => ({
        id: e.id,
        name: e.id.charAt(0).toUpperCase() + e.id.slice(1),
        value: e.value,
        source: e.source ?? 'test',
        sourceUuid: e.sourceUuid,
      })),
      health: { bars: [{ current: 10, max: 10, penalty: 0 }], currentBar: 0 },
      encumbrance: { loadZone: 'none' },
    },
  };
}

describe('attributePoolReduction — Weaken / Soulburn', () => {
  it('Weaken reduces Might / Agility / Intellect pools only', () => {
    const actor = actorWithSpecials([{ id: 'weaken', value: 3 }]);
    expect(attributePoolReduction(actor, 'might').reduction).toBe(3);
    expect(attributePoolReduction(actor, 'agility').reduction).toBe(3);
    expect(attributePoolReduction(actor, 'intellect').reduction).toBe(3);
    expect(attributePoolReduction(actor, 'wits').reduction).toBe(0);
    expect(attributePoolReduction(actor, 'vitality').reduction).toBe(0);
  });

  it('Soulburn reduces Wits / Influence / Resolve pools only', () => {
    const actor = actorWithSpecials([{ id: 'soulburn', value: 2 }]);
    expect(attributePoolReduction(actor, 'wits').reduction).toBe(2);
    expect(attributePoolReduction(actor, 'influence').reduction).toBe(2);
    expect(attributePoolReduction(actor, 'resolve').reduction).toBe(2);
    expect(attributePoolReduction(actor, 'might').reduction).toBe(0);
  });
});

describe('Challenge merge + pool reduction', () => {
  it('same challenger stacks; different challenger replaces only if higher', () => {
    let list: any[] = [];
    list = mergeChallengeEntry(list, 3, 'A', 'Actor.a');
    expect(list).toHaveLength(1);
    expect(list[0].value).toBe(3);
    list = mergeChallengeEntry(list, 2, 'A', 'Actor.a');
    expect(list[0].value).toBe(5);
    list = mergeChallengeEntry(list, 4, 'B', 'Actor.b');
    expect(list[0].value).toBe(5); // not replaced (4 < 5)
    list = mergeChallengeEntry(list, 6, 'B', 'Actor.b');
    expect(list[0].value).toBe(6);
    expect(list[0].sourceUuid).toBe('Actor.b');
  });

  it('reduces Attack Pool when challenger is not a target', () => {
    const actor = actorWithSpecials([
      { id: 'challenge', value: 4, sourceUuid: 'Actor.challenger', source: 'Boss' },
    ]);
    const hit = challengePoolReduction(actor, ['Actor.challenger']);
    expect(hit.reduction).toBe(0);
    const miss = challengePoolReduction(actor, ['Actor.other']);
    expect(miss.reduction).toBe(4);
  });

  it('readChallengeState surfaces uuid + value', () => {
    const actor = actorWithSpecials([
      { id: 'challenge', value: 2, sourceUuid: 'Actor.x', source: 'X' },
    ]);
    expect(readChallengeState(actor)).toEqual({
      value: 2,
      challengerUuid: 'Actor.x',
      challengerName: 'X',
    });
  });
});

describe('Cleanse(X) — one Special, no split', () => {
  it('reduces exactly one Special; excess is lost', () => {
    const list = [
      { id: 'ruin', name: 'Ruin', value: 8 },
      { id: 'hex', name: 'Hex', value: 3 },
    ];
    const result = applyCleanseToList(list, 6, 'ruin');
    expect(result.applied).toBe(true);
    expect(result.reducedBy).toBe(6);
    expect(result.remaining).toBe(2);
    expect(result.fullValueSpent).toBe(true);
    expect(result.statusEffects.find((e) => e.id === 'ruin')?.value).toBe(2);
    expect(result.statusEffects.find((e) => e.id === 'hex')?.value).toBe(3);
  });

  it('ends a Special when value ≤ X; Absorption gate requires full X spent', () => {
    const list = [{ id: 'ruin', name: 'Ruin', value: 3 }];
    const result = applyCleanseToList(list, 6, 'ruin');
    expect(result.remaining).toBe(0);
    expect(result.fullValueSpent).toBe(false); // only 3 of 6 spent
    expect(result.statusEffects).toHaveLength(0);
  });

  it('does not auto-pick when multiple Specials and no chosenId', () => {
    const list = [
      { id: 'ruin', name: 'Ruin', value: 3 },
      { id: 'hex', name: 'Hex', value: 3 },
    ];
    const result = applyCleanseToList(list, 3);
    expect(result.applied).toBe(false);
  });
});

describe('finalizeRolledPool order', () => {
  it('applies flat Special reduction before MR floor', () => {
    const actor = actorWithSpecials([{ id: 'weaken', value: 10 }]);
    // Pretend no health/encumbrance penalty path by giving full HP.
    const result = finalizeRolledPool(actor, 12, 4, {
      rollKind: 'attack',
      poolAttribute: 'might',
      applyPoolPenalties: false,
    });
    // 12 − 10 = 2, then MR floor 4 → 4
    expect(result.numDice).toBe(4);
    expect(result.notes.some((n) => /Weaken/.test(n))).toBe(true);
    expect(result.notes.some((n) => /Minimum Pool/.test(n))).toBe(true);
  });
});
