import { describe, expect, it } from 'vitest';
import { utilitySingleTargetAllowsSelf } from '../src/utility-targeting-rules';

describe('utility self targeting', () => {
  it('lets heal / ally utilities target the caster', () => {
    expect(utilitySingleTargetAllowsSelf('ally')).toBe(true);
    expect(utilitySingleTargetAllowsSelf('self')).toBe(true);
    expect(utilitySingleTargetAllowsSelf('creature')).toBe(true);
    expect(utilitySingleTargetAllowsSelf('any')).toBe(true);
  });

  it('keeps attacks from targeting the caster', () => {
    expect(utilitySingleTargetAllowsSelf('enemy')).toBe(false);
    expect(utilitySingleTargetAllowsSelf(undefined)).toBe(false);
  });
});
