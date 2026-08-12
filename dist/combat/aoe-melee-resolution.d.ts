/**
 * Martial / Spell AoE resolution — per-creature Evade (or Final Spell TN) checks
 * with full printed payload on every remaining hit.
 *
 * One shared Attack/Spell Roll is compared separately against each creature.
 * A miss against one creature does not protect any other. Creatures that would
 * be hit may use Dive for Cover before payload. Secondaries receive the same
 * full payload as the primary (weapon + power damage + specials), not splash-only.
 */
/** Resolve a burst token id to a canvas actor (handles scene / placeable quirks). */
export declare function resolveBurstTarget(tid: string): {
    defender: any;
    tok: any;
} | null;
/**
 * @deprecated Legacy Body-save DC (pre per-Evade AoE rules). Kept for old callers.
 */
export declare function aoeSecondaryBodySaveDc(masteryRank: number): number;
/** Dive-for-Cover movement allowance of the diving creature (2 × own MR). */
export declare function diveForCoverDistanceM(actor: any): number;
/**
 * Offer Dive for Cover to a creature that would be hit by an AoE.
 * Spends the Reaction, lets the table move the token, and asks whether it
 * ended up fully outside the area.
 *
 * @returns true when the creature escaped (→ not affected by the AoE).
 */
export declare function promptDiveForCoverEscape(defender: any, tok: any | null): Promise<boolean>;
/** Per-creature AoE defense TN (Evade or Final Spell TN) before Raise increments. */
export declare function aoeCreatureNormalTn(params: {
    defender: any;
    isSpell: boolean;
    /** Spell Base TN without SR (Final = base + this creature's SR). */
    spellBaseTn?: number | null;
}): number;
/**
 * Hit check for one creature against a shared AoE roll.
 * Declared Raises add +4 per slot to that creature's TN (same as single-target).
 */
export declare function aoeCreatureHitCheck(params: {
    attackTotal: number;
    normalTn: number;
    declaredRaiseSlots: number;
}): {
    hit: boolean;
    raiseTn: number;
};
/**
 * Apply full printed payload to one AoE target via the normal damage dialog.
 */
export declare function resolveAoeFullPayloadOnTarget(params: {
    attacker: any;
    defender: any;
    tok: any | null;
    weaponId: string | null;
    flags: Record<string, any>;
    attackTotal: number;
    evadeTn: number;
    allowDiveForCover?: boolean;
}): Promise<'escaped' | 'negated' | 'damaged' | 'cancelled'>;
/**
 * After the shared AoE roll: resolve every secondary token with its own Evade /
 * Final Spell TN check, Dive for Cover, and full payload.
 *
 * `powerBonusDice` is ignored for damage (full payload via damage dialog).
 * Kept in the signature for call-site compatibility.
 */
export declare function resolveAoeMeleeSecondaries(params: {
    attacker: any;
    attackerMasteryRank: number;
    secondaryTokenIds: string[];
    powerBonusDice: number;
    /** True when the AoE power is a spell (Final Spell TN per creature). */
    isSpell?: boolean;
    attackTotal?: number | null;
    /** @deprecated Anchor TN — each creature uses its own defense now. */
    evadeTn?: number | null;
    /** Flags from the attack card (power id, raises, weapon, snapshot…). */
    flags?: Record<string, any> | null;
    weaponId?: string | null;
    declaredRaiseSlots?: number;
    /** Spell Base TN without SR. */
    spellBaseTn?: number | null;
}): Promise<void>;
/**
 * Resolve an entire AoE from a shared roll with no attack-card primary path
 * (e.g. melee AoE with "no primary" / all secondaries).
 */
export declare function resolveAoeFromSharedRoll(params: {
    attacker: any;
    tokenIds: string[];
    attackTotal: number;
    declaredRaiseSlots?: number;
    isSpell?: boolean;
    spellBaseTn?: number | null;
    flags?: Record<string, any> | null;
    weaponId?: string | null;
}): Promise<void>;
//# sourceMappingURL=aoe-melee-resolution.d.ts.map