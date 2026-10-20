/**
 * Session-time custom mundane items for General Items Storage.
 * Not artifacts — simple gear with name, description, effect text, and an icon.
 */
import { listMundaneItemIconChoices } from './item-icons.js';
import { STORAGE_FOLDER_NAME } from './seed-general-items.js';
export declare const CUSTOM_CATALOG_FLAG = "customCatalogItem";
export { STORAGE_FOLDER_NAME, listMundaneItemIconChoices };
export type CustomCatalogItemInput = {
    name: string;
    description?: string;
    /** Free-text “what it does” — stored alongside description. */
    effect?: string;
    img?: string;
    inventorySize?: string;
    /** Also embed a copy on this actor’s inventory. */
    giveToActor?: any | null;
    /** Write into the world General Items Storage folder (GM). Default true when GM. */
    addToWorldCatalog?: boolean;
};
export declare function isCustomCatalogItem(item: any): boolean;
export declare function listCustomCatalogItemsInStorage(): any[];
/**
 * Create a mundane gear item. GM writes to world catalog; owners can always get
 * an embedded copy on their actor when `giveToActor` is set.
 */
export declare function createCustomCatalogItem(input: CustomCatalogItemInput): Promise<{
    worldItem: any | null;
    actorItem: any | null;
}>;
/** Delete a world catalog item (GM). Prefer custom items; seeded catalog needs confirm. */
export declare function deleteCatalogStorageItem(itemId: string, options?: {
    force?: boolean;
}): Promise<boolean>;
//# sourceMappingURL=custom-catalog-items.d.ts.map