/**
 * First Aid (Players Guide "Rest & Recovery"):
 *
 * After combat, a character may treat another creature with Medicine. On a
 * successful Medicine Skill Check the treated creature loses all remaining
 * negative Specials caused during that combat. First Aid does not restore HP
 * or Scarred Health Bars. Each creature may receive First Aid once per combat.
 *
 * The Medicine roll itself uses the normal Skill Check flow — this GM tool
 * applies the outcome (and tracks the once-per-combat limit).
 */
/** Remove all negative Specials from the target; returns names removed. */
export declare function applyFirstAidTo(target: any): Promise<string[]>;
export declare function hasReceivedFirstAid(target: any): boolean;
/** New combat: the once-per-combat First Aid limit resets. */
export declare function clearFirstAidFlags(actors: Iterable<any>): Promise<void>;
/**
 * GM tool: apply First Aid to the currently selected (or targeted) token's
 * actor after a successful Medicine check.
 */
export declare function promptFirstAidForSelectedToken(): Promise<void>;
//# sourceMappingURL=first-aid.d.ts.map