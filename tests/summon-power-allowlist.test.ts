import { describe, expect, it } from 'vitest';
import {
  evaluateSummonPower,
  isSummonPowerAllowed,
  listSummonPowerCatalog,
  summonPowerTokenCost,
} from '../src/stones/summon-power-allowlist';
import { powerTokenCostFromPp } from '../src/stones/summon-bond-rules';

describe('Summon power purchases (open canonical catalog)', () => {
  it('allows Movement Powers — they replace normal Movement, no second Mode', () => {
    const ev = evaluateSummonPower('movement-trample', 1, 5);
    expect(ev.legal).toBe(true);
    expect(ev.reason).toMatch(/normal Movement/);
    expect(ev.tokenCost).toBe(powerTokenCostFromPp(ev.ppCost));
  });

  it('allows canonical powers previously outside the curated allowlist', () => {
    const ev = evaluateSummonPower('ab-growth-form', 1, 5);
    expect(ev.legal).toBe(true);
  });

  it('blocks powers requiring weapons/armor the Summon lacks (ab-damage, ab-armor)', () => {
    expect(isSummonPowerAllowed('ab-armor')).toBe(false);
    expect(isSummonPowerAllowed('ab-damage')).toBe(false);
    const ev = evaluateSummonPower('ab-armor', 1, 2);
    expect(ev.legal).toBe(false);
    expect(ev.reason).toMatch(/weapon|armor/i);
  });

  it('uses ceil(PP/10) min 1 for token costs', () => {
    const ev = evaluateSummonPower('ab-evade', 1, 2);
    expect(ev.legal).toBe(true);
    expect(ev.tokenCost).toBe(summonPowerTokenCost('activeBuff', 1));
    expect(ev.tokenCost).toBe(powerTokenCostFromPp(ev.ppCost));
    expect(ev.tokenCost).toBeGreaterThanOrEqual(1);
  });

  it('marks over-MR powers illegal', () => {
    const ev = evaluateSummonPower('ab-evade', 8, 1);
    expect(ev.legal).toBe(false);
    expect(ev.reason).toMatch(/MR cap/);
  });

  it('lists the full canonical catalog', () => {
    const catalog = listSummonPowerCatalog(5, 1);
    expect(catalog.length).toBeGreaterThan(50);
    expect(catalog.some((e) => e.category === 'movement' && e.legal)).toBe(true);
  });
});
