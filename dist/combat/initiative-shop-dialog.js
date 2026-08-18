/**
 * Retired. Initiative Shop purchases are gone — Initiative Exchange lives
 * on the Stone Powers dialog (convert Initiative → Temporary Colorless Stones).
 */
export async function showRetiredInitiativeShop(combatant) {
    const actor = combatant.actor;
    if (!actor)
        return false;
    const { StonePowersDialog } = await import('../stones/stone-powers-dialog.js');
    return StonePowersDialog.showForActor(actor, combatant);
}
//# sourceMappingURL=initiative-shop-dialog.js.map