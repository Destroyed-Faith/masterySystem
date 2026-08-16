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

function asTokenArray(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.contents)) return raw.contents;
  if (Array.isArray(raw.placeables)) return raw.placeables;
  if (typeof raw.values === 'function') return Array.from(raw.values());
  return [];
}

function readEncounterToken(token: any, isGM: boolean): SceneEncounterToken | null {
  const doc = token?.document ?? token;
  const actorId = String(doc?.actorId ?? token?.actorId ?? '');
  const actor =
    token?.actor ??
    doc?.actor ??
    (actorId && typeof game !== 'undefined' ? (game as any).actors?.get?.(actorId) : null);
  if (!actor) return null;
  const hidden = doc?.hidden === true || token?.hidden === true;
  if (hidden && !isGM) return null;
  const actorType = String(actor.type ?? '');
  if (actorType !== 'character' && actorType !== 'npc' && actorType !== 'summon') return null;
  const tokenId = String(doc?.id ?? token?.id ?? doc?._id ?? token?._id ?? '');
  if (!tokenId) return null;
  return {
    tokenId,
    actorId: String(actor.id ?? actorId),
    name: String(doc?.name || token?.name || actor.name || '—'),
    img: String(doc?.texture?.src || token?.texture?.src || actor.img || 'icons/svg/mystery-man.svg'),
    actorType,
    isCharacter: actorType === 'character',
    hidden,
  };
}

export function listSceneEncounterTokens(scene?: any): SceneEncounterToken[] {
  const sc =
    scene ??
    (typeof canvas !== 'undefined' ? (canvas as any)?.scene : null) ??
    (typeof game !== 'undefined' ? (game as any).scenes?.active : null);
  const isGM = !!(typeof game !== 'undefined' && game.user?.isGM);
  const seen = new Set<string>();
  const out: SceneEncounterToken[] = [];
  const sources = [asTokenArray(sc?.tokens), asTokenArray(sc?.tokens?.contents)];
  if (!scene && typeof canvas !== 'undefined') {
    sources.push(asTokenArray((canvas as any)?.tokens?.placeables));
  }
  for (const list of sources) {
    for (const token of list) {
      const row = readEncounterToken(token, isGM);
      if (!row || seen.has(row.tokenId)) continue;
      seen.add(row.tokenId);
      out.push(row);
    }
  }
  return out;
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
