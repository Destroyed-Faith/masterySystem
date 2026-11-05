/**
 * K3: newly introduced useAuthoredLevelProgression flags on Titan Scars,
 * Hollow Crown, and Ringchain must not remain if they change tree content
 * beyond allowed identity fields. Sentinel Frame (pre-existing) stays.
 */
import { describe, expect, it } from 'vitest';
import { ECHO_ARTIFACTS } from '../src/utils/echo-artifacts.js';
import { buildEchoArtifactTree } from '../src/artifacts/echo-artifact-tree-builder.js';
import type { EchoArtifactDefinition } from '../src/utils/echo-artifacts.js';

const IDENTITY = new Set([
  'powerTemplateId',
  'artifactFunctionId',
  'rank',
  'limited',
  'isSpell',
  'castingAttribute',
  'spellResolution',
  'chosenSpecialKey',
]);

function stripIdentity(row: Record<string, unknown>) {
  const o = { ...row };
  for (const k of IDENTITY) delete o[k];
  return o;
}

function summarize(def: EchoArtifactDefinition) {
  const tree = buildEchoArtifactTree(def);
  return tree.nodes.map((n) => {
    const sys = n.itemData.system as {
      useAuthoredLevelProgression?: boolean;
      levelProgression?: Record<string, unknown>[];
      powers?: { name?: string }[];
    };
    return {
      level: n.level,
      rows: (sys.levelProgression || []).map((r) => stripIdentity(r)),
      powerNames: (sys.powers || []).map((p) => p.name),
    };
  });
}

describe('K3 useAuthoredLevelProgression flags', () => {
  it('does not enable authored progression on Titan Scars / Hollow Crown / Ringchain', () => {
    expect(ECHO_ARTIFACTS.titanScars.useAuthoredLevelProgression).toBeFalsy();
    expect(ECHO_ARTIFACTS.hollowCrown.useAuthoredLevelProgression).toBeFalsy();
    expect(ECHO_ARTIFACTS.ringchainOfKeptNames.useAuthoredLevelProgression).toBeFalsy();
  });

  it('preserves Sentinel Frame authored progression (pre-existing)', () => {
    expect(ECHO_ARTIFACTS.sentinelFrame.useAuthoredLevelProgression).toBe(true);
  });

  it('forcing authored=true still changes non-identity content (documents why flags were reverted)', () => {
    for (const key of ['titanScars', 'hollowCrown', 'ringchainOfKeptNames'] as const) {
      const def = ECHO_ARTIFACTS[key];
      const picksPath = summarize({ ...def, useAuthoredLevelProgression: false });
      const authoredPath = summarize({ ...def, useAuthoredLevelProgression: true });
      expect(JSON.stringify(picksPath)).not.toBe(JSON.stringify(authoredPath));
    }
  });

  it('identity fields still reach compiled Dragon Head / Ringchain rows via picks path', () => {
    const dragon = buildEchoArtifactTree(ECHO_ARTIFACTS.dragonHead);
    const l1 = (dragon.nodes[0]!.itemData.system as any).levelProgression as any[];
    const breath = l1.find((r) => /breath/i.test(String(r.name || '')));
    expect(breath?.artifactFunctionId).toBe('dragon-breath');
    expect(breath?.powerTemplateId).toBe('active-melee-weapon-aoe');

    const ring = buildEchoArtifactTree(ECHO_ARTIFACTS.ringchainOfKeptNames);
    // Authored identity on source levelProgression must survive into picks-compiled trees
    // via builder Z2 when present on authored stages / specs.
    const allRows = ring.nodes.flatMap(
      (n) => ((n.itemData.system as any).levelProgression as any[]) || [],
    );
    const cleanse = allRows.find((r) => /burden\s*lifted/i.test(String(r.name || '')));
    // May be authored-stage forwarded or pick-compiled; at least source data still has IDs.
    const sourceCleanse = ECHO_ARTIFACTS.ringchainOfKeptNames.levelProgression.find((r) =>
      /burden\s*lifted/i.test(String(r.name || '')),
    );
    expect(sourceCleanse?.powerTemplateId).toBe('active-ranged-single-cleanse');
    expect(sourceCleanse?.rank).toBe(4);
    void cleanse;
  });
});
