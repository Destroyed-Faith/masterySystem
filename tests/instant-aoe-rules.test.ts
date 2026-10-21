/**
 * Instant AoE rules (Destroyed Faith Active Powers catalogue):
 *   - ONE shared Attack/Casting roll, ONE shared Power damage roll
 *   - NO Primary Target, NO Weapon Damage, NO Spell Focus damage
 *   - Pure Special AoEs deal zero Power damage
 *   - Single-target Powers keep weapon / Spell Focus damage
 */
import { describe, expect, it } from 'vitest';
import {
  isInstantAoeFlags,
  martialWeaponDamageApplies,
  spellFocusDamageApplies,
} from '../src/combat/damage-transfer.js';
import {
  aoeCreatureHitCheck,
  toSharedAoeDamagePayload,
  withInstantAoeFlags,
} from '../src/combat/aoe-melee-resolution.js';
import { excludeAlliesFromAoePool } from '../src/combat/aoe-target-filter.js';
import { ACTIVE_TEMPLATES } from '../src/utils/powers/templates/actives';
import { getTemplate } from '../src/utils/powers/index.js';

// Printed catalogue tables: [radiusM, dice] per Power Level 1..16.
const MELEE_AOE: ReadonlyArray<[number, number]> = [
  [2, 1], [2, 2], [3, 2], [3, 4], [4, 4], [4, 6], [5, 6], [5, 7],
  [6, 7], [6, 7], [7, 7], [7, 7], [8, 7], [8, 9], [8, 11], [8, 13],
];
const RANGED_AOE: ReadonlyArray<[number, number]> = [
  [2, 1], [2, 2], [3, 2], [3, 3], [4, 3], [4, 4], [5, 4], [5, 4],
  [6, 4], [6, 4], [7, 4], [7, 5], [7, 5], [8, 5], [8, 6], [8, 8],
];

describe('Melee / Ranged AoE Attack PL tables', () => {
  it('Melee AoE Attack PL1–16 match the catalogue (radius + Power dice)', () => {
    const tpl = getTemplate('active-melee-weapon-aoe')!;
    expect(tpl).toBeTruthy();
    MELEE_AOE.forEach(([radius, dice], i) => {
      const row: any = (tpl.levels as any)[String(i + 1)];
      expect(row.aoe.radiusM, `PL${i + 1} radius`).toBe(radius);
      expect(row.effect.dice, `PL${i + 1} dice`).toBe(`+${dice}d8`);
      expect(row.mechanics.damageRider?.flat, `PL${i + 1} rider`).toBe(`+${dice}d8`);
      expect(row.aoe.center).toBe('self');
    });
  });

  it('Ranged AoE Attack PL1–16 match the catalogue (range, radius, Power dice)', () => {
    const tpl = getTemplate('active-ranged-weapon-aoe')!;
    expect(tpl).toBeTruthy();
    RANGED_AOE.forEach(([radius, dice], i) => {
      const lvl = i + 1;
      const row: any = (tpl.levels as any)[String(lvl)];
      expect(row.range.m, `PL${lvl} range`).toBe(8 + 4 * (lvl - 1));
      expect(row.aoe.radiusM, `PL${lvl} radius`).toBe(radius);
      expect(row.effect.dice, `PL${lvl} dice`).toBe(`+${dice}d8`);
      expect(row.mechanics.damageRider?.flat, `PL${lvl} rider`).toBe(`+${dice}d8`);
      expect(row.aoe.center).toBe('targetPoint');
    });
  });

  it('PL1 now deals 1d8 Power damage (was 0)', () => {
    for (const id of ['active-melee-weapon-aoe', 'active-ranged-weapon-aoe']) {
      const row: any = (getTemplate(id)!.levels as any)['1'];
      expect(row.effect.dice).toBe('+1d8');
      expect(row.effect.text).toContain('**1d8 Power damage**');
    }
  });

  it('effect text says Power damage only — never weapon damage', () => {
    for (const id of ['active-melee-weapon-aoe', 'active-ranged-weapon-aoe']) {
      const tpl = getTemplate(id)!;
      expect(tpl.fluff ?? '').not.toMatch(/weapon damage/i);
      for (let lvl = 1; lvl <= 16; lvl++) {
        const text: string = (tpl.levels as any)[String(lvl)].effect.text;
        expect(text, `${id} PL${lvl}`).not.toMatch(/weapon damage/i);
        expect(text, `${id} PL${lvl}`).toContain('Power damage');
      }
    }
    const pl6: string = (getTemplate('active-melee-weapon-aoe')!.levels as any)['6'].effect.text;
    expect(pl6).toContain('Every creature hit takes **6d8 Power damage**');
  });

  it('keeps the stable template ids', () => {
    expect(getTemplate('active-melee-weapon-aoe')?.templateId).toBe('active-melee-weapon-aoe');
    expect(getTemplate('active-ranged-weapon-aoe')?.templateId).toBe('active-ranged-weapon-aoe');
  });
});

