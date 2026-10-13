import { describe, expect, it } from 'vitest';
import { sumUnconditionalPassiveDamageFormula } from '../src/utils/power-mechanics';

function actorWithPassive(opts: {
  templateId?: string;
  name: string;
  rank?: number;
  damageRiderFlat?: string;
  vsCondition?: string;
  conditionExpr?: string;
  rollDiceDamage?: number;
}) {
  return {
    id: 'pc1',
    type: 'character',
    system: {},
    items: [
      {
        id: 'p1',
        type: 'power',
        name: opts.name,
        system: {
          powerType: 'passive',
          category: 'passive',
          ...(opts.templateId ? { templateId: opts.templateId } : {}),
          rank: opts.rank ?? 1,
          // Inline mechanics when no catalog match / for legacy fields.
          mechanics: {
            ...(opts.damageRiderFlat || opts.vsCondition
              ? {
                  damageRider: {
                    flat: opts.damageRiderFlat,
                    ...(opts.vsCondition ? { vsCondition: opts.vsCondition } : {}),
                  },
                }
              : {}),
            ...(opts.conditionExpr ? { conditionExpr: opts.conditionExpr } : {}),
            ...(opts.rollDiceDamage != null
              ? { rollDice: { damage: opts.rollDiceDamage } }
              : {}),
          },
        },
      },
    ],
  };
}

describe('sumUnconditionalPassiveDamageFormula', () => {
  it('sums catalog Passive: Damage (damageRider.flat) at rank with dice', () => {
    // L4 Killing Intent = +2d8 (L1 is empty by design).
    const actor = actorWithPassive({
      templateId: 'passive-killing-intent',
      name: 'Passive: Damage',
      rank: 4,
    });
    expect(sumUnconditionalPassiveDamageFormula(actor)).toBe('2d8');
  });

  it('sums inline unconditional damageRider.flat without templateId', () => {
    const actor = actorWithPassive({
      name: 'Homebrew Damage',
      damageRiderFlat: '+3d8',
    });
    expect(sumUnconditionalPassiveDamageFormula(actor)).toBe('3d8');
  });

  it('ignores vsCondition / conditionExpr riders (conditional path)', () => {
    expect(
      sumUnconditionalPassiveDamageFormula(
        actorWithPassive({
          name: 'Conditional Hex',
          damageRiderFlat: '+3d8',
          vsCondition: 'hexed',
        }),
      ),
    ).toBe('0');
    expect(
      sumUnconditionalPassiveDamageFormula(
        actorWithPassive({
          name: 'Conditional Momentum',
          damageRiderFlat: '+1d8',
          conditionExpr: 'self.hasMoved',
        }),
      ),
    ).toBe('0');
  });

  it('still counts legacy rollDice.damage', () => {
    const actor = actorWithPassive({
      name: 'Legacy Damage',
      rollDiceDamage: 1,
    });
    expect(sumUnconditionalPassiveDamageFormula(actor)).toBe('1d8');
  });
});
