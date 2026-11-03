import { describe, expect, it } from 'vitest';
import {
  formatSpecialLine,
  listGmAssignableSpecials,
  previewGmEffectApply,
} from '../src/combat/gm-effect-service.js';
import { clampSpecialApplication } from '../src/combat/special-application.js';
import { buildSurpriseRound1Order } from '../src/combat/surprise-order.js';

describe('GM effect service helpers', () => {
  it('lists assignable Specials without Instant multi-attack modes', () => {
    const ids = listGmAssignableSpecials().map((s) => s.id);
    expect(ids).toContain('ruin');
    expect(ids).toContain('slow');
    expect(ids).toContain('root');
    expect(ids).toContain('challenge');
    expect(ids).toContain('brace');
    expect(ids).toContain('bulwark');
    expect(ids).toContain('immovable');
    expect(ids).toContain('cleanse');
    expect(ids).not.toContain('penetration');
    expect(ids).not.toContain('push');
    expect(ids).not.toContain('stunned');
    expect(ids).not.toContain('regeneration');
    expect(ids).not.toContain('exorcism');
    expect(ids).not.toContain('requiem');
  });

  it('lists GM assignable Specials A–Z by display name', () => {
    const labels = listGmAssignableSpecials().map((s) => s.name.replace(/\(X\)/gi, '').trim());
    const sorted = [...labels].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    );
    expect(labels).toEqual(sorted);
  });

  it('formats valued Special lines', () => {
    expect(formatSpecialLine('ruin', 2)).toMatch(/Ruin\(2\)/i);
  });

  it('preview rejects Challenge without source in rules mode', () => {
    const rows = previewGmEffectApply({
      targets: [{ name: 'Guard', actorId: 'x' }],
      specialId: 'challenge',
      value: 2,
      mode: 'rules',
    });
    expect(rows[0]?.restriction).toMatch(/source/i);
  });

  it('does not invent Damage Raises — stacking clamp still works', () => {
    const actor = {
      system: { mastery: { rank: 2 }, masteryRank: 2 },
      getFlag: () => null,
    };
    const clamp = clampSpecialApplication(actor, 'ruin', 20, { id: 'c1', round: 1 }, null);
    expect(clamp.applied).toBeLessThanOrEqual(8); // 4 × MR2
    expect(clamp.ignored).toBeGreaterThan(0);
  });
});

describe('Surprise vs initiative scores', () => {
  it('order rebuild never mutates initiative numbers', () => {
    const combatants = [
      { id: 'g', initiative: 25 },
      { id: 't', initiative: 18 },
    ];
    const before = combatants.map((c) => c.initiative);
    buildSurpriseRound1Order(combatants, ['g']);
    expect(combatants.map((c) => c.initiative)).toEqual(before);
  });
});
