/**
 * Canonical Stone Powers Definition
 *
 * Single authoritative source for all stone powers in the Mastery System.
 * Powers are organized by attribute, with generic powers available to all.
 */
import { type AttributeKey } from '../combat/action-economy.js';
export interface StonePower {
    id: string;
    name: string;
    attribute: AttributeKey | 'generic';
    category: 'action' | 'passive' | 'reaction';
    description: string;
    effect: string;
    apply: (actor: Actor, combatant: Combatant) => Promise<void>;
}
/**
 * Combined registry of all stone powers
 * Organized by attribute for easy lookup
 */
export declare const STONE_POWERS: Record<string, StonePower>;
/**
 * Organized by attribute for UI display
 */
export declare const STONE_POWERS_BY_ATTRIBUTE: Record<AttributeKey | 'generic', StonePower[]>;
//# sourceMappingURL=stone-powers.d.ts.map