import { describe, it, expect } from 'vitest';
import {
  MINOR_EXPRESSIONS,
  MINOR_EXPRESSION_ATTRIBUTES,
  tierThresholdForAttributeValue,
  sanitizeMinorExpressionIds,
  getMinorExpressionDefinition,
  listMinorExpressionsByAttribute
} from '../src/utils/minor-expressions';

describe('minor-expressions catalog', () => {
  it('has 30 definitions (5 attributes × 6)', () => {
    expect(MINOR_EXPRESSIONS.length).toBe(30);
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
  it('returns null below 8', () => {
    expect(tierThresholdForAttributeValue(7)).toBeNull();
    expect(tierThresholdForAttributeValue(0)).toBeNull();
  });

  it('returns correct tier thresholds', () => {
    expect(tierThresholdForAttributeValue(8)).toBe(8);
    expect(tierThresholdForAttributeValue(15)).toBe(8);
    expect(tierThresholdForAttributeValue(16)).toBe(16);
    expect(tierThresholdForAttributeValue(23)).toBe(16);
    expect(tierThresholdForAttributeValue(24)).toBe(24);
    expect(tierThresholdForAttributeValue(31)).toBe(24);
    expect(tierThresholdForAttributeValue(32)).toBe(32);
    expect(tierThresholdForAttributeValue(39)).toBe(32);
    expect(tierThresholdForAttributeValue(40)).toBe(40);
    expect(tierThresholdForAttributeValue(80)).toBe(40);
  });
});

describe('sanitizeMinorExpressionIds', () => {
  const attrs = (might: number, agility = 8, intellect = 8, resolve = 8, influence = 8) => ({
    might,
    agility,
    intellect,
    resolve,
    influence
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

  it('drops picks when attribute under 8', () => {
    const v = get(attrs(7));
    const out = sanitizeMinorExpressionIds(['might-hold-fast'], v, 2);
    expect(out).toEqual([]);
  });

  it('caps at mastery rank', () => {
    const v = get(attrs(8, 8, 8, 8, 8));
    const out = sanitizeMinorExpressionIds(
      ['might-hold-fast', 'agility-soft-step', 'intellect-mage-hand'],
      v,
      2
    );
    expect(out.length).toBe(2);
    expect(out[0]).toBe('might-hold-fast');
    expect(out[1]).toBe('agility-soft-step');
  });

  it('getMinorExpressionDefinition resolves catalog id', () => {
    const d = getMinorExpressionDefinition('resolve-alarm');
    expect(d?.name).toBe('Alarm');
    expect(d?.attribute).toBe('resolve');
  });
});
