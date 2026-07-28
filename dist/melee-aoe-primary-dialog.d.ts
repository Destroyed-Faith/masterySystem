/**
 * Melee weapon AoE — pick the primary target (full payload) vs secondary targets (power AoE only).
 */
import type { RadialCombatOption } from './token-radial-menu.js';
export type MeleeAoePrimaryChoice = 'cancelled' | {
    primaryTokenId: string | null;
    /** Burst pool after the ally filter — secondaries must come from this list. */
    effectiveBurstTokenIds: string[];
};
/**
 * Prompt for primary token when multiple hostiles are in the burst.
 * Returns `cancelled` if the user closes without confirming.
 * `primaryTokenId: null` = no primary (all targets take AoE-only damage — no attack roll path).
 *
 * The dialog carries a pre-checked "Exclude allies/players" filter: allied
 * tokens are removed from the primary dropdown AND from the effective burst
 * pool (secondaries). Unchecking re-allows friendly fire.
 */
export declare function promptMeleeAoePrimaryChoice(burstTokenIds: string[], attackerTokenId: string, _option: RadialCombatOption): Promise<MeleeAoePrimaryChoice>;
//# sourceMappingURL=melee-aoe-primary-dialog.d.ts.map