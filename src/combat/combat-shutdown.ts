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

const T = (key: string, fallback: string): string =>
  (game as any).i18n?.localize?.(key) || fallback;

/**
 * Encounter to shut down. Falls back past `combats.active` on purpose: a combat
 * that is not the active one (wrong scene, leftover from a crash) is exactly the
 * kind that gets stuck and still blocks the table.
 */
export function findShutdownCombat(): any | null {
  const g = game as any;
  return g.combats?.active ?? g.combat ?? g.combats?.contents?.[0] ?? null;
}

async function confirmShutdown(combat: any): Promise<boolean> {
  const title = T('MASTERY.combatShutdown.confirmTitle', 'Kampf abbrechen');
  const round = Math.max(0, Math.floor(Number(combat?.round) || 0));
  const content = `<p>${T(
    'MASTERY.combatShutdown.confirmContent',
    'Beendet den Kampf für alle. Steinpools werden aufgefüllt, farblose Steine und Temp HP entfernt. Laufende Effekte der Spielercharaktere bleiben.',
  )}</p><p><strong>${T('MASTERY.combatShutdown.confirmRound', 'Runde')} ${round}</strong></p>`;

  const DialogV2 = (globalThis as any).foundry?.applications?.api?.DialogV2;
  if (typeof DialogV2?.confirm === 'function') {
    return !!(await DialogV2.confirm({ window: { title }, content, modal: true }));
  }
  const DialogCls = (globalThis as any).Dialog;
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
export async function shutDownCombat(options: { confirm?: boolean } = {}): Promise<boolean> {
  if (!game.user?.isGM) {
    ui.notifications?.warn(
      T('MASTERY.combatShutdown.gmOnly', 'Nur der SL kann den Kampf abbrechen.'),
    );
    return false;
  }

  const combat = findShutdownCombat();
  if (!combat) {
    ui.notifications?.info(T('MASTERY.combatShutdown.noCombat', 'Kein Kampf vorhanden.'));
    return false;
  }

  if (options.confirm !== false && !(await confirmShutdown(combat))) return false;

  try {
    await combat.delete();
  } catch (err) {
    console.warn('Mastery System | Combat delete failed, falling back to endCombat', err);
    try {
      await combat.endCombat?.();
    } catch (err2) {
      console.error('Mastery System | Combat shutdown failed', err2);
      ui.notifications?.error(
        T('MASTERY.combatShutdown.failed', 'Kampf konnte nicht abgebrochen werden — siehe Konsole.'),
      );
      return false;
    }
  }

  ui.notifications?.info(
    T('MASTERY.combatShutdown.done', 'Kampf abgebrochen. Steine sind wieder aufgefüllt.'),
  );
  return true;
}
