/**
 * Legacy cleanup 2026 migration: mapping table, D6 Skill refund (snapshot /
 * history / band, conflicts, XP guard, value conservation), NPC + Summon
 * archives, power remaps / conflicts, Artifact pick realignment, idempotency,
 * rollback round trip, resync hold and the v0.9.9.6 precondition.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { findCatalogEntry, findTemplateById } from '../src/utils/power-catalog.js';
import { buildPowerItemFromCatalogEntry } from '../src/utils/power-item-builder.js';
import { ALL_POWER_TEMPLATES } from '../src/utils/powers/templates/index.js';
import { buildEchoProgressionPicks } from '../src/utils/echo-artifacts.js';
import { lookupArtifactDefinition } from '../src/utils/artifact-row-identity.js';
import { deriveLevelProgressionFromPicks } from '../src/artifacts/progression-compiler.js';
import {
  LEGACY_CLEANUP_CONFLICT_TEMPLATES,
  LEGACY_CLEANUP_SPECIAL_REMAP,
  LEGACY_CLEANUP_TEMPLATE_REMAP,
  classifyLegacyPower,
  isLegacyCleanupResyncHeld,
} from '../src/migrations/legacy-cleanup-2026-mapping.js';
import {
  applyLegacyCleanupReport,
  backupForUpdates,
  buildLegacyCleanupReport,
  planActorLegacyCleanup,
  planArtifactLegacyCleanup,
  planCharacterSkills,
  artifactKeysForName,
  planPowerItemsLegacyCleanup,
  resolveLegacySkillConflict,
  restoreFromBackup,
  rollbackActorLegacyCleanup,
  runLegacyCleanupDryRunOnReady,
} from '../src/migrations/legacy-cleanup-2026-migration.js';

const settings = new Map<string, unknown>();

function setPath(obj: any, path: string, value: unknown): void {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]!;
    if (cur[p] == null || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  const last = parts[parts.length - 1]!;
  if (last.startsWith('-=')) delete cur[last.slice(2)];
  else cur[last] = value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

const updateOptions: unknown[] = [];

function mockDoc(data: any): any {
  const doc: any = {
    ...data,
    flags: data.flags ?? { 'mastery-system': {} },
    getFlag(scope: string, key: string) {
      return doc.flags?.[scope]?.[key];
    },
    async update(patch: Record<string, unknown>, options?: unknown) {
      updateOptions.push(options);
      for (const [k, v] of Object.entries(patch)) setPath(doc, k, v);
      return doc;
    },
  };
  return doc;
}

function mockActor(id: string, name: string, system: any, opts: { type?: string; items?: any[]; flags?: any } = {}): any {
  const items = opts.items ?? [];
  const map = new Map(items.map((i) => [i.id, i]));
  const actor = mockDoc({
    id,
    uuid: `Actor.${id}`,
    name,
    type: opts.type ?? 'character',
    system,
    flags: opts.flags ?? { 'mastery-system': {} },
    items: { contents: items, get: (k: string) => map.get(k), values: () => map.values() },
  });
  actor.toObject = () => JSON.parse(JSON.stringify({ id, name, system: actor.system, flags: actor.flags }));
  return actor;
}

function power(templateId: string, special: string | null, rank: number, id: string, flags: any = {}): any {
  const entry = findCatalogEntry(templateId, special ?? undefined);
  const data: any = entry
    ? buildPowerItemFromCatalogEntry(entry, rank)
    : { name: templateId, type: 'power', system: { templateId, rank, levels: {} } };
  if (special) data.system.chosenSpecial = { key: special, tier: 4 };
  return mockDoc({ ...data, id, flags: { 'mastery-system': flags } });
}

/** A stored item of a template that no longer exists. */
function removedPower(templateId: string, rank: number, id: string, flags: any = {}): any {
  return mockDoc({
    id,
    name: templateId,
    type: 'power',
    system: { templateId, rank, levels: { [String(rank)]: { effect: { text: 'old' } } } },
    flags: { 'mastery-system': flags },
  });
}

