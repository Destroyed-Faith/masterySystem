/**
 * Emergency exit out of an encounter, always reachable for a GM.
 *
 * The regular path is Foundry's End Combat, but it hangs off the carousel and
 * only appears while the carousel considers the encounter healthy. A fight that
 * ends up wedged (stale stone snapshot, a combatant whose actor is gone, flags
 * from an older version) leaves the table with no way out. Deleting the combat
 * document is the one operation that always works, and it fires `deleteCombat`,
 * so the usual cleanup and stone refill still run.
 */
const T = (key, fallback) => game.i18n?.localize?.(key) || fallback;
/**
 * Encounter to shut down. Falls back past `combats.active` on purpose: a combat
 * that is not the active one (wrong scene, leftover from a crash) is exactly the
 * kind that gets stuck and still blocks the table.
 */
export function findShutdownCombat() {
    const g = game;
    return g.combats?.active ?? g.combat ?? g.combats?.contents?.[0] ?? null;
}
async function confirmShutdown(combat) {
    const title = T('MASTERY.combatShutdown.confirmTitle', 'Shut Down Combat');
    const round = Math.max(0, Math.floor(Number(combat?.round) || 0));
    const content = `<p>${T('MASTERY.combatShutdown.confirmContent', 'Ends the fight for everyone. Stone pools refill, Colorless Stones and Temp HP are dropped. Ongoing effects on player characters stay.')}</p><p><strong>${T('MASTERY.combatShutdown.confirmRound', 'Round')} ${round}</strong></p>`;
    const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
    if (typeof DialogV2?.confirm === 'function') {
        return !!(await DialogV2.confirm({ window: { title }, content, modal: true }));
    }
    const DialogCls = globalThis.Dialog;
    if (typeof DialogCls?.confirm === 'function') {
        return !!(await DialogCls.confirm({ title, content }));
    }
    return true;
}
/**
 * Tear the encounter down. Deleting comes first because it cannot be refused;
 * `endCombat()` is only the fallback for the case where a broken document
 * rejects deletion.
 */
export async function shutDownCombat(options = {}) {
    if (!game.user?.isGM) {
        ui.notifications?.warn(T('MASTERY.combatShutdown.gmOnly', 'Only the GM can shut down the combat.'));
        return false;
    }
    const combat = findShutdownCombat();
    if (!combat) {
        ui.notifications?.info(T('MASTERY.combatShutdown.noCombat', 'No combat present.'));
        return false;
    }
    if (options.confirm !== false && !(await confirmShutdown(combat)))
        return false;
    try {
        await combat.delete();
    }
    catch (err) {
        console.warn('Mastery System | Combat delete failed, falling back to endCombat', err);
        try {
            await combat.endCombat?.();
        }
        catch (err2) {
            console.error('Mastery System | Combat shutdown failed', err2);
            ui.notifications?.error(T('MASTERY.combatShutdown.failed', 'Could not shut down the combat — see the console.'));
            return false;
        }
    }
    ui.notifications?.info(T('MASTERY.combatShutdown.done', 'Combat shut down. Stone pools are refilled.'));
    return true;
}
//# sourceMappingURL=combat-shutdown.js.map