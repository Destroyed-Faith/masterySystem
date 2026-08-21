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
 * Auto-show / socket receive: the owning player when they are online.
 * If no player owner is connected, the GM runs the setup for that character
 * (Passives / Stones) so a fight can start without switching users.
 */
export declare function shouldShowEncounterDialogLocally(actor: Actor | null | undefined): boolean;
export declare function emitEncounterSocketToPlayerOwners(actor: Actor | null | undefined, payload: Record<string, unknown>): number;
export declare function resolveLiveCombat(combatOrId: Combat | string | null | undefined): Combat | null;
//# sourceMappingURL=combat-permissions.d.ts.map