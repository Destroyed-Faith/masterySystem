/**
 * Threat Zones (Movement v0.9.9.5).
 *
 * A Threat Zone is the area within a creature's current Melee Reach, measured
 * from the edge of its occupied footprint. Entry opens a Reaction window after
 * arrival. Exit opens one before departure. Teleport checks only the two
 * endpoints. Safe Movement and Disengage suppress those windows. Lacerate is a
 * separate Movement Event and is not suppressed.
 */
export type ThreatTraversal = 'path' | 'teleport';
export interface MeterBox {
    left: number;
    top: number;
    right: number;
    bottom: number;
}
export interface GridScale {
    size: number;
    distance: number;
}
export interface PlacedToken {
    id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    disposition?: number;
}
export interface ThreatReactor extends PlacedToken {
    reachMeters: number;
    reactionsRemaining: number;
}
export interface ThreatMove {
    moverId: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    width?: number;
    height?: number;
    disposition?: number;
    traversal: ThreatTraversal;
    /** Safe Movement, Disengage, or Slip. Does not stop Lacerate. */
    protectedFromReactions: boolean;
}
export interface ThreatWindow {
    kind: 'entry' | 'exit';
    reactorId: string;
    when: 'before-update' | 'after-update';
    /** True when the window is not opened (protection or no Reaction left). */
    suppressed: boolean;
    reason?: string;
    /** Path crossed the zone without starting or ending inside it. */
    passThrough: boolean;
}
export interface ThreatPlan {
    windows: ThreatWindow[];
    /** Any actual position change. Safe Movement still counts. */
    movementEvent: boolean;
}
export declare function tokenBox(token: {
    x: number;
    y: number;
    width?: number;
    height?: number;
}, grid?: GridScale): MeterBox;
/** Gap between footprint edges. Overlap is 0. */
export declare function edgeGap(a: MeterBox, b: MeterBox): number;
export declare function insideThreat(gap: number, reachMeters: number): boolean;
export declare function planThreatZoneWindows(move: ThreatMove, reactors: ThreatReactor[], grid?: GridScale): ThreatPlan;
/** Melee Reach used for the Threat Zone: stored reach, else 2 m, plus Growth Form / Transformation Growth. */
export declare function currentMeleeReachMeters(actor: any): number;
export type ThreatOpener = (window: ThreatWindow, reactor: ThreatReactor) => Promise<void> | void;
export declare function setThreatZoneOpener(fn: ThreatOpener | null): void;
export declare function resolveThreatZoneOnTokenChange(tokenDoc: any, change: {
    x?: number;
    y?: number;
}, when: 'before-update' | 'after-update', sceneTokens?: any[]): Promise<ThreatPlan>;
//# sourceMappingURL=threat-zone.d.ts.map