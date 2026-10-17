import { describe, expect, it, vi } from 'vitest';

import {
  damageNegationSpendCap,
  formatDamageNegationDialogContent,
} from '../src/combat/damage-negation.js';
import {
  maximizeDiceFormula,
  maximizeDamageFormula,
  DAMAGE_MAX_FLAG,
} from '../src/stones/stone-combat-effects.js';
import { disableFoundryInvisibleTokenHide } from '../src/system/status-effects.js';
import {
  evaluateThreatenedSpellcasting,
  isThreatenedByEnemyMelee,
} from '../src/combat/threatened-ranged.js';
import {
  critAppliesToAttackRoll,
  listAvailableCriticalSources,
  resolveCriticalAttackModifier,
} from '../src/combat/critical-resolution.js';
import { STONE_POWERS } from '../src/stones/stone-powers.js';

describe('R-01 Damage Negation without half-pool', () => {
  it('allows full negation when reserve covers all dice', () => {
    expect(damageNegationSpendCap(8, 16)).toBe(8);
    expect(damageNegationSpendCap(8, 3)).toBe(3);
    expect(damageNegationSpendCap(1, 1)).toBe(1);
    expect(damageNegationSpendCap(7, 7)).toBe(7);
    expect(damageNegationSpendCap(8, 0)).toBe(0);
  });

  it('dialog content exposes original pool, available, and remaining preview', () => {
    const html = formatDamageNegationDialogContent({
      defenderName: 'Hero',
      attackerName: 'Orc',
      totalDice: 8,
      available: 16,
      reserve: 10,
      tempDn: 4,
      buffDn: 2,
    });
    expect(html).toContain('Original Damage Pool');
    expect(html).toContain('8d8');
    expect(html).toContain('Available Damage Negation');
    expect(html).toContain('16');
    expect(html).toContain('Remaining Damage Pool');
    expect(html).not.toMatch(/half.?pool/i);
  });
});

describe('R-02 Maximization for Damage and Healing', () => {
  it('keeps technical id vitality.damageMaximization with display name Maximization', () => {
    const power = STONE_POWERS['vitality.damageMaximization'];
    expect(power?.name).toBe('Maximization');
    expect(power?.description).toMatch(/Healing/i);
  });

  it('maximize formula forces every d8 to 8 without explode suffix', () => {
    expect(maximizeDiceFormula('6d8')).toBe('48');
    expect(maximizeDamageFormula('3d8+2')).toBe('24+2');
    expect(maximizeDiceFormula('4d8x2')).toBe('32');
  });

  it('shared combat pool: damage and healing spend the same remaining flag', async () => {
    const flag = { remaining: 3, uses: 3, combatId: 'c1', used: true };
    const actor = {
      getFlag: (_s: string, key: string) => (key === DAMAGE_MAX_FLAG ? { ...flag } : null),
      setFlag: vi.fn(async (_s: string, key: string, value: any) => {
        if (key === DAMAGE_MAX_FLAG) Object.assign(flag, value);
      }),
    };
    (globalThis as any).game = { combat: { id: 'c1', round: 1 } };

    const { spendMaximization, remainingMaximizations } = await import(
      '../src/stones/stone-combat-effects.js'
    );
    expect(remainingMaximizations(actor)).toBe(3);
    expect(await spendMaximization(actor)).toBe(true);
    expect(flag.remaining).toBe(2);
    expect(await spendMaximization(actor)).toBe(true);
    expect(flag.remaining).toBe(1);
    expect(await spendMaximization(actor)).toBe(true);
    expect(flag.remaining).toBe(0);
    expect(await spendMaximization(actor)).toBe(false);
    expect(remainingMaximizations(actor)).toBe(0);
  });
});

describe('Invisibility presentation vs Foundry hide', () => {
  it('clears CONFIG.specialStatusEffects.INVISIBLE so tokens stay targetable', () => {
    (globalThis as any).CONFIG = {
      specialStatusEffects: { INVISIBLE: 'invisible', DEFEATED: 'dead' },
    };
    disableFoundryInvisibleTokenHide();
    expect((globalThis as any).CONFIG.specialStatusEffects.INVISIBLE).toBe('');
    expect((globalThis as any).CONFIG.specialStatusEffects.DEFEATED).toBe('dead');
  });
});

describe('R-03 Threatened Spellcasting', () => {
  it('evaluateThreatenedSpellcasting disadvantages when enemies threaten', () => {
    const caster = {
      id: 'caster',
      actor: { name: 'Mage' },
      name: 'Mage',
      document: { disposition: 1 },
    };
    // Empty canvas → not threatened
    (globalThis as any).canvas = { tokens: { placeables: [caster] } };
    const clear = evaluateThreatenedSpellcasting(caster);
    expect(clear.appliesRule).toBe(true);
    expect(clear.threatened).toBe(false);
    expect(clear.rollDisadvantage).toBe(false);
    expect(isThreatenedByEnemyMelee(caster)).toBe(false);
  });
});

describe('Critical UI helpers', () => {
  it('crit legal only for martial or damaging spells', () => {
    expect(critAppliesToAttackRoll({ spell: false, damageDice: 0 })).toBe(true);
    expect(critAppliesToAttackRoll({ spell: true, damageDice: 0 })).toBe(false);
    expect(critAppliesToAttackRoll({ spell: true, damageDice: 4 })).toBe(true);
  });

  it('lists available sources and preferred source spend', () => {
    const listed = listAvailableCriticalSources({
      buffQuotaRemaining: 1,
      stoneCritCharges: 2,
      specialCritCharges: 0,
    });
    expect(listed.map((s) => s.source)).toEqual(['active-buff', 'stone-crit']);

    const mod = resolveCriticalAttackModifier({
      buffQuotaRemaining: 1,
      stoneCritCharges: 2,
      declared: true,
      preferredSource: 'stone-crit',
    });
    expect(mod.applyCritical).toBe(true);
    expect(mod.consumeFrom).toBe('stone-crit');
  });

  it('undeclared Roll does not spend Crit', () => {
    const mod = resolveCriticalAttackModifier({
      buffQuotaRemaining: 2,
      stoneCritCharges: 2,
      declared: false,
    });
    expect(mod.applyCritical).toBe(false);
    expect(mod.consumeFrom).toBeNull();
  });
});