function installGame(actors: any[], worldItems: any[] = []): any {
  const g: any = {
    user: { isGM: true },
    actors: { contents: actors },
    scenes: { contents: [] },
    items: { contents: worldItems, get: (id: string) => worldItems.find((i) => i.id === id) },
    settings: {
      get: (_ns: string, key: string) => settings.get(key),
      set: async (_ns: string, key: string, v: unknown) => {
        settings.set(key, v);
        return v;
      },
    },
  };
  (globalThis as any).game = g;
  (globalThis as any).ui = { notifications: { warn: () => undefined, info: () => undefined, error: () => undefined } };
  (globalThis as any).foundry = { utils: { saveDataToFile: () => undefined } };
  return g;
}

function charSystem(extra: any = {}): any {
  return {
    creation: { complete: true },
    points: { xp: 0, xpFree: 5 },
    xp: { totalEarned: 40, totalSpent: 30, freeEarned: 5, freeSpent: 0, history: [] },
    specializations: [{ id: 'profession:smith', name: 'Smith', scope: 'x', rank: 3 }],
    ...extra,
  };
}

function spend(key: string, from: number, to: number, amount: number, extra: any = {}): any {
  return { ts: 1, kind: 'spend', category: 'skill', amount, details: { key, from, to, ...extra } };
}

const REMOVED_TEMPLATE_IDS = [
  'active-cleanse-absorption',
  'active-melee-aoe-dispel',
  'active-melee-aoe-targeted-special',
  'active-melee-control-pull-disarm',
  'active-melee-control-push-prone',
  'active-melee-damage-dispel-mixed',
  'active-melee-damage-stunned',
  'active-melee-heal-cleanse-mixed',
  'active-melee-single-dispel',
  'active-melee-targeted-special',
  'active-ranged-aoe-dispel',
  'active-ranged-aoe-targeted-special',
  'active-ranged-control-pull-disarm',
  'active-ranged-control-push-prone',
  'active-ranged-damage-dispel-mixed',
  'active-ranged-damage-stunned',
  'active-ranged-heal-cleanse-mixed',
  'active-ranged-single-dispel',
  'active-ranged-targeted-special',
];

beforeEach(() => {
  settings.clear();
  settings.set('activesV0996MigrationState', 'applied');
  settings.set('legacyCleanup2026MigrationState', 'pending');
  updateOptions.length = 0;
});

describe('mapping table', () => {
  it('maps every removed template exactly once (remap or conflict), never to a removed id', () => {
    for (const id of REMOVED_TEMPLATE_IDS) {
      const inRemap = id in LEGACY_CLEANUP_TEMPLATE_REMAP;
      const inConflict = LEGACY_CLEANUP_CONFLICT_TEMPLATES.has(id);
      expect(inRemap !== inConflict, id).toBe(true);
      expect(findTemplateById(id), id).toBeFalsy();
    }
    for (const to of Object.values(LEGACY_CLEANUP_TEMPLATE_REMAP)) expect(findTemplateById(to)).toBeTruthy();
    for (const to of Object.values(LEGACY_CLEANUP_SPECIAL_REMAP)) {
      expect(findCatalogEntry(to.templateId, to.special ?? undefined)?.chosenSpecial?.key).toBe(to.special);
    }
  });

  it('no live catalog template is a cleanup candidate and Zone T5 Root is not purchasable', () => {
    for (const t of ALL_POWER_TEMPLATES as any[]) {
      const cls = classifyLegacyPower(String(t.templateId), null, false);
      expect(cls, t.templateId).toBeNull();
    }
    expect(findCatalogEntry('active-ranged-zone-t5', 'root')).toBeFalsy();
  });

  it('every Artifact definition pick is canonical (no removed template, no Weapon AoE Special)', () => {
    for (const key of ['moonlightGreatsword', 'lorKethsStaff', 'dragonClaws']) {
      const def = lookupArtifactDefinition(key)!;
      for (const pick of buildEchoProgressionPicks(def) as any[]) {
        if (pick.kind !== 'power') continue;
        expect(classifyLegacyPower(pick.powerTemplateId, pick.chosenSpecial?.key ?? null, true), `${key} L${pick.level}`).toBeNull();
      }
    }
  });
});

