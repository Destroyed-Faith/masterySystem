/**
 * Split Spell fizzle stress (legacy — mechanical Stress retired).
 * Tracking remains for callers; never applies Stress.
 */
export declare function splitSpellShouldStress(_totals: number[], _spellBaseTn: number): boolean;
/**
 * Record one split Casting Roll. Returns whether this completion should
 * apply the single fizzle Stress. Earlier rolls in the pair return 'pending'.
 */
export declare function noteSplitSpellRoll(pairId: string, total: number, spellBaseTn: number, expected?: number): 'pending' | 'stress' | 'clear';
/** Test hook. */
export declare function resetSplitSpellRolls(): void;
//# sourceMappingURL=split-spell-stress.d.ts.map