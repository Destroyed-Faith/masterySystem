/**
 * Combat Initiative Hooks
 * Handles combat start events and shows passive selection overlay
 */

export function initializeCombatHooks(): void {
  console.log('Mastery System | Initializing combat hooks');

  Hooks.on('combatStart', async (combat: Combat) => {
    console.log('Mastery System | Combat started, showing passive selection overlay');
    
    try {
      // Step 1: Show Passive Selection Dialog
      const { PassiveSelectionDialog } = await import('systems/mastery-system/dist/sheets/passive-selection-dialog.js' as any);
      await PassiveSelectionDialog.showForCombat(combat);
      
      // Step 2: Wait a moment for players to finish selecting passives
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Roll initiative for all combatants (NPCs auto, PCs with shop)
      const { rollInitiativeForAllCombatants } = await import('systems/mastery-system/dist/combat/initiative-roll.js' as any);
      await rollInitiativeForAllCombatants(combat);
      
      // Optional: directly after that Turn-Overlay for the first Combatant
      // const { CombatActionOverlay } = await import('systems/mastery-system/dist/sheets/combat-action-overlay.js' as any);
      // await CombatActionOverlay.showForCurrentTurn(combat);
    } catch (error) {
      console.error('Mastery System | Error in combat start sequence', error);
    }
  });
}

