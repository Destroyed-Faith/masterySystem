/**
 * Foundry V14 draws a TokenRuler trail for `movementHistory` (passed waypoints)
 * in the controlling user's color — often read as dark pink/rose. Mastery uses
 * its own yellow remaining range + green hover line during guided movement, so
 * the core walked-path history is noise: clear it after our moves and never
 * render passed waypoints on the token ruler.
 */
/** Clear Foundry's walked-path history for a token document (best-effort). */
export declare function clearTokenMovementHistory(tokenDoc: any): Promise<void>;
/**
 * Install a TokenRuler that never draws walked-path (passed) segments.
 * Pending / planned drag previews still use core behavior when present.
 * Also clears history after Mastery-authorized position updates.
 */
export declare function initializeTokenMovementHistoryPolicy(): void;
//# sourceMappingURL=token-movement-history.d.ts.map