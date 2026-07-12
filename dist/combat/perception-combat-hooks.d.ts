/**
 * Combat perception runtime hooks — stealth results, cloak disruption, round/turn cleanup.
 */
import type { CombatSenseId } from './combat-senses.js';
export interface InvisibilityVeilPreset {
    id: string;
    label: string;
    /** Base blocked senses (basic Invisibility). */
    blockedSenses: CombatSenseId[];
    /** Additional senses blocked at higher veil levels. */
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
/** Cloak Disruption reductions per rules table. */
export declare function applyAttackCloakDisruption(attacker: any): Promise<void>;
export declare function applyMovementCloakDisruption(actor: any, totalMovedM: number): Promise<void>;
/** One Perception check per hidden/invisible target per round — reset on new round. */
export declare function clearPerceptionUsageForNewRound(): Promise<void>;
/** Restore current Invisibility Bonus at the start of the creature's turn. */
export declare function processPerceptionTurnStart(actor: any): Promise<void>;
/** Register Foundry hooks for perception combat bookkeeping. */
export declare function registerPerceptionCombatHooks(): void;
//# sourceMappingURL=perception-combat-hooks.d.ts.map