describe('D6 character Skills', () => {
  it('refunds XP-bought ranks above the creation snapshot via the Skill band table', () => {
    const actor = mockActor('a1', 'Oda', charSystem({
      skills: { athletics: 6, lore: 3 },
      skillsSpent: { athletics: 1 },
      xp: { totalEarned: 40, totalSpent: 30, freeEarned: 5, freeSpent: 0, history: [], postCreationProgress: { skills: { athletics: 4, lore: 3 } } },
    }));
    const plan = planCharacterSkills(actor)!;
    expect(plan.status).toBe('apply');
    expect(plan.xpSource).toBe('canonical-band');
    expect(plan.xpRefund).toBe(2);
    expect(plan.byKey).toEqual([
      { key: 'athletics', rating: 6, creationRanks: 4, xpRanks: 2 },
      { key: 'lore', rating: 3, creationRanks: 3, xpRanks: 0 },
    ]);
    for (const k of plan.byKey) expect(k.creationRanks + k.xpRanks).toBe(k.rating);
  });

  it('uses XP history when it accounts for the ranks; Profession rows are ignored', () => {
    const actor = mockActor('a1', 'Oda', charSystem({
      skills: { athletics: 6 },
      xp: {
        totalEarned: 40, totalSpent: 30, freeEarned: 5, freeSpent: 0,
        postCreationProgress: { skills: { athletics: 4 } },
        history: [
          spend('athletics', 4, 5, 3),
          spend('athletics', 5, 6, 3),
          spend('profession:smith', 2, 3, 4, { specialization: true }),
        ],
      },
    }));
    const plan = planCharacterSkills(actor)!;
    expect(plan.xpSource).toBe('history');
    expect(plan.xpRefund).toBe(6);
    expect(plan.historyRowsMarked).toBe(2);
  });

  it('history that does not match the build is a conflict: nothing about Skills or XP is written', () => {
    const actor = mockActor('a1', 'Oda', charSystem({
      skills: { athletics: 6 },
      xp: { totalEarned: 40, totalSpent: 30, freeEarned: 5, freeSpent: 0, postCreationProgress: { skills: { athletics: 4 } }, history: [spend('athletics', 4, 5, 1)] },
    }));
    const plan = planActorLegacyCleanup(actor)!;
    expect(plan.skills?.status).toBe('conflict');
    expect(Object.keys(plan.updates!)).toEqual(['flags.mastery-system.legacyCleanupConflict']);
  });

  it('without a snapshot, XP-spending characters are a conflict; XP-less ones archive everything as creation', () => {
    const spender = mockActor('a1', 'A', charSystem({ skills: { athletics: 5 } }));
    expect(planCharacterSkills(spender)!.status).toBe('conflict');
    const fresh = mockActor('a2', 'B', charSystem({
      skills: { athletics: 5 },
      xp: { totalEarned: 0, totalSpent: 0, freeEarned: 0, freeSpent: 0, history: [] },
    }));
    const plan = planCharacterSkills(fresh)!;
    expect(plan.status).toBe('apply');
    expect(plan.xpRefund).toBe(0);
    expect(plan.byKey[0]).toEqual({ key: 'athletics', rating: 5, creationRanks: 5, xpRanks: 0 });
  });

  it('XP guard: a refund larger than all XP ever spent is a conflict', () => {
    const actor = mockActor('a1', 'Oda', charSystem({
      skills: { athletics: 20 },
      xp: { totalEarned: 40, totalSpent: 3, freeEarned: 0, freeSpent: 0, history: [], postCreationProgress: { skills: { athletics: 4 } } },
    }));
    const plan = planCharacterSkills(actor)!;
    expect(plan.status).toBe('conflict');
    expect(plan.reasons.join(' ')).toMatch(/larger than all XP ever spent/);
  });

  it('open character creation only archives', () => {
    const actor = mockActor('a1', 'Oda', charSystem({ creation: { complete: false }, skills: { athletics: 6 }, skillPoints: { unspent: 4, placed: {} } }));
    const plan = planActorLegacyCleanup(actor)!;
    expect(plan.skills!.creationOpen).toBe(true);
    expect(plan.updates!['system.points.xpFree']).toBeUndefined();
    expect(plan.updates!['system.-=skills']).toBeNull();
  });

  it('Apply archives, refunds, converts leftover Skill Points, removes the fields and is idempotent', async () => {
    const actor = mockActor('a1', 'Oda', charSystem({
      skills: { athletics: 6 },
      skillsSpent: { athletics: 2 },
      skillPoints: { unspent: 3, placed: {} },
      xp: {
        totalEarned: 40, totalSpent: 30, freeEarned: 5, freeSpent: 0,
        history: [spend('athletics', 4, 5, 1), spend('athletics', 5, 6, 1)],
        postCreationProgress: { skills: { athletics: 4 }, skillsSpent: {}, skillPointsUnspent: 0, attributes: { might: 4 } },
        currentStep: { attributes: [], skills: ['athletics', 'profession:smith'], powers: [], artifacts: [] },
      },
    }), { flags: { 'mastery-system': { legacySkillWriteQuarantine: { entries: [{ at: 'x', values: { 'system.skills.lore': 2 } }] } } } });
    const g = installGame([actor]);
    const report = buildLegacyCleanupReport(g);
    const summary = await applyLegacyCleanupReport(report, g);
    expect(summary).toMatchObject({ actors: 1, failed: 0 });
    expect(updateOptions[0]).toMatchObject({ masteryLegacySkillMigration: true });

    const sys = actor.system;
    expect(sys.skills).toBeUndefined();
    expect(sys.skillsSpent).toBeUndefined();
    expect(sys.skillPoints).toBeUndefined();
    expect(sys.xp.postCreationProgress).toEqual({ attributes: { might: 4 } });
    expect(sys.xp.currentStep.skills).toEqual(['profession:smith']);
    expect(sys.points.xpFree).toBe(5 + 3 + 2);
    expect(sys.xp.freeEarned).toBe(5 + 3);
    expect(sys.xp.totalEarned).toBe(40);
    expect(sys.xp.history.filter((e: any) => e.legacySkillRetired).length).toBe(2);
    const flags = actor.flags['mastery-system'];
    expect(flags.legacySkillWriteQuarantine).toBeUndefined();
    expect(flags.legacyCleanupMigrated).toBe(true);
    expect(flags.legacySkillsArchive).toMatchObject({
      source: 'legacy-cleanup-2026',
      skills: { athletics: 6 },
      skillsSpent: { athletics: 2 },
      skillPoints: { unspent: 3, placed: {} },
      refund: { xpRefund: 2, xpSource: 'history', skillPointsToFreeXp: 3 },
    });
    expect(flags.legacySkillsArchive.quarantine).toHaveLength(1);
    expect(settings.get('legacyCleanup2026MigrationState')).toBe('applied');

    expect(planActorLegacyCleanup(actor)).toBeNull();
    const again = buildLegacyCleanupReport(g);
    expect(again.actors).toHaveLength(0);
  });

  it('rollback restores every touched field and clears the markers', async () => {
    const original = charSystem({
      skills: { athletics: 6 },
      skillPoints: { unspent: 2, placed: {} },
      xp: { totalEarned: 40, totalSpent: 30, freeEarned: 5, freeSpent: 0, history: [], postCreationProgress: { skills: { athletics: 4 } } },
    });
    const actor = mockActor('a1', 'Oda', JSON.parse(JSON.stringify(original)));
    const g = installGame([actor]);
    await applyLegacyCleanupReport(buildLegacyCleanupReport(g), g);
    expect(actor.system.skills).toBeUndefined();
    await rollbackActorLegacyCleanup(actor);
    expect(actor.system).toEqual(original);
    expect(actor.flags['mastery-system']).toEqual({});
    expect(settings.get('legacyCleanup2026MigrationState')).toBe('pending');
  });

  it('a GM decision resolves a Skill conflict with the chosen refund', async () => {
    const actor = mockActor('a1', 'Oda', charSystem({ skills: { athletics: 5 } }));
    const g = installGame([actor]);
    await applyLegacyCleanupReport(buildLegacyCleanupReport(g), g);
    expect(actor.system.skills).toEqual({ athletics: 5 });
    expect(actor.flags['mastery-system'].legacyCleanupConflict.reasons.length).toBeGreaterThan(0);
    expect(await resolveLegacySkillConflict(actor, { xpRefund: 4, note: 'table agreed' })).toBe(true);
    expect(actor.system.skills).toBeUndefined();
    expect(actor.system.points.xpFree).toBe(9);
    expect(actor.flags['mastery-system'].legacyCleanupConflict).toBeUndefined();
    expect(actor.flags['mastery-system'].legacySkillsArchive.gmDecision).toMatchObject({ xpRefund: 4, note: 'table agreed' });
  });
});

