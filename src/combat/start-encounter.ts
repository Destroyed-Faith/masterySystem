/**
 * Test/player "Start Encounter": pick scene tokens, create combat, run setup.
 * Players emit to the GM; the GM writes the Combat document.
 */

import { ENCOUNTER_SOCKET, setSimulatePlayerEncounter } from './combat-permissions.js';

export interface SceneEncounterToken {
  tokenId: string;
  actorId: string;
  name: string;
  img: string;
  actorType: string;
  isCharacter: boolean;
  hidden: boolean;
}

export function listSceneEncounterTokens(scene?: any): SceneEncounterToken[] {
  const sc =
    scene ??
    (typeof canvas !== 'undefined' ? (canvas as any)?.scene : null) ??
    (typeof game !== 'undefined' ? (game as any).scenes?.active : null);
  const raw = sc?.tokens;
  const tokens: any[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.contents)
      ? raw.contents
      : typeof raw?.values === 'function'
        ? Array.from(raw.values())
        : [];
  const isGM = !!(typeof game !== 'undefined' && game.user?.isGM);
  const out: SceneEncounterToken[] = [];
  for (const token of tokens) {
    const actor = token?.actor;
    if (!actor) continue;
    const hidden = token.hidden === true;
    if (hidden && !isGM) continue;
    const actorType = String(actor.type ?? '');
    if (actorType !== 'character' && actorType !== 'npc' && actorType !== 'summon') continue;
    out.push({
      tokenId: String(token.id ?? token._id ?? ''),
      actorId: String(actor.id ?? token.actorId ?? ''),
      name: String(token.name || actor.name || '—'),
      img: String(token.texture?.src || actor.img || 'icons/svg/mystery-man.svg'),
      actorType,
      isCharacter: actorType === 'character',
      hidden,
    });
  }
  return out.filter((t) => t.tokenId);
}

export async function requestStartEncounter(opts: {
  tokenIds: string[];
  openLocally: boolean;
  sceneId?: string;
}): Promise<void> {
  const tokenIds = [...new Set(opts.tokenIds.map(String).filter(Boolean))];
  if (!tokenIds.length) {
    ui.notifications?.warn(loc('noneSelected', 'Bitte mindestens einen Token anhacken.'));
    return;
  }
  const sceneId =
    opts.sceneId ||
    String((canvas as any)?.scene?.id ?? (game as any).scenes?.active?.id ?? '');
  if (!sceneId) {
    ui.notifications?.warn(loc('noScene', 'Keine aktive Szene.'));
    return;
  }

  if (game.user?.isGM) {
    await createAndBeginEncounter({ tokenIds, sceneId, openLocally: opts.openLocally });
    return;
  }

  const gmOnline = Array.from((game as any).users ?? []).some((u: any) => u?.isGM && u?.active);
  if (!gmOnline) {
    ui.notifications?.warn(loc('needGm', 'Ein SL muss online sein, damit der Kampf angelegt wird.'));
    return;
  }

  game.socket?.emit(ENCOUNTER_SOCKET, {
    type: 'playerStartEncounter',
    sceneId,
    tokenIds,
    requesterId: game.user?.id,
    openLocally: opts.openLocally,
  });
  ui.notifications?.info(loc('sent', 'Start Encounter an den SL geschickt.'));
}

export async function createAndBeginEncounter(opts: {
  tokenIds: string[];
  sceneId: string;
  openLocally: boolean;
}): Promise<Combat | null> {
  if (!game.user?.isGM) return null;
  const scene = (game as any).scenes?.get?.(opts.sceneId);
  if (!scene) {
    ui.notifications?.error(loc('noScene', 'Keine aktive Szene.'));
    return null;
  }

  let combat = game.combat as Combat | null | undefined;
  if (combat && (combat as any).scene?.id && (combat as any).scene.id !== opts.sceneId) {
    combat = null;
  }
  if (!combat) {
    const CombatCls = ((CONFIG as any).Combat?.documentClass ?? (globalThis as any).Combat) as {
      create: (data: Record<string, unknown>) => Promise<Combat>;
    };
    combat = await CombatCls.create({ scene: opts.sceneId });
  }
  if (!combat) return null;

  if (typeof (combat as any).activate === 'function' && !(combat as any).isActive) {
    try {
      await (combat as any).activate();
    } catch {
      /* already active or no permission */
    }
  }

  const existing = new Set(
    Array.from(combat.combatants).map((c: any) => String(c.tokenId ?? '')).filter(Boolean),
  );
  const toAdd: Array<Record<string, string>> = [];
  for (const tokenId of opts.tokenIds) {
    if (existing.has(tokenId)) continue;
    const token = scene.tokens?.get?.(tokenId);
    toAdd.push({
      tokenId,
      actorId: String(token?.actorId ?? token?.actor?.id ?? ''),
      sceneId: opts.sceneId,
    });
  }
  if (toAdd.length) {
    await combat.createEmbeddedDocuments('Combatant', toAdd);
  }

  const live = (game.combats?.get(combat.id) as Combat | undefined) ?? combat;
  if (opts.openLocally) setSimulatePlayerEncounter(live.id);

  const flags = (live.flags as any)?.['mastery-system'] || {};
  const setup = flags.encounterSetup;
  if (setup?.started === true || live.round > 0) {
    ui.notifications?.warn(loc('already', 'Dieser Kampf ist schon gestartet.'));
    return live;
  }

  const { beginEncounter } = await import('./encounter-start.js');
  await beginEncounter(live);
  return live;
}

function loc(key: string, fallback: string): string {
  const full = `MASTERY.startEncounter.${key}`;
  const t = (game as any)?.i18n?.localize?.(full);
  return t && t !== full ? t : fallback;
}
