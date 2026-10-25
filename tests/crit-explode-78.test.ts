/**
 * Crit: Attack Pool dice explode on natural 7–8 (not only 8).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rollMasteryPoolDice } from '../src/dice/roll-handler.js';

describe('Crit explode on 7–8', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('explodes a natural 7 when Crit (explodeOn78) is active', () => {
    // First die: 7 then 3 (chain ends). Remaining dice: flat faces.
    const seq = [7, 3, 2, 4, 5];
    let i = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      const face = seq[Math.min(i, seq.length - 1)]!;
      i += 1;
      return (face - 1) / 8;
    });
    const rolled = rollMasteryPoolDice(3, { explodeOn78: true });
    expect(rolled.dieChains[0]).toEqual([7, 3]);
    expect(rolled.dice[0]).toBe(10);
    expect(rolled.exploded).toContain(0);
  });

  it('does not explode a natural 7 without Crit', () => {
    const seq = [7, 2, 4];
    let i = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      const face = seq[Math.min(i, seq.length - 1)]!;
      i += 1;
      return (face - 1) / 8;
    });
    const rolled = rollMasteryPoolDice(3, { explodeOn78: false });
    expect(rolled.dieChains[0]).toEqual([7]);
    expect(rolled.dice[0]).toBe(7);
    expect(rolled.exploded).not.toContain(0);
  });

  it('with Disadvantage + Crit, a lone 7 is the one die that may explode', () => {
    // Three flat faces: 7, 5, 6 — Crit Disadvantage should explode the 7.
    const seq = [7, 5, 6, 2];
    let i = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      const face = seq[Math.min(i, seq.length - 1)]!;
      i += 1;
      return (face - 1) / 8;
    });
    const rolled = rollMasteryPoolDice(3, { explodeOn78: true, rollDisadvantage: true });
    expect(rolled.dieChains[0]![0]).toBe(7);
    expect(rolled.dieChains[0]!.length).toBeGreaterThan(1);
    expect(rolled.dieChains[1]).toEqual([5]);
    expect(rolled.dieChains[2]).toEqual([6]);
  });
});
