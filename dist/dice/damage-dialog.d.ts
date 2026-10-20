/**
 * Damage Dialog for Mastery System
 * Appears after successful attack roll to calculate and apply damage
 */
import { type DeclaredRaise } from '../combat/raise-resolution.js';
export declare function rememberSharedRaiseAllocation(key: string, plan: DeclaredRaise[]): void;
export declare function peekSharedRaiseAllocation(key: string): DeclaredRaise[] | null;
export { computeMarkFloorBonus, clampMarkSpend, listUsefulMarkSpends } from './mark-floor.js';
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
    /** Overflow from the per-Round Diminishing Special application limit. */
    applicationLimitNotes?: string[];
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
    /**
     * When true, dice were rolled but HP was not applied yet — the caller
     * posts the damage chat, runs the Reaction Window, then applies.
     */
    pendingApply?: boolean;
    /** Attack total / Evade TN / per-hit riders carried for the deferred apply path. */
    attackContext?: {
        attackTotal?: number | null;
        evadeTn?: number | null;
        /** Armor Penetration collected for THIS hit (Specials + stones). */
        armorPenetration?: number;
    };
    /**
     * Faith Keep and/or Mark spend already posted this chat message as the
     * damage card. Caller should update it instead of creating a second one.
     */
    prePostedChatMessageId?: string;
}
export declare function showDamageDialog(attacker: Actor, target: Actor, weaponId: string | null, selectedPowerId: string | null, raises: number, flags?: any): Promise<DamageResult | null>;
/**
 * Bind damage-card UI (roll, cancel). Safe to call again after chat HTML refresh.
 */
export declare function attachDamageCardHandlers(messageId: string): void;
import { applyWardToIncomingSpecial, getIncomingWardTotal } from '../combat/apply-special-effects.js';
export { applyWardToIncomingSpecial, getIncomingWardTotal };
/**
 * Result of the full defensive pipeline for one strike. Exposed so that the
 * chat card assembly (and split-attack logging) can render a single-line
 * "Raw 14 → Armor 4 → DR 20% → TempHP 3 → 5" summary.
 */
export interface AppliedDamageSummary {
    rawDamage: number;
    armorApplied: number;
    /** Guard / reaction Armor portion of `armorApplied` (0 when none). */
    reactionArmorApplied?: number;
    drPercent: number;
    mitigatedDamage: number;
    tempHPAbsorbed: number;
    barDamage: number;
    min8sUsed: boolean;
    /** "Raw X → Armor Y → Guard +Z → DR% → TempHP A → B". */
    breakdownLine: string;
    /** `true` if the target phased out of the hit entirely. */
    phased: boolean;
    /** `true` if Reaction: Evade raised Evade above the attack total. */
    negatedByEvade?: boolean;
    /** HP restored to the attacker by Damage Transfer for this instance. */
    transferHealing?: number;
}
/**
 * Apply damage to target actor — full defensive pipeline:
 *   Phasing check (Phase 3) → Armor → DR% → 8s-minimum → Temp-HP → Health bars.
 *
 * `count8s` is the number of natural 8s rolled across all damage dice for
 * this strike; `applyDamageToTarget` uses it to enforce the floor rule
 * ("never below count8s if any 8 was rolled").
 */
export interface ApplyDamageOptions {
    attackTotal?: number | null;
    evadeTn?: number | null;
    /**
     * When set, skip the Reaction Window prompt and use this mitigation
     * (collected earlier via the interactive chat card).
     */
    reactionMitigation?: import('../combat/defender-reactions.js').DefenderReactionMitigation;
    /** Skip the Reaction Window entirely (empty mitigation). */
    skipReactionPrompt?: boolean;
    /** Phasing already resolved by the caller — do not prompt again. */
    skipPhasing?: boolean;
    /**
     * Armor Penetration for THIS hit (Penetration(X) Specials, Might
     * Ignore-Armor stones). Reduces the target's Armor before subtraction.
     */
    armorPenetration?: number;
    /** This strike is a Damage Transfer power. Healing follows real HP lost. */
    damageTransfer?: boolean;
    /** Stable id for this damage instance. A second event with the same id does not heal again. */
    damageInstanceId?: string | null;
    /** Explicit miss. Damage Transfer does not heal, and no bars are written. */
    attackSucceeded?: boolean;
}
/** Exported for AoE secondary hits (power dice only, same mitigation pipeline). */
export declare function applyDamageToTargetFromAoe(target: Actor, damage: number, attacker: Actor, count8s?: number, attackContext?: ApplyDamageOptions): Promise<AppliedDamageSummary>;
/** Full defensive pipeline (phasing → reactions → armor/DR → temp HP → bars). */
export declare function applyDamageToTarget(target: Actor, damage: number, attacker: Actor, count8s?: number, attackContext?: ApplyDamageOptions): Promise<AppliedDamageSummary>;
/**
 * Calculate damage result from selections
 */
export declare function calculateDamageResult(baseDamage: string, powerDamage: string, passiveDamage: string, raises: number, raiseSelections: Map<number, {
    type: 'special' | 'damage';
    value: string;
}>, availableSpecials: SpecialOption[], attacker: Actor, target: Actor, stoneDamageBonusDice?: number, npcAutoDamageDice?: number, npcAutoSpecialStrings?: string[], selectedPowerId?: string | null, splitAttack?: boolean, attackType?: 'melee' | 'ranged', 
/**
 * Offer a Faith Fracture damage reroll after rolling, before applying.
 * The reroll recursion passes `false` — any roll may be rerolled at most once.
 */
allowFaithReroll?: boolean, attackContext?: {
    attackTotal?: number | null;
    evadeTn?: number | null;
    armorPenetration?: number;
}, 
/**
 * When true, roll dice + status effects but do not apply HP yet.
 * Caller posts damage chat → Reaction Window → `applyDamageToTarget`.
 */
skipApply?: boolean, 
/**
 * Phasing was already offered for this strike (e.g. Faith-Fracture reroll
 * recursion) — do not prompt again.
 */
skipPhasingPrompt?: boolean): Promise<DamageResult>;
/**
 * After HP is applied for a hit, open Push/Pull destination picking when the
 * specials list includes Push(X) / Pull(X). Safe no-op when metres are 0.
 */
export declare function resolveForcedMovementAfterDamage(attacker: Actor | null | undefined, target: Actor | null | undefined, specialsUsed: readonly string[] | null | undefined, labelPrefix?: string): Promise<void>;
//# sourceMappingURL=damage-dialog.d.ts.map