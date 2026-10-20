/**
 * Region Behavior: Destroyed Faith — Apply Specials
 * Applies a configured Special on TOKEN_ENTER and/or TOKEN_ROUND_END (while inside).
 */
import { type GmEffectMode, type GmEffectSideFilter, type GmEffectTargetRef } from '../combat/gm-effect-service.js';
/** System RegionBehavior subtype (no package prefix — matches system.json documentTypes). */
export declare const APPLY_SPECIAL_BEHAVIOR_TYPE = "applySpecial";
export type RegionSpecialTrigger = 'enter' | 'roundEnd';
export interface ApplySpecialBehaviorSystem {
    specialId?: string;
    value?: number | null;
    sideFilter?: GmEffectSideFilter | string;
    applyOnEnter?: boolean;
    applyOnRoundEnd?: boolean;
    mode?: GmEffectMode | string;
}
/** Pure: whether this trigger should fire given system toggles (default on when undefined). */
export declare function regionSpecialTriggerEnabled(sys: ApplySpecialBehaviorSystem | null | undefined, trigger: RegionSpecialTrigger): boolean;
export declare function regionSpecialPassesSideFilter(disposition: number | undefined, sideFilter: GmEffectSideFilter | string | undefined): boolean;
export declare function gmEffectTargetFromTokenDoc(token: any): GmEffectTargetRef | null;
export declare function buildSpecialChoices(): Record<string, string>;
export declare function createApplySpecialRegionBehaviorType(): any;
export declare function registerApplySpecialRegionBehavior(): boolean;
//# sourceMappingURL=apply-special-behavior.d.ts.map