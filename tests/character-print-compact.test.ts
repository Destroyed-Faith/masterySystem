import { describe, expect, it } from 'vitest';
import {
  buildCharacterCompactPrintContext,
  packCompactPowerColumns,
  formatCompactDefenseSources,
} from '../src/sheets/character-print';

function alarisActor() {
  return {
    id: 'alaris',
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
        evadeTotal: 11,
        armorTotal: 6,
        initiative: 0,
        initiativeMasteryRank: 2,
        evadeBreakdownRows: [
          { label: 'MR×4 base', detail: 'Mastery Rank 2', value: 8, display: '8' },
          { label: 'Shield', detail: 'Not equipped', value: 0, display: '—' },
          { label: 'Armor', detail: 'Not equipped', value: 0, display: '—' },
          { label: 'Elorian Stride', detail: 'Artifact · Evade', value: 1, display: '+1' },
          { label: 'Soul Sigil', detail: 'Artifact · Evade (Silver Veil)', value: 2, display: '+2' },
        ],
        armorBreakdownRows: [
          { label: 'Mastery Rank', detail: 'Always in soak total', value: 2, display: '2' },
          { label: 'Armor', detail: 'Soul Sigil · Light Armor', value: 4, display: '+4' },
          { label: 'Shield', detail: 'Not equipped', value: null, display: '—' },
        ],
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
        system: {
          category: 'passive',
          templateId: 'passive-evade',
          rank: 4,
          level: 4,
          effect: 'Gain **+4 Evade**.',
        },
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
        name: 'Reaction: Phasing',
        type: 'power',
        system: {
          category: 'reaction',
          templateId: 'reaction-phasing',
          rank: 4,
          level: 4,
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
          equipped: true,
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
          binding: 'bound',
          equipped: true,
          currentLevel: 1,
          baseValues: [{ slot: 'a', type: 'evade', label: 'Evade', value: 1 }],
          levelProgression: [
            {
              level: 1,
              name: 'Otherworld Reflex I',
              type: 'Reaction',
              effect: 'Gain **+1 Evade** against the triggering attack.',
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
          baseProfile: 'bodyArmor',
          binding: 'bound',
          equipped: true,
          currentLevel: 1,
          baseValues: [
            { slot: 'a', type: 'bodyArmor', label: 'Light Armor', value: 0, armorWeightClass: 'light' },
            { slot: 'a', type: 'evade', label: 'Evade (Silver Veil)', value: 2 },
          ],
          stoneFunction: {
            kind: 'stonePowerSupport',
            attribute: 'vitality',
            stonePowerId: 'vitality.tempHp',
          },
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
    expect(ctx.evade).toBe(15);
    expect(ctx.armor).toBe(6);
    expect(ctx.evadeSources).toBe('Base 8 · Elorian Stride +1 · Soul Sigil +2 · Evade +4');
    expect(ctx.armorSources).toBe('Base 2 · Armor +4');
    expect(ctx.initiative).toBe('2d8');
    expect(ctx.faithFractures).toBe('8 / 8');
    expect(ctx.tempHp).toBe(0);
    expect(ctx.colorlessCost).toBe(8);
    expect(ctx.colorlessBoxes).toHaveLength(4);
    expect(ctx.defenseSpecialLabel).toBe('Phasing');
    expect(ctx.defenseSpecialBoxes).toHaveLength(3);
    expect(ctx.hasDefenseSpecial).toBe(true);
    expect(ctx.phasingBoxes).toHaveLength(3);
    expect(ctx.hasPhasing).toBe(true);
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

  it('connects each Attribute to its stones and T1–T3 stone cost layouts', () => {
    const ctx = buildCharacterCompactPrintContext(alarisActor()) as any;
    expect(ctx.attributeModules).toHaveLength(7);
    const agility = ctx.attributeModules.find((m: any) => m.key === 'agility');
    expect(agility.value).toBe(10);
    expect(agility.stoneReady).toBe(1);
    expect(agility.stones).toEqual([{ ready: true }]);
    const crit = agility.powers.find((p: any) => p.name === 'Crit');
    expect(crit.firstTier).toBe(2);
    expect(crit.tiers.map((t: any) => t.label)).toEqual(['T2', 'T3']);
    expect(crit.tiers.find((t: any) => t.label === 'T2').boxes).toHaveLength(2);
    expect(crit.tiers.find((t: any) => t.label === 'T3').boxes).toHaveLength(4);
    expect(crit.tiers.find((t: any) => t.label === 'T2').layout).toBe('t2');
    expect(crit.tiers.find((t: any) => t.label === 'T3').layout).toBe('t3');
    expect(crit.effect).toBeUndefined();

    const vitality = ctx.attributeModules.find((m: any) => m.key === 'vitality');
    const tempHp = vitality.powers.find((p: any) => p.name === 'Temporary HP');
    expect(tempHp.tiers.map((t: any) => t.label)).toEqual(['T1', 'T2', 'T3']);
    expect(tempHp.tiers.find((t: any) => t.label === 'T1').boxes).toHaveLength(1);
    expect(tempHp.tiers.find((t: any) => t.label === 'T1').layout).toBe('t1');

    const influence = ctx.attributeModules.find((m: any) => m.key === 'influence');
    expect(influence.value).toBe(4);
    expect(influence.hasStones).toBe(false);
    expect(influence.stones).toEqual([]);
    expect(influence.powers).toHaveLength(4);

    expect(ctx.generalStones.powers).toHaveLength(4);
    const extraAttack = ctx.generalStones.powers.find((p: any) => p.name === 'Extra Attack');
    expect(extraAttack.firstTier).toBe(2);
    expect(extraAttack.tiers.map((t: any) => t.label)).toEqual(['T2', 'T3']);
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

  it('counts Phasing boxes from Passive + Reaction + Buff sources', () => {
    const onlyPassive = {
      ...alarisActor(),
      items: alarisActor().items.filter(
        (i: any) =>
          i.type !== 'power' ||
          !['passive-ghostform', 'reaction-phasing', 'ab-phasing'].includes(String(i.system?.templateId)),
      ),
    };
    onlyPassive.items = [
      ...onlyPassive.items,
      {
        name: 'Passive: Ghostform',
        type: 'power',
        system: { category: 'passive', templateId: 'passive-ghostform', rank: 4, level: 4 },
      },
    ];
    expect(buildCharacterCompactPrintContext(onlyPassive).phasingBoxes).toHaveLength(1);

    const passiveAndReaction = {
      ...onlyPassive,
      items: [
        ...onlyPassive.items,
        {
          name: 'Reaction: Phasing',
          type: 'power',
          system: { category: 'reaction', templateId: 'reaction-phasing', rank: 4, level: 4 },
        },
      ],
    };
    expect(buildCharacterCompactPrintContext(passiveAndReaction).phasingBoxes).toHaveLength(2);

    const withBuff = alarisActor();
    // Passive 1 + Reaction 1 + Buff 1 = 3
    expect(buildCharacterCompactPrintContext(withBuff).phasingBoxes).toHaveLength(3);
  });

  it('shows Damage Negation or Parry in the Phasing slot, never both with Phasing', () => {
    const withoutPhasing = {
      ...alarisActor(),
      items: alarisActor().items.filter(
        (i: any) =>
          i.type !== 'power' ||
          !['passive-ghostform', 'reaction-phasing', 'ab-phasing'].includes(String(i.system?.templateId)),
      ),
    };

    const withNegation = {
      ...withoutPhasing,
      items: [
        ...withoutPhasing.items,
        {
          name: 'Passive: Damage Negation',
          type: 'power',
          system: {
            category: 'passive',
            templateId: 'passive-damage-negation',
            rank: 4,
            level: 4,
          },
        },
      ],
    };
    const negCtx = buildCharacterCompactPrintContext(withNegation) as any;
    expect(negCtx.defenseSpecialLabel).toBe('Damage Negation');
    expect(negCtx.defenseSpecialBoxes).toHaveLength(16);
    expect(negCtx.hasDefenseSpecial).toBe(true);
    expect(negCtx.hasPhasing).toBe(false);

    const withParry = {
      ...withoutPhasing,
      items: [
        ...withoutPhasing.items,
        {
          name: 'Passive: Parry',
          type: 'power',
          system: { category: 'passive', templateId: 'passive-parry', rank: 4, level: 4 },
        },
      ],
    };
    const parryCtx = buildCharacterCompactPrintContext(withParry) as any;
    expect(parryCtx.defenseSpecialLabel).toBe('Parry');
    expect(parryCtx.defenseSpecialBoxes).toHaveLength(20);
    expect(parryCtx.hasPhasing).toBe(false);

    // Phasing wins when present alongside Damage Negation.
    const both = {
      ...alarisActor(),
      items: [
        ...alarisActor().items,
        {
          name: 'Passive: Damage Negation',
          type: 'power',
          system: {
            category: 'passive',
            templateId: 'passive-damage-negation',
            rank: 4,
            level: 4,
          },
        },
      ],
    };
    const bothCtx = buildCharacterCompactPrintContext(both) as any;
    expect(bothCtx.defenseSpecialLabel).toBe('Phasing');
    expect(bothCtx.hasPhasing).toBe(true);
  });

  it('folds always-on Passive Armor into the Armor total and sources', () => {
    const actor = {
      ...alarisActor(),
      items: [
        ...alarisActor().items,
        {
          name: 'Passive: Armor',
          type: 'power',
          system: {
            category: 'passive',
            templateId: 'passive-fortified-frame',
            rank: 4,
            level: 4,
          },
        },
      ],
    };
    const ctx = buildCharacterCompactPrintContext(actor) as any;
    expect(ctx.armor).toBe(11); // Base 2 + Soul Sigil Light Armor +4 + Fortified Frame L4 (+5)
    expect(ctx.armorSources).toMatch(/Armor \+5/);
    expect(ctx.armorSources).toMatch(/Armor \+4/);
  });

  it('prints Longbow as a single maximum range even when system.range is stale', () => {
    const ctx = buildCharacterCompactPrintContext(alarisActor()) as any;
    const bow = ctx.weaponSetTiles.find((t: any) => /LONGBOW/i.test(t.title));
    expect(bow.body).toMatch(/Ranged 32 m/);
    expect(bow.body).not.toMatch(/10\s*m/);
    expect(bow.body).not.toMatch(/\d+\s*\/\s*\d+/);
  });

  it('collapses legacy 10/16/32m band leftovers into one maximum', () => {
    const actor = {
      ...alarisActor(),
      items: [
        {
          id: 'band-bow',
          name: 'Band Bow',
          type: 'weapon',
          system: {
            weaponType: 'ranged',
            damage: '2d8',
            range: '10m',
            hands: 2,
            innateAbilities: ['Ranged 10/16/32m', 'Set'],
            specials: [],
            equipped: true,
          },
        },
      ],
      flags: {
        'mastery-system': {
          weaponSets: {
            sets: {
              1: { mainhandItemId: 'band-bow', offhandItemId: null },
              2: { mainhandItemId: null, offhandItemId: null },
            },
            activeSet: 1,
          },
        },
      },
    };
    const ctx = buildCharacterCompactPrintContext(actor) as any;
    const bow = ctx.weaponSetTiles.find((t: any) => /BAND BOW/i.test(t.title));
    expect(bow.body).toBe('2d8 · Ranged 32 m · Set');
    expect(bow.body).not.toMatch(/\b16\b/);
    expect(bow.body).not.toMatch(/10\s*m/);
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

  it('keeps melee WD on melee powers and omits Basic Attack from Quick Play', () => {
    const ctx = buildCharacterCompactPrintContext(alarisActor()) as any;
    const active = ctx.powerGroups.find((g: any) => g.phase === 'Active')?.items ?? [];
    expect(active.some((i: any) => i.name === 'Basic Attack')).toBe(false);

    const meleeSingle = active.find((i: any) => i.name === 'Melee Single Attack');
    expect(meleeSingle.damage).toBe('WD 5d8 + 8d8');
    expect(meleeSingle.damage).not.toMatch(/2d8/);

    const sundered = active.find((i: any) => String(i.name).includes('Sundered'));
    expect(sundered.damage).toBe('WD 5d8 + 2d8 + Sundered(5)');
  });

  it('folds Artifact powers into POWERS with source labels and drops the Artifacts block', () => {
    const ctx = buildCharacterCompactPrintContext(alarisActor()) as any;
    expect(ctx.artifacts).toBeUndefined();
    expect(ctx.hasArtifacts).toBeUndefined();

    const allPowers = ctx.powerGroups.flatMap((g: any) => g.items);
    const allPowerNames = allPowers.map((i: any) => i.name);
    expect(allPowerNames).toContain('Melee Single Attack');
    expect(allPowerNames).toContain('Evade');
    expect(allPowerNames).not.toContain('Passive: Evade');
    expect(allPowerNames).toContain('Moonlight Mending I');
    expect(allPowerNames).toContain('Otherworld Reflex I');
    expect(allPowerNames).not.toContain('Soul Shell I');

    const mending = allPowers.find((i: any) => i.name === 'Moonlight Mending I');
    expect(mending.source).toBe('Moonlight Greatsword');
    expect(mending.phase).toBe('Active');
    expect(mending.effect).toMatch(/10d8/);
    expect(mending.effect).not.toMatch(/…/);

    const reflex = allPowers.find((i: any) => i.name === 'Otherworld Reflex I');
    expect(reflex.source).toBe('Elorian Stride');
    expect(reflex.phase).toBe('Reaction');

    const vitality = ctx.attributeModules.find((m: any) => m.key === 'vitality');
    const tempHp = vitality.powers.find((p: any) => p.name === 'Temporary HP');
    expect(tempHp.supported).toBe(true);
    expect(tempHp.supportSource).toBe('Soul Sigil');
    expect(tempHp.supportTier).toBeGreaterThanOrEqual(2);
    const t2 = tempHp.tiers.find((t: any) => t.label === 'T2');
    expect(t2.boxes.every((b: any) => b.filled)).toBe(true);
    const t1 = tempHp.tiers.find((t: any) => t.label === 'T1');
    expect(t1.boxes.every((b: any) => !b.filled)).toBe(true);

    expect(ctx.weaponSetTiles.some((t: any) => /Moonlight Greatsword/i.test(t.title))).toBe(true);

    const sundered = allPowers.find((i: any) => String(i.name).includes('Sundered'));
    expect(sundered.damage).toBe('WD 5d8 + 2d8 + Sundered(5)');
    const meleeSingle = allPowers.find((i: any) => i.name === 'Melee Single Attack');
    expect(meleeSingle.damage).toBe('WD 5d8 + 8d8');
    expect(ctx.minorExpressionTiles.some((t: any) => t.name === 'Bounding Leap')).toBe(true);
    expect(allPowerNames).not.toContain('Bounding Leap');
    expect(ctx.powerGroups.every((g: any) => g.phase !== 'Minor Expression')).toBe(true);
    expect(ctx.powerColumns.length).toBeGreaterThan(0);
    expect(
      [...new Set(ctx.powerColumns.flatMap((c: any) => c.groups.map((g: any) => g.phase)))].sort(),
    ).toEqual(ctx.powerGroups.map((g: any) => g.phase).sort());
    const colNames = ctx.powerColumns.flatMap((c: any) =>
      c.groups.flatMap((g: any) => g.items.map((i: any) => `${g.phase}:${i.name}`)),
    );
    const groupNames = ctx.powerGroups.flatMap((g: any) =>
      g.items.map((i: any) => `${g.phase}:${i.name}`),
    );
    expect(colNames.sort()).toEqual(groupNames.sort());
    if (ctx.powerColumns.length >= 2) {
      const counts = ctx.powerColumns.map((c: any) =>
        c.groups.reduce((n: number, g: any) => n + g.items.length, 0),
      );
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    }
    const allEffects = allPowers.map((i: any) => i.effect).join('\n');
    expect(allEffects).not.toMatch(/…/);
  });

  it('formats Evade / Armor source lines from live breakdown rows', () => {
    expect(
      formatCompactDefenseSources([
        { label: 'MR×4 base', value: 8, display: '8' },
        { label: 'Shield', value: 0, display: '—' },
        { label: 'Elorian Stride', value: 1, display: '+1' },
        { label: 'Soul Sigil', value: 2, display: '+2' },
      ]),
    ).toBe('Base 8 · Elorian Stride +1 · Soul Sigil +2');
    expect(
      formatCompactDefenseSources([
        { label: 'Mastery Rank', value: 2, display: '2' },
        { label: 'Armor', value: 4, display: '+4' },
      ]),
    ).toBe('Base 2 · Armor +4');
  });

  it('splits oversized Active groups across columns to fill empty space', () => {
    const packed = packCompactPowerColumns([
      { phase: 'Active', items: [{ n: 1 }, { n: 2 }, { n: 3 }] },
      { phase: 'Passive', items: [{ n: 4 }, { n: 5 }] },
      { phase: 'Active Buff', items: [{ n: 6 }] },
      { phase: 'Reaction', items: [{ n: 7 }] },
    ]);
    expect(packed.length).toBe(4);
    expect(packed.every((c) => c.groups.reduce((n, g) => n + g.items.length, 0) <= 2)).toBe(true);
    // Active continues into a later column instead of stacking alone on the left.
    const activeColIndexes = packed
      .map((c, i) => (c.groups.some((g) => g.phase === 'Active') ? i : -1))
      .filter((i) => i >= 0);
    expect(activeColIndexes.length).toBeGreaterThan(1);
    expect(activeColIndexes[0]).toBe(0);
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
