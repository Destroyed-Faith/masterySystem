/**
 * Collect Combat Senses granted to an actor and resolve the active Sense Slot.
 */
import type { CombatSenseId } from './combat-senses.js';
export interface CombatSensesData {
    /** Active sense in the Sense Slot (default Normal Combat Awareness). */
    activeSenseId: CombatSenseId;
    /** Special senses granted by Echo / Artifact / Heightened Senses picks. */
    grantedSenseIds: CombatSenseId[];
    /** Additional special senses slotted as normal Passives. */
    passiveSenseIds: CombatSenseId[];
    /** Minor upgrade — augments Normal Awareness in darkness. */
    hasDarkvision?: boolean;
}
export declare const DEFAULT_COMBAT_SENSES: CombatSensesData;
export declare function normalizeCombatSensesData(raw: unknown): CombatSensesData;
/** Scan equipped artifacts / flags for granted special senses. */
export declare function collectGrantedCombatSenses(actor: any): CombatSenseId[];
/** All senses the actor may use (for targeting / perception). */
export declare function listActorCombatSenses(actor: any): CombatSenseId[];
export interface CombatSensesPanelRow {
    id: CombatSenseId;
    label: string;
    rangeM: number;
    /** Checked in UI (manual grant and/or equipped artifact). */
    selected: boolean;
    /** Granted by equipped artifact — display only, not stored on actor.combatSenses.grantedSenseIds. */
    fromArtifact: boolean;
}
export interface CombatSensesPanelContext {
    activeSenseId: CombatSenseId;
    hasDarkvision: boolean;
    slotOptions: Array<{
        id: CombatSenseId;
        label: string;
    }>;
    grantedRows: CombatSensesPanelRow[];
    passiveRows: CombatSensesPanelRow[];
    activeSenseLabel: string;
}
export interface CombatSenseBattleRow {
    id: CombatSenseId;
    label: string;
    rangeM: number;
    summary: string;
    channels: string;
    isActive: boolean;
    /** May be placed in the Sense Slot this combat. */
    isSlotChoice: boolean;
    /** Character has access (granted via sheet, artifact, or always-on default). */
    isGranted: boolean;
    fromArtifact: boolean;
}
export interface CombatSensesBattleAreaContext {
    instruction: string;
    pickOneHint: string;
    activeSenseId: CombatSenseId;
    activeSenseLabel: string;
    hasDarkvision: boolean;
    /** Every sense listed with availability; slot-eligible rows are selectable. */
    senseRows: CombatSenseBattleRow[];
    /** Subset of senseRows that may be chosen in the Sense Slot. */
    slotRows: CombatSenseBattleRow[];
    grantedRows: CombatSensesPanelRow[];
    darkvisionSummary: string;
}
export interface CombatSenseDisplayRow {
    id: CombatSenseId;
    label: string;
    rangeM: number;
    summary: string;
    channels: string;
}
/** Compact battle-sheet display — active sense only (+ darkvision when enabled). */
export interface CombatSensesDisplayContext {
    primary: CombatSenseDisplayRow;
    darkvision: CombatSenseDisplayRow | null;
}
/** Battle sheet + character sheet: full sense list with slot choice emphasis. */
export declare function buildCombatSensesBattleAreaContext(actor: any): CombatSensesBattleAreaContext;
/** Character sheet context for Sense Slot + granted sense picks. */
export declare function buildCombatSensesPanelContext(actor: any): CombatSensesPanelContext;
/** Battle sheet / print: only what the character actually uses in combat. */
export declare function buildCombatSensesDisplayContext(actor: any): CombatSensesDisplayContext;
/** Primary active sense for sense-based rules (Sense Slot contents). */
export declare function getActiveCombatSense(actor: any): CombatSenseId;
export declare function isNonSightCombatSense(senseId: CombatSenseId): boolean;
//# sourceMappingURL=combat-sense-collection.d.ts.map