import { describe, expect, it } from 'vitest';

import { buildSafeHavenRestUpdates } from '../src/utils/safe-haven-rest.js';

describe('buildSafeHavenRestUpdates', () => {
  it('tops HP and Stress, clears scars, and resets spent skills', () => {
    const updates = buildSafeHavenRestUpdates({
      skills: { athletics: 3 },
      skillsSpent: { athletics: 2 },
      faithFractures: { current: 0, maximum: 3 },
      mastery: { rank: 4, charges: 0 },
      health: {
        bars: [
          { name: 'Healthy', max: 20, current: 4 },
          { name: 'Incapacitated', max: 1, current: 0 },
        ],
        currentBar: 1,
        tempHP: 6,
        scarred: 1,
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
    expect(updates['system.health.currentBar']).toBe(0);
    expect(updates['system.health.tempHP']).toBe(0);
    expect(updates['system.health.scarred']).toBe(0);
    expect(updates['system.health.bars']).toEqual([
      { name: 'Healthy', max: 20, current: 20 },
      { name: 'Incapacitated', max: 1, current: 1 },
    ]);
    expect(updates['system.stress.bars']).toEqual([{ name: 'Calm', max: 10, current: 10 }]);
    expect(updates['system.stress.scarred']).toBe(0);
    expect(updates['system.stones.sealed']).toBe(0);
    expect(updates['system.stones.lost']).toBe(0);
    expect(updates['system.stones.bound']).toBe(0);
    expect(updates['system.stones.bondedFormActive']).toBe(false);
    expect(updates['system.statusEffects']).toEqual([]);
  });

  it('does not invent HP bars when the actor has none', () => {
    const updates = buildSafeHavenRestUpdates({ mastery: { rank: 2 } });
    expect(updates['system.health.bars']).toBeUndefined();
    expect(updates['system.mastery.charges']).toBeUndefined();
  });
});
