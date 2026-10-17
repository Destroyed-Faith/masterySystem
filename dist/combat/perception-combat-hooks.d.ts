/**
 * Combat perception runtime hooks — stealth results, reveal, round/turn cleanup.
 */
import type { CombatSenseId } from './combat-senses.js';
export interface InvisibilityVeilPreset {
    id: string;
    label: string;
    /** Covered senses (basic Invisibility). */
    blockedSenses: CombatSenseId[];
    /** Additional senses covered at higher veil levels. */
    elevatedBlockedSenses?: CombatSenseId[];
}
/** Named veil presets from the Players Guide (Silent Veil, Hollow Veil). */
export declare const INVISIBILITY_VEIL_PRESETS: Record<string, InvisibilityVeilPreset>;
export declare function blockedSensesForVeil(presetId: string, elevated?: boolean): CombatSenseId[];
/** Apply a Stealth skill check result. Final Result becomes the Perception TN. */
export declare function applyStealthRollResult(actor: any, result: {
    success: boolean;
    raises?: number;
    finalResult?: number;
}): Promise<void>;
/** Ordinary Stealth hiding ends. Invisibility is left alone. */
export declare function breakOrdinaryStealth(actor: any, _reason?: string): Promise<void>;
/** @deprecated Cloak Disruption removed — attacking no longer reveals Invisibility. */
export declare function applyAttackCloakDisruption(_attacker: any): Promise<void>;
/** @deprecated Cloak Disruption removed — movement no longer lowers Invisibility Bonus. */
export declare function applyMovementCloakDisruption(_actor: any, _totalMovedM: number): Promise<void>;
/** New Round: Perception attempts and Stealth-spent TN bonus. */
export declare function clearPerceptionUsageForNewRound(combat?: any): Promise<void>;
/**
 * Combat end / new encounter: wipe attempt flags, locate results, stealth spend,
 * and Hidden-from-Stealth — then re-sync Invisibility from powers.
 */
export declare function resetPerceptionForCombatEnd(combat?: any): Promise<void>;
/**
 * Start of this creature's turn: sync Invisibility profile; clear *their*
 * Perception attempt flags so they may try once vs each invisible target again.
 */
export declare function processPerceptionTurnStart(actor: any): Promise<void>;
/** Sync every combatant when combat begins so Passive Invisibility is live immediately. */
export declare function syncAllCombatantInvisibility(combat?: any): Promise<void>;
/** Register Foundry hooks for perception combat bookkeeping. */
export declare function registerPerceptionCombatHooks(): void;
//# sourceMappingURL=perception-combat-hooks.d.ts.map