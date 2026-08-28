import { describe, expect, it } from 'vitest';
import {
  orderPowersRampFirst,
  pickStoneFillAttribute,
  shouldSettleStoneWave,
  stoneDialogSectionStartsOpen,
  stonePoolBlockedReason,
} from '../src/stones/stone-payment-rules';

const ATTRS = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence'] as const;

describe('click-fill stone choice', () => {
  it('takes the first attribute pool that still has a stone', () => {
    const pools: Record<string, number> = { might: 0, agility: 2, colorless: 3 };
    expect(pickStoneFillAttribute(ATTRS, () => true, (a) => pools[a] ?? 0)).toBe('agility');
  });

  it('falls back to Colorless only when every attribute pool is empty', () => {
    const pools: Record<string, number> = { colorless: 1 };
    expect(pickStoneFillAttribute(ATTRS, () => true, (a) => pools[a] ?? 0)).toBe('colorless');
  });

  it('returns null when nothing is left', () => {
    expect(pickStoneFillAttribute(ATTRS, () => true, () => 0)).toBeNull();
  });

  it('skips pools the actor cannot use', () => {
    const pools: Record<string, number> = { might: 4, agility: 1 };
    const usable = (a: string) => a !== 'might';
    expect(pickStoneFillAttribute(ATTRS, usable, (a) => pools[a] ?? 0)).toBe('agility');
  });

  it('ignores Colorless when it is not available', () => {
    expect(pickStoneFillAttribute(ATTRS, (a) => a !== 'colorless', () => 1)).toBe('might');
  });
});

describe('wave settlement guard', () => {
  const base = {
    reviewMode: false,
    paidAccKeys: [] as string[],
    accKey: 'might.evade:might:0',
    currentUses: 0,
    usesInKey: 0,
  };

  it('settles a fresh, fully filled wave', () => {
    expect(shouldSettleStoneWave(base)).toBe(true);
  });

  it('never charges a wave that was already paid, even after stoneUsage was reset', () => {
    expect(
      shouldSettleStoneWave({ ...base, paidAccKeys: ['might.evade:might:0'], currentUses: 0 }),
    ).toBe(false);
  });

  it('never charges in review mode', () => {
    expect(shouldSettleStoneWave({ ...base, reviewMode: true })).toBe(false);
  });

  it('ignores waves whose usage level no longer matches', () => {
    expect(shouldSettleStoneWave({ ...base, currentUses: 1 })).toBe(false);
  });
});

describe('power row order', () => {
  const row = ['meleeDamage', 'armor', 'ignoreArmor', 'parry'];
  const isRamp = (id: string) => id === 'parry';

  it('puts the 2-stone ramp power first and keeps the rest in order', () => {
    expect(orderPowersRampFirst(row, isRamp)).toEqual([
      'parry',
      'meleeDamage',
      'armor',
      'ignoreArmor',
    ]);
  });

  it('leaves a row without a ramp power untouched', () => {
    expect(orderPowersRampFirst(row, () => false)).toEqual(row);
  });
});

describe('dialog section expand/collapse', () => {
  it('opens a section that still has freely spendable stones', () => {
    expect(stoneDialogSectionStartsOpen({ sectionHasSpendable: true })).toBe(true);
  });

  it('collapses a section with nothing left to place', () => {
    expect(stoneDialogSectionStartsOpen({ sectionHasSpendable: false })).toBe(false);
  });

  it('stays open when stones are already assigned there this round', () => {
    expect(
      stoneDialogSectionStartsOpen({ sectionHasSpendable: false, sectionHasAssigned: true }),
    ).toBe(true);
  });

  it('lets a manual toggle override the default', () => {
    expect(
      stoneDialogSectionStartsOpen({
        sectionHasSpendable: false,
        userOverride: true,
      }),
    ).toBe(true);
    expect(
      stoneDialogSectionStartsOpen({
        sectionHasSpendable: true,
        userOverride: false,
      }),
    ).toBe(false);
  });
});

describe('pool blocked reason', () => {
  it('explains a missing pool', () => {
    expect(stonePoolBlockedReason({ max: 0, available: 0, sustained: 0, artifactBound: 0 })).toBe(
      'Attribute below 8 — no stone pool',
    );
  });

  it('stays empty while stones are available', () => {
    expect(stonePoolBlockedReason({ max: 2, available: 1, sustained: 0, artifactBound: 1 })).toBe('');
  });

  it('names artifact bindings and sustain before the generic case', () => {
    expect(stonePoolBlockedReason({ max: 2, available: 0, sustained: 0, artifactBound: 2 })).toBe(
      'bound to an artifact activation',
    );
    expect(stonePoolBlockedReason({ max: 2, available: 0, sustained: 2, artifactBound: 0 })).toBe(
      'bound by Sustain',
    );
    expect(stonePoolBlockedReason({ max: 2, available: 0, sustained: 0, artifactBound: 0 })).toBe(
      'spent this round',
    );
  });
});
