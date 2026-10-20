import { describe, expect, it } from 'vitest';
import { matchesSide, dispositionSide } from '../src/combat/gm-effect-service';
import {
  gmEffectTargetFromTokenDoc,
  regionSpecialPassesSideFilter,
  regionSpecialTriggerEnabled,
} from '../src/regions/apply-special-behavior';

describe('regionSpecialTriggerEnabled', () => {
  it('defaults both toggles to on when undefined', () => {
    expect(regionSpecialTriggerEnabled({}, 'enter')).toBe(true);
    expect(regionSpecialTriggerEnabled({}, 'roundEnd')).toBe(true);
  });

  it('respects applyOnEnter / applyOnRoundEnd', () => {
    expect(regionSpecialTriggerEnabled({ applyOnEnter: false, applyOnRoundEnd: true }, 'enter')).toBe(
      false,
    );
    expect(regionSpecialTriggerEnabled({ applyOnEnter: false, applyOnRoundEnd: true }, 'roundEnd')).toBe(
      true,
    );
    expect(regionSpecialTriggerEnabled({ applyOnEnter: true, applyOnRoundEnd: false }, 'roundEnd')).toBe(
      false,
    );
  });

  it('returns false for null system', () => {
    expect(regionSpecialTriggerEnabled(null, 'enter')).toBe(false);
  });
});

describe('regionSpecialPassesSideFilter', () => {
  it('matches disposition like the GM carousel filters', () => {
    expect(dispositionSide(1)).toBe('friendly');
    expect(dispositionSide(-1)).toBe('hostile');
    expect(dispositionSide(0)).toBe('neutral');
    expect(matchesSide(1, 'friendly')).toBe(true);
    expect(matchesSide(-1, 'hostile')).toBe(true);
    expect(regionSpecialPassesSideFilter(1, 'friendly')).toBe(true);
    expect(regionSpecialPassesSideFilter(1, 'hostile')).toBe(false);
    expect(regionSpecialPassesSideFilter(-1, 'all')).toBe(true);
    expect(regionSpecialPassesSideFilter(0, 'neutral')).toBe(true);
    expect(regionSpecialPassesSideFilter(0, 'bogus')).toBe(true);
  });
});

describe('gmEffectTargetFromTokenDoc', () => {
  it('builds a target ref from a token document shape', () => {
    const ref = gmEffectTargetFromTokenDoc({
      id: 'tok1',
      name: 'Goblin',
      disposition: -1,
      actor: { id: 'act1', name: 'Goblin' },
    });
    expect(ref).toEqual({
      actorId: 'act1',
      tokenId: 'tok1',
      combatantId: null,
      name: 'Goblin',
      disposition: -1,
    });
  });

  it('returns null without ids', () => {
    expect(gmEffectTargetFromTokenDoc(null)).toBeNull();
    expect(gmEffectTargetFromTokenDoc({})).toBeNull();
  });
});
