/**
 * Node Editor Dialog
 * Edit a single artifact node's data (kind + type-specific profile).
 */
import type { ArtifactKind, ArtifactWeaponSpecialRef } from '../types/item.js';
declare const BaseDialog: any;
declare function resolveLineageForItem(item: Item): {
    isLineageRoot: boolean;
    lockedBasics: {
        artifactKind: ArtifactKind;
        gearSlot: string;
        weaponType: "melee" | "ranged";
        hands: number;
    };
    lockedInnateList: string[];
    lockedInnateSet: Set<string>;
    lockedSpecialList: ArtifactWeaponSpecialRef[];
    lockedSpecialKeySet: Set<string>;
    depth: number;
    rootArmorType: any;
    rootShieldType: any;
};
export declare class NodeEditor extends BaseDialog {
    private item;
    private _onSaved?;
    constructor(item: Item, options?: {
        onSaved?: () => void | Promise<void>;
    });
    static get defaultOptions(): any;
    /**
     * GM-only tool. Players must never be able to open or edit world artifact
     * node definitions — block the render at the source.
     */
    render(...args: any[]): any;
    getData(options?: any): any;
    activateListeners(html: JQuery): void;
    collectSelectValues(html: JQuery, selectClass: string): string[];
    collectWeaponSpecials(html: JQuery): ArtifactWeaponSpecialRef[];
    mergeInnatesForSave(html: JQuery, lineage: ReturnType<typeof resolveLineageForItem>): string[];
    mergeSpecialsForSave(html: JQuery, lineage: ReturnType<typeof resolveLineageForItem>): ArtifactWeaponSpecialRef[];
    saveNode(html: JQuery): Promise<void>;
}
export {};
//# sourceMappingURL=node-editor.d.ts.map