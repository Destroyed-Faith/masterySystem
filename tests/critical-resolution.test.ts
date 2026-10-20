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

describe('Critical(X) — Active Buff combat-wide quota', () => {
  it('Critical(1) allows at most one Critical designation per combat', () => {
    let quota = syncCriticalRoundQuota(null, 'c1', 1);
    expect(quota.remaining).toBe(1);

    const first = resolveCriticalAttackModifier({
      declared: true,
      activeBuffCriticalX: 1,
      buffQuotaRemaining: quota.remaining,
    });
    expect(first.applyCritical).toBe(true);
    expect(first.explodeOn78).toBe(true);
    expect(first.consumeFrom).toBe('active-buff');
    quota = consumeCriticalQuota(quota);
    expect(quota.remaining).toBe(0);

    const second = resolveCriticalAttackModifier({
      declared: true,
      activeBuffCriticalX: 1,
      buffQuotaRemaining: quota.remaining,
    });
    expect(second.applyCritical).toBe(false);
    expect(second.explodeOn78).toBe(false);
  });

  it('Critical(2) allows at most two Critical designations per combat', () => {
    let quota = syncCriticalRoundQuota(null, 'c1', 2);
    expect(quota.remaining).toBe(2);
    for (let i = 0; i < 2; i++) {
      const m = resolveCriticalAttackModifier({
        declared: true,
        activeBuffCriticalX: 2,
        buffQuotaRemaining: quota.remaining,
      });
      expect(m.applyCritical).toBe(true);
      quota = consumeCriticalQuota(quota);
    }
    expect(quota.remaining).toBe(0);
    expect(
      resolveCriticalAttackModifier({
        declared: true,
        activeBuffCriticalX: 2,
        buffQuotaRemaining: quota.remaining,
      }).applyCritical,
    ).toBe(false);
  });

  it('Critical(3) and Critical(4) honor their combat allowances', () => {
    let q3 = syncCriticalRoundQuota(null, 'c1', 3);
    for (let i = 0; i < 3; i++) {
      expect(
        resolveCriticalAttackModifier({
          declared: true,
          activeBuffCriticalX: 3,
          buffQuotaRemaining: q3.remaining,
        }).applyCritical,
      ).toBe(true);
      q3 = consumeCriticalQuota(q3);
    }
    expect(q3.remaining).toBe(0);

    let q4 = syncCriticalRoundQuota(null, 'c1', 4);
    expect(q4.granted).toBe(4);
    for (let i = 0; i < 4; i++) {
      expect(
        resolveCriticalAttackModifier({
          declared: true,
          activeBuffCriticalX: 4,
          buffQuotaRemaining: q4.remaining,
        }).applyCritical,
      ).toBe(true);
      q4 = consumeCriticalQuota(q4);
    }
    expect(
      resolveCriticalAttackModifier({
        declared: true,
        activeBuffCriticalX: 4,
        buffQuotaRemaining: q4.remaining,
      }).applyCritical,
    ).toBe(false);
  });

  it('does not refill when Round advances within the same combat', () => {
    let quota = syncCriticalRoundQuota(null, 'combatA', 3);
    quota = consumeCriticalQuota(quota);
    quota = consumeCriticalQuota(quota);
    expect(quota.remaining).toBe(1);

    // Same combat key (combat-wide) — Round change must not reset.
    quota = syncCriticalRoundQuota(quota, 'combatA', 3);
    expect(quota.roundKey).toBe('combatA');
    expect(quota.remaining).toBe(1);
    expect(quota.granted).toBe(3);
  });

  it('does not refill on Buff reactivation (same combat, same X)', () => {
    let quota = syncCriticalRoundQuota(null, 'combatA', 2);
    quota = consumeCriticalQuota(quota);
    quota = syncCriticalRoundQuota(quota, 'combatA', 2);
    expect(quota.remaining).toBe(1);
  });

  it('combatRoundKey is combat-id only', () => {
    expect(combatRoundKey({ id: 'abc', round: 1 })).toBe('abc');
    expect(combatRoundKey({ id: 'abc', round: 7 })).toBe('abc');
  });
});

describe('Critical(X) — fixed explode threshold, not strength', () => {
  it('uses explode faces 7–8 for every Critical value', () => {
    for (const x of [1, 2, 3, 4]) {
      const m = resolveCriticalAttackModifier({
        declared: true,
        activeBuffCriticalX: x,
        buffQuotaRemaining: x,
      });
      expect(m.explodeFaces).toEqual([7, 8]);
      expect(m.explodeOn78).toBe(true);
      expect(CRITICAL_ATTACK_EXPLODE_FACES).toEqual([7, 8]);
    }
  });

  it('never explodes Damage Dice from Critical', () => {
    expect(CRITICAL_DAMAGE_DICE_EXPLODE).toBe(false);
  });
});

describe('Critical label', () => {
  it('formats Critical(X)', () => {
    expect(formatCriticalLabel(2)).toMatch(/Critical\(2\)/);
  });
});
