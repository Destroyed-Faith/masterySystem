/**
 * Damage Dialog for Mastery System
 * Appears after successful attack roll to calculate and apply damage
 */
export { computeMarkFloorBonus, clampMarkSpend } from './mark-floor.js';
/**
 * Re-attach Roll / Cancel listeners when the log re-renders (Foundry v13
 * `renderChatMessageHTML`). Without this, handlers are lost while an in-memory
 * roll lock can remain — the button stays dead after reload/reroll flows.
 */
export declare function registerDamageCardChatHooks(): void;
export interface DamageDialogData {
    attacker: Actor;
    target: Actor;
    weapon: any | null;
    baseDamage: string;
    powerDamage: string;
    passiveDamage: string;
    raises: number;
    availableSpecials: SpecialOption[];
    weaponSpecials: string[];
}
export interface SpecialOption {
    id: string;
    name: string;
    type: 'power' | 'passive' | 'weapon' | 'power-special' | 'npc-combat' | 'npc-raise';
    description: string;
    effect?: string;
    value?: number;
}
export interface DamageResult {
    baseDamage: number;
    powerDamage: number;
    passiveDamage: number;
    raiseDamage: number;
    specialsUsed: string[];
    totalDamage: number;
    /** One line per rolled pool (base / power / passive / each raise d8) for chat */
    rollDetails?: string[];
    /**
     * Evaluated Foundry `Roll` instances (base, power, passive, raise d8s) for chat + 3D dice.
     * Ephemeral — not stored on documents.
     */
    damageChatRolls?: any[];
    /** Natural 8s rolled across all damage dice (drives the 8s-minimum rule). */
    count8s?: number;
    /**
     * Mitigation breakdown once damage has been applied to the target. The
     * attack-roll chat card appends this line so players can see exactly
     * why a hit went through (or got phased/mitigated).
     */
    mitigation?: AppliedDamageSummary;
}
export declare function showDamageDialog(attacker: Actor, target: Actor, weaponId: string | null, selectedPowerId: string | null, raises: number, flags?: any): Promise<DamageResult | null>;
/**
 * Bind damage-card UI (roll, cancel). Safe to call again after chat HTML refresh.
 */
export declare function attachDamageCardHandlers(messageId: string): void;
/**
 * Result of the full defensive pipeline for one strike. Exposed so that the
 * chat card assembly (and split-attack logging) can render a single-line
 * "Raw 14 → Armor 4 → DR 20% → TempHP 3 → 5" summary.
 */
export interface AppliedDamageSummary {
    rawDamage: number;
    armorApplied: number;
    drPercent: number;
    mitigatedDamage: number;
    tempHPAbsorbed: number;
    barDamage: number;
    min8sUsed: boolean;
    /** "Raw X → Armor Y → DR Z% → TempHP A → B". */
    breakdownLine: string;
    /** `true` if the target phased out of the hit entirely. */
    phased: boolean;
    /** `true` if Reaction: Evade raised Evade above the attack total. */
    negatedByEvade?: boolean;
}
/**
 * Apply damage to target actor — full defensive pipeline:
 *   Phasing check (Phase 3) → Armor → DR% → 8s-minimum → Temp-HP → Health bars.
 *
 * `count8s` is the number of natural 8s rolled across all damage dice for
 * this strike; `applyDamageToTarget` uses it to enforce the floor rule
 * ("never below count8s if any 8 was rolled").
 */
/** Exported for AoE secondary hits (power dice only, same mitigation pipeline). */
export declare function applyDamageToTargetFromAoe(target: Actor, damage: number, attacker: Actor, count8s?: number, attackContext?: {
    attackTotal?: number | null;
    evadeTn?: number | null;
}): Promise<AppliedDamageSummary>;
//# sourceMappingURL=damage-dialog.d.ts.map