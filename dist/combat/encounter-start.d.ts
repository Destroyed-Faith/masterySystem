/**
 * Encounter Start Flow
 * Orchestrates the one-click "Begin Encounter" setup pipeline
 *
 * Flow:
 * 1. GM clicks "Begin Encounter" button
 * 2. For all PC combatants: open passive selection (read-only if already done)
 * 3. After passive selection: stone powers (round 1), then initiative (dice + Combat Reflexes + shop) for all combatants
 * 4. Start combat after all PCs confirm initiative (via shop confirm)
 */
/**
 * Begin encounter flow (called by GM)
 */
export declare function beginEncounter(combat: Combat): Promise<void>;
/**
 * Initialize encounter start system
 */
export declare function initializeEncounterStart(): void;
//# sourceMappingURL=encounter-start.d.ts.map