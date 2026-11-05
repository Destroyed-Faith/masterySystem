/**
 * Batch E / K7 — identity migration fixture tests (plan M1–M8).
 * Never touches productive actors — in-memory fixtures only.
 */
import { describe, expect, it } from 'vitest';
import {
  applyIdentityMigrationProposals,
  buildIdentityMigrationDryRunSections,
  formatIdentityMigrationDryRunMarkdown,
  planActorIdentityMigration,
  rollbackIdentityMigration,
  IDENTITY_BACKUP_FLAG,
} from '../src/migrations/power-identity-migration.js';
import { resolvePowerIdentity } from '../src/utils/power-identity.js';

/**
 * K7b: Foundry Document#update merge semantics.
 * - Nested objects merge.
 * - Keys named `-=field` delete `field` on the parent.
 * - Plain omission does NOT delete.
 * A local `delete obj.key` before update must not make the test pass — only the
 * update payload (applied here) mutates the document.
 */
function applyFoundryUpdate(doc: Record<string, unknown>, patch: Record<string, unknown>): void {
  const merge = (target: Record<string, unknown>, source: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(source)) {
      if (key.startsWith('-=')) {
        delete target[key.slice(2)];
        continue;
      }
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof target[key] === 'object' &&
        target[key] &&
        !Array.isArray(target[key])
      ) {
        merge(target[key] as Record<string, unknown>, value as Record<string, unknown>);
      } else {
        target[key] = value;
      }
    }
  };
  merge(doc, patch);
}

function withFoundryUpdate<T extends Record<string, unknown>>(doc: T): T & {
  updateCalls: unknown[];
  update: (data: Record<string, unknown>) => Promise<void>;
} {
  const wrapped = doc as T & {
    updateCalls: unknown[];
    update: (data: Record<string, unknown>) => Promise<void>;
  };
  wrapped.updateCalls = [];
  wrapped.update = async (data: Record<string, unknown>) => {
    wrapped.updateCalls.push(JSON.parse(JSON.stringify(data)));
    // Mutate ONLY via Foundry merge — ignore any prior in-memory deletes.
    applyFoundryUpdate(wrapped, data);
  };
  return wrapped;
}

function ringchainFixture() {
  return {
    id: 'ActorFix1',
    name: 'Fixture Halfling',
    items: [
      {
        id: 'art1',
        type: 'artifact',
        name: 'Ringchain of Kept Names - Level 8-1',
        flags: { 'mastery-system': { echoArtifactKey: 'ringchainOfKeptNames' } },
        system: {
          currentLevel: 8,
          levelProgression: [
            {
              level: 2,
              name: 'Burden Lifted I',
              type: 'Active, Support',
              effect: 'Remove up to 6…',
            },
            {
              level: 3,
              name: 'Hearth Circle I',
              type: 'Active, Support',
              effect: 'Restore…',
            },
            {
              level: 8,
              name: 'Hearth Circle II',
              type: 'Active, Support',
              effect: 'Restore…',
            },
          ],
        },
      },
    ],
    effects: [],
  };
}

