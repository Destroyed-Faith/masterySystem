import { describe, expect, it } from 'vitest';
import { buildCharacterCompactPrintContext } from '../src/sheets/character-print';

function alarisActor() {
  return {
    type: 'character',
    name: 'Alaris',
    img: 'https://assets.forge-vtt.com/6727fe2e3c793ad173f66d6b/destroyed-Faith%20Adventures/Players/Alaris.png',
    system: {
      bio: { echo: 'Elves' },
      echo: { key: 'elorians', selectedCardIds: ['unseen-grace'] },
      mastery: { rank: 2 },
      attributes: {
        might: { value: 8 },
        agility: { value: 10 },
        vitality: { value: 11 },
        intellect: { value: 8 },
        resolve: { value: 8 },
        influence: { value: 4 },
        wits: { value: 8 },
      },
      stonePools: {
        might: { current: 1, max: 1 },
        agility: { current: 1, max: 1 },
        vitality: { current: 1, max: 1 },
        intellect: { current: 1, max: 1 },
        resolve: { current: 1, max: 1 },
        influence: { current: 0, max: 0 },
        wits: { current: 1, max: 1 },
      },
      faithFractures: { current: 8, maximum: 8 },
      minorExpressions: ['agility-light-fingers'],
      combat: {
        speed: 8,
        evadeTotal: 17,
        armorTotal: 2,
        initiative: 0,
        initiativeMasteryRank: 2,
      },
      health: {
        tempHP: 0,
        bars: [
          { name: 'Healthy', current: 22, max: 22 },
          { name: 'Bruised', current: 22, max: 22 },
          { name: 'Injured', current: 22, max: 22 },
          { name: 'Wounded', current: 22, max: 22 },
          { name: 'Broken', current: 22, max: 22 },
          { name: 'Incapacitated', current: 1, max: 1 },
        ],
      },
      stress: {
        bars: [
          { name: 'Healthy', current: 16, max: 16 },
          { name: 'Stressed', current: 16, max: 16 },
          { name: 'Not Well', current: 16, max: 16 },
          { name: 'Breaking', current: 16, max: 16 },
        ],
      },
      skills: {
        meleeWeapons: 4,
        perception: 4,
        acrobatics: 4,
        survival: 4,
        combatReflexes: 4,
        defensiveCombat: 4,
        persuasion: 4,
        herbalism: 4,
        occultism: 4,
        stealth: 4,
        athletics: 0,
        lore: 0,
      },
    },
    items: [
      {
        id: 'longbow-1',
        name: 'Longbow',
        type: 'weapon',
        system: {
          weaponType: 'ranged',
          damage: '2d8',
          range: '10m',
          hands: 2,
          innateAbilities: ['Ranged (32 m)', 'Set'],
          specials: ['Penetration(2), Expose(4)'],
          equipped: true,
        },
      },
      {
        name: 'Passive: Evade',
        type: 'power',
        system: { category: 'passive', rank: 4, level: 4, effect: 'Gain **+8 Evade**.' },
      },
      {
        name: 'Melee Single Attack',
        type: 'power',
        system: {
          category: 'active',
          templateId: 'active-melee-weapon-single',
          subfamily: 'weapon-attack',
          slot: 'attack',
          cost: { action: 'attack' },
          rank: 4,
          level: 4,
          effect: 'Make **one melee weapon attack**. On hit, deal weapon damage + **8d8 damage**.',
        },
      },
      {
        name: 'Melee Damage — Tier 6 — Sundered',
        type: 'power',
        system: {
          category: 'active',
          templateId: 'active-melee-damage-t6',
          rank: 5,
          level: 5,
          chosenSpecial: { key: 'sundered', tier: 6 },
          cost: { action: 'attack' },
          slot: 'attack',
          effect: 'Deal **+2d8 damage** on hit.',
        },
      },
      {
        name: 'Passive: Ghostform',
        type: 'power',
        system: {
          category: 'passive',
          templateId: 'passive-ghostform',
          rank: 4,
          level: 4,
          effect: 'At the start of combat, gain **1 Phasing charge**.',
        },
      },
      {
        name: 'Active Buff: Phasing',
        type: 'power',
        system: {
          category: 'activeBuff',
          templateId: 'ab-phasing',
          rank: 4,
          level: 4,
        },
      },
      {
        id: 'moonlight-1',
        name: 'Moonlight Greatsword - Level 1-1',
        type: 'artifact',
        system: {
          artifactKind: 'weapon',
          baseTypeKey: 'weapon:greatsword',
          baseProfile: 'twoHandedWeapon',
          binding: 'bound',
          freeTrait: 'Finesse',
          currentLevel: 1,
          artifactWeapon: { damage: '5d8', weaponType: 'melee' },
          levelProgression: [
            {
              level: 1,
              name: 'Moonlight Mending I',
              type: 'Ranged',
              effect: 'Heal one creature for **10d8 HP**.',
            },
          ],
        },
        flags: { 'mastery-system': { artifactActivated: true } },
      },
      {
        name: 'Elorian Stride - Level 1-1',
        type: 'artifact',
        system: {
          artifactKind: 'gear',
          baseProfile: 'feet',
          currentLevel: 1,
          baseValues: [{ slot: 'a', type: 'evade', label: 'Evade', value: 2 }],
          levelProgression: [
            {
              level: 1,
              name: 'Otherworld Reflex I',
              type: 'Reaction',
              effect: 'Gain **+8 Evade** against the triggering attack.',
            },
          ],
        },
        flags: { 'mastery-system': { artifactActivated: true } },
      },
      {
        name: 'Soul Sigil - Level 1-1',
        type: 'artifact',
        system: {
          artifactKind: 'armor',
          baseProfile: 'noArmorBody',
          currentLevel: 1,
          baseValues: [{ slot: 'a', type: 'evade', label: 'Evade (Silver Veil)', value: 7 }],
          levelProgression: [
            {
              level: 1,
              name: 'Soul Shell I',
              type: 'Stone Power Support',
              effect:
                'Supports the Vitality Ability: Temporary HP Stone Power and pre-fills Tier 2. You must still pay Tier 1 yourself. If Tier 1 is not paid, the pre-filled Tier 2 has no effect.',
            },
          ],
        },
        flags: { 'mastery-system': { artifactActivated: true } },
      },
    ],
    flags: {
      'mastery-system': {
        weaponSets: {
          schemaVersion: 1,
          active: 1,
          sets: {
            1: { mainhand: 'longbow-1', offhand: 'longbow-1' },
            2: { mainhand: 'moonlight-1', offhand: 'moonlight-1' },
          },
        },
      },
    },
  };
}

