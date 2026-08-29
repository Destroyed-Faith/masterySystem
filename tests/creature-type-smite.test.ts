import { describe, it, expect } from 'vitest';
import {
  resolveCreatureType,
  isExorcismValidTarget,
  isRequiemValidTarget,
  isTargetedSpecialValidTarget,
  normalizeCreatureTypeValue,
  creatureTypeSelectOptions,
} from '../src/utils/creature-type';

describe('creature-type / Exorcism–Requiem validity', () => {
  it('resolves deathless and fiend aliases (including legacy undead)', () => {
    expect(resolveCreatureType({ system: { creatureType: 'deathless' } })).toBe('deathless');
    expect(resolveCreatureType({ system: { creatureType: 'undead' } })).toBe('deathless');
    expect(resolveCreatureType({ system: { creatureType: 'Untot' } })).toBe('deathless');
    expect(resolveCreatureType({ system: { creatureType: 'fiend' } })).toBe('fiend');
    expect(resolveCreatureType({ system: { creatureType: 'Dämon' } })).toBe('fiend');
    expect(resolveCreatureType({ system: { creatureType: 'demon' } })).toBe('fiend');
    expect(resolveCreatureType({ system: { bio: { type: 'vampire' } } })).toBe('deathless');
  });

  it('gates Exorcism to Fiend and Requiem to Deathless', () => {
    expect(isExorcismValidTarget({ system: { creatureType: 'fiend' } })).toBe(true);
    expect(isExorcismValidTarget({ system: { creatureType: 'deathless' } })).toBe(false);
    expect(isExorcismValidTarget({ system: { creatureType: 'undead' } })).toBe(false);
    expect(isRequiemValidTarget({ system: { creatureType: 'deathless' } })).toBe(true);
    expect(isRequiemValidTarget({ system: { creatureType: 'undead' } })).toBe(true);
    expect(isRequiemValidTarget({ system: { creatureType: 'fiend' } })).toBe(false);
    expect(isExorcismValidTarget({ system: { creatureType: 'humanoid' } })).toBe(false);
    expect(isRequiemValidTarget({ system: { creatureType: '' } })).toBe(false);
    expect(isTargetedSpecialValidTarget('exorcism', { system: { creatureType: 'fiend' } })).toBe(true);
    expect(isTargetedSpecialValidTarget('requiem', { system: { creatureType: 'deathless' } })).toBe(true);
    expect(isTargetedSpecialValidTarget('requiem', { system: { creatureType: 'undead' } })).toBe(true);
    expect(isTargetedSpecialValidTarget('exorcism', { system: { creatureType: 'undead' } })).toBe(false);
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
