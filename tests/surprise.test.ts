import { describe, expect, it } from 'vitest';
import { getTargetEvade } from '../src/combat/target-defenses';
import {
  actorHasSurprise,
  effectCarriesSurprise,
  evadeAfterSurprise,
  statusListHasSurprise,
} from '../src/combat/surprise';

describe('evadeAfterSurprise', () => {
  it('halves Evade while surprised and leaves a normal score alone', () => {
    expect(evadeAfterSurprise(17, true)).toBe(8);
    expect(evadeAfterSurprise(17, false)).toBe(17);
    expect(evadeAfterSurprise(0, true)).toBe(0);
  });
});

describe('actorHasSurprise', () => {
  it('reads the sheet status list, the token status set, and ActiveEffects', () => {
    expect(actorHasSurprise({ system: { statusEffects: [{ id: 'surprise' }] } })).toBe(true);
    expect(actorHasSurprise({ system: { statusEffects: [{ id: 'slow', value: 2 }] } })).toBe(false);
    expect(actorHasSurprise({ statuses: new Set(['surprise']) })).toBe(true);
    expect(
      actorHasSurprise({
        effects: [{ name: 'Surprise', statuses: new Set(['surprise']) }],
      }),
    ).toBe(true);
  });
});

describe('effectCarriesSurprise', () => {
  it('matches the token HUD status id and the display name', () => {
    expect(effectCarriesSurprise({ statuses: new Set(['surprise']) })).toBe(true);
    expect(effectCarriesSurprise({ flags: { core: { statusId: 'surprise' } } })).toBe(true);
    expect(effectCarriesSurprise({ name: 'Surprised' })).toBe(true);
    expect(effectCarriesSurprise({ name: 'Prone', statuses: new Set(['prone']) })).toBe(false);
  });
});

describe('statusListHasSurprise', () => {
  it('detects a sheet patch that adds Surprise', () => {
    expect(statusListHasSurprise([{ id: 'slow' }, { id: 'surprise' }])).toBe(true);
    expect(statusListHasSurprise({ '0': { id: 'surprise' } })).toBe(true);
    expect(statusListHasSurprise([{ name: 'Slow', value: 1 }])).toBe(false);
  });
});

describe('getTargetEvade', () => {
  it('halves the live Evade total when Surprise is on', () => {
    const actor = {
      system: {
        combat: { evadeTotal: 17, evadeFromActiveBuffs: 8 },
        statusEffects: [{ id: 'surprise' }],
      },
    };
    expect(getTargetEvade(actor)).toBe(12);
    expect(getTargetEvade({ system: { combat: { evadeTotal: 17, evadeFromActiveBuffs: 8 } } })).toBe(25);
  });
});
