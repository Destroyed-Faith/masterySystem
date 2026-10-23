/**
 * Scene-control entry point for Echo Imprints: resolves "my" character and
 * opens the Echo Imprints dialog (pick + use-to-chat).
 */

/** Assigned character, else a controlled character token, else the first owned character. */
export function resolveEchoImprintsActor(): any | null {
  const g = globalThis as any;
  const user = g.game?.user;
  if (!user) return null;

  const assigned = user.character;
  if (assigned && String(assigned.type || '') === 'character') return assigned;

  const controlled: any[] = g.canvas?.tokens?.controlled ?? [];
  for (const token of controlled) {
    const actor = token?.actor;
    if (actor && String(actor.type || '') === 'character') return actor;
  }

  for (const actor of g.game?.actors ?? []) {
    if (String(actor?.type || '') !== 'character') continue;
    if (actor?.isOwner || actor?.testUserPermission?.(user, 'OWNER')) return actor;
  }
  return null;
}

export async function showEchoImprintsFromMenu(): Promise<void> {
  const ui = (globalThis as any).ui;
  const actor = resolveEchoImprintsActor();
  if (!actor) {
    if ((globalThis as any).game?.user?.isGM) {
      ui?.notifications?.info(
        'Echo Imprints: select a character token (or assign a character to your user) first.',
      );
    } else {
      ui?.notifications?.warn('No owned character found for Echo Imprints.');
    }
    return;
  }
  const { showEchoImprintsDialog } = await import('../sheets/echo-imprints-dialog.js');
  await showEchoImprintsDialog(actor);
}
