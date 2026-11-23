/**
 * Protective Auras (v0.9.9.6): Armor / Evade / Spell Resistance Aura —
 * caster + allies in radius, never enemies, highest Active Buff bonus only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const distances = new Map<string, number>();
vi.mock('../src/combat/reaction-eligibility.js', () => ({
  distanceBetweenActorsMeters: (a: any, b: any) =>
    distances.get(`${a?.id}>${b?.id}`) ?? distances.get(`${b?.id}>${a?.id}`) ?? null,
}));

import { ACTIVE_BUFF_TEMPLATES } from '../src/utils/powers/templates/activeBuffs.js';
import {
  FINAL_ACTIVE_BUFF_TEMPLATE_IDS,
  isSelectableActiveBuffTemplateId,
} from '../src/utils/power-catalog.js';
import {
  PROTECTIVE_AURA_TEMPLATE_IDS,
  bestProtectiveAuraBonus,
  maintainedProtectiveAuras,
  protectiveAuraDelta,
} from '../src/combat/protective-aura-runtime.js';
import {
  activeBuffDefenseBonus,
  getTargetArmorBeforeAllOut,
  getTargetSpellResistance,
} from '../src/combat/target-defenses.js';

const RULES_VALUE = [1, 3, 5, 7, 9, 11, 13, 15, 15, 17, 19, 21, 23, 25, 27, 29];
const RULES_RADIUS = [2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3];

function auraEffect(stat: 'armor' | 'evade' | 'spellResistance', value: number, radiusM: number) {
  return {
    flags: { 'mastery-system': { activeBuff: true, mechanics: { protectiveAura: { stat, value, radiusM } } } },
  };
}

function makeActor(id: string, disposition: number, combat: Record<string, number> = {}, effects: any[] = []) {
  return {
    id,
    system: { combat: { armorTotal: 10, evadeTotal: 8, spellResistanceTotal: 0, ...combat } },
    effects,
    prototypeToken: { disposition },
    getFlag: () => undefined,
  };
}

function placeOnCanvas(actors: any[]) {
  vi.stubGlobal('canvas', {
    tokens: { placeables: actors.map((a) => ({ actor: a, document: { disposition: a.prototypeToken.disposition } })) },
  });
  vi.stubGlobal('game', { combat: null });
}

describe('Protective Aura catalogue', () => {
  it('three templates match the printed PL 1–16 bonus and radius', () => {
    for (const id of PROTECTIVE_AURA_TEMPLATE_IDS) {
      const tpl = ACTIVE_BUFF_TEMPLATES.find((t) => t.templateId === id);
      expect(tpl, id).toBeTruthy();
      for (let pl = 1; pl <= 16; pl++) {
        const mech = (tpl!.levels as any)[String(pl)].mechanics.protectiveAura;
        expect(mech.value, `${id} PL${pl}`).toBe(RULES_VALUE[pl - 1]);
        expect(mech.radiusM, `${id} PL${pl}`).toBe(RULES_RADIUS[pl - 1]);
        expect((tpl!.levels as any)[String(pl)].mechanics.armor).toBeUndefined();
      }
      expect(isSelectableActiveBuffTemplateId(id)).toBe(true);
    }
    expect(FINAL_ACTIVE_BUFF_TEMPLATE_IDS).toHaveLength(36);
  });

  it('Artifact Armor Aura effects without a mechanics snapshot resolve from template id + PL', () => {
    const owner = makeActor('o', 1, {}, [
      { flags: { 'mastery-system': { activeBuff: true, powerTemplateId: 'ab-armor-aura', effectiveLevel: 10 } } },
    ]);
    expect(maintainedProtectiveAuras(owner)).toEqual([{ stat: 'armor', value: 17, radiusM: 3 }]);
  });
});

describe('Protective Aura runtime', () => {
  beforeEach(() => distances.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('affects the caster and allies in radius; never enemies; leaves on exit', () => {
    const caster = makeActor('caster', 1, {}, [auraEffect('armor', 7, 2)]);
    const ally = makeActor('ally', 1);
    const foe = makeActor('foe', -1);
    placeOnCanvas([caster, ally, foe]);
    distances.set('caster>ally', 2);
    distances.set('caster>foe', 1);

    expect(bestProtectiveAuraBonus(caster, 'armor')).toBe(7);
    expect(bestProtectiveAuraBonus(ally, 'armor')).toBe(7);
    expect(bestProtectiveAuraBonus(foe, 'armor')).toBe(0);
    expect(bestProtectiveAuraBonus(ally, 'evade')).toBe(0);

    distances.set('caster>ally', 2.5);
    expect(bestProtectiveAuraBonus(ally, 'armor')).toBe(0);
  });

  it('rulebook example: Auras +7 and +13 plus own Armor Buff +8 → only +13', () => {
    const a = makeActor('a', 1, {}, [auraEffect('armor', 7, 2)]);
    const b = makeActor('b', 1, {}, [auraEffect('armor', 13, 2)]);
    const c = makeActor('c', 1, { armorFromActiveBuffs: 8 });
    placeOnCanvas([a, b, c]);
    distances.set('a>c', 1);
    distances.set('b>c', 2);

    expect(protectiveAuraDelta(c, 'armor', 8)).toBe(5);
    expect(activeBuffDefenseBonus(c, 'armor')).toBe(13);
    // Equipment / Passive Armor (armorTotal 10) still adds normally.
    expect(getTargetArmorBeforeAllOut(c)).toBe(23);
  });

  it('own Active Buff higher than every Aura keeps its own value', () => {
    const a = makeActor('a', 1, {}, [auraEffect('evade', 7, 2)]);
    const c = makeActor('c', 1, { evadeFromActiveBuffs: 16 });
    placeOnCanvas([a, c]);
    distances.set('a>c', 1);
    expect(activeBuffDefenseBonus(c, 'evade')).toBe(16);
  });

  it('Spell Resistance Aura raises Spell Resistance of allies in range', () => {
    const a = makeActor('a', 1, {}, [auraEffect('spellResistance', 17, 3)]);
    const c = makeActor('c', 1);
    placeOnCanvas([a, c]);
    distances.set('a>c', 3);
    expect(getTargetSpellResistance(c)).toBe(17);
  });
});
