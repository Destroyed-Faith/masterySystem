/**
 * Radial Menu for Combat Action Selection
 * PIXI-based radial menu that appears on the canvas around tokens
 * Replaces the dialog-based option selection
 *
 * This file is the main entry point. The implementation is split into modules:
 * - radial-menu/types.ts: Types, interfaces, and constants
 * - radial-menu/options.ts: Option collection and parsing
 * - radial-menu/range-preview.ts: Range preview and hex highlighting
 * - radial-menu/info-panel.ts: Info panel display
 * - radial-menu/rendering.ts: Rendering functions (slices, rings, segments)
 */
import type { RadialCombatOption } from './radial-menu/types';
import { getAllCombatOptionsForActor } from './radial-menu/options';
export { getAllCombatOptionsForActor };
export type { RadialCombatOption, InnerSegment, TargetGroup, AoEShape } from './radial-menu/types';
/**
 * Close the radial menu and clean up
 */
export declare function closeRadialMenu(): void;
/**
 * Open the radial menu for an actor's token
 */
export declare function openRadialMenuForActor(token: any, allOptions: RadialCombatOption[]): void;
//# sourceMappingURL=token-radial-menu.d.ts.map