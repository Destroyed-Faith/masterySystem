/**
 * Radial Menu for Combat Action Selection
 * PIXI-based radial menu that appears on the canvas around tokens
 * Replaces the dialog-based option selection
 */
import { CombatManeuver } from './system/combat-maneuvers';
import type { CombatSlot } from './system/combat-maneuvers';
/**
 * Combat option interface for the radial menu
 */
export interface RadialCombatOption {
    id: string;
    name: string;
    description: string;
    slot: CombatSlot;
    source: 'power' | 'maneuver';
    range?: number;
    item?: any;
    maneuver?: CombatManeuver;
    powerType?: string;
    tags?: string[];
}
/**
 * Close the radial menu and clean up
 */
export declare function closeRadialMenu(): void;
/**
 * Get all combat options for an actor (all categories)
 * Collects all Powers and Maneuvers available to the actor
 */
export declare function getAllCombatOptionsForActor(actor: any): RadialCombatOption[];
/**
 * Open the radial menu for an actor's token
 */
export declare function openRadialMenuForActor(token: any, allOptions: RadialCombatOption[]): void;
//# sourceMappingURL=token-radial-menu.d.ts.map