describe('power identity migration (fixtures)', () => {
  it('M1: Ringchain rows get powerTemplateId/rank from echoArtifactKey+level', async () => {
    const actor = ringchainFixture();
    const proposals = planActorIdentityMigration(actor);
    const auto = proposals.filter((p) => p.disposition === 'auto-stable-key');
    expect(auto.length).toBeGreaterThanOrEqual(3);
    for (const p of auto) p.selected = true;
    const report = await applyIdentityMigrationProposals(actor, proposals);
    expect(report.applied).toBeGreaterThanOrEqual(3);
    const rows = actor.items[0].system.levelProgression;
    const l3 = rows.find((r: any) => r.level === 3);
    expect(l3.powerTemplateId).toBe('active-melee-aoe-restoration');
    expect(l3.rank).toBe(4);
    expect(l3.name).toBe('Hearth Circle I');
    expect(l3.effect).toBe('Restore…');
    expect(actor.items[0].flags['mastery-system'][IDENTITY_BACKUP_FLAG]).toBeDefined();

    const id = resolvePowerIdentity({
      kind: 'artifact-row',
      artifact: actor.items[0],
      row: l3,
    });
    expect(id.ok).toBe(true);
  });

  it('M2: artifact without echoArtifactKey stays manual', () => {
    const actor = {
      items: [
        {
          id: 'a',
          type: 'artifact',
          name: 'Mystery',
          flags: { 'mastery-system': {} },
          system: {
            levelProgression: [{ level: 1, name: 'X', type: 'Active, Support' }],
          },
        },
      ],
      effects: [],
    };
    const proposals = planActorIdentityMigration(actor);
    expect(proposals.every((p) => p.disposition === 'manual')).toBe(true);
  });

  it('M5: buff effect with powerId gets templateId', async () => {
    const actor = {
      items: [
        {
          id: 'pow1',
          type: 'power',
          name: 'Armor',
          system: { templateId: 'ab-armor', rank: 4 },
        },
      ],
      effects: [
        {
          id: 'e1',
          name: 'Armor',
          flags: { 'mastery-system': { activeBuff: true, powerId: 'pow1' } },
        },
      ],
    };
    const proposals = planActorIdentityMigration(actor);
    const buff = proposals.find((p) => p.effectId === 'e1');
    expect(buff?.disposition).toBe('auto-stable-key');
    buff!.selected = true;
    await applyIdentityMigrationProposals(actor, proposals);
    expect(actor.effects[0].flags['mastery-system'].powerTemplateId).toBe('ab-armor');
    expect(actor.effects[0].name).toBe('Armor');
  });

  it('M8: migration is idempotent', async () => {
    const actor = ringchainFixture();
    const p1 = planActorIdentityMigration(actor);
    for (const p of p1) if (p.disposition === 'auto-stable-key') p.selected = true;
    await applyIdentityMigrationProposals(actor, p1);
    const p2 = planActorIdentityMigration(actor);
    const still = p2.filter(
      (p) => p.disposition === 'auto-stable-key' && Object.keys(p.after).length > 0,
    );
    expect(still.length).toBe(0);
  });

  it('dry-run does not mutate', async () => {
    const actor = ringchainFixture();
    const proposals = planActorIdentityMigration(actor);
    for (const p of proposals) if (p.disposition === 'auto-stable-key') p.selected = true;
    await applyIdentityMigrationProposals(actor, proposals, { dryRun: true });
    expect(actor.items[0].system.levelProgression[0].powerTemplateId).toBeUndefined();
  });

  it('M3: ambiguous templateName stays manual (never guessed)', () => {
    const actor = {
      items: [
        {
          id: 'p',
          type: 'power',
          name: 'Armor',
          system: { templateName: 'Armor', rank: 1 },
        },
      ],
      effects: [],
    };
    const proposals = planActorIdentityMigration(actor);
    const p = proposals.find((x) => x.itemId === 'p');
    expect(p?.disposition).toBe('manual');
    expect(Object.keys(p?.after || {})).toHaveLength(0);
  });

  it('M4: unique templateName → auto-provenance; apply after selection', async () => {
    const { ALL_POWER_TEMPLATES } = await import('../src/utils/powers/templates/index.js');
    const counts = new Map<string, number>();
    const ids = new Map<string, string>();
    for (const t of ALL_POWER_TEMPLATES) {
      const name = String(t.templateName || '').trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
      ids.set(name, t.templateId);
    }
    let unique: { name: string; id: string } | null = null;
    for (const [name, id] of ids) {
      if (counts.get(name) === 1) {
        unique = { name, id };
        break;
      }
    }
    expect(unique).toBeTruthy();
    const actor = {
      items: [
        {
          id: 'p',
          type: 'power',
          name: unique!.name,
          system: { templateName: unique!.name, rank: 4 },
        },
      ],
      effects: [],
    };
    const proposals = planActorIdentityMigration(actor);
    const p = proposals.find((x) => x.itemId === 'p');
    expect(p?.disposition).toBe('auto-provenance');
    expect(p?.after.templateId).toBe(unique!.id);
    expect(p?.selected).toBe(false); // must confirm
    p!.selected = true;
    await applyIdentityMigrationProposals(actor, proposals);
    expect(actor.items[0].system.templateId).toBe(unique!.id);
  });

  it('M6: effect without linked power stays unresolved; document preserved', async () => {
    const actor = {
      items: [],
      effects: [
        {
          id: 'e1',
          name: 'Orphan Buff',
          flags: { 'mastery-system': { activeBuff: true, powerId: 'missing' } },
        },
      ],
    };
    const proposals = planActorIdentityMigration(actor);
    const e = proposals.find((x) => x.effectId === 'e1');
    expect(e?.disposition).toBe('manual');
    expect(actor.effects[0].flags['mastery-system'].activeBuff).toBe(true);
    expect(actor.effects[0].name).toBe('Orphan Buff');
  });

  it('M7: rollback restores levelProgression rows and effects (in-memory)', async () => {
    const actor = ringchainFixture();
    actor.effects = [
      {
        id: 'e1',
        name: 'Armor',
        flags: { 'mastery-system': { activeBuff: true, powerId: 'pow1' } },
      },
    ];
    actor.items.push({
      id: 'pow1',
      type: 'power',
      name: 'Armor',
      system: { templateId: 'ab-armor', rank: 4 },
    });

    const proposals = planActorIdentityMigration(actor);
    for (const p of proposals) {
      if (p.disposition === 'auto-stable-key' && Object.keys(p.after).length) p.selected = true;
    }
    await applyIdentityMigrationProposals(actor, proposals);
    const rows = actor.items[0].system.levelProgression;
    expect(rows.find((r: any) => r.level === 3)?.powerTemplateId).toBe(
      'active-melee-aoe-restoration',
    );
    expect(actor.effects[0].flags['mastery-system'].powerTemplateId).toBe('ab-armor');

    const restored = await rollbackIdentityMigration(actor);
    expect(restored).toBeGreaterThan(0);
    expect(rows.find((r: any) => r.level === 3)?.powerTemplateId).toBeUndefined();
    expect(actor.effects[0].flags['mastery-system'].powerTemplateId).toBeUndefined();
    expect(actor.effects[0].flags['mastery-system'][IDENTITY_BACKUP_FLAG]).toBeUndefined();
    expect(actor.effects[0].flags['mastery-system'].activeBuff).toBe(true);
    expect(actor.effects[0].flags['mastery-system'].powerId).toBe('pow1');
  });

  it('M7b/K7b: rollback uses Foundry -= deletions under merge semantics', async () => {
    const artifact = withFoundryUpdate({
      id: 'art1',
      type: 'artifact',
      name: 'Ringchain of Kept Names - Level 8-1',
      flags: { 'mastery-system': { echoArtifactKey: 'ringchainOfKeptNames' } },
      system: {
        currentLevel: 8,
        levelProgression: [
          {
            level: 3,
            name: 'Hearth Circle I',
            type: 'Active, Support',
            effect: 'Restore…',
          },
        ],
      },
    });
    // Linked power already carries templateId so the effect proposal is auto-stable-key.
    const power = withFoundryUpdate({
      id: 'pow1',
      type: 'power',
      name: 'Armor',
      system: { templateId: 'ab-armor', rank: 4, category: 'activeBuff' },
    });

    const effect = withFoundryUpdate({
      id: 'e1',
      name: 'Armor',
      flags: { 'mastery-system': { activeBuff: true, powerId: 'pow1' } },
    });

    const actor = { id: 'ActorMerge', items: [artifact, power], effects: [effect] };

    const proposals = planActorIdentityMigration(actor);
    for (const p of proposals) {
      if (Object.keys(p.after).length && p.disposition !== 'manual') p.selected = true;
    }
    await applyIdentityMigrationProposals(actor, proposals);

    expect(artifact.system.levelProgression[0].powerTemplateId).toBe(
      'active-melee-aoe-restoration',
    );
    expect(effect.flags['mastery-system'].powerTemplateId).toBeTruthy();
    expect(effect.flags['mastery-system'][IDENTITY_BACKUP_FLAG]).toBeTruthy();

    // Snapshot post-apply keys that must disappear after rollback.
    const effectKeysBefore = Object.keys(effect.flags['mastery-system']);
    expect(effectKeysBefore).toContain('powerTemplateId');
    expect(effectKeysBefore).toContain(IDENTITY_BACKUP_FLAG);

    const restored = await rollbackIdentityMigration(actor);
    expect(restored).toBeGreaterThan(0);

    // Foundry merge path: identity keys must be gone (not merely null).
    expect(artifact.system.levelProgression[0].powerTemplateId).toBeUndefined();
    expect(artifact.system.levelProgression[0].name).toBe('Hearth Circle I');
    expect(artifact.system.levelProgression[0].effect).toBe('Restore…');
    expect(artifact.flags['mastery-system'][IDENTITY_BACKUP_FLAG]).toBeUndefined();
    expect(artifact.flags['mastery-system'].echoArtifactKey).toBe('ringchainOfKeptNames');

    expect(Object.prototype.hasOwnProperty.call(effect.flags['mastery-system'], 'powerTemplateId')).toBe(
      false,
    );
    expect(
      Object.prototype.hasOwnProperty.call(effect.flags['mastery-system'], IDENTITY_BACKUP_FLAG),
    ).toBe(false);
    expect(effect.flags['mastery-system'].activeBuff).toBe(true);
    expect(effect.flags['mastery-system'].powerId).toBe('pow1');

    // Update payloads must contain explicit -= deletions (plain delete is insufficient).
    const effectRollback = [...effect.updateCalls].reverse().find((c: any) =>
      JSON.stringify(c).includes(`-=${IDENTITY_BACKUP_FLAG}`),
    ) as any;
    expect(effectRollback).toBeTruthy();
    expect(effectRollback.flags['mastery-system'][`-=${IDENTITY_BACKUP_FLAG}`]).toBeNull();
    expect(
      Object.keys(effectRollback.flags['mastery-system']).some((k) => k.startsWith('-=')),
    ).toBe(true);

    // Idempotent second rollback.
    const again = await rollbackIdentityMigration(actor);
    expect(again).toBe(0);
  });

  it('M7c: power-item system.templateId rollback uses Foundry -= under merge semantics', async () => {
    // Unique templateName (Flight) → auto-provenance. "Armor" collides across categories.
    const power = withFoundryUpdate({
      id: 'powMissing',
      type: 'power',
      name: 'Flight',
      system: {
        templateName: 'Flight',
        category: 'movement',
        rank: 4,
      },
    });
    const actor = { id: 'ActorPowerMerge', items: [power], effects: [] };

    const proposals = planActorIdentityMigration(actor);
    const powerProp = proposals.find(
      (p) => p.itemId === 'powMissing' && p.path.includes('templateId'),
    );
    expect(powerProp).toBeTruthy();
    expect(powerProp!.disposition).toBe('auto-provenance');
    expect(powerProp!.after.templateId).toBe('movement-flight');
    powerProp!.selected = true;

    await applyIdentityMigrationProposals(actor, proposals);
    expect(power.system.templateId).toBe('movement-flight');
    expect(power.flags?.['mastery-system']?.[IDENTITY_BACKUP_FLAG]).toBeTruthy();

    const restored = await rollbackIdentityMigration(actor);
    expect(restored).toBeGreaterThan(0);

    // Foundry merge: templateId must be gone (not null).
    expect(Object.prototype.hasOwnProperty.call(power.system, 'templateId')).toBe(false);
    expect(power.flags?.['mastery-system']?.[IDENTITY_BACKUP_FLAG]).toBeUndefined();

    const powerRollback = [...power.updateCalls].reverse().find((c: any) =>
      JSON.stringify(c).includes('-=templateId'),
    ) as any;
    expect(powerRollback).toBeTruthy();
    expect(powerRollback.system['-=templateId']).toBeNull();
    expect(powerRollback.flags['mastery-system'][`-=${IDENTITY_BACKUP_FLAG}`]).toBeNull();
  });

  it('K7: dry-run report has four sections', () => {
    const actor = ringchainFixture();
    const proposals = planActorIdentityMigration(actor);
    const sections = buildIdentityMigrationDryRunSections(proposals);
    expect(sections.autoStableKey.length).toBeGreaterThan(0);
    const md = formatIdentityMigrationDryRunMarkdown(sections);
    expect(md).toContain('Auto (stabiler Schlüssel)');
    expect(md).toContain('Auto (Herkunftsdatum)');
    expect(md).toContain('Manuell');
    expect(md).toContain('Nicht aktivierbar');
  });

  it('K7: GM-reassigned row with existing identity is not overwritten', () => {
    const actor = {
      items: [
        {
          id: 'art1',
          type: 'artifact',
          flags: { 'mastery-system': { echoArtifactKey: 'dragonHead' } },
          system: {
            currentLevel: 1,
            levelProgression: [
              {
                level: 1,
                name: 'GM Custom Cleanse',
                type: 'Active',
                powerTemplateId: 'active-ranged-single-cleanse',
                rank: 4,
              },
            ],
          },
        },
      ],
      effects: [],
    };
    const proposals = planActorIdentityMigration(actor);
    expect(proposals.filter((p) => p.path.includes('levelProgression'))).toHaveLength(0);
  });

  it('K7: authoredStages proposals are planned', () => {
    const actor = {
      items: [
        {
          id: 'art1',
          type: 'artifact',
          flags: { 'mastery-system': { echoArtifactKey: 'ringchainOfKeptNames' } },
          system: {
            currentLevel: 3,
            levelProgression: [],
            progressionPicks: [
              {
                authoredStages: [
                  { level: 3, name: 'Hearth Circle I', type: 'Active, Support' },
                ],
              },
            ],
          },
        },
      ],
      effects: [],
    };
    const proposals = planActorIdentityMigration(actor);
    const stage = proposals.find((p) => p.path.includes('authoredStages'));
    expect(stage?.after.powerTemplateId).toBe('active-melee-aoe-restoration');
    expect(stage?.disposition).toBe('auto-stable-key');
  });
});

