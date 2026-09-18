/**
 * Encounter dialogs (passives, stone powers, initiative shop) for the
 * owning player — not only the GM. Combat document writes stay on the GM.
 */

import {
  ENCOUNTER_SOCKET,
  resolveLiveCombat,
  shouldShowEncounterDialogLocally,
} from './combat-permissions.js';
import { isRelayableActorUpdate } from './gm-relay.js';

function requesterMayAdvanceTurn(combat: any, userId: string): boolean {
  const user = game.users?.get?.(userId);
  if (!user) return false;
  if (user.isGM) return true;
  const actor = combat?.combatant?.actor;
  if (!actor || String(actor.type || '') === 'npc') return false;
  if (typeof actor.testUserPermission === 'function') return !!actor.testUserPermission(user, 'OWNER');
  return false;
}

async function applyRelayedActorUpdate(payload: any): Promise<boolean> {
  if (!isRelayableActorUpdate(payload.update)) return false;
  let actor: any = null;
  const uuid = String(payload.tokenActorUuid || '');
  if (uuid && typeof (globalThis as any).fromUuid === 'function') {
    try {
      actor = await (globalThis as any).fromUuid(uuid);
    } catch {
      actor = null;
    }
  }
  if (!actor && payload.actorId) {
    actor = game.actors?.get?.(payload.actorId) ?? null;
  }
  if (!actor || typeof actor.update !== 'function') return false;
  await actor.update(payload.update, payload.options || {});
  return true;
}

let socketRegistered = false;

export function registerEncounterSocket(): void {
  if (socketRegistered) return;
  if (typeof game === 'undefined' || !game.socket) return;
  socketRegistered = true;

  game.socket.on(ENCOUNTER_SOCKET, (payload: any) => {
    void handleEncounterSocket(payload);
  });
}

