import { describe, expect, it } from 'vitest';
import { disableMovementAutoRotate } from '../src/combat/token-auto-rotate';

describe('disableMovementAutoRotate', () => {
  it('sets autoRotate false on the movement operation', () => {
    const movement = { autoRotate: true, showRuler: true };
    disableMovementAutoRotate(movement);
    expect(movement.autoRotate).toBe(false);
    expect(movement.showRuler).toBe(true);
  });

  it('ignores nullish movement', () => {
    expect(() => disableMovementAutoRotate(null)).not.toThrow();
    expect(() => disableMovementAutoRotate(undefined)).not.toThrow();
  });
});
