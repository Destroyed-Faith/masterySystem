import { describe, expect, it } from 'vitest';
import {
  pickStoneFillAttribute,
  shouldSettleStoneWave,
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

describe('pool blocked reason', () => {
  it('explains a missing pool', () => {
    expect(stonePoolBlockedReason({ max: 0, available: 0, sustained: 0, artifactBound: 0 })).toBe(
      'Attribut unter 8 — kein Steinpool',
    );
  });

  it('stays empty while stones are available', () => {
    expect(stonePoolBlockedReason({ max: 2, available: 1, sustained: 0, artifactBound: 1 })).toBe('');
  });

  it('names artifact bindings and sustain before the generic case', () => {
    expect(stonePoolBlockedReason({ max: 2, available: 0, sustained: 0, artifactBound: 2 })).toBe(
      'an Artefakt-Aktivierung gebunden',
    );
    expect(stonePoolBlockedReason({ max: 2, available: 0, sustained: 2, artifactBound: 0 })).toBe(
      'durch Sustain gebunden',
    );
    expect(stonePoolBlockedReason({ max: 2, available: 0, sustained: 0, artifactBound: 0 })).toBe(
      'diese Runde verbraucht',
    );
  });
});
