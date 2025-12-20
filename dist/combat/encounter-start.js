/**
 * Encounter Start Flow
 * Orchestrates the one-click "Begin Encounter" setup pipeline
 *
 * Flow:
 * 1. GM clicks "Begin Encounter" button
 * 2. For all PC combatants: open passive selection (read-only if already done)
 * 3. After passive selection: open initiative shop, auto-roll, allow shopping
 * 4. For all NPC combatants: auto-roll initiative (roll&keep)
 * 5. Start combat after all PCs confirm initiative
 */
import { PassiveSelectionDialog } from '../sheets/passive-selection-dialog.js';
import { InitiativeShopDialog } from './initiative-shop-dialog.js';
import { rollInitiativeForCombatant } from './initiative-roll.js';
import { CombatCarouselApp } from '../ui/combat-carousel.js';
const SOCKET_NAME = 'system.mastery-system';
/**
 * Get encounter setup state from combat flags
 */
function getEncounterSetup(combat) {
    const flags = combat.flags['mastery-system'] || {};
    const setup = flags.encounterSetup;
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
async function updateEncounterSetup(combat, updates) {
    const current = getEncounterSetup(combat);
    const updated = { ...current, ...updates };
    await combat.setFlag('mastery-system', 'encounterSetup', updated);
}
/**
 * Auto-roll initiative for NPC combatant (roll&keep)
 */
async function rollInitiativeForNPC(combatant) {
    const actor = combatant.actor;
    if (!actor) {
        console.error('Mastery System | Cannot roll initiative for NPC: no actor');
        return;
    }
    // Use existing rollInitiativeForCombatant which already does roll&keep
    const breakdown = await rollInitiativeForCombatant(combatant);
    // Store msInitiativeValue flag
    await combatant.setFlag('mastery-system', 'msInitiativeValue', breakdown.totalInitiative);
    console.log('Mastery System | NPC initiative rolled', {
        actor: actor.name,
        baseInitiative: breakdown.baseInitiative,
        diceTotal: breakdown.diceTotal,
        totalInitiative: breakdown.totalInitiative,
        masteryRank: breakdown.masteryRank
    });
}
/**
 * Handle passive selection completion for a combatant
 */
async function handlePassiveSelectionComplete(combat, actorId, data) {
    const setup = getEncounterSetup(combat);
    // Mark passives as locked for this actor
    setup.passives[actorId] = {
        locked: true,
        data: data || {}
    };
    await updateEncounterSetup(combat, { passives: setup.passives });
    // Notify GM that passives are complete for this actor
    if (!game.user?.isGM) {
        // Player: notify GM via socket
        game.socket?.emit(SOCKET_NAME, {
            type: 'passiveSelectionComplete',
            combatId: combat.id,
            actorId: actorId,
            data: data
        });
    }
}
/**
 * Handle initiative shop confirmation for a combatant
 */
async function handleInitiativeConfirmed(combat, combatantId, finalInitiative) {
    const setup = getEncounterSetup(combat);
    // Mark initiative as confirmed
    setup.initiativeConfirmed[combatantId] = true;
    await updateEncounterSetup(combat, { initiativeConfirmed: setup.initiativeConfirmed });
    console.log('Mastery System | Initiative confirmed', {
        combatantId,
        finalInitiative,
        setup: setup.initiativeConfirmed
    });
    // Check if all PCs have confirmed (only GM can start combat)
    if (game.user?.isGM) {
        const allPCs = Array.from(combat.combatants).filter((c) => c.actor?.type === 'character');
        const allConfirmed = allPCs.length > 0 && allPCs.every((pc) => setup.initiativeConfirmed[pc.id]);
        if (allConfirmed) {
            // All PCs confirmed - re-sort combat by initiative and refresh carousel
            console.log('Mastery System | All PCs confirmed - re-sorting combat by initiative');
            // Ensure combat is sorted by initiative
            // Foundry v13: use setupTurns() to re-sort based on current initiative values
            if (combat.setupTurns) {
                combat.setupTurns();
            }
            else {
                // Fallback: trigger updateCombat which should sort
                await combat.update({ turn: combat.turn ?? 0 });
            }
            // Small delay to ensure combat sorting is complete
            await new Promise(resolve => setTimeout(resolve, 100));
            // Broadcast refresh to all clients
            game.socket?.emit(SOCKET_NAME, {
                type: 'msRefreshCarousel',
                combatId: combat.id
            });
            // Refresh carousel locally
            CombatCarouselApp.refresh();
            // Start combat if not already started
            if (combat.round === 0 && !combat.started) {
                await combat.startCombat();
                console.log('Mastery System | All PCs confirmed initiative - combat started');
                ui.notifications?.info('All players have confirmed initiative. Combat started!');
            }
        }
    }
}
/**
 * Begin encounter flow (called by GM)
 */
export async function beginEncounter(combat) {
    if (!game.user?.isGM) {
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
    console.log('Mastery System | Beginning encounter setup', { combatId: combat.id });
    // Show carousel on all clients (only if not already shown)
    const currentSetup = getEncounterSetup(combat);
    if (!currentSetup.carouselShown) {
        // Show carousel locally for GM
        CombatCarouselApp.open();
        // Broadcast to all clients
        game.socket?.emit(SOCKET_NAME, {
            type: 'msShowCarousel',
            combatId: combat.id
        });
        // Mark as shown
        await updateEncounterSetup(combat, { carouselShown: true });
    }
    // Separate PCs and NPCs
    const pcs = [];
    const npcs = [];
    for (const combatant of combat.combatants) {
        if (!combatant.actor)
            continue;
        if (combatant.actor.type === 'character') {
            pcs.push(combatant);
        }
        else if (combatant.actor.type === 'npc' || combatant.actor.type === 'summon' || combatant.actor.type === 'divine') {
            npcs.push(combatant);
        }
    }
    // Step 1: Open passive selection for all PCs (via socket to owning clients)
    // Also handle GM's own characters locally
    for (const pc of pcs) {
        const actor = pc.actor;
        if (!actor)
            continue;
        // Find owning users
        const owners = (game.users || []).filter((u) => u.isGM || actor.testUserPermission(u, 'OWNER'));
        // Send socket message to each owner
        for (const owner of owners) {
            // If this is the GM and they own the character, handle locally
            if (game.user?.isGM && owner.id === game.user.id) {
                // Handle locally for GM
                const localSetup = getEncounterSetup(combat);
                const isLocked = localSetup.passives[actor.id]?.locked === true;
                try {
                    await PassiveSelectionDialog.showForCombatant(pc, isLocked);
                    await handlePassiveSelectionComplete(combat, actor.id, {});
                    await openInitiativeShopForCombatant(combat, pc);
                }
                catch (err) {
                    console.error('Mastery System | Error in GM passive selection', err);
                }
            }
            else {
                // Send socket message to player
                game.socket?.emit(SOCKET_NAME, {
                    type: 'openPassiveSelection',
                    combatId: combat.id,
                    combatantId: pc.id,
                    actorId: actor.id,
                    userId: owner.id
                });
            }
        }
    }
    // Step 2: Auto-roll initiative for all NPCs
    for (const npc of npcs) {
        await rollInitiativeForNPC(npc);
        // Small delay between rolls
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    // Note: PC initiative shops will be opened after passive selection completes
    // This is handled via socket messages
}
/**
 * Handle socket messages
 */
async function handleSocketMessage(payload) {
    const { type, combatId, combatantId, actorId, userId, data, finalInitiative } = payload;
    // Only process messages intended for this user
    if (userId && userId !== game.user?.id) {
        return;
    }
    const combat = game.combat;
    if (!combat || combat.id !== combatId) {
        return;
    }
    switch (type) {
        case 'openPassiveSelection': {
            // Open passive selection dialog for the specified combatant
            const combatant = combat.combatants.get(combatantId);
            if (!combatant || !combatant.actor)
                return;
            const setup = getEncounterSetup(combat);
            const isLocked = setup.passives[actorId]?.locked === true;
            try {
                await PassiveSelectionDialog.showForCombatant(combatant, isLocked);
                // After passive selection completes, mark as locked and open initiative shop
                await handlePassiveSelectionComplete(combat, actorId, {});
                // Open initiative shop for this combatant
                await openInitiativeShopForCombatant(combat, combatant);
            }
            catch (err) {
                console.error('Mastery System | Error in passive selection', err);
            }
            break;
        }
        case 'passiveSelectionComplete': {
            // GM receives notification that a player completed passive selection
            if (game.user?.isGM) {
                await handlePassiveSelectionComplete(combat, actorId, data);
            }
            break;
        }
        case 'initiativeConfirmed': {
            // GM receives notification that a player confirmed initiative
            if (game.user?.isGM) {
                await handleInitiativeConfirmed(combat, combatantId, finalInitiative);
            }
            break;
        }
        case 'msShowCarousel': {
            // Show carousel on this client
            const currentCombat = game.combat;
            if (currentCombat && currentCombat.id === combatId) {
                CombatCarouselApp.open();
            }
            break;
        }
        case 'msRefreshCarousel': {
            // Refresh carousel on this client
            const currentCombat = game.combat;
            if (currentCombat && currentCombat.id === combatId) {
                CombatCarouselApp.refresh();
            }
            break;
        }
    }
}
/**
 * Open initiative shop for a combatant (after passive selection)
 */
async function openInitiativeShopForCombatant(combat, combatant) {
    const actor = combatant.actor;
    if (!actor)
        return;
    // Check if user owns this actor
    const user = game.user;
    if (!user || (!user.isGM && !actor.isOwner)) {
        return;
    }
    // Auto-roll initiative first
    const breakdown = await rollInitiativeForCombatant(combatant);
    // Show initiative shop (it will handle storing msInitiativeValue and sending socket message)
    await InitiativeShopDialog.showForCombatant(combatant, breakdown, combat);
    // After shop closes, get final initiative and confirm
    // The shop dialog sends a socket message, but if we're the GM, handle locally
    if (game.user?.isGM) {
        const finalInitiative = combatant.initiative ?? breakdown.totalInitiative;
        await handleInitiativeConfirmed(combat, combatant.id, finalInitiative);
    }
    // For players, the socket message will be handled by the GM's socket handler
}
/**
 * Debounce helper for carousel refresh
 */
let carouselRefreshTimeout = null;
function debouncedCarouselRefresh(delay = 150) {
    if (carouselRefreshTimeout !== null) {
        clearTimeout(carouselRefreshTimeout);
    }
    carouselRefreshTimeout = window.setTimeout(() => {
        const combat = game.combat;
        if (!combat)
            return;
        const flags = combat.flags['mastery-system'] || {};
        const setup = flags.encounterSetup;
        // Only refresh if encounter setup has started and carousel is open
        if (setup?.started && CombatCarouselApp.instance && CombatCarouselApp.instance.rendered) {
            CombatCarouselApp.refresh();
        }
        carouselRefreshTimeout = null;
    }, delay);
}
/**
 * Initialize encounter start system
 */
export function initializeEncounterStart() {
    console.log('Mastery System | Initializing encounter start system');
    // Register socket handler
    game.socket?.on(SOCKET_NAME, handleSocketMessage);
    // Hook: Update carousel when combat changes (debounced)
    Hooks.on('updateCombat', (combat) => {
        const flags = combat.flags['mastery-system'] || {};
        const setup = flags.encounterSetup;
        // Only refresh if encounter setup has started
        if (setup?.started) {
            debouncedCarouselRefresh(150);
        }
    });
    // Hook: Update carousel when combatant changes (debounced)
    Hooks.on('updateCombatant', (_combatant, _changes, _options, _userId) => {
        const combat = game.combat;
        if (!combat)
            return;
        const flags = combat.flags['mastery-system'] || {};
        const setup = flags.encounterSetup;
        // Only refresh if encounter setup has started
        if (setup?.started) {
            debouncedCarouselRefresh(150);
        }
    });
    // Cleanup on combat end
    Hooks.on('deleteCombat', () => {
        // Clear any pending refresh
        if (carouselRefreshTimeout !== null) {
            clearTimeout(carouselRefreshTimeout);
            carouselRefreshTimeout = null;
        }
        // Socket cleanup is handled automatically by Foundry
    });
}
//# sourceMappingURL=encounter-start.js.map