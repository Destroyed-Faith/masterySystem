/**
 * Keep Combat Carousel (and combatant.name) in sync when a sheet renames an Actor.
 * Temporary verbose logging is on so we can see which step fails in play.
 */

import { CombatCarouselApp } from './combat-carousel.js';
import {
  nameFromUpdateDiff,
  resolveCombatantDisplayName,
  updateDiffHasNameChange,
} from './combat-carousel-helpers.js';

const LOG = 'Mastery System | [CAROUSEL-RENAME]';

/** Flip to false once rename sync is confirmed stable. */
export let CAROUSEL_RENAME_DEBUG = true;

export function setCarouselRenameDebug(on: boolean): void {
  CAROUSEL_RENAME_DEBUG = !!on;
}

export function logCarouselRename(...args: unknown[]): void {
  if (!CAROUSEL_RENAME_DEBUG) return;
  console.log(LOG, ...args);
}

function combatantsList(combat: any): any[] {
  const raw = combat?.combatants;
  if (!raw) return [];
  if (typeof raw.contents !== 'undefined') return Array.from(raw.contents);
  if (typeof raw.values === 'function') return Array.from(raw.values());
  return Array.isArray(raw) ? raw : [];
}

function refreshCarousel(reason: string): void {
  try {
    const carousel = CombatCarouselApp.instance as any;
    const rendered = !!(carousel?.rendered || carousel?.state?.rendered);
    logCarouselRename('refresh', { reason, hasInstance: !!carousel, rendered });
    if (carousel && rendered) {
      void carousel.render({ force: true });
    } else {
      CombatCarouselApp.refresh();
    }
  } catch (err) {
    console.warn(LOG, 'refresh failed', err);
  }
}

function actorMatchesCombatant(actor: any, combatant: any): boolean {
  const actorId = String(actor?.id ?? '');
  const cActorId = String(combatant?.actorId ?? combatant?.actor?.id ?? '');
  if (actorId && cActorId && actorId === cActorId) return true;
  if (combatant?.actor && actor && combatant.actor === actor) return true;
  const tokenId = String(actor?.token?.id ?? actor?.token?.document?.id ?? '');
  const cTokenId = String(combatant?.tokenId ?? combatant?.token?.id ?? '');
  if (tokenId && cTokenId && tokenId === cTokenId) return true;
  return false;
}

/**
 * Push the live Actor name onto matching combatants (+ linked tokens) and re-render.
 */
export async function syncCombatCarouselNamesForActor(
  actor: any,
  reason = 'sync',
): Promise<void> {
  const combat = game.combats?.active;
  const newName = String(actor?.name || '').trim();
  logCarouselRename('syncForActor', {
    reason,
    actorId: actor?.id,
    actorName: newName,
    isToken: !!actor?.isToken,
    isGM: !!game.user?.isGM,
    hasActiveCombat: !!combat,
    combatId: combat?.id,
  });
  if (!combat || !newName) {
    refreshCarousel(`${reason}:no-combat-or-name`);
    return;
  }

  const all = combatantsList(combat);
  const matched = all.filter((c) => actorMatchesCombatant(actor, c));
  logCarouselRename('matched combatants', {
    reason,
    count: matched.length,
    matched: matched.map((c) => ({
      id: c?.id,
      name: c?.name,
      resolved: resolveCombatantDisplayName(c, c?.token, c?.actor),
      tokenId: c?.tokenId ?? c?.token?.id,
      actorId: c?.actorId ?? c?.actor?.id,
      actorLiveName: c?.actor?.name,
      tokenLiveName: c?.token?.name ?? c?.token?.document?.name,
    })),
    all: all.map((c) => ({
      id: c?.id,
      name: c?.name,
      tokenId: c?.tokenId ?? c?.token?.id,
      actorId: c?.actorId ?? c?.actor?.id,
    })),
  });

  if (!matched.length) {
    refreshCarousel(`${reason}:no-match`);
    return;
  }

  if (game.user?.isGM) {
    const combatantUpdates = matched
      .filter((c) => String(c?.name || '').trim() !== newName)
      .map((c) => ({ _id: c.id, name: newName }));
    if (combatantUpdates.length) {
      try {
        logCarouselRename('updateEmbeddedDocuments Combatant', combatantUpdates);
        await combat.updateEmbeddedDocuments('Combatant', combatantUpdates);
      } catch (err) {
        console.warn(LOG, 'combatant rename sync failed', err);
      }
    } else {
      logCarouselRename('combatant name already matches', { newName });
    }

    for (const c of matched) {
      const tokenDoc =
        c?.token?.document ??
        c?.token ??
        (c?.tokenId ? canvas.tokens?.get(c.tokenId)?.document : null);
      if (!tokenDoc || tokenDoc.actorLink === false) continue;
      if (String(tokenDoc.name || '').trim() === newName) continue;
      try {
        logCarouselRename('sync linked token name', {
          tokenId: tokenDoc.id,
          from: tokenDoc.name,
          to: newName,
        });
        await tokenDoc.update({ name: newName });
      } catch (err) {
        console.warn(LOG, 'token rename sync failed', err);
      }
    }
  } else {
    logCarouselRename('non-GM — refresh only (no combatant/token write)');
  }

  refreshCarousel(`${reason}:done`);
}

