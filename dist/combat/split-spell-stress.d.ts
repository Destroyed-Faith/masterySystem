/**
 * Split Spell fizzle stress.
 * The caster takes 1d8 Stress only when none of the split Casting Rolls
 * reach Spell Base TN. A placement that reaches Base but misses Final Spell TN
 * is resisted, not fizzled.
 */
export declare function splitSpellShouldStress(totals: number[], spellBaseTn: number): boolean;
/**
 * Record one split Casting Roll. Returns whether this completion should
 * apply the single fizzle Stress. Earlier rolls in the pair return 'pending'.
 */
export declare function noteSplitSpellRoll(pairId: string, total: number, spellBaseTn: number, expected?: number): 'pending' | 'stress' | 'clear';
/** Test hook. */
export declare function resetSplitSpellRolls(): void;
//# sourceMappingURL=split-spell-stress.d.ts.map