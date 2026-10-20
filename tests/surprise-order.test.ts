import { describe, expect, it } from 'vitest';
import {
  buildSurpriseRound1Order,
  sortByInitiativeOnly,
  type SurpriseEdge,
  type SurpriseOrderCombatant,
} from '../src/combat/surprise-order.js';

function c(
  id: string,
  initiative: number,
  extra: Partial<SurpriseOrderCombatant> = {},
): SurpriseOrderCombatant {
  return { id, initiative, ...extra };
}

describe('Surprise Round 1 order', () => {
  it('puts both Surprise attackers before both surprised Guards without changing scores', () => {
    const combatants = [
      c('guardA', 25),
      c('thora', 18),
      c('guardB', 15),
      c('alaris', 10),
    ];
    const edges: SurpriseEdge[] = [
      { attackerId: 'thora', targetId: 'guardA' },
      { attackerId: 'thora', targetId: 'guardB' },
      { attackerId: 'alaris', targetId: 'guardA' },
      { attackerId: 'alaris', targetId: 'guardB' },
    ];
    const result = buildSurpriseRound1Order(combatants, edges);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.orderIds).toEqual(['thora', 'alaris', 'guardA', 'guardB']);
    expect(combatants.find((x) => x.id === 'guardA')?.initiative).toBe(25);
    expect(combatants.find((x) => x.id === 'alaris')?.initiative).toBe(10);
  });

  it('honors partial Surprise while preserving compatible initiative', () => {
    const combatants = [c('guardA', 25), c('thora', 18), c('guardB', 15), c('alaris', 10)];
    // Only Thora surprises Guard A — Alaris has no edge.
    const edges: SurpriseEdge[] = [{ attackerId: 'thora', targetId: 'guardA' }];
    const result = buildSurpriseRound1Order(combatants, edges);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Thora before Guard A; otherwise initiative order among unconstrained.
    expect(result.orderIds.indexOf('thora')).toBeLessThan(result.orderIds.indexOf('guardA'));
    expect(result.orderIds[0]).toBe('thora');
  });

  it('detects contradictory cycles', () => {
    const combatants = [c('a', 20), c('b', 10)];
    const edges: SurpriseEdge[] = [
      { attackerId: 'a', targetId: 'b' },
      { attackerId: 'b', targetId: 'a' },
    ];
    const result = buildSurpriseRound1Order(combatants, edges);
    expect(result.ok).toBe(false);
  });

  it('without edges matches initiative order', () => {
    const combatants = [c('guardA', 25), c('thora', 18), c('alaris', 10)];
    const result = buildSurpriseRound1Order(combatants, []);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.orderIds).toEqual(sortByInitiativeOnly(combatants).map((x) => x.id));
  });
});
