/**
 * Region Behavior: Destroyed Faith — Apply Specials
 *
 * On enter (measured move): TOKEN_MOVE_IN → pause → wait animation → apply → stopMovement
 *   so the token stops at the boundary without sprite/document desync; remaining
 *   Movement Action meters stay usable for a new drag.
 * Non-move enter (create/teleport/behavior activate): TOKEN_ENTER, deferred apply.
 * Round end while inside: TOKEN_ROUND_END.
 */
import { type GmEffectMode, type GmEffectSideFilter, type GmEffectTargetRef } from '../combat/gm-effect-service.js';
/** System RegionBehavior subtype (no package prefix — matches system.json documentTypes). */
export declare const APPLY_SPECIAL_BEHAVIOR_TYPE = "applySpecial";
export declare const REGION_APPLY_PAUSE_KEY = "mastery-applySpecial";
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
/** True when Foundry reports this enter came from measured movement (prefer MOVE_IN). */
export declare function regionEventLooksLikeMeasuredMove(event: any): boolean;
export declare function markRegionMoveInHandled(tokenId: string, regionId: string, at?: number): void;
export declare function wasRegionMoveInRecentlyHandled(tokenId: string, regionId: string, now?: number): boolean;
/** Skip TOKEN_ENTER apply when MOVE_IN already handled this crossing. */
export declare function shouldSkipTokenEnterAfterMoveIn(event: any, regionId: string): boolean;
/** True when this client is the user who triggered the region event (Foundry fires on all users). */
export declare function isRegionEventSelf(event: any): boolean;
export declare function applyFromBehavior(behaviorSystem: ApplySpecialBehaviorSystem, token: any, trigger: RegionSpecialTrigger, reason: string, opts?: {
    deferVisuals?: boolean;
}): Promise<void>;
/** Handle measured move into region: pause → animate → apply → stop (keep rest meters). */
export declare function handleRegionTokenMoveIn(sys: ApplySpecialBehaviorSystem, event: any, regionName: string, regionId: string): Promise<void>;
/** Non-move enter: apply without blocking animation; skip if MOVE_IN already ran. */
export declare function handleRegionTokenEnter(sys: ApplySpecialBehaviorSystem, event: any, regionName: string, regionId: string): Promise<void>;
export declare function createApplySpecialRegionBehaviorType(): any;
export declare function registerApplySpecialRegionBehavior(): boolean;
/** GM socket: player relayed a region apply. */
export declare function handleRegionApplySpecialSocket(payload: any): Promise<void>;
//# sourceMappingURL=apply-special-behavior.d.ts.map