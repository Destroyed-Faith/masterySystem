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
/** Apply a Stealth skill check result to the rolling actor's perception combat state. */
export declare function applyStealthRollResult(actor: any, result: {
    success: boolean;
    raises?: number;
}): Promise<void>;
/** @deprecated Cloak Disruption removed — no-op (attack reveal is handled separately). */
export declare function applyAttackCloakDisruption(_attacker: any): Promise<void>;
/** @deprecated Cloak Disruption removed — movement no longer lowers Invisibility Bonus. */
export declare function applyMovementCloakDisruption(_actor: any, _totalMovedM: number): Promise<void>;
/** New Round: Perception attempts, attack-reveal, and Stealth-spent TN bonus. */
export declare function clearPerceptionUsageForNewRound(): Promise<void>;
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