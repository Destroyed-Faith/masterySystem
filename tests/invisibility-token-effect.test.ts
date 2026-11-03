import { describe, expect, it } from 'vitest';
import {
  invisibilityTokenEffectEnabled,
  invisibilityTokenVisualWanted,
  isInvisibleStatusId,
} from '../src/combat/invisibility-presentation';

describe('invisibility token effect toggle', () => {
  it('shows the token effect unless it was explicitly switched off', () => {
    expect(invisibilityTokenEffectEnabled({ flags: {} })).toBe(true);
    expect(
      invisibilityTokenEffectEnabled({
        flags: { 'mastery-system': { invisibilityTokenEffect: false } },
      }),
    ).toBe(false);
    expect(
      invisibilityTokenEffectEnabled({
        getFlag: () => false,
      }),
    ).toBe(false);
  });

  it('keeps mechanics and drops only the token visual when the switch is off', () => {
    expect(invisibilityTokenVisualWanted(3, true)).toBe(true);
    expect(invisibilityTokenVisualWanted(3, false)).toBe(false);
    expect(invisibilityTokenVisualWanted(0, true)).toBe(false);
    expect(isInvisibleStatusId('invisible')).toBe(true);
    expect(isInvisibleStatusId('hex')).toBe(false);
  });
});
