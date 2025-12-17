/**
 * Combat Initiative Hooks
 * Handles combat start events and shows passive selection overlay
 */
export function initializeCombatHooks() {
    console.log('Mastery System | Initializing combat hooks');
    Hooks.on('combatStart', async (combat) => {
        console.log('Mastery System | Combat started, showing passive selection overlay');
        try {
            // On each client: owners see their Passive Overlay
            const { PassiveSelectionDialog } = await import(new URL('../sheets/passive-selection-dialog.js', import.meta.url).toString());
            await PassiveSelectionDialog.showForCombat(combat);
            // Optional: directly after that Turn-Overlay for the first Combatant
            // const { CombatActionOverlay } = await import(new URL('../sheets/combat-action-overlay.js', import.meta.url).toString());
            // await CombatActionOverlay.showForCurrentTurn(combat);
        }
        catch (error) {
            console.error('Mastery System | Error showing passive selection overlay on combat start', error);
        }
    });
}
//# sourceMappingURL=initiative.js.map