async function handleEncounterSocket(payload: any): Promise<void> {
  if (!payload || typeof payload !== 'object') return;
  if (payload.action) return;

  const { type, combatId, combatantId, actorId, userId, data, finalInitiative, round } = payload;

  if (type === 'gmRelayResult') {
    if (payload.replyTo && payload.replyTo !== game.user?.id && userId !== game.user?.id) return;
    const { settleGmRelay } = await import('./gm-relay.js');
    settleGmRelay(String(payload.requestId || ''), !!payload.ok);
    return;
  }

  if (type === 'showBlood') {
    if (payload.fromUserId && payload.fromUserId === game.user?.id) return;
    try {
      const { showDamageBloodEffect } = await import('../utils/blood-pool.js');
      const scene = canvas?.scene;
      if (payload.sceneId && scene?.id && payload.sceneId !== scene.id) return;
      const tokenDoc = scene?.tokens?.get?.(payload.tokenId);
      const token = tokenDoc?.object ?? tokenDoc;
      if (!token) return;
      await showDamageBloodEffect(token, {
        barDamage: Number(payload.barDamage) || 0,
        healthLevelLost: !!payload.healthLevelLost,
        bloodColor: payload.bloodColor,
        barMax: payload.barMax,
        skipBroadcast: true,
      });
    } catch (err) {
      console.warn('Mastery System | remote blood FX failed', err);
    }
    return;
  }

  if (type === 'gmActorUpdate' || type === 'gmNextTurn' || type === 'gmDelayInitiative' || type === 'gmSetInitiative') {
    if (!game.user?.isGM) return;
    let ok = false;
    try {
      if (type === 'gmActorUpdate') {
        ok = await applyRelayedActorUpdate(payload);
      } else if (type === 'gmNextTurn') {
        const combat = resolveLiveCombat(payload.combatId);
        if (combat && requesterMayAdvanceTurn(combat, payload.replyTo)) {
          await combat.nextTurn();
          ok = true;
        }
      } else if (type === 'gmDelayInitiative') {
        const combat = resolveLiveCombat(payload.combatId);
        const combatant = combat?.combatants?.get?.(payload.combatantId) ?? combat?.combatant;
        if (
          combat &&
          combatant &&
          requesterMayAdvanceTurn(combat, payload.replyTo) &&
          Number.isFinite(Number(payload.initiative))
        ) {
          await combatant.update({ initiative: Number(payload.initiative) });
          await combat.nextTurn();
          ok = true;
        }
      } else if (type === 'gmSetInitiative') {
        const combat = resolveLiveCombat(payload.combatId);
        const combatant = combat?.combatants?.get?.(payload.combatantId);
        const requester = (game as any).users?.get?.(payload.replyTo);
        const actor = combatant?.actor;
        const owns =
          !!requester &&
          !!actor &&
          (requester.isGM ||
            (typeof actor.testUserPermission === 'function' &&
              actor.testUserPermission(requester, 'OWNER')));
        if (combatant && owns && Number.isFinite(Number(payload.initiative))) {
          await combatant.update({ initiative: Number(payload.initiative) });
          const flags = payload.flags;
          if (flags && typeof flags === 'object') {
            for (const [key, value] of Object.entries(flags as Record<string, unknown>)) {
              if (value == null) await combatant.unsetFlag?.('mastery-system', key);
              else await combatant.setFlag?.('mastery-system', key, value);
            }
          }
          ok = true;
        }
      }
    } catch (err) {
      console.error('Mastery System | GM relay failed', err);
      ok = false;
    }
    game.socket?.emit(ENCOUNTER_SOCKET, {
      type: 'gmRelayResult',
      requestId: payload.requestId,
      ok,
      userId: payload.replyTo,
      replyTo: payload.replyTo,
    });
    return;
  }

  if (userId && userId !== game.user?.id) return;

  if (type === 'playerStartEncounter') {
    if (!game.user?.isGM) return;
    try {
      const { createAndBeginEncounter } = await import('./start-encounter.js');
      await createAndBeginEncounter({
        tokenIds: Array.isArray(payload.tokenIds) ? payload.tokenIds.map(String) : [],
        sceneId: String(payload.sceneId ?? ''),
        openLocally: false,
      });
    } catch (err) {
      console.error('Mastery System | Player Start Encounter failed', err);
    }
    return;
  }

  const combat = resolveLiveCombat(combatId);
  if (!combat || (combatId && combat.id !== combatId)) return;

  switch (type) {
    case 'openPassiveSelection':
    case 'openStonePowers':
    case 'openInitiativeShop': {
      if (!shouldShowEncounterDialogLocally(combat.combatants.get(combatantId)?.actor)) return;
      try {
        const { resumePlayerEncounterSetup } = await import('./player-encounter-setup.js');
        await resumePlayerEncounterSetup(combat);
      } catch (err) {
        console.error('Mastery System | Error resuming player encounter setup', err);
      }
      break;
    }

    case 'passiveSelectionComplete': {
      if (!game.user?.isGM) return;
      const { handlePassiveSelectionComplete } = await import('./encounter-start.js');
      await handlePassiveSelectionComplete(combat, actorId, data);
      break;
    }

    case 'stonePowersComplete': {
      if (!game.user?.isGM) return;
      const { handleStonePowersComplete } = await import('./stone-powers-flow.js');
      await handleStonePowersComplete(combat, combatantId, Number(round) || combat.round || 1);
      break;
    }

    case 'stoneRecoveryComplete': {
      if (!game.user?.isGM) return;
      const { handleStoneRecoveryComplete } = await import('./stone-powers-flow.js');
      await handleStoneRecoveryComplete(combat, combatantId, Number(round) || combat.round || 1);
      break;
    }

    case 'forceEncounterDialog': {
      const combatant = combat.combatants.get(combatantId);
      if (!combatant?.actor || !shouldShowEncounterDialogLocally(combatant.actor)) return;
      try {
        const { openEncounterDialogLocally } = await import('./encounter-setup-status.js');
        await openEncounterDialogLocally(payload.kind, combatant, combat);
      } catch (err) {
        console.error('Mastery System | Forced encounter dialog failed', err);
      }
      break;
    }

    case 'initiativeConfirmed': {
      if (!game.user?.isGM) return;
      const { handleInitiativeConfirmed } = await import('./encounter-start.js');
      await handleInitiativeConfirmed(combat, combatantId, Number(finalInitiative) || 0);
      break;
    }

    case 'msShowCarousel': {
      const { CombatCarouselApp } = await import('../ui/combat-carousel.js');
      CombatCarouselApp.open();
      break;
    }

    case 'msRefreshCarousel': {
      const { CombatCarouselApp } = await import('../ui/combat-carousel.js');
      CombatCarouselApp.refresh();
      break;
    }

    default:
      break;
  }
}