describe('NPC Skills and Summon fields (D7)', () => {
  it('archives NPC system.skills without conversion', () => {
    const npc = mockActor('n1', 'Bandit', { skills: { stealth: 4 }, attributes: {} }, { type: 'npc' });
    const plan = planActorLegacyCleanup(npc)!;
    expect(plan.npcSkillKeys).toBe(1);
    expect(plan.updates!['system.-=skills']).toBeNull();
    expect((plan.updates!['flags.mastery-system.legacySkillsArchive'] as any).skills).toEqual({ stealth: 4 });
  });

  it('archives retired Summon Skill fields on Bonds and Summon actors', () => {
    const owner = mockActor('a1', 'Oda', charSystem({
      summonBonds: [{ id: 'b1', name: 'Owl', selectedSkills: ['stealth'], skillDiceAlloc: { stealth: 2 }, taskSpecMap: {} }, { id: 'b2', name: 'Cat' }],
    }));
    const plan = planActorLegacyCleanup(owner)!;
    expect(plan.summonBonds).toBe(1);
    expect(plan.updates!['system.summonBonds']).toEqual([{ id: 'b1', name: 'Owl' }, { id: 'b2', name: 'Cat' }]);
    const summon = mockActor('s1', 'Owl', { summonBond: { bondId: 'b1', selectedSkills: ['x'], skillDiceAlloc: {} } }, { type: 'npc' });
    const sp = planActorLegacyCleanup(summon)!;
    expect(sp.summonActorFields).toBe(2);
    expect(sp.updates!['system.summonBond.-=selectedSkills']).toBeNull();
  });

  it('archives retired Echo Card picks and restores them on rollback', () => {
    const actor = mockActor('a1', 'Oda', charSystem({
      echo: { key: 'humans', selectedCardIds: ['human-start-1'], cardUses: { 'human-start-1': true }, traitUses: {} },
    }));
    const plan = planActorLegacyCleanup(actor)!;
    expect(plan.echoCardIds).toBe(1);
    expect(plan.updates!['system.echo.-=selectedCardIds']).toBeNull();
    expect(plan.updates!['system.echo.-=cardUses']).toBeNull();
    expect((plan.updates!['flags.mastery-system.legacySkillsArchive'] as any).echoCards).toEqual({
      selectedCardIds: ['human-start-1'],
      cardUses: { 'human-start-1': true },
    });
    const restore = restoreFromBackup(backupForUpdates(actor, plan.updates!, '2026-11-18T00:00:00.000Z'));
    expect(restore['system.echo.selectedCardIds']).toEqual(['human-start-1']);
    expect(restore['system.echo.cardUses']).toEqual({ 'human-start-1': true });
  });
});

