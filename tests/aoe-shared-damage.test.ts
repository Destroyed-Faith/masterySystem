/**
 * AoE shared damage payload — one roll for the whole burst.
 */
import { describe, expect, it } from 'vitest';
import { toSharedAoeDamagePayload } from '../src/combat/aoe-melee-resolution.js';

describe('AoE shared damage payload', () => {
  it('builds a reusable payload from a primary damage result', () => {
    const shared = toSharedAoeDamagePayload({
      totalDamage: 12,
      count8s: 1,
      specialsUsed: ['Slow(4)', 'Penetration(8)'],
      rollDetails: ['Weapon: 0', 'Power: 0d8'],
      attackContext: { armorPenetration: 8 },
    });
    expect(shared).toEqual({
      totalDamage: 12,
      count8s: 1,
      specialsUsed: ['Slow(4)', 'Penetration(8)'],
      applicationLimitNotes: undefined,
      rollDetails: ['Weapon: 0', 'Power: 0d8'],
      damageChatRolls: undefined,
      armorPenetration: 8,
    });
  });

  it('reuses one raw damage total for every hit target (no primary / no re-roll)', () => {
    const shared = toSharedAoeDamagePayload({ totalDamage: 21, count8s: 1, specialsUsed: ['Push(2)'] });
    const perTarget = ['t1', 't2', 't3'].map(() => ({ ...shared! }));
    expect(perTarget.map((p) => p.totalDamage)).toEqual([21, 21, 21]);
    expect(perTarget.every((p) => p.specialsUsed?.[0] === 'Push(2)')).toBe(true);
  });

  it('rejects phased / missing results so secondaries can roll their own shared payload', () => {
    expect(toSharedAoeDamagePayload(null)).toBeNull();
    expect(
      toSharedAoeDamagePayload({
        totalDamage: 0,
        mitigation: { phased: true },
      }),
    ).toBeNull();
  });
});
