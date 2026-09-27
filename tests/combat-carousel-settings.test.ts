import { describe, expect, it } from 'vitest';

import {
  buildCarouselTooltip,
  normalizeCarouselClientPrefs,
  resolveCarouselCompact,
} from '../src/ui/combat-carousel-settings.js';

describe('carousel client prefs', () => {
  it('normalizes unknown values to defaults', () => {
    const prefs = normalizeCarouselClientPrefs({
      compactMode: 'nope',
      tooltipMode: 'loud',
      showCombatStrip: false,
    });
    expect(prefs.compactMode).toBe('auto');
    expect(prefs.tooltipMode).toBe('full');
    expect(prefs.showCombatStrip).toBe(false);
    expect(prefs.showNextMark).toBe(true);
  });

  it('resolves compact mode against the viewport', () => {
    expect(resolveCarouselCompact({ ...normalizeCarouselClientPrefs({}), compactMode: 'auto' }, true)).toBe(
      true,
    );
    expect(resolveCarouselCompact({ ...normalizeCarouselClientPrefs({}), compactMode: 'off' }, true)).toBe(
      false,
    );
    expect(resolveCarouselCompact({ ...normalizeCarouselClientPrefs({}), compactMode: 'force' }, false)).toBe(
      true,
    );
  });
});

describe('buildCarouselTooltip', () => {
  it('hides vitals for short mode and hostile hide', () => {
    const short = buildCarouselTooltip({
      mode: 'short',
      name: 'Oda',
      initiative: 12,
      statusTooltips: ['Slow (2)'],
      hideVitals: false,
      armor: 4,
      evade: 8,
    });
    expect(short?.lines.join(' ')).not.toContain('Armor');
    expect(short?.lines.join(' ')).toContain('Slow (2)');

    const hidden = buildCarouselTooltip({
      mode: 'full',
      name: 'Goblin',
      initiative: 3,
      statusTooltips: [],
      hideVitals: true,
      armor: 2,
      stressCurrent: 4,
      stressMax: 10,
    });
    expect(hidden?.lines.join(' ')).not.toContain('Stress');
    expect(hidden?.lines.join(' ')).not.toContain('Armor');
  });

  it('returns null when tooltips are off', () => {
    expect(
      buildCarouselTooltip({
        mode: 'off',
        name: 'Oda',
        initiative: 1,
        statusTooltips: [],
        hideVitals: false,
      }),
    ).toBeNull();
  });
});
