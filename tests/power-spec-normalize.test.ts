import { describe, it, expect } from 'vitest';
import {
  normalizePowerSpecial,
  normalizeAoeSpec,
  persistPowerMechanics,
} from '../src/utils/power-spec-normalize';
import type { PowerMechanics } from '../src/types/item';

describe('normalizePowerSpecial', () => {
  it('maps type/value to canonical key/rank and lowercases key', () => {
    const n = normalizePowerSpecial({ type: 'Shock', value: 1 });
    expect(n).toEqual({ key: 'shock', rank: 1 });
  });

  it('returns null without key or type', () => {
    expect(normalizePowerSpecial({ value: 2 })).toBeNull();
    expect(normalizePowerSpecial({})).toBeNull();
  });

  it('preserves raiseCost and note', () => {
    const n = normalizePowerSpecial({ key: 'Ignite', rank: 2, raiseCost: 2, note: 'vs ignited' });
    expect(n?.key).toBe('ignite');
    expect(n?.rank).toBe(2);
    expect(n?.raiseCost).toBe(2);
    expect(n?.note).toBe('vs ignited');
  });
});

describe('normalizeAoeSpec', () => {
  it('drops sizeM when radiusM is set for radius', () => {
    const n = normalizeAoeSpec({
      shape: 'radius',
      radiusM: 4,
      sizeM: 4,
      center: 'self',
    });
    expect(n?.radiusM).toBe(4);
    expect((n as any).sizeM).toBeUndefined();
  });

  it('maps sizeM to radiusM when only sizeM for zone', () => {
    const n = normalizeAoeSpec({
      shape: 'zone',
      sizeM: 6,
      targetFilter: 'enemies',
    });
    expect(n?.radiusM).toBe(6);
    expect((n as any).sizeM).toBeUndefined();
  });

  it('removes stray sizeM on cone', () => {
    const n = normalizeAoeSpec({ shape: 'cone', lengthM: 8, sizeM: 99 } as any);
    expect((n as any).sizeM).toBeUndefined();
  });
});

describe('persistPowerMechanics', () => {
  it('merges triggerLimit into usageLimit and removes triggerLimit', () => {
    const m = persistPowerMechanics({
      applyWhen: 'passive-slotted-active',
      armor: 1,
      triggerLimit: { per: 'round', max: 2 },
    } as PowerMechanics);
    expect(m.usageLimit).toEqual({ per: 'round', max: 2 });
    expect((m as any).triggerLimit).toBeUndefined();
  });

  it('clears conditionExpr when condition enum is set', () => {
    const m = persistPowerMechanics({
      applyWhen: 'passive-slotted-active',
      condition: 'targetIgnited',
      conditionExpr: 'targetIgnited',
      armor: 1,
    } as PowerMechanics);
    expect(m.condition).toBe('targetIgnited');
    expect(m.conditionExpr).toBeUndefined();
  });

  it('normalizes grantNextHitEffect.specials', () => {
    const m = persistPowerMechanics({
      applyWhen: 'activeBuff-active',
      grantNextHitEffect: {
        expires: 'endOfTurn',
        specials: [{ type: 'Expose', value: 1 } as any],
      },
    } as PowerMechanics);
    expect(m.grantNextHitEffect?.specials).toEqual([{ key: 'expose', rank: 1 }]);
  });
});
