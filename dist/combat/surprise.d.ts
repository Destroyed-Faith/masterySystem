/**
 * Surprise status marks a creature as unaware for contests.
 * Round-1 Surprise Priority is a separate flag and does not change Initiative.
 */
export declare const SURPRISE_STATUS_ID = "surprise";
/** True when an ActiveEffect / status document is the Surprise condition. */
export declare function effectCarriesSurprise(effect: any): boolean;
export declare function statusListHasSurprise(raw: unknown): boolean;
/** Token HUD (`actor.statuses` / effects) or the sheet `system.statusEffects` list. */
export declare function actorHasSurprise(actor: any): boolean;
/**
 * The old Surprise status halved Evade. Core v0.9.9.5 does not.
 * The score passes through. `surprised` stays in the signature so older callers compile.
 */
export declare function evadeAfterSurprise(evade: number, _surprised: boolean): number;
export declare function combatantsForActor(combat: any, actor: any): any[];
/**
 * Surprise Priority (Core v0.9.9.5): during Round 1 this creature acts before
 * combatants without the flag. The Initiative Score itself is not changed.
 */
/** Round 1, or before combat has started, and only against an unaware target. */
export declare function surprisePriorityShouldGrant(opts: {
    combatStarted: boolean;
    round: number;
    targetUnaware: boolean;
}): boolean;
/** Attack against an unaware creature at the start of a fight. Initiative numbers stay put. */
export declare function applySurprisePriorityForAttack(attacker: any, target: any, combat: any): Promise<boolean>;
/**
 * Grant Surprise Priority. Prefer attacker→target combatant edges (Round-1 order).
 * Legacy actor flag is still set for UI markers, but ordering uses edges.
 */
export declare function grantSurprisePriority(actor: any, enabled?: boolean, target?: any, combatArg?: any): Promise<void>;
/**
 * Retired. Surprise no longer pins Initiative at 0 or halves Evade.
 * Round-1 order is Surprise Priority (`grantSurprisePriority`).
 */
export declare function pinSurprisedInitiative(_actor?: any, _combat?: any): Promise<void>;
//# sourceMappingURL=surprise.d.ts.map