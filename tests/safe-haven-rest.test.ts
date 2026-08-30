import { describe, expect, it } from 'vitest';

import { buildSafeHavenRestUpdates, buildRestHealthBarUpdates } from '../src/utils/safe-haven-rest.js';

describe('buildSafeHavenRestUpdates', () => {
  it('restores active bar + 1 scarred bar, refreshes daily resources, leaves stress and bound stones alone', () => {
    const updates = buildSafeHavenRestUpdates({
      skills: { athletics: 3 },
      skillsSpent: { athletics: 2 },
      faithFractures: { current: 0, maximum: 3 },
      mastery: { rank: 4, charges: 0 },
      health: {
        bars: [
          { name: 'Healthy', max: 20, current: 0 },
          { name: 'Wounded', max: 20, current: 0 },
          { name: 'Critical', max: 20, current: 5 },
        ],
        currentBar: 2,
        tempHP: 6,
        scarred: 2,
      },
      stress: {
        bars: [{ name: 'Calm', max: 10, current: 2 }],
        currentBar: 0,
        scarred: 2,
      },
      stones: { sealed: 2, lost: 1, bound: 1, bondedFormActive: true },
      statusEffects: [{ id: 'bleed' }],
    });

    expect(updates['system.skillsSpent']).toMatchObject({ athletics: 0 });
    expect(updates['system.faithFractures.current']).toBe(3);
    expect(updates['system.mastery.charges']).toBe(4);
    expect(updates['system.health.tempHP']).toBe(0);
    // Active bar (Critical) refilled + the most recent Scarred bar (Wounded)
    // reopened; the older scar (Healthy) stays.
    expect(updates['system.health.bars']).toEqual([
      { name: 'Healthy', max: 20, current: 0 },
      { name: 'Wounded', max: 20, current: 20 },
      { name: 'Critical', max: 20, current: 20 },
    ]);
    expect(updates['system.health.currentBar']).toBe(1);
    expect(updates['system.health.scarred']).toBe(1);
    // Stress is not part of the documented Safe Haven refresh list.
    expect(updates['system.stress.bars']).toBeUndefined();
    expect(updates['system.stress.scarred']).toBeUndefined();
    expect(updates['system.stones.sealed']).toBe(0);
    expect(updates['system.stones.lost']).toBe(0);
    // Bound Stones (Artifacts / Familiars) do NOT return on rest.
    expect(updates['system.stones.bound']).toBeUndefined();
    expect(updates['system.stones.bondedFormActive']).toBe(false);
    expect(updates['system.statusEffects']).toEqual([]);
  });

  it('does not invent HP bars when the actor has none', () => {
    const updates = buildSafeHavenRestUpdates({ mastery: { rank: 2 } });
    expect(updates['system.health.bars']).toBeUndefined();
    expect(updates['system.mastery.charges']).toBeUndefined();
  });
});

describe('buildRestHealthBarUpdates', () => {
  it('Night Rest refills only the active bar', () => {
    const updates = buildRestHealthBarUpdates(
      {
        health: {
          bars: [
            { max: 20, current: 0 },
            { max: 20, current: 7 },
          ],
          scarred: 1,
        },
      },
      { restoreOneScarredBar: false },
    );
    expect(updates['system.health.bars']).toEqual([
      { max: 20, current: 0 },
      { max: 20, current: 20 },
    ]);
    expect(updates['system.health.currentBar']).toBe(1);
    expect(updates['system.health.scarred']).toBe(1);
  });

  it('reopens the last bar when everything is depleted', () => {
    const updates = buildRestHealthBarUpdates(
      {
        health: {
          bars: [
            { max: 20, current: 0 },
            { max: 20, current: 0 },
          ],
        },
      },
      { restoreOneScarredBar: true },
    );
    expect(updates['system.health.bars']).toEqual([
      { max: 20, current: 20 },
      { max: 20, current: 20 },
    ]);
    expect(updates['system.health.currentBar']).toBe(0);
  });
});
