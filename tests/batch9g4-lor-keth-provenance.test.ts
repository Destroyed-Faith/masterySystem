/**
 * Batch 9G.4 — Lor-Keth new world-seed hold; v0.9.9.6 progression.
 */
import { describe, expect, it } from 'vitest';
import {
  GENERAL_ARTIFACTS,
  getGeneralArtifact,
  isArtifactNewGrantHeld,
  shouldCreateNewWorldArtifactTree,
} from '../src/utils/general-artifacts.js';
import { buildEchoProgressionPicks } from '../src/utils/echo-artifacts.js';
import { resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';
import { buildAllGeneralArtifactTrees } from '../src/artifacts/echo-artifact-tree-builder.js';

describe('Batch 9G.4 — Lor-Keth provenance (hold lifted in v0.9.9.6)', () => {
  it('keeps the full definition resolvable (no delete / redesign)', () => {
    const def = getGeneralArtifact('lorKethsStaff');
    expect(def).toBeTruthy();
    expect(def?.name).toBe("Lor-Keth's Titanstorm Staff");
    expect(def?.newGrantHold).toBeUndefined();
    expect(isArtifactNewGrantHeld('lorKethsStaff')).toBe(false);
    expect(isArtifactNewGrantHeld('moonlightGreatsword')).toBe(false);
  });

  it('seeds the world library like every other Artifact', () => {
    expect(shouldCreateNewWorldArtifactTree('lorKethsStaff', 0)).toBe(true);
    expect(shouldCreateNewWorldArtifactTree('lorKethsStaff', 10)).toBe(true);
    expect(shouldCreateNewWorldArtifactTree('heartOfWinter', 0)).toBe(true);
  });

  it('programs the Artifacts.md L1–10 progression (including Awakening)', () => {
    const def = getGeneralArtifact('lorKethsStaff')!;
    const rows = resolveFullLevelProgression(
      def.levelProgression,
      buildEchoProgressionPicks(def) as any,
    );
    expect(rows.map((r) => r.name)).toEqual([
      'Giant Shock Strike I',
      'Titanstorm Guard I',
      'Stormbreaker I',
      'Giant Shock Strike II',
      'Titanstorm Guard II',
      'Stormbreaker II',
      'Giant Shock Strike III',
      'Titanstorm Guard III',
      'Stormbreaker III',
      'Artifact Awakening',
    ]);
    expect(rows.find((r) => r.level === 10)?.name).toBe('Artifact Awakening');
    expect(rows.find((r) => r.level === 1)?.powerTemplateId).toBe('active-melee-instant-special-t6');
    expect(rows.find((r) => r.level === 2)?.powerTemplateId).toBe('reaction-armor');
    const effect = (lvl: number) => String(rows.find((r) => r.level === lvl)?.special ?? '') + ' ' +
      String(rows.find((r) => r.level === lvl)?.effect ?? '');
    expect(effect(1)).toMatch(/Expose\(5\)/);
    expect(effect(4)).toMatch(/Expose\(8\)/);
    expect(effect(7)).toMatch(/Expose\(10\)/);
    expect(effect(2)).toMatch(/\+8 Armor/);
    expect(effect(5)).toMatch(/\+20 Armor/);
    expect(effect(8)).toMatch(/\+32 Armor/);
    expect(effect(3)).toMatch(/Rank 2/);
    expect(effect(6)).toMatch(/Rank 3/);
    expect(effect(9)).toMatch(/Rank 4/);
    expect(rows.find((r) => r.level === 1)?.type).toBe('Active, Special');
  });

  it('still builds the Lor-Keth tree for refresh/repair of existing worlds', () => {
    const trees = buildAllGeneralArtifactTrees();
    expect(trees.some((t) => t.echoArtifactKey === 'lorKethsStaff')).toBe(true);
    expect(Object.keys(GENERAL_ARTIFACTS)).toContain('lorKethsStaff');
  });
});
