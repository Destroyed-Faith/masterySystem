import { describe, expect, it, vi } from 'vitest';
import { totalArtifactXpToLevel } from '../src/utils/artifact-actor-rules.js';
import { powerLevelCost } from '../src/utils/constants.js';
import { applyGroundTruthXp, computeGroundTruthXp } from '../src/utils/xp-recalc.js';

const ATTRS = {
  might: 2,
  agility: 2,
  vitality: 2,
  intellect: 2,
  resolve: 2,
  influence: 2,
  wits: 2,
};

function actor(opts: {
  artifactLevel?: number;
  freeEarned?: number;
  totalEarned?: number;
  xp?: number;
  xpFree?: number;
  totalSpent?: number;
  freeSpent?: number;
  powers?: any[];
  skills?: Record<string, number>;
  snapSkills?: Record<string, number>;
}) {
  const items: any[] = [];
  if (opts.artifactLevel != null) {
    items.push({ id: 'art1', type: 'artifact', name: 'Dragon Claws', system: { level: opts.artifactLevel } });
  }
  for (const p of opts.powers ?? []) items.push(p);

  return {
    items: { filter: (fn: (i: any) => boolean) => items.filter(fn) },
    update: vi.fn(async () => undefined),
    system: {
      attributes: Object.fromEntries(Object.entries(ATTRS).map(([k, v]) => [k, { value: v }])),
      skills: opts.skills ?? {},
      points: { xp: opts.xp ?? 0, xpFree: opts.xpFree ?? 0 },
      xp: {
        totalEarned: opts.totalEarned ?? 0,
        freeEarned: opts.freeEarned ?? 24,
        totalSpent: opts.totalSpent ?? 0,
        freeSpent: opts.freeSpent ?? 0,
        history: [],
        postCreationProgress: {
          attributes: { ...ATTRS },
          skills: opts.snapSkills ?? {},
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

describe('computeGroundTruthXp powers', () => {
  it('counts only upgrades above creation baseline for package powers', () => {
    const powers = [
      { type: 'power', system: { category: 'active', level: 5, minLevel: 2 } },
      { type: 'power', system: { category: 'active', level: 4, minLevel: 2 } },
      { type: 'power', system: { category: 'active', level: 4, minLevel: 2 } },
      { type: 'power', system: { category: 'passive', level: 4, minLevel: 4 } },
      { type: 'power', system: { category: 'activeBuff', level: 4, minLevel: 4 } },
      { type: 'power', system: { category: 'reaction', level: 4, minLevel: 4 } },
    ];
    // 2→5 = 6+8+10=24; two× 2→4 = 2×(6+8)=28; total 52
    const result = computeGroundTruthXp(actor({ powers, freeEarned: 100, totalEarned: 0 }));
    expect(result.ok).toBe(true);
    expect(result.powerSpent).toBe(52);
  });

  it('counts full ladder for XP-purchased powers', () => {
    const powers = [
      {
        type: 'power',
        system: { category: 'active', level: 3, minLevel: 1 },
        flags: { 'mastery-system': { xpPurchased: true } },
      },
    ];
    const result = computeGroundTruthXp(actor({ powers, freeEarned: 50 }));
    expect(result.powerSpent).toBe(powerLevelCost(1) + powerLevelCost(2) + powerLevelCost(3));
  });

  it('skips artifact-granted powers', () => {
    const powers = [
      {
        type: 'power',
        system: { category: 'active', level: 5, minLevel: 1, fromArtifact: true },
        flags: { 'mastery-system': { fromArtifact: true } },
      },
    ];
    const result = computeGroundTruthXp(actor({ powers, freeEarned: 50 }));
    expect(result.powerSpent).toBe(0);
  });
});

describe('applyGroundTruthXp', () => {
  it('writes corrected pools when accounting drifted', async () => {
    const a = actor({
      freeEarned: 24,
      totalEarned: 0,
      xp: 0,
      xpFree: 24,
      totalSpent: 0,
      freeSpent: 0,
      artifactLevel: 3,
    });
    const result = await applyGroundTruthXp(a, { userName: 'GM' });
    expect(result.ok).toBe(true);
    expect(result.changed).toBe(true);
    expect(a.update).toHaveBeenCalledWith(
      expect.objectContaining({
        'system.points.xp': 0,
        'system.points.xpFree': 8,
        'system.xp.totalSpent': 0,
        'system.xp.freeSpent': 16,
      }),
    );
  });

  it('does not update when already correct', async () => {
    const a = actor({
      freeEarned: 24,
      xp: 0,
      xpFree: 8,
      freeSpent: 16,
      artifactLevel: 3,
    });
    const result = await applyGroundTruthXp(a);
    expect(result.changed).toBe(false);
    expect(a.update).not.toHaveBeenCalled();
  });
});
