import { describe, expect, it } from 'vitest';
import {
  CRITICAL_ATTACK_EXPLODE_FACES,
  CRITICAL_DAMAGE_DICE_EXPLODE,
  combatRoundKey,
  consumeCriticalQuota,
  formatCriticalLabel,
  resolveCriticalAttackModifier,
  syncCriticalRoundQuota,
} from '../src/combat/critical-resolution';

describe('Critical(X) — attacks-per-round quota', () => {
  it('Critical(1) allows at most one Critical attack per round', () => {
    let quota = syncCriticalRoundQuota(null, 'c:1', 1);
    expect(quota.remaining).toBe(1);

    const first = resolveCriticalAttackModifier({
      activeBuffCriticalX: 1,
      buffQuotaRemaining: quota.remaining,
    });
    expect(first.applyCritical).toBe(true);
    expect(first.explodeOn78).toBe(true);
    expect(first.consumeFrom).toBe('active-buff');
    quota = consumeCriticalQuota(quota);
    expect(quota.remaining).toBe(0);

    const second = resolveCriticalAttackModifier({
      activeBuffCriticalX: 1,
      buffQuotaRemaining: quota.remaining,
    });
    expect(second.applyCritical).toBe(false);
    expect(second.explodeOn78).toBe(false);
  });

  it('Critical(2) allows at most two Critical attacks per round', () => {
    let quota = syncCriticalRoundQuota(null, 'c:1', 2);
    expect(quota.remaining).toBe(2);
    for (let i = 0; i < 2; i++) {
      const m = resolveCriticalAttackModifier({
        activeBuffCriticalX: 2,
        buffQuotaRemaining: quota.remaining,
      });
      expect(m.applyCritical).toBe(true);
      quota = consumeCriticalQuota(quota);
    }
    expect(quota.remaining).toBe(0);
    expect(
      resolveCriticalAttackModifier({
        activeBuffCriticalX: 2,
        buffQuotaRemaining: quota.remaining,
      }).applyCritical,
    ).toBe(false);
  });

  it('Critical(3) allows at most three Critical attacks per round', () => {
    let quota = syncCriticalRoundQuota(null, 'c:1', 3);
    for (let i = 0; i < 3; i++) {
      expect(
        resolveCriticalAttackModifier({
          activeBuffCriticalX: 3,
          buffQuotaRemaining: quota.remaining,
        }).applyCritical,
      ).toBe(true);
      quota = consumeCriticalQuota(quota);
    }
    expect(quota.remaining).toBe(0);
  });

  it('Critical(4) allows at most four Critical attacks per round', () => {
    let quota = syncCriticalRoundQuota(null, 'c:1', 4);
    expect(quota.granted).toBe(4);
    for (let i = 0; i < 4; i++) {
      expect(
        resolveCriticalAttackModifier({
          activeBuffCriticalX: 4,
          buffQuotaRemaining: quota.remaining,
        }).applyCritical,
      ).toBe(true);
      quota = consumeCriticalQuota(quota);
    }
    expect(
      resolveCriticalAttackModifier({
        activeBuffCriticalX: 4,
        buffQuotaRemaining: quota.remaining,
      }).applyCritical,
    ).toBe(false);
  });

  it('resets the quota at the start of a new round', () => {
    let quota = syncCriticalRoundQuota(null, 'combatA:1', 3);
    quota = consumeCriticalQuota(quota);
    quota = consumeCriticalQuota(quota);
    expect(quota.remaining).toBe(1);

    quota = syncCriticalRoundQuota(quota, 'combatA:2', 3);
    expect(quota.roundKey).toBe('combatA:2');
    expect(quota.remaining).toBe(3);
    expect(quota.granted).toBe(3);
  });

  it('keeps spent charges within the same round', () => {
    let quota = syncCriticalRoundQuota(null, 'combatA:1', 2);
    quota = consumeCriticalQuota(quota);
    quota = syncCriticalRoundQuota(quota, 'combatA:1', 2);
    expect(quota.remaining).toBe(1);
  });
});

describe('Critical(X) — fixed explode threshold, not strength', () => {
  it('uses explode faces 7–8 for every Critical value', () => {
    for (const x of [1, 2, 3, 4]) {
      const m = resolveCriticalAttackModifier({
        activeBuffCriticalX: x,
        buffQuotaRemaining: x,
      });
      expect(m.explodeFaces).toEqual([7, 8]);
      expect(m.explodeOn78).toBe(true);
      expect(CRITICAL_ATTACK_EXPLODE_FACES).toEqual([7, 8]);
    }
  });

  it('never marks Damage Dice as exploding', () => {
    for (const x of [1, 2, 3, 4]) {
      const m = resolveCriticalAttackModifier({
        activeBuffCriticalX: x,
        buffQuotaRemaining: x,
      });
      expect(m.damageDiceExplode).toBe(false);
    }
    expect(CRITICAL_DAMAGE_DICE_EXPLODE).toBe(false);
  });

  it('does not interpret X as Critical strength / lower explode threshold', () => {
    const c1 = resolveCriticalAttackModifier({
      activeBuffCriticalX: 1,
      buffQuotaRemaining: 1,
    });
    const c4 = resolveCriticalAttackModifier({
      activeBuffCriticalX: 4,
      buffQuotaRemaining: 4,
    });
    expect(c1.explodeFaces).toEqual(c4.explodeFaces);
    expect(c1.explodeOn78).toBe(c4.explodeOn78);
    expect(c4.criticalX).toBe(4);
    expect(c4.criticalX).not.toBeGreaterThan(4); // X is quota size, not a threshold dial
    expect(formatCriticalLabel(4)).toBe('Critical(4)');
  });

  it('multiple sources never improve the explode threshold', () => {
    const m = resolveCriticalAttackModifier({
      activeBuffCriticalX: 4,
      buffQuotaRemaining: 4,
      stoneCritCharges: 3,
      specialCritCharges: 2,
    });
    expect(m.explodeFaces).toEqual([7, 8]);
    expect(m.explodeOn78).toBe(true);
    expect(m.consumeFrom).toBe('active-buff'); // prefers buff quota
  });

  it('falls back to stone Crit charges when buff quota is spent', () => {
    const m = resolveCriticalAttackModifier({
      activeBuffCriticalX: 2,
      buffQuotaRemaining: 0,
      stoneCritCharges: 1,
    });
    expect(m.applyCritical).toBe(true);
    expect(m.consumeFrom).toBe('stone-crit');
    expect(m.explodeFaces).toEqual([7, 8]);
  });
});

describe('Critical helpers', () => {
  it('builds combat round keys for quota refresh', () => {
    expect(combatRoundKey({ id: 'abc', round: 3 })).toBe('abc:3');
    expect(combatRoundKey(null)).toBe(':1');
  });
});
