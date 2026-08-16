/**
 * Encounter Start Flow
 * Orchestrates the one-click "Begin Encounter" setup pipeline
 * 
 * Flow:
 * 1. GM clicks "Begin Encounter" button
 * 2. For all PC combatants: open passive selection (read-only if already done)
 * 3. After passive selection: stone powers (round 1), then initiative (dice + Combat Reflexes + shop) for all combatants
 * 4. Start combat after all PCs confirm initiative (via shop confirm)
 */

import { PassiveSelectionDialog } from '../sheets/passive-selection-dialog.js';
import { CombatCarouselApp } from '../ui/combat-carousel.js';
import { openStonePowersForAllCombatants } from './stone-powers-flow.js';
import { syncCombatTurnToHighestInitiativeFirst } from './initiative-roll.js';
import {
  ENCOUNTER_SOCKET,
  canCurrentUserUpdateDocument,
  emitEncounterSocketToPlayerOwners,
  getSimulatePlayerEncounterId,
  resolveLiveCombat,
  setSimulatePlayerEncounter,
  shouldShowEncounterDialogLocally,
} from './combat-permissions.js';

interface EncounterSetupState {
  started: boolean;
  combatId: string;
  passives: Record<string, { locked: boolean; data: any }>;
  initiativeConfirmed: Record<string, boolean>;
  carouselShown: boolean;
}

/**
 * Get encounter setup state from combat flags
 */
export function getEncounterSetup(combat: Combat): EncounterSetupState {
  const flags = combat.flags['mastery-system'] || {};
  const setup = flags.encounterSetup as EncounterSetupState | undefined;
  
  if (!setup || setup.combatId !== combat.id) {
    // Initialize new setup state
    return {
      started: false,
      combatId: combat.id,
      passives: {},
      initiativeConfirmed: {},
      carouselShown: false
    };
  }
  
  return setup;
}

/**
 * Update encounter setup state in combat flags
 */
async function updateEncounterSetup(combat: Combat, updates: Partial<EncounterSetupState>): Promise<void> {
  const live = resolveLiveCombat(combat);
  if (!live || !canCurrentUserUpdateDocument(live)) return;
  const current = getEncounterSetup(live);
  const updated = { ...current, ...updates };
  await live.setFlag('mastery-system', 'encounterSetup', updated);
}

/**
 * Handle passive selection completion for a combatant
 */
export async function handlePassiveSelectionComplete(combat: Combat, actorId: string, data: any): Promise<void> {
  const live = resolveLiveCombat(combat);
  if (!live) return;
  if (!game.user?.isGM && !canCurrentUserUpdateDocument(live)) {
    game.socket?.emit(ENCOUNTER_SOCKET, {
      type: 'passiveSelectionComplete',
      combatId: combat.id,
      actorId,
      data,
    });
    return;
  }
  const setup = getEncounterSetup(live);
  setup.passives[actorId] = {
    locked: true,
    data: data || {},
  };
  await updateEncounterSetup(live, { passives: setup.passives });
}

/**
 * Handle initiative shop confirmation for a combatant
 */
export async function handleInitiativeConfirmed(combat: Combat, combatantId: string, finalInitiative: number): Promise<void> {
  const setup = getEncounterSetup(combat);
  
  // Mark initiative as confirmed
  setup.initiativeConfirmed[combatantId] = true;
  
  if (!game.user?.isGM) {
    game.socket?.emit(ENCOUNTER_SOCKET, {
      type: 'initiativeConfirmed',
      combatId: combat.id,
      combatantId,
      finalInitiative,
    });
    return;
  }

  const live = resolveLiveCombat(combat);
  if (!live) return;
  await updateEncounterSetup(live, { initiativeConfirmed: setup.initiativeConfirmed });
  combat = live;
  // Check if all PCs have confirmed (only GM can start combat)
  if (game.user?.isGM) {
    const allPCs = Array.from(combat.combatants).filter((c: any) => c.actor?.type === 'character');
    const allConfirmed = allPCs.length > 0 && allPCs.every((pc: any) => setup.initiativeConfirmed[pc.id]);
    
    if (allConfirmed) {
      // All PCs confirmed - re-sort combat by initiative and refresh carousel
      // Ensure combat is sorted by initiative
      // Foundry v13: use setupTurns() to re-sort based on current initiative values
      if ((combat as any).setupTurns) {
        (combat as any).setupTurns();
      } else {
        // Fallback: trigger updateCombat which should sort
        await combat.update({ turn: combat.turn ?? 0 });
      }

      await syncCombatTurnToHighestInitiativeFirst(combat);
      // Small delay to ensure combat sorting is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Broadcast refresh to all clients
      game.socket?.emit(ENCOUNTER_SOCKET, {
        type: 'msRefreshCarousel',
        combatId: combat.id
      });
      
      // Refresh carousel locally
      CombatCarouselApp.refresh();
      
      // Start combat if not already started
      if (combat.round === 0 && !combat.started) {
        await combat.startCombat();
        ui.notifications?.info('All players have confirmed initiative. Combat started!');
      }
    }
  }
}

/**
 * Begin encounter flow (called by GM)
 */
