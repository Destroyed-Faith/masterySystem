/**
 * Encounter setup status (passives / stones / initiative) plus GM force-open.
 */
export type EncounterDialogKind = 'passives' | 'stones' | 'initiative';
export interface EncounterPickRow {
    kind: EncounterDialogKind;
    label: string;
    done: boolean;
    summary: string;
    tooltip: string;
}
export interface EncounterSetupStatus {
    isCharacter: boolean;
    combatantId: string;
    actorId: string;
    rows: EncounterPickRow[];
    canForce: boolean;
}
export declare function buildEncounterSetupStatus(combatant: Combatant, combat?: Combat | null): EncounterSetupStatus | null;
export declare function openEncounterDialogLocally(kind: EncounterDialogKind, combatant: Combatant, combat: Combat): Promise<void>;
export declare function forceEncounterDialog(kind: EncounterDialogKind, combatant: Combatant): Promise<void>;
export declare function forceEncounterDialogForAll(kind: EncounterDialogKind): Promise<void>;
//# sourceMappingURL=encounter-setup-status.d.ts.map