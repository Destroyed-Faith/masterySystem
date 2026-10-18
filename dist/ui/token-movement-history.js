/**
 * Foundry V14 draws a TokenRuler trail for `movementHistory` (passed waypoints)
 * in the controlling user's color — often read as dark pink/rose. Mastery uses
 * its own yellow remaining range + green hover line during guided movement, so
 * the core walked-path history is noise: clear it after our moves and never
 * render passed waypoints on the token ruler.
 */
/** Clear Foundry's walked-path history for a token document (best-effort). */
export async function clearTokenMovementHistory(tokenDoc) {
    if (!tokenDoc)
        return;
    try {
        if (typeof tokenDoc.clearMovementHistory === 'function') {
            await tokenDoc.clearMovementHistory();
            return;
        }
    }
    catch (err) {
        console.warn('Mastery System | clearMovementHistory failed', err);
    }
    try {
        // Fallback: drop the history field if the API is unavailable.
        if (Array.isArray(tokenDoc.movementHistory) && tokenDoc.movementHistory.length) {
            await tokenDoc.update?.({ movementHistory: [] }, { diff: false, render: false });
        }
    }
    catch {
        /* ignore */
    }
}
/**
 * Install a TokenRuler that never draws walked-path (passed) segments.
 * Pending / planned drag previews still use core behavior when present.
 * Also clears history after Mastery-authorized position updates.
 */
export function initializeTokenMovementHistoryPolicy() {
    const cfg = globalThis.CONFIG?.Token;
    if (!cfg)
        return;
    const Base = cfg.rulerClass;
    if (!Base || Base.__masteryNoHistoryRuler) {
        /* ruler already wrapped or missing — still register the update hook below */
    }
    else {
        class MasteryTokenRuler extends Base {
            static __masteryNoHistoryRuler = true;
            refresh(data) {
                // Strip history so selecting a token never re-shows the walked trail.
                return super.refresh({
                    ...data,
                    passedWaypoints: [],
                });
            }
        }
        cfg.rulerClass = MasteryTokenRuler;
    }
    const g = globalThis;
    if (g.__masteryMovementHistoryHook)
        return;
    g.__masteryMovementHistoryHook = true;
    Hooks.on('updateToken', (tokenDoc, change, options) => {
        if (change?.x === undefined && change?.y === undefined)
            return;
        // Our guided / forced moves pass showRuler: false or masteryAuthorizedMove.
        if (options?.showRuler === false || options?.masteryAuthorizedMove === true) {
            void clearTokenMovementHistory(tokenDoc);
        }
    });
}
//# sourceMappingURL=token-movement-history.js.map