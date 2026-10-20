/**
 * Dialog: create a mundane custom item (gear) for General Items Storage / actor.
 */
export type CustomCatalogDialogOptions = {
    actor?: any | null;
    onCreated?: () => void | Promise<void>;
};
/**
 * Open a simple create dialog: name, description, effect, icon grid.
 */
export declare function openCustomCatalogItemDialog(options?: CustomCatalogDialogOptions): Promise<void>;
//# sourceMappingURL=custom-catalog-item-dialog.d.ts.map