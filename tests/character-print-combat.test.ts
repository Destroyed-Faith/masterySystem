import { describe, expect, it } from 'vitest';
import {
  buildArtifactRowSpellPrintMeta,
  buildPrintCombatPreview,
  buildPrintCombatPreviewForArtifactRow,
  buildSpellPrintMeta,
} from '../src/sheets/character-print-combat.js';

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

function moonlightGreatsword(level: number, opts: { artifactWeapon?: boolean } = {}) {
  return {
    id: 'moonlight',
    type: 'artifact',
    name: 'Moonlight Greatsword',
    system: {
      binding: 'bound',
      baseProfile: 'twoHandedWeapon',
      currentLevel: level,
      level,
      description: 'Moonlight Greatsword attacks may use Might or Agility.',
      ...(opts.artifactWeapon
        ? { artifactWeapon: { weaponType: 'melee', damage: '8d8' } }
        : {}),
    },
  };
}

function meleeWeaponSinglePower(overrides: Record<string, unknown> = {}) {
  return {
    type: 'power',
    system: {
      slot: 'attack',
      cost: { action: 'attack' },
      subfamily: 'weapon-attack',
      templateId: 'active-melee-weapon-single',
      level: 4,
      levels: {
        '4': {
          type: 'Melee',
          effect: { dice: '+8d8', text: 'Weapon attack +8d8.' },
          mechanics: { damageRider: { flat: '+8d8' }, applyWhen: 'attack-rider' },
        },
      },
      ...overrides,
    },
  };
}