describe('Quick Play character print', () => {
  it('renders Alaris from the same actor data without a separate Echo block', () => {
    const ctx = buildCharacterCompactPrintContext(alarisActor()) as any;
    expect(ctx.name).toBe('Alaris');
    expect(ctx.echoName).toBe('Elorians');
    expect(ctx.masteryRank).toBe(2);
    expect(ctx.hasPortrait).toBe(true);
    expect(ctx.portrait).toContain('Players/Alaris/Alaris.png');
    expect(ctx.movement).toBe('8 m');
    expect(ctx.evade).toBe(17);
    expect(ctx.armor).toBe(2);
    expect(ctx.initiative).toBe('2d8');
    expect(ctx.faithFractures).toBe('8 / 8');
    expect(ctx.tempHp).toBe(0);
    expect(ctx.colorlessCost).toBe(8);
    expect(ctx.colorlessBoxes).toHaveLength(4);
    expect(ctx.phasingBoxes).toHaveLength(2);
    expect(ctx.healthBars.map((b: any) => b.name)).toEqual([
      'Healthy',
      'Bruised',
      'Injured',
      'Wounded',
      'Broken',
    ]);
    expect(ctx.healthBars[0]).toMatchObject({ available: 22, max: 22, penalty: '' });
    expect(ctx.healthBars[1].penalty).toBe('−10%');
    expect(ctx.healthBars[4].penalty).toBe('−50%');
    expect(ctx.stressBars).toHaveLength(4);
    expect(ctx.echoCards).toBeUndefined();
    expect(ctx.hasEchoCards).toBeUndefined();
  });

  it('connects each Attribute to its stones and first real Stone Power tier', () => {
    const ctx = buildCharacterCompactPrintContext(alarisActor()) as any;
    expect(ctx.attributeModules).toHaveLength(7);
    const agility = ctx.attributeModules.find((m: any) => m.key === 'agility');
    expect(agility.value).toBe(10);
    expect(agility.stoneReady).toBe(1);
    expect(agility.stones).toEqual([{ ready: true }]);
    const crit = agility.powers.find((p: any) => p.name === 'Crit');
    expect(crit.tier).toBe(2);
    expect(crit.cost).toBe(2);
    expect(crit.costPips).toHaveLength(2);
    expect(agility.powers.some((p: any) => p.tier === 1 && p.name === 'Crit')).toBe(false);

    const influence = ctx.attributeModules.find((m: any) => m.key === 'influence');
    expect(influence.value).toBe(4);
    expect(influence.hasStones).toBe(false);
    expect(influence.stones).toEqual([]);
    expect(influence.powers).toHaveLength(4);

    expect(ctx.generalStones.powers).toHaveLength(4);
    const extraAttack = ctx.generalStones.powers.find((p: any) => p.name === 'Extra Attack');
    expect(extraAttack.tier).toBe(2);
    expect(extraAttack.cost).toBe(2);
  });

  it('shows only trained skills with Keep and existing skill-use boxes', () => {
    const ctx = buildCharacterCompactPrintContext(alarisActor()) as any;
    expect(ctx.skills.map((s: any) => s.name)).not.toContain('Athletics');
    const acro = ctx.skills.find((s: any) => s.name === 'Acrobatics');
    expect(acro.attr).toBe('Agility');
    expect(acro.pool).toBe(10);
    expect(acro.keep).toBe('k2');
    expect(acro.boxes.map((b: any) => b.size)).toEqual([2, 2, 0, 0]);
    expect(acro.boxes.map((b: any) => b.state)).toEqual([
      'available',
      'available',
      'locked',
      'locked',
    ]);
    expect(ctx.skills.every((s: any) => s.boxes.length === 4)).toBe(true);
  });

  it('lists prepared weapon Sets between Skills and Powers style tiles', () => {
    const ctx = buildCharacterCompactPrintContext(alarisActor()) as any;
    expect(ctx.hasWeaponSets).toBe(true);
    expect(ctx.weaponSetTiles).toHaveLength(2);
    expect(ctx.weaponSetTiles[0]).toMatchObject({
      index: 1,
      active: true,
      title: 'SET 1 — LONGBOW',
      kindLabel: 'Ranged · Active',
      body: '2d8 · Ranged 32 m · Set · Penetration(2) · Expose(4)',
    });
    expect(ctx.weaponSetTiles[1]).toMatchObject({
      index: 2,
      active: false,
      title: 'SET 2 — MOONLIGHT GREATSWORD',
      kindLabel: 'Melee',
      body: '5d8 · Melee · Finesse · Artifact',
    });
  });

  it('keeps melee WD on melee powers and lists Basic Attack for the ranged set without a Ranged power', () => {
    const ctx = buildCharacterCompactPrintContext(alarisActor()) as any;
    const active = ctx.powerGroups.find((g: any) => g.phase === 'Active')?.items ?? [];
    const basic = active.find((i: any) => i.name === 'Basic Attack');
    expect(basic.damageLines).toEqual([
      'Melee: WD 5d8 + 4d8',
      'Ranged: WD 2d8 + 4d8',
    ]);
    expect(basic.effect).toMatch(/No Ranged attack power/i);
    expect(basic.effect).toMatch(/Ranged Single Attack/i);

    const meleeSingle = active.find((i: any) => i.name === 'Melee Single Attack');
    expect(meleeSingle.damage).toBe('WD 5d8 + 8d8');
    expect(meleeSingle.damage).not.toMatch(/2d8/);

    const sundered = active.find((i: any) => String(i.name).includes('Sundered'));
    expect(sundered.damage).toBe('WD 5d8 + 2d8 + Sundered(5)');
  });

  it('keeps Artifact powers on the Artifact, not in the general Power list', () => {
    const ctx = buildCharacterCompactPrintContext(alarisActor()) as any;
    const sword = ctx.artifacts.find((a: any) => a.name === 'Moonlight Greatsword');
    expect(sword.damage).toBe('5d8');
    expect(sword.trait).toBe('Finesse');
    expect(sword.powers.some((p: any) => p.name === 'Moonlight Mending I')).toBe(true);
    const allPowerNames = ctx.powerGroups.flatMap((g: any) => g.items.map((i: any) => i.name));
    expect(allPowerNames.join(' ')).not.toMatch(/Moonlight Mending/);
    expect(allPowerNames).toContain('Melee Single Attack');
    expect(allPowerNames).toContain('Evade');
    expect(allPowerNames).not.toContain('Passive: Evade');
    const stride = ctx.artifacts.find((a: any) => a.name === 'Elorian Stride');
    expect(stride.bases).toContain('+2 Evade');
    expect(stride.powers.some((p: any) => p.name === 'Otherworld Reflex I')).toBe(true);
    const sigil = ctx.artifacts.find((a: any) => a.name === 'Soul Sigil');
    expect(sigil.bases).toContain('+7 Evade');
    const shell = sigil.powers.find((p: any) => p.name === 'Soul Shell I');
    expect(shell.effect).toMatch(/Temporary HP/);
    expect(shell.effect).not.toMatch(/…/);
    const sundered = ctx.powerGroups
      .flatMap((g: any) => g.items)
      .find((i: any) => String(i.name).includes('Sundered'));
    expect(sundered.damage).toBe('WD 5d8 + 2d8 + Sundered(5)');
    const meleeSingle = ctx.powerGroups
      .flatMap((g: any) => g.items)
      .find((i: any) => i.name === 'Melee Single Attack');
    expect(meleeSingle.damage).toBe('WD 5d8 + 8d8');
    expect(ctx.minorExpressionTiles.some((t: any) => t.name === 'Bounding Leap')).toBe(true);
    expect(allPowerNames).not.toContain('Bounding Leap');
    expect(ctx.powerGroups.every((g: any) => g.phase !== 'Minor Expression')).toBe(true);
    expect(ctx.powerColumns.length).toBeGreaterThan(0);
    expect(ctx.powerColumns.flatMap((c: any) => c.groups.map((g: any) => g.phase)).sort()).toEqual(
      ctx.powerGroups.map((g: any) => g.phase).sort(),
    );
    const allEffects = [
      ...ctx.powerGroups.flatMap((g: any) => g.items.map((i: any) => i.effect)),
      ...ctx.artifacts.flatMap((a: any) => a.powers.map((p: any) => p.effect)),
    ].join('\n');
    expect(allEffects).not.toMatch(/…/);
  });

  it('marks missing combat totals as [CHECK]', () => {
    const actor = {
      type: 'character',
      name: '',
      system: { mastery: {}, attributes: {}, skills: {}, combat: {} },
      items: [],
    };
    const ctx = buildCharacterCompactPrintContext(actor) as any;
    expect(ctx.name).toBe('[CHECK]');
    expect(ctx.movement).toBe('[CHECK]');
    expect(ctx.evade).toBe('[CHECK]');
    expect(ctx.hasHealth).toBe(false);
  });
});
