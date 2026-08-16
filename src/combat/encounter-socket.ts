/**
 * Encounter dialogs (passives, stone powers, initiative shop) for the
 * owning player — not only the GM. Combat document writes stay on the GM.
 */

import { PassiveSelectionDialog } from '../sheets/passive-selection-dialog.js';
import { StonePowersDialog } from '../stones/stone-powers-dialog.js';
import {
  ENCOUNTER_SOCKET,
  resolveLiveCombat,
  shouldShowEncounterDialogLocally,
} from './combat-permissions.js';

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

  const { type, combatId, combatantId, actorId, userId, data, finalInitiative, breakdown, round } =
    payload;

  if (userId && userId !== game.user?.id) return;

  const combat = resolveLiveCombat(combatId);
  if (!combat || (combatId && combat.id !== combatId)) return;

  switch (type) {
    case 'openPassiveSelection': {
      const combatant = combat.combatants.get(combatantId);
      if (!combatant?.actor || !shouldShowEncounterDialogLocally(combatant.actor)) return;
      try {
        const { getEncounterSetup } = await import('./encounter-start.js');
        const setup = getEncounterSetup(combat);
        const isLocked = setup.passives[actorId]?.locked === true;
        const outcome = await PassiveSelectionDialog.showForCombatant(combatant, isLocked);
        if (outcome.confirmed) {
          const { handlePassiveSelectionComplete } = await import('./encounter-start.js');
          await handlePassiveSelectionComplete(combat, actorId, {});
        }
      } catch (err) {
        console.error('Mastery System | Error in passive selection', err);
      }
      break;
    }

    case 'passiveSelectionComplete': {
      if (!game.user?.isGM) return;
      const { handlePassiveSelectionComplete } = await import('./encounter-start.js');
      await handlePassiveSelectionComplete(combat, actorId, data);
      break;
    }

    case 'openStonePowers': {
      const combatant = combat.combatants.get(combatantId);
      if (!combatant?.actor || !shouldShowEncounterDialogLocally(combatant.actor)) return;
      try {
        await StonePowersDialog.showForActor(combatant.actor, combatant);
      } catch (err) {
        console.error('Mastery System | Error in stone powers dialog', err);
      }
      game.socket?.emit(ENCOUNTER_SOCKET, {
        type: 'stonePowersComplete',
        combatId: combat.id,
        combatantId,
        round,
      });
      break;
    }

    case 'stonePowersComplete': {
      if (!game.user?.isGM) return;
      const { handleStonePowersComplete } = await import('./stone-powers-flow.js');
      await handleStonePowersComplete(combat, combatantId, Number(round) || combat.round || 1);
      break;
    }

    case 'openInitiativeShop': {
      const combatant = combat.combatants.get(combatantId);
      if (!combatant?.actor || !shouldShowEncounterDialogLocally(combatant.actor)) return;
      try {
        const { InitiativeShopDialog } = await import('./initiative-shop-dialog.js');
        await InitiativeShopDialog.showForCombatant(combatant, breakdown ?? {}, combat);
      } catch (err) {
        console.error('Mastery System | Failed to show Initiative Shop', err);
      }
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