describe('powers', () => {
  it('Heal + Cleanse (Mixed) → Cleanse at the same PL; an existing Cleanse makes it a conflict', () => {
    const mixed = removedPower('active-melee-heal-cleanse-mixed', 5, 'p1');
    mixed.name = 'Melee Cleanse (Mixed)';
    const [c] = planPowerItemsLegacyCleanup([mixed], { name: 'Oda', uuid: 'Actor.a1' });
    expect(c).toMatchObject({ kind: 'remap', rank: 5, to: { templateId: 'active-melee-single-cleanse', special: null } });
    expect(c!.rename).toBeTruthy();
    const owned = power('active-melee-single-cleanse', null, 3, 'p2');
    const [d] = planPowerItemsLegacyCleanup([mixed, owned], { name: 'Oda', uuid: 'Actor.a1' });
    expect(d!.kind).toBe('conflict');
  });

  it('classifies D3–D5 removals, Artifact heals and Weapon AoE Specials', () => {
    const items = [
      removedPower('active-ranged-single-dispel', 4, 'd1'),
      removedPower('active-melee-targeted-special', 4, 'd2'),
      power('active-ranged-zone-t5', null, 6, 'd3'),
      removedPower('active-melee-single-heal', 4, 'd4', { fromArtifact: true }),
      removedPower('active-melee-single-heal', 4, 'd5'),
      power('active-melee-weapon-aoe', null, 4, 'd6', { fromArtifact: true }),
      power('active-melee-weapon-aoe', null, 4, 'd7'),
      removedPower('active-melee-damage-t4', 4, 'd8'),
      removedPower('active-ranged-aoe-dispel', 4, 'd9', { legacyCleanupConflict: { reasons: ['x'] } }),
    ];
    items[2]!.system.chosenSpecial = { key: 'root', tier: 5 };
    items[5]!.system.chosenSpecial = { key: 'lacerate', tier: 4 };
    items[6]!.system.chosenSpecial = { key: 'lacerate', tier: 4 };
    const byId = Object.fromEntries(planPowerItemsLegacyCleanup(items, null).map((c) => [c.itemId, c]));
    expect(byId.d1!.kind).toBe('conflict');
    expect(byId.d2!.kind).toBe('conflict');
    expect(byId.d3!.kind).toBe('conflict');
    expect(byId.d4!.kind).toBe('retire');
    expect(byId.d5).toBeUndefined();
    expect(byId.d6).toMatchObject({ kind: 'remap', to: { templateId: 'active-melee-aoe-damage-t4', special: 'lacerate' } });
    expect(byId.d7!.kind).toBe('conflict');
    expect(byId.d8!.kind).toBe('conflict');
    expect(byId.d9).toBeUndefined();
  });

  it('Apply remaps, flags and retires; rollback restores the item', async () => {
    const mixed = removedPower('active-ranged-heal-cleanse-mixed', 6, 'p1');
    const dispel = removedPower('active-melee-single-dispel', 3, 'p2');
    const heal = removedPower('active-ranged-single-heal', 4, 'p3', { fromArtifact: true });
    const actor = mockActor('a1', 'Oda', charSystem(), { items: [mixed, dispel, heal] });
    const g = installGame([actor]);
    const summary = await applyLegacyCleanupReport(buildLegacyCleanupReport(g), g);
    expect(summary).toMatchObject({ items: 3, failed: 0 });
    expect(mixed.system.templateId).toBe('active-ranged-single-cleanse');
    expect(mixed.system.rank).toBe(6);
    expect(dispel.flags['mastery-system'].legacyCleanupConflict).toBeTruthy();
    expect(dispel.system.templateId).toBe('active-melee-single-dispel');
    expect(heal.flags['mastery-system'].legacyCleanupRetired).toBe(true);
    expect(buildLegacyCleanupReport(g).items).toHaveLength(0);

    await rollbackActorLegacyCleanup(actor);
    expect(mixed.system.templateId).toBe('active-ranged-heal-cleanse-mixed');
    expect(mixed.flags['mastery-system']).toEqual({});
    expect(heal.flags['mastery-system']).toEqual({ fromArtifact: true });
  });
});

