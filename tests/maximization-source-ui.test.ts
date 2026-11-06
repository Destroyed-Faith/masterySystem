import { describe, expect, it } from 'vitest';
import { maximizationSourcePickerMode } from '../src/stones/stone-combat-effects.js';

describe('Maximization source picker UI', () => {
  it('hides the control when no sources remain', () => {
    expect(maximizationSourcePickerMode(0)).toBe('hidden');
  });

  it('shows a plain hint (no dropdown) for a single source', () => {
    expect(maximizationSourcePickerMode(1)).toBe('hint');
  });

  it('shows a dropdown only when multiple sources remain', () => {
    expect(maximizationSourcePickerMode(2)).toBe('select');
    expect(maximizationSourcePickerMode(3)).toBe('select');
  });
});
