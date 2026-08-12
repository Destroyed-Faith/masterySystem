import { describe, it, expect } from 'vitest';
import {
  resolveCreatureType,
  isExorcismValidTarget,
  isRequiemValidTarget,
  isTargetedSpecialValidTarget,
} from '../src/utils/creature-type';

describe('creature-type / Exorcism–Requiem validity', () => {
  it('resolves undead and fiend aliases', () => {
    expect(resolveCreatureType({ system: { creatureType: 'undead' } })).toBe('undead');
    expect(resolveCreatureType({ system: { creatureType: 'Untot' } })).toBe('undead');
    expect(resolveCreatureType({ system: { creatureType: 'fiend' } })).toBe('fiend');
    expect(resolveCreatureType({ system: { creatureType: 'Dämon' } })).toBe('fiend');
    expect(resolveCreatureType({ system: { creatureType: 'demon' } })).toBe('fiend');
    expect(resolveCreatureType({ system: { bio: { type: 'vampire' } } })).toBe('undead');
  });

  it('gates Exorcism to Fiend and Requiem to Undead', () => {
    expect(isExorcismValidTarget({ system: { creatureType: 'fiend' } })).toBe(true);
    expect(isExorcismValidTarget({ system: { creatureType: 'undead' } })).toBe(false);
    expect(isRequiemValidTarget({ system: { creatureType: 'undead' } })).toBe(true);
    expect(isRequiemValidTarget({ system: { creatureType: 'fiend' } })).toBe(false);
    expect(isExorcismValidTarget({ system: { creatureType: 'humanoid' } })).toBe(false);
    expect(isRequiemValidTarget({ system: { creatureType: '' } })).toBe(false);
    expect(isTargetedSpecialValidTarget('exorcism', { system: { creatureType: 'fiend' } })).toBe(true);
    expect(isTargetedSpecialValidTarget('requiem', { system: { creatureType: 'undead' } })).toBe(true);
    expect(isTargetedSpecialValidTarget('exorcism', { system: { creatureType: 'undead' } })).toBe(false);
  });
});