describe('Artifact picks', () => {
  function artifact(key: string | null, picks: any[], id = 'art1', extra: any = {}): any {
    const rows = deriveLevelProgressionFromPicks(picks);
    return mockDoc({
      id,
      name: key ?? 'Unknown',
      type: 'artifact',
      system: { progressionPicks: picks, levelProgression: [...rows, { level: 10, name: 'Artifact Awakening', type: 'Ultimate' }], ...extra },
      flags: { 'mastery-system': key ? { echoArtifactKey: key } : {} },
    });
  }

  function defPicks(key: string): any[] {
    return JSON.parse(JSON.stringify(buildEchoProgressionPicks(lookupArtifactDefinition(key)!)));
  }

  it('Moonlight Greatsword L1 Heal → Ranged Scarred Bar Restoration (D1); other rows untouched', async () => {
    const picks = defPicks('moonlightGreatsword');
    picks[0] = { level: 1, kind: 'power', powerTemplateId: 'active-melee-single-heal', displayName: 'Moonlight Mending' };
    const art = artifact('moonlightGreatsword', picks);
    const before = JSON.parse(JSON.stringify(art.system.levelProgression));
    const plan = planArtifactLegacyCleanup(art, null)!;
    expect(plan.picks).toEqual([expect.objectContaining({ level: 1, kind: 'realign' })]);
    const g = installGame([], [art]);
    await applyLegacyCleanupReport(buildLegacyCleanupReport(g), g);
    expect(art.system.progressionPicks[0].powerTemplateId).toBe('active-ranged-health-level-heal');
    const rows = art.system.levelProgression as any[];
    for (const lvl of [1, 4, 7]) expect(rows.find((r) => r.level === lvl)?.powerTemplateId).toBe('active-ranged-health-level-heal');
    for (const lvl of [2, 3, 5, 6, 8, 9, 10]) {
      expect(rows.find((r) => r.level === lvl)).toEqual(before.find((r: any) => r.level === lvl));
    }
    expect(planArtifactLegacyCleanup(art, null)).toBeNull();
  });

  it('a Moonlight Mending Healing-support pick (v0.9.869) is realigned; other Healing supports are untouched', () => {
    const picks = defPicks('moonlightGreatsword');
    picks[0] = {
      level: 1,
      kind: 'stoneFunction',
      displayName: 'Moonlight Mending',
      stoneFunction: { kind: 'stonePowerSupport', attribute: 'resolve', stonePowerId: 'resolve.healing', supportStages: [1, 4, 7] },
    };
    const plan = planArtifactLegacyCleanup(artifact('moonlightGreatsword', picks), null)!;
    expect(plan.picks).toEqual([expect.objectContaining({ level: 1, kind: 'realign', to: 'active-ranged-health-level-heal' })]);
    for (const key of ['judicatorFrame']) {
      if (!lookupArtifactDefinition(key)) continue;
      expect(planArtifactLegacyCleanup(artifact(key, defPicks(key)), null)).toBeNull();
    }
  });

  it("Lor-Keth's Staff L1 → Melee Single Target Special: Challenge (D2); Dragon Claws → AoE Special: Lacerate", () => {
    const lk = defPicks('lorKethsStaff');
    lk[0] = { level: 1, kind: 'power', powerTemplateId: 'active-melee-damage-t5', chosenSpecial: { key: 'challenge', tier: 5 } };
    const lkPlan = planArtifactLegacyCleanup(artifact('lorKethsStaff', lk), null)!;
    expect(lkPlan.picks[0]).toMatchObject({ level: 1, kind: 'realign', to: 'active-melee-instant-special-t5::challenge' });
    const dc = defPicks('dragonClaws');
    dc[1] = { level: 2, kind: 'power', powerTemplateId: 'active-melee-weapon-aoe', chosenSpecial: { key: 'lacerate', tier: 4 } };
    const dcPlan = planArtifactLegacyCleanup(artifact('dragonClaws', dc), null)!;
    expect(dcPlan.picks[0]).toMatchObject({ level: 2, kind: 'realign', to: 'active-melee-aoe-damage-t4::lacerate' });
  });

  it('an Artifact without a definition key or with authored rows goes to the conflict list unchanged', async () => {
    const heal = [{ level: 1, kind: 'power', powerTemplateId: 'active-melee-single-heal' }];
    const noKey = artifact(null, heal, 'x1');
    expect(planArtifactLegacyCleanup(noKey, null)!.picks[0]!.kind).toBe('conflict');
    const authored = artifact('moonlightGreatsword', heal, 'x2', { useAuthoredLevelProgression: true });
    expect(planArtifactLegacyCleanup(authored, null)!.picks[0]!.kind).toBe('conflict');
    const g = installGame([], [noKey]);
    await applyLegacyCleanupReport(buildLegacyCleanupReport(g), g);
    expect(noKey.system.progressionPicks).toEqual(heal);
    expect(noKey.flags['mastery-system'].legacyCleanupConflict).toBeTruthy();
  });
});

