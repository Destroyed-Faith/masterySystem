import { describe, it, expect } from 'vitest';
import {
  MINOR_EXPRESSIONS,
  MINOR_EXPRESSION_ATTRIBUTES,
  tierThresholdForAttributeValue,
  sanitizeMinorExpressionIds,
  getMinorExpressionDefinition,
  listMinorExpressionsByAttribute,
  isTierUnlocked,
} from '../src/utils/minor-expressions';

describe('minor-expressions catalog', () => {
  it('has 36 definitions (6 attributes × 6)', () => {
    expect(MINOR_EXPRESSIONS.length).toBe(36);
  });

  it('each attribute has exactly 6 expressions', () => {
    for (const a of MINOR_EXPRESSION_ATTRIBUTES) {
      expect(listMinorExpressionsByAttribute(a).length).toBe(6);
    }
  });

  it('ids are unique', () => {
    const ids = MINOR_EXPRESSIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('tierThresholdForAttributeValue', () => {
  it('returns null below 4', () => {
    expect(tierThresholdForAttributeValue(3)).toBeNull();
    expect(tierThresholdForAttributeValue(0)).toBeNull();
  });

  it('returns correct tier thresholds', () => {
    expect(tierThresholdForAttributeValue(4)).toBe(4);
    expect(tierThresholdForAttributeValue(7)).toBe(4);
    expect(tierThresholdForAttributeValue(8)).toBe(8);
    expect(tierThresholdForAttributeValue(11)).toBe(8);
    expect(tierThresholdForAttributeValue(12)).toBe(12);
    expect(tierThresholdForAttributeValue(15)).toBe(12);
    expect(tierThresholdForAttributeValue(16)).toBe(16);
    expect(tierThresholdForAttributeValue(19)).toBe(16);
    expect(tierThresholdForAttributeValue(20)).toBe(20);
    expect(tierThresholdForAttributeValue(40)).toBe(20);
  });
});

describe('isTierUnlocked', () => {
  it('matches tier thresholds', () => {
    expect(isTierUnlocked(3, 4)).toBe(false);
    expect(isTierUnlocked(4, 4)).toBe(true);
    expect(isTierUnlocked(7, 8)).toBe(false);
    expect(isTierUnlocked(8, 8)).toBe(true);
    expect(isTierUnlocked(15, 16)).toBe(false);
    expect(isTierUnlocked(16, 16)).toBe(true);
  });
});

describe('sanitizeMinorExpressionIds', () => {
  const attrs = (might: number, agility = 8, intellect = 8, resolve = 8, influence = 8, wits = 8) => ({
    might,
    agility,
    intellect,
    resolve,
    influence,
    wits
  });

  const get = (vals: ReturnType<typeof attrs>) => (k: string) =>
    Math.floor(Number((vals as any)[k]) || 0);

  it('drops unknown ids and duplicates', () => {
    const v = get(attrs(8));
    const out = sanitizeMinorExpressionIds(
      ['might-hold-fast', 'might-hold-fast', 'nope'],
      v,
      5
    );
    expect(out).toEqual(['might-hold-fast']);
  });

  it('drops picks when attribute under 4', () => {
    const v = get(attrs(3));
    const out = sanitizeMinorExpressionIds(['might-hold-fast'], v, 2);
    expect(out).toEqual([]);
  });

  it('caps at mastery rank', () => {
    const v = get(attrs(8, 8, 8, 8, 8, 8));
    const out = sanitizeMinorExpressionIds(
      ['might-hold-fast', 'agility-soft-step', 'intellect-mage-hand'],
      v,
      2
    );
    expect(out.length).toBe(2);
    expect(out[0]).toBe('might-hold-fast');
    expect(out[1]).toBe('agility-soft-step');
  });

  it('drops wits picks when wits under 4', () => {
    const v = get(attrs(8, 8, 8, 8, 8, 3));
    const out = sanitizeMinorExpressionIds(['wits-quick-read'], v, 3);
    expect(out).toEqual([]);
  });

  it('getMinorExpressionDefinition resolves catalog id', () => {
    const d = getMinorExpressionDefinition('resolve-alarm');
    expect(d?.name).toBe('Alarm');
    expect(d?.attribute).toBe('resolve');
  });
});
