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
export type EncounterStep = 'party' | 'difficulty' | 'composition' | 'review' | 'name';
export declare const ENCOUNTER_STEP_ORDER: EncounterStep[];
export type Difficulty = 'moderate' | 'hard' | 'brutal';
/** Per-PC combat profile extracted from a prepared actor. */
export interface PartyMemberMetrics {
    actorId: string;
    name: string;
    mr: number;
    /** Sum of all health-bar maxima. */
    effectiveHP: number;
    /** Effective evade used by the to-hit pipeline (evadeTotal). */
    evade: number;
    /** Effective flat armor used by mitigation (armorTotal). */
    armor: number;
    /** Continuous damage reduction percent (0-100). */
    drPct: number;
    /** Attack dice pool size (number of d8). */
    attackPool: number;
    /** Kept dice (Mastery Rank). */
    keep: number;
    /** Expected weapon dice damage per hit (pre-raise, pre-Might). */
    weaponDamageMean: number;
    /** Flat melee damage bonus = 2 * floor(Might / 8). */
    mightMeleeBonus: number;
    /** Attack actions per round (PC base = 1). */
    attacksPerRound: number;
    /** Sorted-ascending Monte-Carlo sample of this member's attack totals. */
    attackTotals: number[];
}
/** Aggregated party metrics consumed by the balance model. */
export interface PartyMetrics {
    members: PartyMemberMetrics[];
    size: number;
    medianMR: number;
    avgEvade: number;
    avgArmor: number;
    avgDrPct: number;
    avgHP: number;
    /** All members' attack-total samples pooled and sorted ascending. */
    pooledAttackTotals: number[];
}
/** One phase of an enemy (minions carry exactly one). */
export interface EnemyPhaseStat {
    name: string;
    hp: number;
    /** Intended evade (display); realized in-engine via mr + agility. */
    evade: number;
    /** Intended armor (display); realized in-engine as mr. */
    armor: number;
    attackDiceCount: number;
    damageDiceCount: number;
}
export interface EnemyStatBlock {
    id: string;
    kind: 'boss' | 'minion';
    name: string;
    mr: number;
    /** Agility chosen so MR*4 + floor(agility/8) ≈ intended evade. */
    agility: number;
    speed: number;
    attackSlots: number;
    movementSlots: number;
    saves: {
        body: number;
        mind: number;
        spirit: number;
    };
    /** Boss: 2-5 phases. Minion: exactly 1. */
    phases: EnemyPhaseStat[];
}
export interface RespawnPlan {
    /** Minions spawned per wave (0 = none). */
    minionsPerWave: number;
    /** Wave cadence in rounds (0 = no respawn). */
    cadenceRounds: number;
    recommendedPerWave: number;
    recommendedCadence: number;
}
export interface EncounterPlan {
    difficulty: Difficulty;
    bosses: EnemyStatBlock[];
    minions: EnemyStatBlock[];
    respawn: RespawnPlan;
    notes: string[];
}
export interface CompositionSelection {
    bossCount: number;
    phasesPerBoss: number;
    minionCount: number;
    /** Desired respawn cadence in rounds (0 = none). */
    respawnCadence: number;
}
export interface EncounterSelection {
    selectedActorIds: string[];
    difficulty: Difficulty;
    composition: CompositionSelection;
    folderName: string;
}
export declare const ENCOUNTER_LIMITS: {
    readonly minBosses: 1;
    readonly maxBosses: 6;
    readonly minPhases: 2;
    readonly maxPhases: 5;
    readonly minMinions: 0;
    readonly maxMinions: 20;
    readonly minCadence: 0;
    readonly maxCadence: 5;
};
//# sourceMappingURL=encounter-generator-types.d.ts.map