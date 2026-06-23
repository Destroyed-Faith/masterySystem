import { describe, expect, it } from 'vitest';
import { buildPrintCombatPreview } from '../src/sheets/character-print-combat.js';

function mockActor(attrs: Record<string, number>, items: any[] = []) {
  return {
    system: {
      attributes: Object.fromEntries(
        Object.entries(attrs).map(([k, v]) => [k, { value: v }]),
      ),
    },
    items,
  };
}

function meleePower(overrides: Record<string, unknown> = {}) {
  return {
    type: 'power',
    system: {
      slot: 'attack',
      cost: { action: 'attack' },
      level: 4,
      levels: {
        '4': { type: 'Melee', effect: { dice: '6d8', text: 'Hit for 6d8.' } },
      },
      ...overrides,
    },
  };
}

function rangedSpellPower() {
  return {
    type: 'power',
    system: {
      slot: 'attack',
      cost: { action: 'attack' },
      isSpell: true,
      castingAttribute: 'intellect',
      level: 4,
      levels: {
        '4': { type: 'Ranged', effect: { dice: '8d8', text: 'Ranged spell.' } },
      },
    },
  };
}

function meleeArtifact(level: number, withSpellFocus = false) {
  return {
    id: 'art-1',
    type: 'artifact',
    name: withSpellFocus ? 'Focus Blade' : 'Sword',
    system: {
      equipped: true,
      slot: 'mainHand',
      baseProfile: 'oneHandedWeapon',
      currentLevel: level,
      ...(withSpellFocus
        ? { baseValues: [{ type: 'spellFocus', value: '2d8', slot: 'b' }] }
        : {}),
      artifactWeapon: { weaponType: 'melee', damage: '4d8' },
    },
  };
}

describe('buildPrintCombatPreview', () => {
  it('shows attribute pool for melee martial power (unarmed when no weapon)', () => {
    const actor = mockActor({ agility: 16, might: 12 });
    const preview = buildPrintCombatPreview(actor, meleePower({ tree: 'Grim Hunter' }), []);
    expect(preview?.attackLabel).toBe('Agility');
    expect(preview?.attackValue).toBe(16);
    expect(preview?.damage).toBe('1d8 + 6d8');
  });

  it('adds melee weapon damage for matching martial power', () => {
    const weapon = meleeArtifact(4);
    const actor = mockActor({ might: 14 }, [weapon]);
    const preview = buildPrintCombatPreview(actor, meleePower(), [weapon]);
    expect(preview?.damage).toBe('6d8 + 6d8');
  });

  it('excludes weapon damage for ranged spells', () => {
    const weapon = meleeArtifact(4);
    const actor = mockActor({ intellect: 18 }, [weapon]);
    const preview = buildPrintCombatPreview(actor, rangedSpellPower(), [weapon]);
    expect(preview?.attackLabel).toBe('Intellect');
    expect(preview?.attackValue).toBe(18);
    expect(preview?.damage).toBe('8d8');
    expect(preview?.damage).not.toContain('4d8');
  });

  it('adds spell focus bonus to spell damage only', () => {
    const weapon = meleeArtifact(4, true);
    const actor = mockActor({ intellect: 18 }, [weapon]);
    const preview = buildPrintCombatPreview(actor, rangedSpellPower(), [weapon]);
    expect(preview?.damage).toMatch(/10d8/);
    expect(preview?.damage).toMatch(/Spell Focus/i);
  });

  it('appends the chosen Special to the damage line', () => {
    const power = meleePower({
      levels: {
        '4': {
          type: 'Melee',
          effect: { dice: '6d8', text: 'Hit for 6d8.' },
          specials: [{ key: 'penetration', rank: 3 }],
        },
      },
    });
    const actor = mockActor({ might: 14 });
    const preview = buildPrintCombatPreview(actor, power, []);
    expect(preview?.damage).toContain('1d8 + 6d8');
    expect(preview?.damage).toContain('Penetration(3)');
  });

  it('skips the unbound SPECIAL placeholder', () => {
    const power = meleePower({
      levels: {
        '4': {
          type: 'Melee',
          effect: { dice: '6d8', text: 'Hit for 6d8.' },
          specials: [{ key: 'SPECIAL', rank: 3 }],
        },
      },
    });
    const actor = mockActor({ might: 14 });
    const preview = buildPrintCombatPreview(actor, power, []);
    expect(preview?.damage).not.toContain('SPECIAL');
  });

  it('activeBuff slot shows power damage only without attack or weapon', () => {
    const weapon = meleeArtifact(4);
    const actor = mockActor({ resolve: 16 }, [weapon]);
    const buff = {
      type: 'power',
      system: {
        slot: 'utility',
        cost: { action: 'utility' },
        level: 4,
        levels: {
          '4': {
            type: 'Self Buff',
            effect: { dice: '2d8', text: 'Gain armor aura.' },
            specials: [{ key: 'bulwark', rank: 2 }],
          },
        },
      },
    };
    const preview = buildPrintCombatPreview(actor, buff, [weapon], 'activeBuff');
    expect(preview?.showAttack).toBe(false);
    expect(preview?.attackLabel).toBe('');
    expect(preview?.damage).toBe('2d8 + Bulwark(2)');
    expect(preview?.damage).not.toContain('6d8');
  });
});