/** Persist a typed name on the Actor, then sync the carousel. */
export async function applyActorDisplayName(
  actor: any,
  rawName: string,
  reason = 'applyName',
): Promise<void> {
  const newName = String(rawName || '').trim();
  logCarouselRename('applyActorDisplayName', {
    reason,
    actorId: actor?.id,
    from: actor?.name,
    to: newName,
  });
  if (!actor || !newName) return;
  if (String(actor.name || '').trim() !== newName) {
    try {
      await actor.update({ name: newName });
      logCarouselRename('actor.update({ name }) ok', { actorId: actor.id, name: actor.name });
    } catch (err) {
      console.warn(LOG, 'actor.update name failed', err);
      return;
    }
  }
  await syncCombatCarouselNamesForActor(actor, reason);
}

export function registerCombatCarouselRenameHooks(): void {
  Hooks.on('updateToken', (tokenDoc: any, changed: any) => {
    const hasName = updateDiffHasNameChange(changed);
    logCarouselRename('hook updateToken', {
      tokenId: tokenDoc?.id,
      actorId: tokenDoc?.actorId,
      hasNameChange: hasName,
      changedKeys: changed ? Object.keys(changed) : [],
      nameFromDiff: nameFromUpdateDiff(changed, tokenDoc?.name),
      tokenName: tokenDoc?.name,
      actorLink: tokenDoc?.actorLink,
      hasActiveCombat: !!game.combats?.active,
      changed,
    });
    if (!hasName) return;
    const combat = game.combats?.active;
    if (!combat) return;
    const tokenId = String(tokenDoc?.id ?? '');
    const actorId = String(tokenDoc?.actorId ?? tokenDoc?.actor?.id ?? '');
    const newName = nameFromUpdateDiff(changed, tokenDoc?.name);
    if (!newName) return;
    void (async () => {
      if (game.user?.isGM) {
        const matched = combatantsList(combat).filter((c: any) => {
          const cToken = String(c.tokenId ?? c.token?.id ?? '');
          if (cToken && cToken === tokenId) return true;
          const cActor = String(c.actorId ?? c.actor?.id ?? '');
          return !!actorId && !!cActor && cActor === actorId;
        });
        const updates = matched
          .filter((c) => String(c?.name || '').trim() !== newName)
          .map((c) => ({ _id: c.id, name: newName }));
        if (updates.length) {
          try {
            await combat.updateEmbeddedDocuments('Combatant', updates);
          } catch (err) {
            console.warn(LOG, 'combatant rename from token failed', err);
          }
        }
      }
      refreshCarousel('updateToken');
    })();
  });

  Hooks.on('updateActor', (actor: Actor, changed: any) => {
    const hasName = updateDiffHasNameChange(changed);
    logCarouselRename('hook updateActor', {
      actorId: (actor as any)?.id,
      actorName: (actor as any)?.name,
      isToken: !!(actor as any)?.isToken,
      hasNameChange: hasName,
      changedKeys: changed ? Object.keys(changed) : [],
      nameFromDiff: nameFromUpdateDiff(changed, (actor as any)?.name),
      hasActiveCombat: !!game.combats?.active,
      changed,
    });
    if (!hasName) return;
    void syncCombatCarouselNamesForActor(actor, 'updateActor');
  });

  Hooks.on('closeActorSheet', (app: any) => {
    const actor = app?.actor;
    logCarouselRename('hook closeActorSheet', {
      actorId: actor?.id,
      actorName: actor?.name,
      sheetClass: app?.constructor?.name,
    });
    if (!actor) return;
    void syncCombatCarouselNamesForActor(actor, 'closeActorSheet');
  });

  // Expose for console: game.masteryCarouselRenameDebug(false)
  (globalThis as any).game = (globalThis as any).game;
  Hooks.once('ready', () => {
    try {
      (game as any).masteryCarouselRenameDebug = setCarouselRenameDebug;
      (game as any).masterySyncCarouselName = (actor: any) =>
        syncCombatCarouselNamesForActor(actor, 'console');
      logCarouselRename('hooks registered — debug ON (game.masteryCarouselRenameDebug(false) to silence)');
    } catch {
      /* ignore */
    }
  });
}
