/**
 * Damage Negation → Maximization order (Players Guide).
 */
import { describe, expect, it } from 'vitest';
import {
  maximizedRemainingPool,
  shouldSpendMaximizationAfterNegation,
} from '../src/combat/maximization-order';
import { maximizeDamageFormula } from '../src/stones/stone-combat-effects';

describe('Maximization after Damage Negation', () => {
  it('Single Target: Negation first — Maximization only on remaining dice', () => {
    // 10d8 pool, −2 Negation → maximize 8d8 → 64 (artificial 8s)
    const r = maximizedRemainingPool({
      originalDice: 10,
      diceRemovedByNegation: 2,
      maximize: true,
      maximizeFormula: maximizeDamageFormula,
    });
    expect(r.remainingDice).toBe(8);
    expect(r.spentMaximization).toBe(true);
    expect(r.formula).toBe('64');
    expect(Number(r.formula)).toBe(8 * 8);
  });

  it('Maximization never affects removed dice', () => {
    const r = maximizedRemainingPool({
      originalDice: 4,
      diceRemovedByNegation: 1,
      maximize: true,
      maximizeFormula: maximizeDamageFormula,
    });
    // Only 3 remaining dice become 8 — not 4×8
    expect(r.formula).toBe('24');
    expect(r.remainingDice).toBe(3);
  });

  it('no Maximization charge when the entire pool is negated', () => {
    expect(
      shouldSpendMaximizationAfterNegation({ wantMaximization: true, remainingDice: 0 }),
    ).toBe(false);
    const r = maximizedRemainingPool({
      originalDice: 5,
      diceRemovedByNegation: 5,
      maximize: true,
      maximizeFormula: maximizeDamageFormula,
    });
    expect(r.spentMaximization).toBe(false);
    expect(r.remainingDice).toBe(0);
    expect(r.formula).toBe('0');
  });

  it('Roll (not Roll Maximum) never spends Maximization', () => {
    expect(
      shouldSpendMaximizationAfterNegation({ wantMaximization: false, remainingDice: 8 }),
    ).toBe(false);
    const r = maximizedRemainingPool({
      originalDice: 6,
      diceRemovedByNegation: 0,
      maximize: false,
      maximizeFormula: maximizeDamageFormula,
    });
    expect(r.spentMaximization).toBe(false);
    expect(r.formula).toBe('6d8');
  });

  it('Autofire / shared pool: spend only when remainingDice > 0 (same gate)', () => {
    expect(
      shouldSpendMaximizationAfterNegation({ wantMaximization: true, remainingDice: 4 }),
    ).toBe(true);
    expect(
      shouldSpendMaximizationAfterNegation({ wantMaximization: true, remainingDice: 0 }),
    ).toBe(false);
  });

  it('cancellation before spend: unused Maximization is not consumed (intent)', () => {
    // Pure sequencing: wantMax alone does not spend — only the post-Negation gate does.
    // Damage-card cancel never reaches shouldSpendMaximizationAfterNegation.
    expect(
      shouldSpendMaximizationAfterNegation({ wantMaximization: true, remainingDice: 0 }),
    ).toBe(false);
  });
});