describe('Artifact identity', () => {
  it('backfills the key once from an exact, unique name; shared names go to the conflict list', async () => {
    expect(artifactKeysForName('Moonlight Greatsword (L3)')).toEqual(['moonlightGreatsword']);
    expect(artifactKeysForName('Rusty Dagger')).toEqual([]);
    const art = mockDoc({ id: 'k1', name: 'Moonlight Greatsword', type: 'artifact', system: { progressionPicks: [], levelProgression: [] }, flags: { 'mastery-system': {} } });
    const plan = planArtifactLegacyCleanup(art, null)!;
    expect(plan.keyBackfill).toBe('moonlightGreatsword');
    const g = installGame([], [art]);
    await applyLegacyCleanupReport(buildLegacyCleanupReport(g), g);
    expect(art.flags['mastery-system'].echoArtifactKey).toBe('moonlightGreatsword');
    expect(planArtifactLegacyCleanup(art, null)).toBeNull();

    const shared = mockDoc({ id: 'k2', name: 'Titan Scars', type: 'artifact', system: {}, flags: { 'mastery-system': {} } });
    const sp = planArtifactLegacyCleanup(shared, null);
    if (artifactKeysForName('Titan Scars').length > 1) expect(sp!.picks[0]!.kind).toBe('conflict');
  });

  it('runtime resolves Artifact identity from flags only (no name fallback)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (p.endsWith('.ts') && !p.includes(`${path.sep}migrations${path.sep}`)) {
          const src = fs.readFileSync(p, 'utf8');
          if (/inferArtifactKeyFromName|ArtifactKeyFromName/.test(src)) offenders.push(p);
        }
      }
    };
    walk(path.resolve('src'));
    expect(offenders).toEqual([]);
  });
});

