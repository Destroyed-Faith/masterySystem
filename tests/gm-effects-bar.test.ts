import { describe, expect, it } from 'vitest';
import {
  clampGmEffectsBarPosition,
  DEFAULT_GM_EFFECTS_BAR_POSITION,
  sanitizeGmEffectsBarPosition,
} from '../src/system/gm-effects-bar';

describe('gm-effects-bar position', () => {
  it('sanitizes invalid positions to default', () => {
    expect(sanitizeGmEffectsBarPosition(null)).toEqual(DEFAULT_GM_EFFECTS_BAR_POSITION);
    expect(sanitizeGmEffectsBarPosition({ x: 10.7, y: 20.2 })).toEqual({ x: 11, y: 20 });
  });

  it('clamps inside the viewport', () => {
    const next = clampGmEffectsBarPosition(
      { x: -50, y: 9999 },
      { width: 800, height: 600 },
      { width: 200, height: 100 },
    );
    expect(next.x).toBe(8);
    expect(next.y).toBeLessThanOrEqual(600 - 100 - 8);
  });
});
