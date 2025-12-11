/**
 * Radial Menu for Combat Action Selection
 * PIXI-based radial menu that appears on the canvas around tokens
 * Replaces the dialog-based option selection
 */
import { CombatManeuver } from './system/combat-maneuvers';
import type { CombatSlot } from './system/combat-maneuvers';
/**
 * Range category for combat options
 */
export type RangeCategory = 'melee' | 'ranged' | 'self' | 'area';
/**
 * Target group for utility powers
 */
export type TargetGroup = 'self' | 'ally' | 'enemy' | 'creature' | 'any';
/**
 * AoE shape for utility powers
 */
export type AoEShape = 'none' | 'radius' | 'cone' | 'line';
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
    rangeCategory?: RangeCategory;
    meleeReachMeters?: number;
    rangeMeters?: number;
    aoeShape?: AoEShape;
    aoeRadiusMeters?: number;
    defaultTargetGroup?: TargetGroup;
    allowManualTargetSelection?: boolean;
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
export declare function getAllCombatOptionsForActor(actor: any): Promise<RadialCombatOption[]>;
/**
 * Open the radial menu for an actor's token
 */
export declare function openRadialMenuForActor(token: any, allOptions: RadialCombatOption[]): void;
//# sourceMappingURL=token-radial-menu.d.ts.map