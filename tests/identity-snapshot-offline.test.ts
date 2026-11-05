/**
 * Offline Identity Snapshot adapter — fixture round-trip (no Foundry).
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { preflightActor } from '../src/utils/identity-preflight.js';
import {
  buildIdentityMigrationDryRunSections,
  planActorIdentityMigration,
} from '../src/migrations/power-identity-migration.js';

const FIXTURE = path.resolve(__dirname, './__fixtures__/identity-snapshot-minimal.json');

describe('identity snapshot offline adapter', () => {
  it('minimal fixture has the expected format envelope (v1 still accepted)', () => {
    const snap = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
    expect(snap.format).toBe('mastery-identity-snapshot');
    // Fixture stays on v1 to prove offline adapter / preflight keep accepting prior exports.
    expect(snap.formatVersion).toBe(1);
    expect([1, 2]).toContain(snap.formatVersion);
    expect(snap.readOnly).toBe(true);
    expect(Array.isArray(snap.actors)).toBe(true);
    expect(snap.actors[0].items.some((i: any) => i.type === 'power')).toBe(true);
    expect(snap.actors[0].items.some((i: any) => i.type === 'artifact')).toBe(true);
  });

  it('v2 envelope shape: mastery.rank + progressionPicks level/kind remain preflight-compatible', () => {
    const snap = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
    const actor = {
      ...snap.actors[0],
      system: {
        masteryRank: 4,
        mastery: { rank: 4 },
        level: null,
      },
      items: snap.actors[0].items.map((it: any) => {
        if (it.type !== 'artifact') return it;
        return {
          ...it,
          system: {
            ...it.system,
            progressionPicks: [
              {
                pickIndex: 0,
                level: 1,
                kind: 'authored',
                authoredStages: [],
              },
            ],
          },
        };
      }),
    };
    const report = preflightActor(actor);
    expect(report.errors || []).toEqual([]);
    expect(report.totals.sources).toBeGreaterThan(0);
  });

  it('preflightActor and planActorIdentityMigration accept snapshot actors', () => {
    const snap = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
    const actor = snap.actors[0];
    const report = preflightActor(actor);
    expect(report.totals.sources).toBeGreaterThan(0);
    // Power with templateId resolves; artifact row missing identity is unresolved / suggestable.
    expect(report.errors || []).toEqual([]);

    const proposals = planActorIdentityMigration(actor);
    expect(proposals.some((p) => p.path.includes('levelProgression'))).toBe(true);
    expect(
      proposals.some(
        (p) =>
          p.disposition === 'auto-stable-key' &&
          p.basis === 'echoArtifactKey+level' &&
          !!p.after.powerTemplateId,
      ),
    ).toBe(true);

    const sections = buildIdentityMigrationDryRunSections(proposals);
    expect(sections.autoStableKey.length).toBeGreaterThan(0);
  });

  it('redaction contract: fixture contains no sensitive keys', () => {
    const raw = fs.readFileSync(FIXTURE, 'utf8');
    expect(raw).not.toMatch(/password|api[_-]?key|authorization|access[_-]?token/i);
  });
});