describe('Pure Special AoE templates deal no Power damage', () => {
  const pureSpecialAoe = ACTIVE_TEMPLATES.filter((t) => /^active-(melee|ranged)-aoe-damage-t[3-6]$/.test(t.templateId));

  it('finds all eight tier AoE templates', () => {
    expect(pureSpecialAoe.map((t) => t.templateId).sort()).toEqual(
      [3, 4, 5, 6].flatMap((tier) => [`active-melee-aoe-damage-t${tier}`, `active-ranged-aoe-damage-t${tier}`]).sort(),
    );
  });

  it('has zero Power damage dice and no weapon / Spell Focus wording at every PL', () => {
    for (const tpl of pureSpecialAoe) {
      for (let lvl = 1; lvl <= 16; lvl++) {
        const row: any = (tpl.levels as any)[String(lvl)];
        expect(row.effect.dice, `${tpl.templateId} PL${lvl}`).toBeUndefined();
        expect(row.mechanics.damageRider, `${tpl.templateId} PL${lvl}`).toBeUndefined();
        expect(row.effect.text).toContain('no Power damage');
        expect(row.effect.text).not.toMatch(/takes weapon damage/i);
        expect(row.specials.length).toBe(1);
        expect(row.specials[0].key).toBe('SPECIAL');
      }
    }
  });

  it('Targeted Special AoE (Instant AoE) does not promise weapon damage', () => {
    for (const id of ['active-melee-aoe-targeted-special', 'active-ranged-aoe-targeted-special']) {
      const text: string = (getTemplate(id)!.levels as any)['1'].effect.text;
      expect(text).not.toMatch(/takes weapon damage/i);
      expect(text).toContain('no Power damage');
    }
  });
});

