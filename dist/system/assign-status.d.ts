/**
 * One path for setting a catalog status on a character or NPC.
 *
 * Combat, the sheet, and the carousel read flags first, then `system.statusEffects`.
 * The token status bar reads ActiveEffects. Both have to move together,
 * including when a Special never triggered on its own.
 */
import { type RawStatusEntry } from './active-specials.js';
export interface StatusAddChoice {
    id: string;
    name: string;
    hasValue: boolean;
    img: string;
}
/** Persistent conditions a GM can put on by hand. Instants resolve and vanish. */
export declare function isAssignableStatusId(id: string): boolean;
export declare function listAssignableStatuses(): StatusAddChoice[];
export declare function choiceForStatus(id: string): StatusAddChoice | undefined;
/** Add a missing status, or replace its rank when `value` is given. */
export declare function upsertStatusEntry(list: unknown, statusId: string, value?: number | null): RawStatusEntry[];
export declare function removeStatusById(list: unknown, statusId: string): RawStatusEntry[];
/** Catalog id carried by a token ActiveEffect, ignoring active buffs. */
export declare function statusIdFromEffect(effect: any): string | null;
export declare function tokenHasStatus(actor: any, statusId: string): boolean;
/** Make the token status-bar icons match `system.statusEffects`. */
export declare function syncTokenStatusIcons(actor: any): Promise<void>;
export declare function isMirroringStatusIcons(actor: any): boolean;
export declare function writeTokenStatusJson(token: any, encoded: string): Promise<void>;
export declare function writeActorStatusList(actor: any, list: RawStatusEntry[], extra?: Record<string, unknown>): Promise<void>;
/**
 * Turn a catalog status on or off for this actor.
 * `value` sets the rank when the status is new or when a number is passed.
 */
export declare function setActorCatalogStatus(actor: any, statusId: string, active: boolean, value?: number | null, options?: {
    notify?: boolean;
}): Promise<void>;
/** HUD toggle created or deleted an ActiveEffect — copy that into the sheet list. */
export declare function adoptEffectStatus(actor: any, effect: any, active: boolean): Promise<void>;
/** Dialog: pick a catalog status and optional rank, then write it. */
export declare function openStatusAddDialog(actor: any): Promise<void>;
/** Sheet control: plus next to the Status heading opens the add dialog. */
export declare function bindStatusAddControls(html: {
    find: (sel: string) => any;
}, actor: any): void;
//# sourceMappingURL=assign-status.d.ts.map