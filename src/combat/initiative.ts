/**
 * Combat Initiative Hooks
 * Handles combat start events and shows passive selection overlay
 */

export function initializeCombatHooks(): void {
  console.log('Mastery System | Initializing combat hooks');

  Hooks.on('combatStart', async (combat: Combat) => {
    console.log('Mastery System | Combat started, showing passive selection overlay');
    
    try {
      // On each client: owners see their Passive Overlay
      const { PassiveSelectionDialog } = await import('systems/mastery-system/dist/sheets/passive-selection-dialog.js' as any);
      await PassiveSelectionDialog.showForCombat(combat);
      
      // Optional: directly after that Turn-Overlay for the first Combatant
      // const { CombatActionOverlay } = await import('systems/mastery-system/dist/sheets/combat-action-overlay.js' as any);
      // await CombatActionOverlay.showForCurrentTurn(combat);
    } catch (error) {
      console.error('Mastery System | Error showing passive selection overlay on combat start', error);
    }
  });
}

