/**
 * Post-combat cleanup that runs on `combatEnd` / `deleteCombat`.
 *
 * Encounter-scoped resources always go away:
 *   - Temporary HP (sourced pools are cleared by `passive-triggers`; the scalar
 *     mirror is zeroed here so stone-granted / manual Temp HP cannot survive).
 *   - Leftover Initiative Colorless Stones (used or unused). Item-granted
 *     Colorless Stones stay and follow that item's own combat rule.
 *
 * Ongoing Special Effects are wiped from every combatant when the fight
 * ends — PCs and NPCs. Leftover stacks on the sheet were too noisy, and
 * leftover NPC tokens (dead or not) must not keep Mark / Slow / etc.
 */
/** Zero the Temp HP mirror on every combatant — Temp HP never outlives a fight. */
export declare function resetTempHpAfterCombat(combat: any): Promise<void>;
/** Leftover Initiative Colorless Stones vanish when the encounter ends. */
export declare function clearColorlessStonesAfterCombat(combat: any): Promise<void>;
/** No-GM / player client: drop leftover Initiative stones on owned actors only. */
export declare function clearOwnedInitiativeColorlessAfterCombat(combat: any): Promise<void>;
/**
 * Drop ongoing Special Effects from everyone who was in the fight.
 * Mastery active buffs are still NPC-only — those are slotted powers, not Stati.
 */
export declare function clearNpcOngoingEffectsAfterCombat(combat: any): Promise<void>;
/**
 * Fresh encounter: drop leftover Initiative Colorless Stones from a fight
 * that ended without cleanup (crash, no GM online). Item-granted stones stay.
 * A stale stone assignment snapshot would otherwise reappear in the dialog.
 *
 * Runs at encounter preparation, never at `combatStart` — round-1 stones are
 * bought during the prepare phase and must survive.
 */
export declare function clearStaleStoneStateBeforeEncounter(combat: any): Promise<void>;
/** Single entry point for the `combatEnd` / `deleteCombat` hooks (GM only). */
export declare function runCombatEndCleanup(combat: any): Promise<void>;
//# sourceMappingURL=combat-end-cleanup.d.ts.map