import { describe, it, expect } from 'vitest';
import {
  getMasteryRank,
  basicCombatMrTimesTwo,
  buildBasicReactionItems,
  isBasicReactionItem,
  BASIC_REACTION_IDS,
} from '../src/combat/basic-combat.js';
import { COMBAT_MANEUVERS } from '../src/system/combat-maneuvers.js';
import { RADIAL_STANDARD_MANEUVER_IDS } from '../src/utils/radial-maneuver-prefs.js';
import {
  isManeuverHiddenFromActorRadial,
  isOptInRadialManeuverId,
  buildRadialManeuverPrefsContext,
} from '../src/utils/radial-maneuver-prefs.js';

describe('basic-combat helpers', () => {
  it('clamps Mastery Rank and derives MR×2', () => {
    expect(getMasteryRank({ system: { mastery: { rank: 4 } } })).toBe(4);
    expect(basicCombatMrTimesTwo({ system: { mastery: { rank: 4 } } })).toBe(8);
    expect(getMasteryRank({ system: { mastery: { rank: 0 } } })).toBe(2);
    expect(getMasteryRank({ system: {} })).toBe(2);
  });

  it('builds only Dive for Cover (no Basic Evade or Guard, Core v0.9.9.6)', () => {
    const items = buildBasicReactionItems({ system: { mastery: { rank: 3 } } });
    expect(items.map((i) => i.id)).toEqual([BASIC_REACTION_IDS.diveForCover]);
    expect(items[0].basicReaction).toBe('dive-for-cover');
    expect(items.some((i) => i.basicReaction === 'evade' || i.basicReaction === 'guard')).toBe(false);
    expect(items.every(isBasicReactionItem)).toBe(true);
  });
});

describe('basic combat maneuvers catalog', () => {
  it('includes Dive/Quick Load/Flee and radial prefs cover core basics', () => {
    const ids = new Set(COMBAT_MANEUVERS.map((m) => m.id));
    expect(ids.has('evade')).toBe(false);
    expect(ids.has('guard')).toBe(false);
    for (const id of [
      'dive-for-cover',
      'quick-load',
      'weapon-swap',
      'flee',
    ]) {
      expect(ids.has(id)).toBe(true);
    }
    // Counterattack remains in the catalog but is not a universal Basic Reaction.
    expect(ids.has('counterattack')).toBe(true);
    expect(COMBAT_MANEUVERS.find((m) => m.id === 'counterattack')?.tags).not.toContain(
      'basic-reaction',
    );
    expect(ids.has('initiative-delay')).toBe(false);
    expect(RADIAL_STANDARD_MANEUVER_IDS).toContain('quick-load');
    expect(RADIAL_STANDARD_MANEUVER_IDS).toContain('weapon-swap');
    expect(RADIAL_STANDARD_MANEUVER_IDS).toContain('flee');
    expect(RADIAL_STANDARD_MANEUVER_IDS).not.toContain('initiative-delay');
    expect(RADIAL_STANDARD_MANEUVER_IDS).not.toContain('weapon-attack');
  });

  it('has no Basic Attack in the radial prefs (Actives v0.9.9.6)', () => {
    expect(isOptInRadialManeuverId('weapon-attack')).toBe(false);
    expect(isManeuverHiddenFromActorRadial({ system: {} }, 'move')).toBe(false);
    const panel = buildRadialManeuverPrefsContext({});
    expect(panel.rows.find((r) => r.id === 'weapon-attack')).toBeUndefined();
    expect(panel.rows.some((r) => r.id === 'move')).toBe(true);
  });

  it('Flee / Dash / Dive texts match current Basic Maneuver rules', () => {
    const flee = COMBAT_MANEUVERS.find((m) => m.id === 'flee');
    const dash = COMBAT_MANEUVERS.find((m) => m.id === 'dash');
    const disengage = COMBAT_MANEUVERS.find((m) => m.id === 'disengage');
    expect(flee?.effect).toMatch(/4×/);
    expect(flee?.effect).toMatch(/lose one Attack Action/i);
    expect(flee?.effect).toMatch(/no way back/i);
    expect(flee?.description).toMatch(/Escape/i);
    expect(dash?.effect).toMatch(/double/);
    expect(dash?.effect).toMatch(/lose one Attack Action/i);
    expect(dash?.description).toMatch(/lose one Attack Action/i);
    expect(disengage?.effect).toMatch(/lose one Attack Action/i);
    expect(disengage?.description).toMatch(/lose one Attack Action/i);
    expect(COMBAT_MANEUVERS.find((m) => m.id === 'dive-for-cover')?.effect).toMatch(/2 × Mastery Rank/);
    expect(COMBAT_MANEUVERS.find((m) => m.id === 'stand-up')?.slot).toBe('movement');
  });
});
