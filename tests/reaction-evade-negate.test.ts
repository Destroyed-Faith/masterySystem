import { describe, expect, it } from 'vitest';

import { evaluateReactionEvadeNegation } from '../src/combat/defender-reactions.js';

describe('evaluateReactionEvadeNegation', () => {
  it('negates when Evade + bonus exceeds the attack total', () => {
    const r = evaluateReactionEvadeNegation(16, 8, 20);
    expect(r.effectiveEvade).toBe(24);
    expect(r.negates).toBe(true);
    expect(r.unknown).toBe(false);
  });

  it('does not negate when Evade + bonus only equals the attack total (hit rule ≥)', () => {
    const r = evaluateReactionEvadeNegation(16, 8, 24);
    expect(r.effectiveEvade).toBe(24);
    expect(r.negates).toBe(false);
  });

  it('does not negate when the attack still clears boosted Evade', () => {
    const r = evaluateReactionEvadeNegation(16, 8, 30);
    expect(r.negates).toBe(false);
  });

  it('marks unknown when attack total is missing', () => {
    const r = evaluateReactionEvadeNegation(16, 8, null);
    expect(r.unknown).toBe(true);
    expect(r.negates).toBe(false);
  });

  it('never negates with zero bonus', () => {
    const r = evaluateReactionEvadeNegation(16, 0, 10);
    expect(r.negates).toBe(false);
  });
});
