/**
 * Compact Echo info dialog — ancestry summary + Echo Artifact blurbs.
 * Change Echo reuses the existing creation dialog (without Echo Cards).
 */
export interface EchoInfoDialogResult {
    /** True when the player opened Change Echo from this dialog. */
    changed: boolean;
}
/** Equipped echo-bound artifacts on the actor, with catalog blurbs. */
export declare function listEquippedEchoArtifacts(actor: any): Array<{
    id: string;
    name: string;
    key: string | null;
    description: string;
    slot: string;
}>;
/** Catalog artifacts offered to this Echo (for reference when none equipped yet). */
export declare function listCatalogEchoArtifacts(echoKey: string | null | undefined, subChoiceKey?: string | null): Array<{
    key: string;
    name: string;
    description: string;
    slot: string;
}>;
export declare function buildEchoInfoHtml(actor: any): string;
/**
 * Open the Echo info dialog. Optional Change Echo button opens the picker.
 */
export declare function showEchoInfoDialog(actor: any): Promise<EchoInfoDialogResult>;
//# sourceMappingURL=echo-info-dialog.d.ts.map