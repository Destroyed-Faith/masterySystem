/**
 * Melee weapon AoE — pick the primary target (full payload) vs secondary targets (power AoE only).
 */
import type { RadialCombatOption } from './token-radial-menu.js';
export type MeleeAoePrimaryChoice = 'cancelled' | {
    primaryTokenId: string | null;
};
/**
 * Prompt for primary token when multiple hostiles are in the burst.
 * Returns `cancelled` if the user closes without confirming.
 * `primaryTokenId: null` = no primary (all targets take AoE-only damage — no attack roll path).
 */
export declare function promptMeleeAoePrimaryChoice(burstTokenIds: string[], _attackerTokenId: string, _option: RadialCombatOption): Promise<MeleeAoePrimaryChoice>;
//# sourceMappingURL=melee-aoe-primary-dialog.d.ts.map