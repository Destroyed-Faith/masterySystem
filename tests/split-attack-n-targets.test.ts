/**
 * Split Attack (v0.9.9.6): up to 2 / 3 / 4 different targets at PL 1–6 / 7–12 / 13–16;
 * the Attack Pool is divided between the chosen targets.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  divideSplitAttackPool,
  divideSplitAttackPoolN,
  openSplitPair,
  peekPendingSplit,
  setSplitSecondTargetResolver,
  splitAttackMaxTargets,
  splitTargetsForPowerLevel,
} from '../src/combat/attack-executor';
import { MELEE_SPLIT_PROG, RANGED_SPLIT_PROG } from '../src/utils/powers/templates/actives';
import { formatRadialPowerDisplayName } from '../src/radial-menu/power-radial-label';

function splitOption(level: number): any {
  return { source: 'power', item: { system: { templateId: 'active-melee-weapon-split', level } } };
}

describe('Split Attack target count', () => {
  it('matches the printed tables for PL 1–16 (melee and ranged)', () => {
    for (let pl = 1; pl <= 16; pl++) {
      expect(splitTargetsForPowerLevel(pl), `PL${pl}`).toBe(MELEE_SPLIT_PROG[pl - 1]!.attacks);
      expect(splitTargetsForPowerLevel(pl), `PL${pl}`).toBe(RANGED_SPLIT_PROG[pl - 1]!.attacks);
    }
  });

  it('reads PL from Power items and Artifact rows; NPC rows default to 2', () => {
    expect(splitAttackMaxTargets(splitOption(6))).toBe(2);
    expect(splitAttackMaxTargets(splitOption(7))).toBe(3);
    expect(splitAttackMaxTargets(splitOption(13))).toBe(4);
    const heartseeker = (row: number) =>
      ({ source: 'power', item: {}, artifactPowerTemplateId: 'active-ranged-weapon-split', artifactRowLevel: row }) as any;
    expect(splitAttackMaxTargets(heartseeker(1))).toBe(2);
    expect(splitAttackMaxTargets(heartseeker(4))).toBe(3);
    expect(splitAttackMaxTargets(heartseeker(7))).toBe(4);
    expect(splitAttackMaxTargets({ source: 'npc-attack', npcSplitAttack: true } as any)).toBe(2);
  });

  it('radial label shows the maximum number of targets', () => {
    expect(formatRadialPowerDisplayName({ name: 'Melee Split Attack' }, { splitAttack: true, splitTargets: 3 })).toBe(
      'Melee Split Attack × 3',
    );
  });
});

describe('Split Attack pool division', () => {
  it('divides the pool evenly; earlier strikes take the remainder', () => {
    expect(divideSplitAttackPoolN(12, 2)).toEqual([6, 6]);
    expect(divideSplitAttackPoolN(10, 3)).toEqual([4, 3, 3]);
    expect(divideSplitAttackPoolN(11, 4)).toEqual([3, 3, 3, 2]);
    expect(divideSplitAttackPoolN(7, 1)).toEqual([7]);
    expect(divideSplitAttackPool(5)).toEqual({ first: 3, second: 2 });
  });
});

describe('Split Attack target selection', () => {
  afterEach(() => setSplitSecondTargetResolver(null));

  it('queues up to the printed number of different targets', async () => {
    const picks = ['b', 'c', 'd', 'e'];
    setSplitSecondTargetResolver(async () => picks.shift() ?? null);
    const opened = await openSplitPair({ id: 'attacker' }, { id: 'a' }, splitOption(13), 'melee');
    expect(opened.targetTokenIds).toEqual(['a', 'b', 'c', 'd']);
    const next = peekPendingSplit(opened.pairId);
    expect(next?.targetTokenId).toBe('b');
    expect(next?.nextIndex).toBe(2);
    expect(next?.splitTotal).toBe(4);
  });

  it('never targets the same creature twice and lets the player stop early', async () => {
    const picks = ['b', 'a'];
    setSplitSecondTargetResolver(async () => picks.shift() ?? null);
    const opened = await openSplitPair({ id: 'attacker' }, { id: 'a' }, splitOption(10), 'melee');
    expect(opened.targetTokenIds).toEqual(['a', 'b']);

    setSplitSecondTargetResolver(async () => null);
    const solo = await openSplitPair({ id: 'attacker' }, { id: 'a' }, splitOption(10), 'melee');
    expect(solo.targetTokenIds).toEqual(['a']);
    expect(solo.secondTargetId).toBe('');
  });
});
