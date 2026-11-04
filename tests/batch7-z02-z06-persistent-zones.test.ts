/**
 * Batch 7 — Persistent Special Zones (Z02 / Z03 / Z04 / Z06)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  appendSpellZone,
  createPersistentZone,
  createPersistentSpellZone,
  creatureInsideZone,
  markZoneApplied,
  parseZoneDurationRounds,
  removeSpellZone,
  retainActiveSpellZones,
  selectZonesToMaintain,
  spellZonesEntered,
  zoneAlreadyApplied,
  zoneCreationOutcome,
  zoneRoundKey,
  zoneSpecialLabel,
  writeSpellZones,
} from '../src/combat/spell-zones.js';
import {
  isPersistentZonePower,
  readZonePlacementProfile,
} from '../src/combat/persistent-zone-runtime.js';
import { ACTIVE_BUFF_TEMPLATES } from '../src/utils/powers/templates/activeBuffs.js';
import { ACTIVE_TEMPLATES } from '../src/utils/powers/templates/actives.js';
import { ruinTickDamage } from '../src/combat/status-tick.js';

void ACTIVE_BUFF_TEMPLATES;

function zonePower(templateId = 'active-ranged-zone-t3', rank = 4) {
  const tpl = ACTIVE_TEMPLATES.find((t) => t.templateId === templateId);
  expect(tpl).toBeTruthy();
  const row = tpl!.levels![String(rank)] ?? tpl!.levels!['4'];
  return {
    id: `pwr-${templateId}`,
    name: tpl!.name,
    type: 'power',
    system: {
      powerType: 'active',
      category: 'active',
      subfamily: 'persistent-zone',
      templateId,
      rank,
      level: rank,
      chosenSpecial: 'blight',
      tags: ['spell'],
      levels: tpl!.levels,
      ...row,
    },
  };
}

describe('Batch 7 — Persistent Zone catalogue (Z02)', () => {
  it('zones are Ranged-only templates with roll.kind none', () => {
    const zones = ACTIVE_TEMPLATES.filter((t) => t.subfamily === 'persistent-zone');
    expect(zones.length).toBeGreaterThan(0);
    for (const z of zones) {
      expect(z.templateId).toMatch(/^active-ranged-zone/);
      expect(z.roll?.kind).toBe('none');
      expect(z.cost?.action).toBe('attack');
    }
  });

  it('printed PL keeps range/radius/special; no 4-round duration; allCreatures filter', () => {
    const tpl = ACTIVE_TEMPLATES.find((t) => t.templateId === 'active-ranged-zone-t3')!;
    const row4 = tpl.levels!['4'] as any;
    expect(row4.aoe.radiusM).toBeGreaterThan(0);
    expect(row4.aoe.targetFilter).toBe('allCreatures');
    expect(row4.duration.kind).toBe('untilBroken');
    expect(row4.mechanics.persistentZone).toBe(true);
    expect(String(row4.effectText)).not.toMatch(/4 Rounds/i);
  });

  it('isPersistentZonePower + placement profile', () => {
    const item = zonePower();
    expect(isPersistentZonePower(item)).toBe(true);
    const profile = readZonePlacementProfile(item);
    expect(profile?.radiusMeters).toBeGreaterThan(0);
    expect(profile?.specialKey).toBeTruthy();
  });
});

describe('Batch 7 — Zone model & once-per-round (Z04 / Z06)', () => {
  it('create has no auto-expiry; parseZoneDurationRounds is inert', () => {
    expect(parseZoneDurationRounds('4 rounds', 3)).toBeNull();
    const zone = createPersistentZone({
      id: 'z1',
      name: 'Blight Zone',
      creatorId: 'hero',
      specialKey: 'blight',
      specialRank: 3,
      centerX: 0,
      centerY: 0,
      radiusMeters: 2,
      createdRound: 1,
    });
    expect(zone.expiresAfterRound).toBeNull();
    expect(retainActiveSpellZones([zone], 99)).toHaveLength(1);
  });

  it('legacy createPersistentSpellZone ignores Casting for expiry', () => {
    const zone = createPersistentSpellZone({
      id: 'legacy',
      name: 'Old',
      casterId: 'c',
      spellBaseTn: 22,
      castingTotal: 30,
      durationNote: '4 rounds',
      createdRound: 1,
      centerX: 0,
      centerY: 0,
      radiusMeters: 2,
      specialKey: 'ruin',
      specialRank: 2,
    });
    expect(zone.expiresAfterRound).toBeNull();
    expect(zoneCreationOutcome(10, 22)).toBe('create');
  });

  it('affects every creature in radius including creator — no SR resist', () => {
    const zone = createPersistentZone({
      id: 'z1',
      name: 'Zone',
      creatorId: 'hero',
      specialKey: 'blight',
      specialRank: 2,
      centerX: 0,
      centerY: 0,
      radiusMeters: 3,
    });
    expect(creatureInsideZone(zone, 0, 0, () => 0)).toBe(true);
    expect(creatureInsideZone(zone, 0, 0, () => 4)).toBe(false);

    const hits = spellZonesEntered([zone], {
      x: 0,
      y: 0,
      roundKey: 'c:1',
      creatureId: 'hero',
      spellResistance: 99,
      distanceMeters: () => 0,
    });
    expect(hits).toHaveLength(1);
    expect(hits[0].outcome).toBe('affect');
  });

  it('once per zone × creature × round; reentry same round skipped; new round allowed', () => {
    let zone = createPersistentZone({
      id: 'z1',
      name: 'Zone',
      creatorId: 'hero',
      specialKey: 'blight',
      specialRank: 2,
      centerX: 0,
      centerY: 0,
      radiusMeters: 2,
    });
    const key1 = zoneRoundKey('c', 1);
    zone = markZoneApplied(zone, key1, 'goblin');
    expect(zoneAlreadyApplied(zone, key1, 'goblin')).toBe(true);
    const again = spellZonesEntered([zone], {
      x: 0,
      y: 0,
      roundKey: key1,
      creatureId: 'goblin',
      distanceMeters: () => 0,
    });
    expect(again).toHaveLength(0);

    const key2 = zoneRoundKey('c', 2);
    const nextRound = spellZonesEntered([zone], {
      x: 0,
      y: 0,
      roundKey: key2,
      creatureId: 'goblin',
      distanceMeters: () => 0,
    });
    expect(nextRound).toHaveLength(1);
  });

  it('overlapping zones are independent sources', () => {
    const a = createPersistentZone({
      id: 'a',
      name: 'A',
      creatorId: 'hero',
      specialKey: 'blight',
      specialRank: 2,
      centerX: 0,
      centerY: 0,
      radiusMeters: 3,
    });
    const b = createPersistentZone({
      id: 'b',
      name: 'B',
      creatorId: 'hero',
      specialKey: 'ruin',
      specialRank: 1,
      centerX: 0,
      centerY: 0,
      radiusMeters: 3,
    });
    const hits = spellZonesEntered([a, b], {
      x: 0,
      y: 0,
      roundKey: 'c:1',
      creatureId: 'goblin',
      distanceMeters: () => 0,
    });
    expect(hits.map((h) => h.zoneId).sort()).toEqual(['a', 'b']);
  });

  it('zoneSpecialLabel formats printed Special', () => {
    expect(
      zoneSpecialLabel(
        createPersistentZone({
          id: 'z',
          name: 'Z',
          creatorId: 'c',
          specialKey: 'blight',
          specialRank: 4,
          centerX: 0,
          centerY: 0,
          radiusMeters: 1,
        }),
      ),
    ).toBe('Blight(4)');
  });
});

describe('Batch 7 — Maintenance selection (Z03)', () => {
  it('two zones + two actions → keep both', () => {
    expect(selectZonesToMaintain(['a', 'b'], 2)).toEqual({ keep: ['a', 'b'], end: [] });
  });

  it('two zones + one action → only preferred / first kept', () => {
    expect(selectZonesToMaintain(['a', 'b'], 1)).toEqual({ keep: ['a'], end: ['b'] });
    expect(selectZonesToMaintain(['a', 'b'], 1, ['b'])).toEqual({ keep: ['b'], end: ['a'] });
  });

  it('zero actions → all end', () => {
    expect(selectZonesToMaintain(['a', 'b'], 0)).toEqual({ keep: [], end: ['a', 'b'] });
  });
});

describe('Batch 7 — Ruin tick unchanged', () => {
  it('Ruin tick is still 4 × X', () => {
    expect(ruinTickDamage(3)).toBe(12);
    expect(ruinTickDamage(0)).toBe(0);
  });
});

describe('Batch 7 — persistence write', () => {
  beforeEach(() => {
    vi.stubGlobal('ui', { notifications: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } });
  });

  it('writeSpellZones replaces list (no merge ghosts)', async () => {
    const actor: any = {
      flags: { 'mastery-system': { spellZones: [] } },
      async unsetFlag() {
        delete this.flags['mastery-system'].spellZones;
      },
      async setFlag(_s: string, _k: string, value: any) {
        this.flags['mastery-system'].spellZones = value;
      },
    };
    const a = createPersistentZone({
      id: 'a',
      name: 'A',
      creatorId: 'c',
      specialKey: 'blight',
      specialRank: 1,
      centerX: 0,
      centerY: 0,
      radiusMeters: 1,
    });
    const b = createPersistentZone({
      id: 'b',
      name: 'B',
      creatorId: 'c',
      specialKey: 'ruin',
      specialRank: 1,
      centerX: 1,
      centerY: 1,
      radiusMeters: 1,
    });
    await writeSpellZones(actor, appendSpellZone([a], b));
    expect(actor.flags['mastery-system'].spellZones).toHaveLength(2);
    await writeSpellZones(actor, removeSpellZone(actor.flags['mastery-system'].spellZones, 'a'));
    expect(actor.flags['mastery-system'].spellZones).toHaveLength(1);
    expect(actor.flags['mastery-system'].spellZones[0].id).toBe('b');
  });
});
