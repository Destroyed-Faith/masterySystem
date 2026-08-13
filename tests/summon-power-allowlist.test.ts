import { describe, expect, it } from 'vitest';
import {
  evaluateSummonPower,
  isSummonPowerAllowed,
  summonPowerTokenCost,
} from '../src/stones/summon-power-allowlist';
import { powerTokenCostFromPp } from '../src/stones/summon-bond-rules';

describe('Summon power allowlist', () => {
  it('blocks movement powers that would bypass Bond Movement', () => {
    const ev = evaluateSummonPower('movement-trample', 1, 5);
    expect(ev.legal).toBe(false);
    expect(ev.reason).toMatch(/Movement/);
  });

  it('blocks powers not on the allowlist', () => {
    const ev = evaluateSummonPower('ab-growth-form', 1, 5);
    expect(ev.legal).toBe(false);
    expect(ev.reason).toMatch(/allowlist/);
  });

  it('allows listed powers under the MR cap and uses ceil(PP/10) min 1', () => {
    expect(isSummonPowerAllowed('ab-armor')).toBe(true);
    const ev = evaluateSummonPower('ab-armor', 1, 2);
    expect(ev.legal).toBe(true);
    expect(ev.tokenCost).toBe(summonPowerTokenCost('activeBuff', 1));
    expect(ev.tokenCost).toBe(powerTokenCostFromPp(ev.ppCost));
    expect(ev.tokenCost).toBeGreaterThanOrEqual(1);
  });

  it('marks over-MR powers illegal', () => {
    const ev = evaluateSummonPower('ab-armor', 8, 1);
    expect(ev.legal).toBe(false);
    expect(ev.reason).toMatch(/MR cap/);
  });
});
