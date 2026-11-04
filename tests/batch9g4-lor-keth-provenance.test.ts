/**
 * Batch 9G.4 — Lor-Keth SOURCE MISSING provenance hold (new world-seed only).
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

describe('Batch 9G.4 — Lor-Keth provenance hold', () => {
  it('keeps the full definition resolvable (no delete / redesign)', () => {
    const def = getGeneralArtifact('lorKethsStaff');
    expect(def).toBeTruthy();
    expect(def?.newGrantHold).toBe(true);
    expect(isArtifactNewGrantHeld('lorKethsStaff')).toBe(true);
    expect(isArtifactNewGrantHeld('moonlightGreatsword')).toBe(false);
  });

  it('blocks only brand-new world-library creates; existing trees stay open', () => {
    expect(shouldCreateNewWorldArtifactTree('lorKethsStaff', 0)).toBe(false);
    expect(shouldCreateNewWorldArtifactTree('lorKethsStaff', 10)).toBe(true);
    expect(shouldCreateNewWorldArtifactTree('heartOfWinter', 0)).toBe(true);
  });

  it('preserves current programmed L1–10 (including Awakening) for owners', () => {
    const def = getGeneralArtifact('lorKethsStaff')!;
    const rows = resolveFullLevelProgression(
      def.levelProgression,
      buildEchoProgressionPicks(def) as any,
    );
    expect(rows.map((r) => r.name)).toEqual([
      'Giant Shock Strike I',
      'Ancestral Guard I',
      'Might Ignore Armor Support I',
      'Giant Shock Strike II',
      'Ancestral Guard II',
      'Might Ignore Armor Support II',
      'Giant Shock Strike III',
      'Ancestral Guard III',
      'Might Ignore Armor Support III',
      'Artifact Awakening',
    ]);
    expect(rows.find((r) => r.level === 10)?.name).toBe('Artifact Awakening');
    expect(rows.find((r) => r.level === 1)?.powerTemplateId).toBe('active-melee-damage-t5');
    expect(rows.find((r) => r.level === 2)?.powerTemplateId).toBe('reaction-armor');
  });

  it('still builds the Lor-Keth tree for refresh/repair of existing worlds', () => {
    const trees = buildAllGeneralArtifactTrees();
    expect(trees.some((t) => t.echoArtifactKey === 'lorKethsStaff')).toBe(true);
    expect(Object.keys(GENERAL_ARTIFACTS)).toContain('lorKethsStaff');
  });
});
