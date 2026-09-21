import { describe, expect, it } from 'vitest';
import {
  orderPowersRampFirst,
  pendingStoneActivation,
  pendingStoneActivationLabel,
  formatPendingStoneActivationWarning,
  pickStoneFillAttribute,
  stonePowerAllowsColorless,
  stonePowerColorlessRejectMessage,
  shouldSettleStoneWave,
  stoneDialogSectionStartsOpen,
  stonePoolBlockedReason,
  stonePowerActivationRing,
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

  it('never offers Colorless for Remove Scar', () => {
    expect(stonePowerAllowsColorless('vitality.removeScar')).toBe(false);
    expect(stonePowerAllowsColorless('vitality.tempHp')).toBe(true);
    const pools: Record<string, number> = { vitality: 0, colorless: 3 };
    expect(
      pickStoneFillAttribute(
        ['vitality'],
        (a) => stonePowerAllowsColorless('vitality.removeScar') || a !== 'colorless',
        (a) => pools[a] ?? 0,
      ),
    ).toBeNull();
  });

  it('never offers Colorless for Initiative Boost', () => {
    expect(stonePowerAllowsColorless('wits.initiativeBoost')).toBe(false);
    expect(stonePowerColorlessRejectMessage('wits.initiativeBoost')).toMatch(/Initiative Boost/);
    const pools: Record<string, number> = { wits: 0, colorless: 4 };
    expect(
      pickStoneFillAttribute(
        ['wits'],
        (a) => stonePowerAllowsColorless('wits.initiativeBoost') || a !== 'colorless',
        (a) => pools[a] ?? 0,
      ),
    ).toBeNull();
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

describe('unactivated stone warning', () => {
  it('warns when one stone sits on a power that needs two', () => {
    const row = pendingStoneActivation({ name: 'Extra Attack', placed: 1, needed: 2 });
    expect(row).toEqual({ name: 'Extra Attack', placed: 1, needed: 2, missing: 1 });
    expect(pendingStoneActivationLabel(row!)).toBe('Not activated — 1 of 2, 1 stone still needed.');
    const crit = pendingStoneActivation({ name: 'Crit', placed: 1, needed: 2 });
    expect(formatPendingStoneActivationWarning([row!, crit!])).toBe(
      'Not activated: Extra Attack (1 of 2), Crit (1 of 2). Placing them does not turn the power on — the wave must be full.',
    );
  });

  it('stays quiet once the wave is full or empty', () => {
    expect(pendingStoneActivation({ name: 'Evade', placed: 1, needed: 1 })).toBeNull();
    expect(pendingStoneActivation({ name: 'Evade', placed: 0, needed: 1 })).toBeNull();
    expect(formatPendingStoneActivationWarning([])).toBe('');
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

  it('names sustain before the generic case and never blames artifacts', () => {
    expect(stonePoolBlockedReason({ max: 2, available: 0, sustained: 0, artifactBound: 2 })).toBe(
      'spent this round',
    );
    expect(stonePoolBlockedReason({ max: 2, available: 0, sustained: 2, artifactBound: 0 })).toBe(
      'bound by Sustain',
    );
    expect(stonePoolBlockedReason({ max: 2, available: 0, sustained: 0, artifactBound: 0 })).toBe(
      'spent this round',
    );
  });
});

describe('stonePowerActivationRing', () => {
  it('leaves unused cards white (1px, not activated)', () => {
    expect(stonePowerActivationRing(0)).toEqual({
      activationCount: 0,
      activated: false,
      ringPx: 1,
    });
  });

  it('grows the green ring with each paid wave', () => {
    expect(stonePowerActivationRing(1)).toEqual({ activationCount: 1, activated: true, ringPx: 1 });
    expect(stonePowerActivationRing(2)).toEqual({ activationCount: 2, activated: true, ringPx: 2 });
    expect(stonePowerActivationRing(3)).toEqual({ activationCount: 3, activated: true, ringPx: 3 });
    expect(stonePowerActivationRing(4)).toEqual({ activationCount: 4, activated: true, ringPx: 4 });
    expect(stonePowerActivationRing(5)).toEqual({ activationCount: 5, activated: true, ringPx: 5 });
    expect(stonePowerActivationRing(8)).toEqual({ activationCount: 8, activated: true, ringPx: 5 });
  });
});
