import { describe, it, expect } from 'vitest';
import {
  getMasteryRank,
  basicCombatMrTimesTwo,
  basicAttackMrDamageFormula,
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
  it('clamps Mastery Rank and derives MR×2 / MR×2d8', () => {
    expect(getMasteryRank({ system: { mastery: { rank: 4 } } })).toBe(4);
    expect(basicCombatMrTimesTwo({ system: { mastery: { rank: 4 } } })).toBe(8);
    expect(basicAttackMrDamageFormula({ system: { mastery: { rank: 4 } } })).toBe('8d8');
    expect(getMasteryRank({ system: { mastery: { rank: 0 } } })).toBe(2);
    expect(getMasteryRank({ system: {} })).toBe(2);
  });

  it('builds Guard / Evade / Dive for Cover with MR×2 bonuses', () => {
    const items = buildBasicReactionItems({ system: { mastery: { rank: 3 } } });
    expect(items.map((i) => i.id)).toEqual([
      BASIC_REACTION_IDS.guard,
      BASIC_REACTION_IDS.evade,
      BASIC_REACTION_IDS.diveForCover,
    ]);
    expect(items[0].mechanics.armor).toBe(6);
    expect(items[1].mechanics.evade).toBe(6);
    expect(items[2].basicReaction).toBe('dive-for-cover');
    expect(items.every(isBasicReactionItem)).toBe(true);
  });
});

describe('basic combat maneuvers catalog', () => {
  it('includes Guard/Evade/Dive/Quick Load/Flee and radial prefs cover core basics', () => {
    const ids = new Set(COMBAT_MANEUVERS.map((m) => m.id));
    for (const id of [
      'guard',
      'evade',
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
    expect(RADIAL_STANDARD_MANEUVER_IDS).toContain('weapon-attack');
  });

  it('shows Basic Attack in the radial by default', () => {
    expect(isOptInRadialManeuverId('weapon-attack')).toBe(false);
    expect(isManeuverHiddenFromActorRadial({ system: {} }, 'weapon-attack')).toBe(false);
    expect(isManeuverHiddenFromActorRadial({ system: {} }, 'move')).toBe(false);
    expect(
      isManeuverHiddenFromActorRadial(
        { system: { radialManeuverPrefs: { hideIds: { 'weapon-attack': true } } } },
        'weapon-attack',
      ),
    ).toBe(true);
    const panel = buildRadialManeuverPrefsContext({});
    const basic = panel.rows.find((r) => r.id === 'weapon-attack');
    expect(basic?.hideFromRadial).toBe(false);
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
