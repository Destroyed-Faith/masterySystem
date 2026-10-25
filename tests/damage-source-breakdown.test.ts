/**
 * Damage sources must stay separate in UI / roll buckets:
 * Spell Focus, Power, Passive, Active Buff, Specials — never merge Focus into Power.
 */
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  calculateDamageResult,
  formatDamageSpecialsLabel,
  summarizeActiveBuffDamage,
} from '../src/dice/damage-dialog.js';

function installMinimalDamageWorld(): void {
  const g = globalThis as any;
  g.game = {
    user: { id: 'gm', isGM: true },
    combat: null,
    actors: { get: () => null },
    messages: { get: () => null },
  };
  g.Hooks = { callAll: () => undefined, on: () => undefined, off: () => undefined };
  g.ChatMessage = { create: async () => ({ id: 'chat' }), getSpeaker: () => ({}) };
  g.ui = { notifications: { warn: () => undefined, info: () => undefined, error: () => undefined } };
  g.canvas = { ready: false, tokens: { placeables: [] } };
  g.Roll = class {
    formula: string;
    total: number;
    terms: any[];
    constructor(formula: string) {
      this.formula = formula;
      // Deterministic: Nd8 → N*4 so pools stay distinguishable by total.
      const match = String(formula).match(/(\d+)d8/i);
      const n = match ? Number(match[1]) : 0;
      this.total = n * 4;
      this.terms = n
        ? [
            {
              faces: 8,
              results: Array.from({ length: n }, () => ({ result: 4, active: true })),
            },
          ]
        : [];
    }
    async evaluate() {
      return this;
    }
  };
}

describe('damage source breakdown helpers', () => {
  it('formats Specials for chat as Name(N) list', () => {
    const label = formatDamageSpecialsLabel([
      'Expose(3)',
      'Armor Penetration 8 (reduces Armor for this hit)',
      'Hex(5)',
      'Red Hunt I (buff damage)',
      'Expose(3)',
      'Maximization: every d8 is 8',
    ]);
    expect(label).toBe('Expose(3), Hex(5)');
  });

  it('summarizes unconditional Active Buff damage riders', () => {
    const actor = {
      items: {
        contents: [],
        values: () => [],
        [Symbol.iterator]: function* () {},
      },
      system: {},
      getFlag: () => undefined,
    } as any;
    // Empty actor → no buffs
    expect(summarizeActiveBuffDamage(actor)).toEqual({ formula: '0', sources: [] });
  });
});

describe('Spell Focus is not merged into Power (source contract)', () => {
  it('showDamageDialog keeps powerDamage free of Focus merge', () => {
    const src = readFileSync(new URL('../src/dice/damage-dialog.ts', import.meta.url), 'utf8');
    // Must not reintroduce: powerDamage = addD8DiceToFormula(powerDamage, spellFocusBonusDice)
    expect(src).not.toMatch(
      /powerDamage\s*=\s*addD8DiceToFormula\(\s*powerDamage\s*,\s*spellFocusBonusDice\s*\)/,
    );
    expect(src).toMatch(/rollDiceWithDetail\(\s*`\$\{spellFocusDiceLeft\}d8`\s*,\s*'Spell Focus'/);
    expect(src).toMatch(/spellFocusDice:\s*Math\.max\(0,\s*Math\.floor\(Number\(flags\.spellFocusDice\)/);
    expect(src).toMatch(/Active Buff:/);
    expect(src).toMatch(/specialsLabel/);
  });

  it('attack-roll chat summary lists typed totals including Spell Focus and Special', () => {
    const src = readFileSync(new URL('../src/chat/attack-roll-handler.ts', import.meta.url), 'utf8');
    expect(src).toMatch(/Spell Focus: \$\{damageResult\.spellFocusDamage\}/);
    expect(src).toMatch(/Active Buff: \$\{damageResult\.activeBuffDamage\}/);
    expect(src).toMatch(/mastery-damage-specials/);
    expect(src).toMatch(/<strong>Special:<\/strong>/);
  });
});

describe('calculateDamageResult rolls Spell Focus separately from Power', () => {
  beforeEach(() => {
    installMinimalDamageWorld();
  });

  it('2d8 Power + 7 Focus → Power total 8, Focus total 28 (not Power 36)', async () => {
    const attacker = {
      id: 'atk',
      name: 'Caster',
      type: 'character',
      items: { contents: [], values: () => [], [Symbol.iterator]: function* () {} },
      system: { mastery: { rank: 3 }, health: { bars: [{ current: 40, max: 40 }] } },
      getFlag: () => undefined,
      update: async () => undefined,
    } as any;
    const target = {
      id: 'tgt',
      name: 'Foe',
      type: 'npc',
      items: { contents: [], values: () => [], [Symbol.iterator]: function* () {} },
      system: {
        mastery: { rank: 1 },
        health: { bars: [{ current: 40, max: 40 }], currentBar: 0, tempHP: 0 },
        combat: { armorTotal: 0, damageReductionPct: 0 },
        statusEffects: [],
      },
      getFlag: () => undefined,
      update: async () => undefined,
      sheet: { rendered: false },
    } as any;

    const result = await calculateDamageResult(
      '0',
      '2d8',
      '0',
      0,
      new Map(),
      [],
      attacker,
      target,
      0,
      0,
      [],
      null,
      false,
      'ranged',
      false, // no faith reroll
      undefined,
      true, // skip apply
      true, // skip phasing
      { spellFocusDice: 7 },
    );

    expect(result.powerDamage).toBe(8); // 2*4
    expect(result.spellFocusDamage).toBe(28); // 7*4
    expect(result.totalDamage).toBe(36);
    const details = result.rollDetails || [];
    expect(details.some((l) => /^Spell Focus:/.test(l))).toBe(true);
    expect(details.some((l) => /^Power:/.test(l))).toBe(true);
    expect(details.some((l) => /^Power:.*9d8/.test(l))).toBe(false);
  });
});
