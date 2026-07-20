import { describe, it, expect } from 'vitest';
import {
  resolveCreatureType,
  isSmiteValidTarget,
  extractSmiteDice,
  stripSmiteSpecials,
} from '../src/utils/creature-type';

describe('creature-type / Smite validity', () => {
  it('resolves undead and fiend aliases', () => {
    expect(resolveCreatureType({ system: { creatureType: 'undead' } })).toBe('undead');
    expect(resolveCreatureType({ system: { creatureType: 'Untot' } })).toBe('undead');
    expect(resolveCreatureType({ system: { creatureType: 'fiend' } })).toBe('fiend');
    expect(resolveCreatureType({ system: { creatureType: 'Dämon' } })).toBe('fiend');
    expect(resolveCreatureType({ system: { creatureType: 'demon' } })).toBe('fiend');
    expect(resolveCreatureType({ system: { bio: { type: 'vampire' } } })).toBe('undead');
  });

  it('marks only undead/fiend as Smite-valid', () => {
    expect(isSmiteValidTarget({ system: { creatureType: 'undead' } })).toBe(true);
    expect(isSmiteValidTarget({ system: { creatureType: 'fiend' } })).toBe(true);
    expect(isSmiteValidTarget({ system: { creatureType: 'humanoid' } })).toBe(false);
    expect(isSmiteValidTarget({ system: { creatureType: '' } })).toBe(false);
    expect(isSmiteValidTarget(null)).toBe(false);
  });

  it('extracts and strips Smite special strings', () => {
    expect(extractSmiteDice(['Smite(8)', 'Lacerate(3)', 'smite(2)'])).toBe(10);
    expect(stripSmiteSpecials(['Smite(8)', 'Lacerate(3)', 'Mark spent 2 (floor 2)'])).toEqual([
      'Lacerate(3)',
      'Mark spent 2 (floor 2)',
    ]);
  });
});
