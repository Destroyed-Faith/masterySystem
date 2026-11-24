import { describe, expect, it } from 'vitest';
import {
  NPC_STANDARD_REACTIONS,
  actorParticipatesInReactions,
  clampNpcReactionSlots,
  coerceNpcReactionsArray,
  materializeNpcReactionPowers,
  newStandardNpcReaction,
  npcReactionSlotsForEconomy,
  resolveNpcReactionConfig,
} from '../src/utils/npc-reactions.js';

describe('NPC reaction opt-in', () => {
  it('defaults to no participation', () => {
    const npc = { type: 'npc', system: {} };
    expect(actorParticipatesInReactions(npc)).toBe(false);
    expect(npcReactionSlotsForEconomy(npc)).toBe(0);
    expect(materializeNpcReactionPowers(npc)).toEqual([]);
  });

  it('characters still participate without NPC config', () => {
    expect(actorParticipatesInReactions({ type: 'character', system: {} })).toBe(true);
  });

  it('needs both slots and at least one row', () => {
    const onlySlots = { type: 'npc', system: { npcReactionSlots: 2, npcReactions: [] } };
    const onlyRows = {
      type: 'npc',
      system: {
        npcReactionSlots: 0,
        npcReactions: [{ id: 'a', name: 'Dive for Cover', source: 'basic', basicId: 'dive-for-cover' }],
      },
    };
    const both = {
      type: 'npc',
      system: {
        npcReactionSlots: 2,
        npcReactions: [{ id: 'a', name: 'Dive for Cover', source: 'basic', basicId: 'dive-for-cover' }],
      },
    };
    expect(actorParticipatesInReactions(onlySlots)).toBe(false);
    expect(actorParticipatesInReactions(onlyRows)).toBe(false);
    expect(actorParticipatesInReactions(both)).toBe(true);
    expect(npcReactionSlotsForEconomy(both)).toBe(2);
  });

  it('materializes only the configured standard reaction', () => {
    const npc = {
      type: 'npc',
      system: {
        mastery: { rank: 2 },
        npcReactionSlots: 1,
        npcReactions: [{ id: 'a', name: 'Dive for Cover', source: 'basic', basicId: 'dive-for-cover' }],
      },
    };
    const powers = materializeNpcReactionPowers(npc);
    expect(powers.map((p: any) => p.basicReaction)).toEqual(['dive-for-cover']);
  });

  it('drops stored Basic Evade and Guard rows (Core v0.9.9.6)', () => {
    expect(NPC_STANDARD_REACTIONS.map((row) => row.id)).not.toContain('evade');
    expect(NPC_STANDARD_REACTIONS.map((row) => row.id)).not.toContain('guard');
    expect(newStandardNpcReaction('evade')).toBeNull();
    expect(newStandardNpcReaction('guard')).toBeNull();
    const npc = {
      type: 'npc',
      system: {
        mastery: { rank: 2 },
        npcReactionSlots: 1,
        npcReactions: [
          { id: 'e', name: 'Evade', source: 'basic', basicId: 'evade' },
          { id: 'g', name: 'Guard', source: 'basic', basicId: 'guard' },
          { id: 'd', name: 'Dive for Cover', source: 'basic', basicId: 'dive-for-cover' },
        ],
      },
    };
    expect(resolveNpcReactionConfig(npc.system).rows.map((row) => row.basicId)).toEqual([
      'dive-for-cover',
    ]);
    expect(materializeNpcReactionPowers(npc).map((p: any) => p.basicReaction)).toEqual([
      'dive-for-cover',
    ]);
  });

  it('reads the active boss phase', () => {
    const cfg = resolveNpcReactionConfig({
      npcActivePhaseIndex: 1,
      phases: [
        { npcReactionSlots: 1, npcReactions: [{ name: 'P1', source: 'custom' }] },
        {
          npcReactionSlots: 3,
          npcReactions: [{ name: 'P2 Dive', source: 'basic', basicId: 'dive-for-cover' }],
        },
      ],
    });
    expect(cfg.phaseIndex).toBe(1);
    expect(cfg.slots).toBe(3);
    expect(cfg.rows[0]?.basicId).toBe('dive-for-cover');
  });

  it('does not offer or fire Counterattack', () => {
    expect(NPC_STANDARD_REACTIONS.map((row) => row.id)).not.toContain('counterattack');
    expect(newStandardNpcReaction('counterattack')).toBeNull();
    const npc = {
      type: 'npc',
      system: {
        mastery: { rank: 2 },
        npcReactionSlots: 1,
        npcReactions: [
          { id: 'c', name: 'Counterattack', source: 'basic', basicId: 'counterattack' },
          { id: 'd', name: 'Dive for Cover', source: 'basic', basicId: 'dive-for-cover' },
        ],
      },
    };
    const cfg = resolveNpcReactionConfig(npc.system);
    expect(cfg.rows.map((row) => row.basicId)).toEqual(['dive-for-cover']);
    expect(materializeNpcReactionPowers(npc).map((p: any) => p.basicReaction)).toEqual([
      'dive-for-cover',
    ]);
  });

  it('clamps slots and coerces object-shaped arrays', () => {
    expect(clampNpcReactionSlots(-2)).toBe(0);
    expect(clampNpcReactionSlots(99)).toBe(10);
    const rows = coerceNpcReactionsArray({
      0: { name: 'A', source: 'custom' },
      1: { name: 'B', source: 'basic', basicId: 'dive-for-cover' },
    });
    expect(rows).toHaveLength(2);
    expect(rows[1].basicId).toBe('dive-for-cover');
  });
});
