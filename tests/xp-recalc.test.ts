import { describe, expect, it } from 'vitest';
import { totalArtifactXpToLevel } from '../src/utils/artifact-actor-rules.js';
import { computeGroundTruthXp } from '../src/utils/xp-recalc.js';

const ATTRS = {
  might: 2,
  agility: 2,
  vitality: 2,
  intellect: 2,
  resolve: 2,
  influence: 2,
  wits: 2,
};

function actor(opts: { artifactLevel: number; freeEarned?: number; xp?: number; xpFree?: number }) {
  const items = [
    { id: 'art1', type: 'artifact', name: 'Dragon Claws', system: { level: opts.artifactLevel } },
  ];
  return {
    items: { filter: (fn: (i: any) => boolean) => items.filter(fn) },
    system: {
      attributes: Object.fromEntries(Object.entries(ATTRS).map(([k, v]) => [k, { value: v }])),
      skills: {},
      points: { xp: opts.xp ?? 0, xpFree: opts.xpFree ?? 0 },
      xp: {
        totalEarned: 0,
        freeEarned: opts.freeEarned ?? 24,
        totalSpent: 0,
        freeSpent: 0,
        postCreationProgress: {
          attributes: { ...ATTRS },
          skills: {},
          skillsSpent: {},
          powerLevels: {},
        },
      },
    },
  };
}

describe('computeGroundTruthXp artifacts', () => {
  it('sums banded XP for levels above 1 (L2–3 = 8 each)', () => {
    const result = computeGroundTruthXp(actor({ artifactLevel: 3, freeEarned: 24 }));
    expect(result.ok).toBe(true);
    expect(result.artifactSpent).toBe(totalArtifactXpToLevel(3));
    expect(result.totalInvested).toBe(16);
    expect(result.freeSpent).toBe(16);
    expect(result.freeAvailable).toBe(8);
  });

  it('applies higher bands at L4+ and L7+', () => {
    const at6 = computeGroundTruthXp(actor({ artifactLevel: 6, freeEarned: 200 }));
    expect(at6.artifactSpent).toBe(totalArtifactXpToLevel(6)); // 8+8+16+16+16 = 64
    const at10 = computeGroundTruthXp(actor({ artifactLevel: 10, freeEarned: 300 }));
    expect(at10.artifactSpent).toBe(totalArtifactXpToLevel(10)); // 224
  });

  it('counts nothing for a level-1 artifact', () => {
    const result = computeGroundTruthXp(actor({ artifactLevel: 1, freeEarned: 24 }));
    expect(result.ok).toBe(true);
    expect(result.artifactSpent).toBe(0);
    expect(result.totalInvested).toBe(0);
    expect(result.freeAvailable).toBe(24);
  });
});
