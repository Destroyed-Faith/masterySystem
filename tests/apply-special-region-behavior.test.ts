import { describe, expect, it } from 'vitest';
import { matchesSide, dispositionSide } from '../src/combat/gm-effect-service';
import {
  gmEffectTargetFromTokenDoc,
  isRegionEventSelf,
  markRegionMoveInHandled,
  regionEventLooksLikeMeasuredMove,
  regionSpecialPassesSideFilter,
  regionSpecialTriggerEnabled,
  shouldSkipTokenEnterAfterMoveIn,
  wasRegionMoveInRecentlyHandled,
} from '../src/regions/apply-special-behavior';
import {
  createMovementBudget,
  movementBudgetExhausted,
  reconcileGuidedSpendAfterHalt,
  spendMovementMeters,
} from '../src/ui/guided-movement-budget';

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

describe('MOVE_IN / ENTER dedupe', () => {
  it('detects measured-move event shapes', () => {
    expect(regionEventLooksLikeMeasuredMove({ data: { movement: { id: 'm1' } } })).toBe(true);
    expect(regionEventLooksLikeMeasuredMove({ data: { moved: true } })).toBe(true);
    expect(regionEventLooksLikeMeasuredMove({ data: {} })).toBe(false);
  });

  it('skips TOKEN_ENTER only after a recent MOVE_IN for the same token/region', () => {
    const now = Date.now();
    markRegionMoveInHandled('tokA', 'reg1', now);
    expect(wasRegionMoveInRecentlyHandled('tokA', 'reg1', now + 500)).toBe(true);
    expect(
      shouldSkipTokenEnterAfterMoveIn({ data: { token: { id: 'tokA' } } }, 'reg1'),
    ).toBe(true);
    expect(
      shouldSkipTokenEnterAfterMoveIn({ data: { token: { id: 'tokB' } } }, 'reg1'),
    ).toBe(false);
  });

  it('does not skip measured ENTER when MOVE_IN never marked the crossing', () => {
    expect(
      shouldSkipTokenEnterAfterMoveIn(
        { data: { token: { id: `fresh-${Date.now()}` }, movement: { id: 'x' } } },
        'regZ',
      ),
    ).toBe(false);
  });

  it('detects self region events', () => {
    expect(isRegionEventSelf({ user: { isSelf: true } })).toBe(true);
    expect(isRegionEventSelf({ user: { isSelf: false, id: 'other' } })).toBe(false);
    expect(isRegionEventSelf({})).toBe(false);
  });
});

describe('remaining movement budget after a partial stop', () => {
  it('keeps meters after spending only the walked leg', () => {
    let budget = createMovementBudget(12, 6);
    budget = spendMovementMeters(budget, 4);
    expect(budget.remainingMeters).toBeCloseTo(8);
    expect(movementBudgetExhausted(budget)).toBe(false);
    budget = spendMovementMeters(budget, 8);
    expect(movementBudgetExhausted(budget)).toBe(true);
  });

  it('reconciles guided spend when halted short of the intended dest', () => {
    const grid = reconcileGuidedSpendAfterHalt({
      intendedSteps: 5,
      intendedMeters: 0,
      actualSteps: 2,
      actualMeters: 0,
      gridless: false,
    });
    expect(grid.stepsUsed).toBe(2);
    expect(grid.haltedShort).toBe(true);

    const free = reconcileGuidedSpendAfterHalt({
      intendedSteps: 0,
      intendedMeters: 10,
      actualSteps: null,
      actualMeters: 3.5,
      gridless: true,
    });
    expect(free.metersUsed).toBeCloseTo(3.5);
    expect(free.haltedShort).toBe(true);

    const full = reconcileGuidedSpendAfterHalt({
      intendedSteps: 3,
      intendedMeters: 0,
      actualSteps: 3,
      actualMeters: 0,
      gridless: false,
    });
    expect(full.haltedShort).toBe(false);
  });
});
