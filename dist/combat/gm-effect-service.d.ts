/**
 * GM effect application service — carousel bulk tools and future Region Behaviors.
 * Does not invent Special formulas; delegates to apply-special-effects / assign-status.
 */
import { type SpecialEffect } from '../utils/special-effects.js';
export type GmEffectMode = 'rules' | 'exact';
export type GmEffectScope = 'selected' | 'allCombatants' | 'allSceneTokens';
export type GmEffectSideFilter = 'all' | 'friendly' | 'neutral' | 'hostile';
export interface GmEffectTargetRef {
    actorId?: string | null;
    tokenId?: string | null;
    combatantId?: string | null;
    name?: string;
    disposition?: number;
}
export interface GmEffectSource {
    name: string;
    uuid: string;
}
export interface GmEffectApplyRequest {
    targets: GmEffectTargetRef[];
    specialId: string;
    value?: number | null;
    mode: GmEffectMode;
    source?: GmEffectSource | null;
    /** Audit label for chat. */
    reason?: string;
    /** Defer token icon / sheet redraw (safe during movement animation). */
    deferVisuals?: boolean;
}
export interface GmEffectTargetResult {
    name: string;
    actorId: string;
    tokenId: string;
    ok: boolean;
    beforeValue: number | null;
    afterValue: number | null;
    notes: string[];
    error?: string;
}
export interface GmEffectOperationResult {
    ok: boolean;
    mode: GmEffectMode;
    specialId: string;
    specialLabel: string;
    results: GmEffectTargetResult[];
    errors: string[];
    undoId: string | null;
}
export declare function dispositionSide(d: number): GmEffectSideFilter;
export declare function matchesSide(disposition: number | undefined, filter: GmEffectSideFilter): boolean;
/** Legal persistent Specials for the GM picker (instants/support excluded except Cleanse). */
export declare function listGmAssignableSpecials(): SpecialEffect[];
export declare function formatSpecialLine(specialId: string, value?: number | null): string;
export declare function resolveGmEffectActor(ref: GmEffectTargetRef): {
    actor: any;
    tokenId: string;
} | null;
export declare function collectTargetsByScope(scope: GmEffectScope, opts?: {
    selected?: GmEffectTargetRef[];
    sideFilter?: GmEffectSideFilter;
    combat?: any;
    scene?: any;
}): GmEffectTargetRef[];
/** Preview expected values before apply (pure; no writes). */
export declare function previewGmEffectApply(req: GmEffectApplyRequest): Array<{
    name: string;
    before: number | null;
    expectedAfter: number | null | string;
    restriction?: string;
}>;
export declare function applyGmEffect(req: GmEffectApplyRequest): Promise<GmEffectOperationResult>;
export declare function removeGmEffect(targets: GmEffectTargetRef[], specialId: string): Promise<GmEffectOperationResult>;
export declare function adjustGmEffect(targets: GmEffectTargetRef[], specialId: string, newValue: number): Promise<GmEffectOperationResult>;
export declare function undoLastGmEffectBulk(): Promise<{
    ok: boolean;
    message: string;
}>;
export declare function peekLastGmEffectUndoId(): string | null;
//# sourceMappingURL=gm-effect-service.d.ts.map