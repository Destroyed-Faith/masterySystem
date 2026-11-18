import { describe, it, expect } from 'vitest';
import * as creatureType from '../src/utils/creature-type';
import {
  resolveCreatureType,
  normalizeCreatureTypeValue,
  creatureTypeSelectOptions,
} from '../src/utils/creature-type';

describe('creature-type catalog', () => {
  it('resolves deathless and fiend aliases (including legacy undead)', () => {
    expect(resolveCreatureType({ system: { creatureType: 'deathless' } })).toBe('deathless');
    expect(resolveCreatureType({ system: { creatureType: 'undead' } })).toBe('deathless');
    expect(resolveCreatureType({ system: { creatureType: 'Untot' } })).toBe('deathless');
    expect(resolveCreatureType({ system: { creatureType: 'fiend' } })).toBe('fiend');
    expect(resolveCreatureType({ system: { creatureType: 'Dämon' } })).toBe('fiend');
    expect(resolveCreatureType({ system: { creatureType: 'demon' } })).toBe('fiend');
    expect(resolveCreatureType({ system: { bio: { type: 'vampire' } } })).toBe('deathless');
  });

  it('has no Exorcism / Requiem target gates (not in the canonical rules)', () => {
    expect('isExorcismValidTarget' in creatureType).toBe(false);
    expect('isRequiemValidTarget' in creatureType).toBe(false);
    expect('isTargetedSpecialValidTarget' in creatureType).toBe(false);
  });

  it('normalizes leftover free text onto the catalog and rejects unknown strings', () => {
    expect(normalizeCreatureTypeValue('beast')).toBe('beast');
    expect(normalizeCreatureTypeValue('Spirit')).toBe('spirit');
    expect(normalizeCreatureTypeValue('Tier')).toBe('beast');
    expect(normalizeCreatureTypeValue('owl spirit construct')).toBe('');
    const opts = creatureTypeSelectOptions('construct');
    expect(opts.some((o) => o.value === 'spirit')).toBe(true);
    expect(opts.some((o) => o.value === 'deathless' && o.label === 'Deathless')).toBe(true);
    expect(opts.find((o) => o.value === 'construct')?.selected).toBe(true);
  });
});
