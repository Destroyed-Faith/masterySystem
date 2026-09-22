/**
 * Surprise — a GM-set token status, not a rulebook surprise round.
 *
 * While the status is on, Evade is halved. Applying it pins Initiative at 0
 * so everyone who still has a normal score acts first.
 */
export declare const SURPRISE_STATUS_ID = "surprise";
/** True when an ActiveEffect / status document is the Surprise condition. */
export declare function effectCarriesSurprise(effect: any): boolean;
export declare function statusListHasSurprise(raw: unknown): boolean;
/** Token HUD (`actor.statuses` / effects) or the sheet `system.statusEffects` list. */
export declare function actorHasSurprise(actor: any): boolean;
/** Half Evade, rounded down. Unsurprised scores pass through. */
export declare function evadeAfterSurprise(evade: number, surprised: boolean): number;
export declare function combatantsForActor(combat: any, actor: any): any[];
/** Pin every matching combatant at Initiative 0. GM only. No-op outside combat. */
export declare function pinSurprisedInitiative(actor: any, combat?: any): Promise<void>;
//# sourceMappingURL=surprise.d.ts.map