describe('buildPrintCombatPreview', () => {
  it('adds two-handed bound artifact weapon damage without baked artifactWeapon profile', () => {
    const weapon = moonlightGreatsword(4);
    const actor = mockActor({ might: 14, agility: 14 }, [weapon]);
    const preview = buildPrintCombatPreview(actor, meleeWeaponSinglePower(), [weapon]);
    expect(preview?.attackLabel).toBe('Might / Agility');
    expect(preview?.damage).toBe('WD 8d8 + 8d8');
  });

  it('prefers bound artifact weapon over legacy equipped Unarmed item', () => {
    const weapon = moonlightGreatsword(4);
    const legacyUnarmed = {
      id: 'u1',
      type: 'weapon',
      name: 'Unarmed',
      system: { weaponType: 'melee', damage: '1d8', equipped: true },
    };
    const actor = mockActor({ might: 14, agility: 14 }, [weapon, legacyUnarmed]);
    const ignite = {
      type: 'power',
      system: {
        slot: 'attack',
        cost: { action: 'attack' },
        templateId: 'active-melee-damage-t4',
        level: 4,
        levels: {
          '4': {
            type: 'Melee',
            effect: { dice: '+1d8' },
            mechanics: { damageRider: { flat: '+1d8' } },
            specials: [{ key: 'ignite', rank: 7 }],
          },
        },
      },
    };
    const preview = buildPrintCombatPreview(actor, ignite, [weapon, legacyUnarmed]);
    expect(preview?.damage).toBe('WD 8d8 + 1d8 + Ignite(7)');
  });

  it('includes weapon damage on weapon-attack powers even when mis-flagged as spell', () => {
    const weapon = moonlightGreatsword(4);
    const actor = mockActor({ intellect: 18, might: 14 }, [weapon]);
    const preview = buildPrintCombatPreview(
      actor,
      meleeWeaponSinglePower({ isSpell: true, castingAttribute: 'intellect' }),
      [weapon],
    );
    expect(preview?.damage).toBe('WD 8d8 + 8d8');
  });

  it('shows attribute pool for melee martial power (unarmed when no weapon)', () => {
    const actor = mockActor({ agility: 16, might: 12 });
    const preview = buildPrintCombatPreview(actor, meleePower({ tree: 'Grim Hunter' }), []);
    expect(preview?.attackLabel).toBe('Agility');
    expect(preview?.damage).toBe('WD 1d8 + 6d8');
  });

  it('adds melee weapon damage for matching martial power', () => {
    const weapon = meleeArtifact(4);
    const actor = mockActor({ might: 14 }, [weapon]);
    const preview = buildPrintCombatPreview(actor, meleePower(), [weapon]);
    expect(preview?.damage).toBe('WD 6d8 + 6d8');
  });

  it('excludes weapon damage for ranged spells', () => {
    const weapon = meleeArtifact(4);
    const actor = mockActor({ intellect: 18 }, [weapon]);
    const preview = buildPrintCombatPreview(actor, rangedSpellPower(), [weapon]);
    expect(preview?.attackLabel).toBe('Intellect');
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
    expect(preview?.damage).toContain('WD 1d8 + 6d8');
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

  it('shows heal dice and footnote without attack line', () => {
    const heal = {
      type: 'power',
      system: {
        slot: 'attack',
        cost: { action: 'attack' },
        subfamily: 'heal',
        level: 4,
        levels: {
          '4': {
            type: 'Self',
            mechanics: { healing: { flat: '10d8' } },
          },
        },
      },
    };
    const actor = mockActor({ resolve: 16 });
    const preview = buildPrintCombatPreview(actor, heal, []);
    expect(preview?.showAttack).toBe(false);
    expect(preview?.rollKind).toBe('heal');
    expect(preview?.damage).toBe('10d8');
    expect(preview?.footnote).toMatch(/Safe Haven Rest/i);
  });

  it('labels melee attacks and includes weapon damage on reactions', () => {
    const weapon = meleeArtifact(4);
    const reaction = {
      type: 'power',
      system: {
        slot: 'reaction',
        level: 4,
        levels: {
          '4': {
            type: 'Melee',
            mechanics: { damageRider: { flat: '4d8' } },
          },
        },
      },
    };
    const actor = mockActor({ might: 14 }, [weapon]);
    const preview = buildPrintCombatPreview(actor, reaction, [weapon], 'reaction');
    expect(preview?.attackKind).toBeUndefined();
    expect(preview?.showAttack).toBe(false);
    expect(preview?.damage).toBe('WD 6d8 + 4d8');
  });

  it('labels ranged AoE attacks', () => {
    const aoe = {
      type: 'power',
      system: {
        slot: 'attack',
        cost: { action: 'attack' },
        level: 4,
        levels: {
          '4': {
            type: 'Ranged AoE',
            effect: { dice: '6d8' },
            aoe: { shape: 'burst', radiusM: 3 },
          },
        },
      },
    };
    const actor = mockActor({ agility: 16 });
    const preview = buildPrintCombatPreview(actor, aoe, []);
    expect(preview?.attackKind).toBe('Ranged AoE Attack');
    expect(preview?.attackLabel).toBe('Agility');
  });

  it('buildSpellPrintMeta marks character powers flagged as spells', () => {
    expect(buildSpellPrintMeta({ isSpell: true, castingAttribute: 'resolve', spellResolution: 'saveSpell' })).toEqual({
      isSpell: true,
      spellLabel: 'Save Spell (Resolve)',
    });
    expect(buildSpellPrintMeta({ isSpell: false })).toEqual({ isSpell: false });
  });

  it('buildArtifactRowSpellPrintMeta marks artifact progression rows', () => {
    expect(
      buildArtifactRowSpellPrintMeta({
        isSpell: true,
        castingAttribute: 'intellect',
        spellResolution: 'spellAttack',
      }),
    ).toEqual({
      isSpell: true,
      spellLabel: 'Spell Attack (Intellect)',
    });
  });

  it('builds battle preview for artifact spell rows', () => {
    const actor = mockActor({ intellect: 18 });
    const preview = buildPrintCombatPreviewForArtifactRow(
      actor,
      {
        level: 2,
        name: 'Moonlight Judgment I',
        type: 'Ranged AoE',
        isSpell: true,
        castingAttribute: 'resolve',
        spellResolution: 'spellAttack',
        powerTemplateId: 'active-ranged-aoe-smite-attack',
      },
      [],
    );
    expect(preview?.attackLabel).toBe('Resolve');
    expect(preview?.showAttack).toBe(true);
  });
});
