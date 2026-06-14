/**
 * Encounter Generator — shared types.
 *
 * The generator analyses a chosen party of player `character` actors and
 * derives balanced Souls-like enemies (bosses with 2-5 phases + minions),
 * then writes them as `npc` actors into a new, named folder.
 *
 * Engine reality this model is built on (see src/documents/actor.ts):
 *   - NPC effective evade in combat = `MR * 4 + floor(agility / 8)` (the flat
 *     `combat.evade` field is NOT read by the to-hit pipeline).
 *   - NPC effective armor in combat = `MR` (no equipped items).
 *   - NPC HP = explicit `health.bars` (never recomputed from vitality).
 *   - Per-phase attack/damage dice ARE honored via resolveNpcAttackList; the
 *     active phase is `npcActivePhaseIndex`.
 */
export const ENCOUNTER_STEP_ORDER = [
    'party',
    'difficulty',
    'composition',
    'review',
    'name',
];
export const ENCOUNTER_LIMITS = {
    minBosses: 1,
    maxBosses: 6,
    minPhases: 2,
    maxPhases: 5,
    minMinions: 0,
    maxMinions: 20,
    minCadence: 0,
    maxCadence: 5,
};
//# sourceMappingURL=encounter-generator-types.js.map