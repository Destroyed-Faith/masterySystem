import { describe, expect, it } from 'vitest';
import {
  enrichArtifactRowIdentity,
  resolveEchoArtifactKey,
  rowHasStructuredIdentity,
} from '../src/utils/artifact-row-identity.js';
import type { ArtifactLevelProgressionRow } from '../src/types/item.js';

function dragonHeadItem(overrides: Record<string, unknown> = {}) {
  return {
    flags: { 'mastery-system': { echoArtifactKey: 'dragonHead' } },
    system: { echoKey: 'dragonkin', ...overrides },
  };
}

describe('artifact-row-identity (K2)', () => {
  it('resolveEchoArtifactKey ignores system.echoKey', () => {
    expect(
      resolveEchoArtifactKey({
        flags: {},
        system: { echoKey: 'halflings' },
      }),
    ).toBe('');
    expect(
      resolveEchoArtifactKey({
        flags: { 'mastery-system': { echoArtifactKey: 'dragonHead' } },
        system: { echoKey: 'dragonkin' },
      }),
    ).toBe('dragonHead');
  });

  it('fills blank Breath Weapon row atomically from catalog', () => {
    const blank: ArtifactLevelProgressionRow = {
      level: 1,
      name: 'Breath Weapon I',
      type: 'Active',
      range: '',
      aoe: '',
      duration: '',
      effect: '',
      special: '',
    };
    const enriched = enrichArtifactRowIdentity(dragonHeadItem(), blank);
    expect(enriched.powerTemplateId).toBe('active-melee-weapon-aoe');
    expect(enriched.artifactFunctionId).toBe('dragon-breath');
    expect(enriched.rank).toBe(4);
    expect(rowHasStructuredIdentity(enriched)).toBe(true);
  });

  it('never overwrites a GM-reassigned row that already has identity', () => {
    const reassigned: ArtifactLevelProgressionRow = {
      level: 1,
      name: 'GM Custom Cleanse',
      type: 'Active',
      range: '',
      aoe: '',
      duration: '',
      effect: '',
      special: '',
      powerTemplateId: 'active-ranged-single-cleanse',
      rank: 4,
    };
    const enriched = enrichArtifactRowIdentity(dragonHeadItem(), reassigned);
    expect(enriched).toBe(reassigned);
    expect(enriched.powerTemplateId).toBe('active-ranged-single-cleanse');
    expect(enriched.artifactFunctionId).toBeUndefined();
    expect(enriched.limited).toBeUndefined();
  });

  it('does not splice catalog limited/rank onto a row that already has artifactFunctionId', () => {
    const partial: ArtifactLevelProgressionRow = {
      level: 1,
      name: 'Custom Growth',
      type: 'Transformation',
      range: '',
      aoe: '',
      duration: '',
      effect: '',
      special: '',
      artifactFunctionId: 'titan-growth',
    };
    const item = {
      flags: { 'mastery-system': { echoArtifactKey: 'titanScars' } },
      system: {},
    };
    const enriched = enrichArtifactRowIdentity(item, partial);
    expect(enriched).toBe(partial);
    expect(enriched.powerTemplateId).toBeUndefined();
  });

  it('returns unchanged when no echoArtifactKey flag is set', () => {
    const blank: ArtifactLevelProgressionRow = {
      level: 1,
      name: 'Breath Weapon I',
      type: 'Active',
      range: '',
      aoe: '',
      duration: '',
      effect: '',
      special: '',
    };
    const item = { flags: {}, system: { echoKey: 'dragonkin' } };
    expect(enrichArtifactRowIdentity(item, blank)).toBe(blank);
  });
});
