/**
 * Who may show encounter dialogs and who may write combat documents.
 */
export declare const ENCOUNTER_SOCKET = "system.mastery-system";
export declare function canCurrentUserUpdateDocument(doc: unknown): boolean;
/** Combat documents are GM-only on the server, even if the client reports ownership. */
export declare function canCurrentUserUpdateCombat(combat: unknown): boolean;
export declare function listActiveUsers(): Array<{
    id: string;
    isGM?: boolean;
    active?: boolean;
}>;
export declare function hasActiveGm(): boolean;
export declare function canCurrentUserCreateCombat(): boolean;
export declare function findConnectedPlayerOwners(actor: Actor | null | undefined): Array<{
    id: string;
    isGM?: boolean;
    active?: boolean;
}>;
export declare function setSimulatePlayerEncounter(combatId: string | null): void;
export declare function getSimulatePlayerEncounterId(): string | null;
/**
 * Auto-show / socket receive: only the owning player.
 * The GM never gets Passives / Stones automatically — they open those
 * with the per-character buttons when they need to intervene.
 */
export declare function shouldShowEncounterDialogLocally(actor: Actor | null | undefined): boolean;
export declare function emitEncounterSocketToPlayerOwners(actor: Actor | null | undefined, payload: Record<string, unknown>): number;
export declare function resolveLiveCombat(combatOrId: Combat | string | null | undefined): Combat | null;
//# sourceMappingURL=combat-permissions.d.ts.map