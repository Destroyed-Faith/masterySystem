import { describe, expect, it } from 'vitest';
import {
  buildSurpriseRound1Order,
  sortByInitiativeOnly,
  surprisedIdsFromLegacyEdges,
  type SurpriseOrderCombatant,
} from '../src/combat/surprise-order.js';

function c(
  id: string,
  initiative: number,
  extra: Partial<SurpriseOrderCombatant> = {},
): SurpriseOrderCombatant {
  return { id, initiative, ...extra };
}

describe('Surprise Round 1 order (surprised act last)', () => {
  it('puts surprised combatants after non-surprised, both segments by initiative', () => {
    const combatants = [
      c('guardA', 25),
      c('thora', 18),
      c('guardB', 15),
      c('alaris', 10),
    ];
    const result = buildSurpriseRound1Order(combatants, ['guardA', 'guardB']);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.orderIds).toEqual(['thora', 'alaris', 'guardA', 'guardB']);
    expect(combatants.find((x) => x.id === 'guardA')?.initiative).toBe(25);
    expect(combatants.find((x) => x.id === 'alaris')?.initiative).toBe(10);
  });

  it('keeps surprised among themselves in initiative order', () => {
    const combatants = [c('guardA', 25), c('thora', 18), c('guardB', 15)];
    const result = buildSurpriseRound1Order(combatants, ['guardB', 'guardA']);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.orderIds).toEqual(['thora', 'guardA', 'guardB']);
  });

  it('migrates legacy edges to surprised target ids', () => {
    expect(
      surprisedIdsFromLegacyEdges([
        { attackerId: 'thora', targetId: 'guardA' },
        { attackerId: 'alaris', targetId: 'guardA' },
        { attackerId: 'thora', targetId: 'guardB' },
      ]),
    ).toEqual(['guardA', 'guardB']);
  });

  it('accepts legacy edge arrays in buildSurpriseRound1Order', () => {
    const combatants = [c('guardA', 25), c('thora', 18)];
    const result = buildSurpriseRound1Order(combatants, [
      { attackerId: 'thora', targetId: 'guardA' },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.orderIds).toEqual(['thora', 'guardA']);
  });

  it('without surprised ids matches initiative order', () => {
    const combatants = [c('guardA', 25), c('thora', 18), c('alaris', 10)];
    const result = buildSurpriseRound1Order(combatants, []);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.orderIds).toEqual(sortByInitiativeOnly(combatants).map((x) => x.id));
  });
});
