/**
 * Active Buff activation limit (Core v0.9.9.6): each named Active Buff may be
 * activated once per Combat. Switching during Preparation is only allowed to a
 * Buff whose activation is still unused. Ending a Buff never refunds its use.
 *
 * Ledger: actor flag `activeBuffCombatUses = { combatId, keys }`. A ledger from
 * another Combat counts as empty, so no cleanup is needed for correctness.
 */
export declare const ACTIVE_BUFF_COMBAT_USES_FLAG = "activeBuffCombatUses";
/** Identity of a named Active Buff granted by a Power item. */
export declare function activeBuffUseKey(power: any): string;
/** Identity of a named Active Buff granted by an Artifact function. */
export declare function artifactActiveBuffUseKey(artifactItem: any, option: any): string;
/** Use key for a Preparation-list entry (Power item or synthetic Artifact row). */
export declare function preparationEntryUseKey(entry: any): string;
/** Keys already activated in `combat` (empty for another or no Combat). */
export declare function activeBuffKeysUsedThisCombat(actor: any, combat: any): string[];
export declare function isActiveBuffUsedThisCombat(actor: any, combat: any, key: string): boolean;
export declare function markActiveBuffUsedThisCombat(actor: any, combat: any, key: string): Promise<void>;
export declare function clearActiveBuffCombatUses(actor: any): Promise<void>;
//# sourceMappingURL=active-buff-combat-uses.d.ts.map