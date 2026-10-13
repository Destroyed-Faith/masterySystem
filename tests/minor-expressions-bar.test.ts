import { describe, expect, it } from 'vitest';
import {
  buildMinorExpressionsBarModel,
  clampMinorExpressionsBarPosition,
  minorExpressionUsesMax,
  resolveMinorExpressionsBarActor,
  sanitizeMinorExpressionsBarPosition,
} from '../src/system/minor-expressions-bar';

function actor(opts: {
  ids?: string[];
  might?: number;
  rank?: number;
  uses?: number;
}) {
  return {
    id: 'a1',
    type: 'character',
    system: {
      mastery: { rank: opts.rank ?? 2 },
      attributes: { might: { value: opts.might ?? 9 }, agility: { value: 3 } },
      minorExpressions: opts.ids ?? ['might-hold-fast', 'agility-unknown-id', 'might-hold-fast'],
    },
    flags: opts.uses != null ? { 'mastery-system': { minorExpressionUses: opts.uses } } : {},
    getFlag(scope: string, key: string) {
      return (this.flags as any)?.[scope]?.[key];
    },
  };
}

describe('Minor Expressions bar model', () => {
  it('lists known ids once with the resolved tier text', () => {
    const model = buildMinorExpressionsBarModel(actor({}));
    expect(model.rows.map((r) => r.id)).toEqual(['might-hold-fast']);
    expect(model.rows[0]).toMatchObject({ attribute: 'might', attributeValue: 9, tier: 8 });
    expect(model.rows[0].body.length).toBeGreaterThan(10);
  });

  it('locks below attribute 4 (tier null, tagline as body)', () => {
    const model = buildMinorExpressionsBarModel(actor({ might: 3 }));
    expect(model.rows[0].tier).toBeNull();
    expect(model.rows[0].body).toBe(model.rows[0].tagline);
  });

  it('budget is Mastery Rank × 2 and uses are clamped', () => {
    expect(minorExpressionUsesMax(3)).toBe(6);
    const model = buildMinorExpressionsBarModel(actor({ rank: 2, uses: 9 }));
    expect(model).toMatchObject({ usesMax: 4, usesSpent: 4, usesLeft: 0 });
    const fresh = buildMinorExpressionsBarModel(actor({ rank: 2 }));
    expect(fresh).toMatchObject({ usesSpent: 0, usesLeft: 4 });
  });
});

describe('Minor Expressions bar actor + position', () => {
  it('prefers the assigned character, else the first owned one, never for the GM', () => {
    const owned = { id: 'o', type: 'character', isOwner: true };
    const assigned = { id: 'c', type: 'character' };
    expect(resolveMinorExpressionsBarActor({ isGM: true, character: assigned }, [owned])).toBeNull();
    expect(resolveMinorExpressionsBarActor({ isGM: false, character: assigned }, [owned])).toBe(assigned);
    expect(resolveMinorExpressionsBarActor({ isGM: false }, [{ id: 'n', type: 'npc', isOwner: true }, owned])).toBe(
      owned,
    );
  });

  it('sanitizes and clamps the stored position', () => {
    expect(sanitizeMinorExpressionsBarPosition({ x: '12.4', y: 20 })).toEqual({ x: 12, y: 20 });
    expect(sanitizeMinorExpressionsBarPosition(null)).toEqual({ x: 90, y: 160 });
    expect(
      clampMinorExpressionsBarPosition({ x: 5000, y: -50 }, { width: 1000, height: 800 }, { width: 200, height: 100 }),
    ).toEqual({ x: 792, y: 8 });
  });
});
