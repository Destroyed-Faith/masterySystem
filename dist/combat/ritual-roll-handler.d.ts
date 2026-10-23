/**
 * Core Ritual skill-check flow (DF 2026): Base TN = 4 × max(3, Task Level),
 * Final TN = Base + 4 × Paid Raises, Stones Sealed by total Raises (Paid + Free)
 * on the attempt (success or failure).
 */
import { type CoreRitualDefinition } from '../rules/core-rituals.js';
export declare function showRitualRollDialog(actor: Actor, ritualId?: string): Promise<void>;
export interface PerformRitualRollOptions {
    /** Pool attribute rolled (any of the seven). */
    attributeKey: string;
    /** Source / task level (Base TN = 4 × max(3, level)). */
    taskLevel: number;
    /** Free-text description of how the Ritual is performed. */
    approach?: string;
    /** Optional relevant Specialization — contributes Free Raises by Rank. */
    specialization?: {
        id?: string;
        name: string;
        field?: string;
        rank: number;
    } | null;
    /** Named tier 0–4 (Seal Passage Tier 4 = open-passage mode). */
    namedTier: number;
    /** Additional generic Raises beyond the named tier. */
    genericRaises?: number;
    /** Situational TN modifier from the GM. */
    gmMod?: number;
    placedAttrs?: string[];
}
export declare function performRitualRoll(actor: Actor, ritual: CoreRitualDefinition, opts: PerformRitualRollOptions): Promise<void>;
//# sourceMappingURL=ritual-roll-handler.d.ts.map