describe('martialWeaponDamageApplies / spellFocusDamageApplies', () => {
  it('single-target Powers keep weapon damage', () => {
    expect(martialWeaponDamageApplies({})).toBe(true);
    expect(martialWeaponDamageApplies({ ignoreWeaponDamage: false, powerIsSpell: false })).toBe(true);
    expect(martialWeaponDamageApplies({ aoeMeleeWeapon: false, instantAoe: false })).toBe(true);
  });

  it('is false when ignoreWeaponDamage or spell delivery is set', () => {
    expect(martialWeaponDamageApplies({ ignoreWeaponDamage: true })).toBe(false);
    expect(martialWeaponDamageApplies({ powerIsSpell: true })).toBe(false);
    expect(martialWeaponDamageApplies({ npcIsSpell: true })).toBe(false);
  });

  it('is false for every Instant AoE flag spelling', () => {
    expect(martialWeaponDamageApplies({ aoeMeleeWeapon: true })).toBe(false);
    expect(martialWeaponDamageApplies({ aoeMeleeWeapon: 'true' })).toBe(false);
    expect(martialWeaponDamageApplies({ instantAoe: true })).toBe(false);
    expect(martialWeaponDamageApplies({ instantAoe: 'true' })).toBe(false);
    expect(isInstantAoeFlags({ aoeMeleeWeapon: true })).toBe(true);
    expect(isInstantAoeFlags({})).toBe(false);
    expect(isInstantAoeFlags(null)).toBe(false);
  });

  it('Spell Focus: single-target Spells keep it, Instant AoE never gets it', () => {
    expect(spellFocusDamageApplies({ isSpell: true })).toBe(true);
    expect(spellFocusDamageApplies({ isSpell: false })).toBe(false);
    expect(spellFocusDamageApplies({ isSpell: true, isNpcAttackFlow: true })).toBe(false);
    expect(spellFocusDamageApplies({ isSpell: true, aoeMeleeWeapon: true })).toBe(false);
    expect(spellFocusDamageApplies({ isSpell: true, instantAoe: 'true' })).toBe(false);
  });

  it('withInstantAoeFlags forces Power-only damage rules', () => {
    const flags = withInstantAoeFlags({ selectedPowerId: 'p1', ignoreWeaponDamage: false });
    expect(flags.ignoreWeaponDamage).toBe(true);
    expect(flags.instantAoe).toBe(true);
    expect(flags.aoeMeleeWeapon).toBe(true);
    expect(flags.selectedPowerId).toBe('p1');
    expect(martialWeaponDamageApplies(flags)).toBe(false);
    expect(spellFocusDamageApplies({ isSpell: true, ...flags })).toBe(false);
    expect(withInstantAoeFlags(null).instantAoe).toBe(true);
  });
});

describe('Shared roll, no primary', () => {
  it('one raw Power damage total applies unchanged to N targets', () => {
    const shared = toSharedAoeDamagePayload({
      totalDamage: 27,
      count8s: 2,
      specialsUsed: ['Slow(4)'],
      rollDetails: ['Power: 6d8'],
    });
    expect(shared).not.toBeNull();
    const targets = ['a', 'b', 'c', 'd'];
    const applied = targets.map(() => shared!.totalDamage);
    expect(new Set(applied)).toEqual(new Set([27]));
    // Every target gets the full printed Special; nothing is distributed.
    for (const _ of targets) expect(shared!.specialsUsed).toEqual(['Slow(4)']);
  });

  it('the payload carries no primary designation', () => {
    const shared = toSharedAoeDamagePayload({ totalDamage: 5 })!;
    expect(Object.keys(shared)).not.toContain('primaryTokenId');
    expect(shared.specialsAppliedToTargetId).toBeUndefined();
  });

  it('one attack total is checked separately against each creature (no primary needed)', () => {
    const total = 14;
    const evades = [8, 14, 15, 20];
    const hits = evades.map((tn) => aoeCreatureHitCheck({ attackTotal: total, normalTn: tn, declaredRaiseSlots: 0 }).hit);
    expect(hits).toEqual([true, true, false, false]);
  });

  it('ally filter keeps order and never promotes a primary', () => {
    const attacker = { actor: { id: 'pc1', type: 'character' } };
    const tokens: Record<string, any> = {
      a: { actor: { id: 'pc2', type: 'character' } },
      b: { actor: { id: 'n1', type: 'npc' }, document: { disposition: -1 } },
      c: { actor: { id: 'n2', type: 'npc' }, document: { disposition: -1 } },
    };
    const out = excludeAlliesFromAoePool(attacker, ['a', 'b', 'c'], (id) => tokens[id]);
    expect(out).toEqual(['b', 'c']);
  });

  it('Instant AoE flow no longer imports the Primary Target dialog', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../src/token-action-selector.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/promptMeleeAoePrimaryChoice/);
    expect(src).not.toMatch(/melee-aoe-primary-dialog/);
  });
});