describe('gates', () => {
  it('Apply does nothing until Actives v0.9.9.6 is applied; the dry run never writes', async () => {
    settings.set('activesV0996MigrationState', 'pending');
    const actor = mockActor('a1', 'Oda', charSystem({ skills: { athletics: 5 }, xp: { totalEarned: 0, totalSpent: 0, history: [] } }));
    const g = installGame([actor]);
    const report = (await runLegacyCleanupDryRunOnReady(g))!;
    expect(report.actors).toHaveLength(1);
    expect(updateOptions).toHaveLength(0);
    const summary = await applyLegacyCleanupReport(report, g);
    expect(summary.actors).toBe(0);
    expect(actor.system.skills).toEqual({ athletics: 5 });
    expect(settings.get('legacyCleanup2026MigrationState')).toBe('pending');
  });

  it('a clean world is marked applied without writes', async () => {
    const g = installGame([mockActor('a1', 'Clean', charSystem())]);
    await runLegacyCleanupDryRunOnReady(g);
    expect(settings.get('legacyCleanup2026MigrationState')).toBe('applied');
    expect(updateOptions).toHaveLength(0);
  });

  it('resync hold: candidates wait for Apply; flagged items are never re-baked', () => {
    const zone = power('active-ranged-zone-t5', null, 6, 'z');
    zone.system.chosenSpecial = { key: 'root', tier: 5 };
    expect(isLegacyCleanupResyncHeld(zone, false)).toBe(true);
    expect(isLegacyCleanupResyncHeld(zone, true)).toBe(false);
    zone.flags['mastery-system'].legacyCleanupConflict = { reasons: ['x'] };
    expect(isLegacyCleanupResyncHeld(zone, true)).toBe(true);
    expect(isLegacyCleanupResyncHeld(power('active-melee-single-cleanse', null, 3, 'c'), false)).toBe(false);
  });
});
