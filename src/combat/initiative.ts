/**
 * Combat Initiative Hooks
 * Handles combat start events, per-round initiative re-rolling,
 * and passive selection overlay.
 */

export function initializeCombatHooks(): void {
  console.log('Mastery System | Initializing combat hooks');

  Hooks.on('combatStart', async (combat: Combat) => {
    console.log('Mastery System | Combat started, showing passive selection overlay');
    
    try {
      const { PassiveSelectionDialog } = await import('systems/mastery-system/dist/sheets/passive-selection-dialog.js' as any);
      await PassiveSelectionDialog.showForCombat(combat);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { rollInitiativeForAllCombatants } = await import('systems/mastery-system/dist/combat/initiative-roll.js' as any);
      await rollInitiativeForAllCombatants(combat);
    } catch (error) {
      console.error('Mastery System | Error in combat start sequence', error);
    }
  });

  // Per-round initiative: re-roll initiative at the start of each new round
  Hooks.on('combatRound', async (combat: Combat, _updateData: any, _updateOptions: any) => {
    console.log('Mastery System | New combat round, re-rolling initiative for all combatants');
    
    try {
      const { rollInitiativeForAllCombatants } = await import('systems/mastery-system/dist/combat/initiative-roll.js' as any);
      await rollInitiativeForAllCombatants(combat);
    } catch (error) {
      console.error('Mastery System | Error re-rolling per-round initiative', error);
    }
  });
}

