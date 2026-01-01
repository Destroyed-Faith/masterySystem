/**
 * Divine Clash Manager
 * Handles automation for the Divine Clash board system
 */
import type { DivineClashPhase } from './divine-clash-types.js';
export declare function startDivineClash(): Promise<void>;
/**
 * REVEAL: Reveal attack/defense and move stones to exhausted
 */
export declare function revealDivineClash(): Promise<void>;
/**
 * END ROUND: Regenerate stones based on Mastery Rank
 */
export declare function endRoundDivineClash(): Promise<void>;
/**
 * RESET: Cleanup all Divine Clash tokens, actors, and folders
 */
export declare function resetDivineClash(): Promise<void>;
/**
 * Get current phase
 */
export declare function getDivineClashPhase(): DivineClashPhase | null;
/**
 * Check if current scene is Divine Clash scene
 */
export declare function isDivineClashScene(): boolean;
//# sourceMappingURL=divine-clash.d.ts.map