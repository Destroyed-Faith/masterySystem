/**
 * Token Action Selector for Mastery System
 * Adds a custom icon to Token HUD for selecting action category
 * Enforces movement restrictions based on selected action
 *
 * Uses a PIXI-based radial menu for visual option selection
 */
import type { RadialCombatOption } from './token-radial-menu';
/**
 * Initialize token action selector hooks
 */
export declare function initializeTokenActionSelector(): void;
/**
 * Handle the chosen combat option
 * Can trigger rolls, chat cards, or other mechanics based on the selection
 * Made available globally so the radial menu can call it
 * @param token - The token that selected the option
 * @param option - The chosen option (power or maneuver)
 */
export declare function handleChosenCombatOption(token: any, option: RadialCombatOption): void;
//# sourceMappingURL=token-action-selector.d.ts.map