export async function beginEncounter(combat: Combat): Promise<void> {
  const canWrite = !!(game.user?.isGM || canCurrentUserUpdateDocument(combat));
  if (!canWrite && !getSimulatePlayerEncounterId()) {
    ui.notifications?.warn('Only the GM can begin an encounter');
    return;
  }

  const setup = getEncounterSetup(combat);
  
  // Check if already started
  if (setup.started || combat.round > 0) {
    ui.notifications?.warn('Encounter already initialized');
    return;
  }

  // Mark as started
  await updateEncounterSetup(combat, { started: true });
  // Show carousel on all clients (only if not already shown)
  const currentSetup = getEncounterSetup(combat);
  if (!currentSetup.carouselShown) {
    // Show carousel locally for GM
    CombatCarouselApp.open();
    
    // Broadcast to all clients
    game.socket?.emit(ENCOUNTER_SOCKET, {
      type: 'msShowCarousel',
      combatId: combat.id
    });
    
    // Mark as shown
    await updateEncounterSetup(combat, { carouselShown: true });
  }

  const pcs: Combatant[] = [];
  for (const combatant of combat.combatants) {
    if (!combatant.actor || combatant.actor.type !== 'character') continue;
    pcs.push(combatant);
  }

  // Notify connected player-owners immediately, then GM handles unowned PCs.
  for (const pc of pcs) {
    const actor = pc.actor;
    if (!actor) continue;
    if (shouldShowEncounterDialogLocally(actor)) continue;
    emitEncounterSocketToPlayerOwners(actor, {
      type: 'openPassiveSelection',
      combatId: combat.id,
      combatantId: pc.id,
      actorId: actor.id,
    });
  }

  for (const pc of pcs) {
    const actor = pc.actor;
    if (!actor || !shouldShowEncounterDialogLocally(actor)) continue;
    const localSetup = getEncounterSetup(combat);
    const isLocked = localSetup.passives[actor.id]?.locked === true;
    try {
      const outcome = await PassiveSelectionDialog.showForCombatant(pc, isLocked);
      if (outcome.confirmed) {
        await handlePassiveSelectionComplete(combat, actor.id, {});
      }
    } catch (err) {
      console.error('Mastery System | Error in GM passive selection', err);
    }
  }

  // Step 2: After all passives are selected, open Stone Powers for all combatants (round 1)
  // This will be triggered when all PCs have completed passive selection
  // We check this in a function that monitors passive completion
  // Don't await - let it run in background
  checkAndOpenStonePowersAfterPassives(combat).catch(err => {
    console.error('Mastery System | Error checking for stone powers after passives', err);
  });
}

/**
 * Check if all passives are done and open Stone Powers (round 1)
 */
async function checkAndOpenStonePowersAfterPassives(combat: Combat): Promise<void> {
  // Wait a bit for all passive selections to complete
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const setup = getEncounterSetup(combat);
  const allPCs = Array.from(combat.combatants).filter((c: any) => c.actor?.type === 'character');
  
  // Check if all PCs have completed passive selection
  const allPassivesDone = allPCs.length > 0 && allPCs.every((pc: any) => {
    const actorId = pc.actor?.id;
    return setup.passives[actorId]?.locked === true;
  });
  
  if (allPassivesDone) {
    // Open Stone Powers for all combatants (round 1)
    // This will automatically open Initiative Shop after all Stone Powers are done
    await openStonePowersForAllCombatants(combat, 1);
  } else {
    // Retry after a delay (in case some players are still selecting)
    setTimeout(() => checkAndOpenStonePowersAfterPassives(combat), 2000);
  }
}

/**
 * Debounce helper for carousel refresh
 */
let carouselRefreshTimeout: number | null = null;

function refreshOpenCharacterSheets(combat: Combat): void {
  for (const combatant of combat.combatants) {
    const actor = combatant.actor as { type?: string; sheet?: { rendered?: boolean; render?: (force?: boolean) => unknown } } | undefined;
    if (!actor || actor.type !== 'character') continue;
    const sheet = actor.sheet;
    if (sheet?.rendered) {
      try {
        void sheet.render?.(false);
      } catch {
        /* best-effort live setup status */
      }
    }
  }
}

function debouncedCarouselRefresh(delay: number = 150): void {
  if (carouselRefreshTimeout !== null) {
    clearTimeout(carouselRefreshTimeout);
  }
  
  carouselRefreshTimeout = window.setTimeout(() => {
    const combat = game.combat;
    if (!combat) return;
    
    const flags = combat.flags['mastery-system'] || {};
    const setup = flags.encounterSetup;
    
    // Only refresh if encounter setup has started and carousel is open
    if (setup?.started && CombatCarouselApp.instance && (CombatCarouselApp.instance as any).rendered) {
      CombatCarouselApp.refresh();
    }
    
    carouselRefreshTimeout = null;
  }, delay);
}

/**
 * Initialize encounter start system
 */
export function initializeEncounterStart(): void {
  // Hook: Update carousel when combat changes (debounced)
  Hooks.on('updateCombat', (combat: Combat, changes: any) => {
    const flags = combat.flags['mastery-system'] || {};
    const setup = flags.encounterSetup;
    
    // Only refresh if encounter setup has started
    if (setup?.started) {
      debouncedCarouselRefresh(150);
    }
    const ms = changes?.flags?.['mastery-system'];
    if (ms?.encounterSetup || ms?.stonePowersState) {
      refreshOpenCharacterSheets(combat);
    }
  });

  // Hook: Update carousel when combatant changes (debounced)
  Hooks.on('updateCombatant', (_combatant: Combatant, changes: any, _options: any, _userId: string) => {
    const combat = game.combat;
    if (!combat) return;
    
    const flags = combat.flags['mastery-system'] || {};
    const setup = flags.encounterSetup;
    
    // Only refresh if encounter setup has started
    if (setup?.started) {
      debouncedCarouselRefresh(150);
    }
    if (changes?.flags?.['mastery-system']) {
      refreshOpenCharacterSheets(combat);
    }
  });

  // Cleanup on combat end
  Hooks.on('deleteCombat', () => {
    // Clear any pending refresh
    if (carouselRefreshTimeout !== null) {
      clearTimeout(carouselRefreshTimeout);
      carouselRefreshTimeout = null;
    }
    setSimulatePlayerEncounter(null);
    // Socket cleanup is handled automatically by Foundry
  });
}
