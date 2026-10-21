/**
 * Martial / Spell AoE resolution — per-creature Evade (or Final Spell TN) checks
 * with full printed payload on every remaining hit.
 *
 * One shared Attack/Spell Roll is compared separately against each creature.
 * A miss against one creature does not protect any other. Creatures that would
 * be hit may use Dive for Cover before payload.
 *
 * Instant AoE rules (Destroyed Faith Active Powers):
 *   - ONE shared Attack/Casting roll for the whole AoE.
 *   - ONE shared Power damage roll (if damaging): the same raw total goes to every
 *     hit creature; armor / DR / Temp HP / Phasing still resolve per creature.
 *   - The full printed Special goes to every hit creature (no distribution).
 *   - NO Primary Target. NO Weapon Damage. NO Spell Focus damage.
 *
 * Default (and only) flow: `resolveAoeFromSharedRoll` → every token gets its own
 * hit check + Dive for Cover; one damage dialog rolls the Power damage once
 * (against the first remaining hit, purely as the roll surface); one Apply-to-all
 * confirmation then applies the same payload to every other hit.
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
/**
 * Who decides Dive for Cover for `defender` on this client?
 * - GM, or a player who owns the defender → decide here.
 * - Otherwise (a player resolving an AoE against an NPC or someone else's PC)
 *   → route to a connected owner, else to the GM. Never ask the attacker.
 */
export declare function diveForCoverDeciderUserId(defender: any): {
    local: boolean;
    userId: string;
};
export declare function promptDiveForCoverEscape(defender: any, tok: any | null): Promise<boolean>;
/**
 * After Dive for Cover is chosen (Reaction already spent via the Reaction Window),
 * let the table move the token and confirm whether it left the area.
 */
export declare function confirmDiveForCoverOutside(defender: any, tok: any | null, moveM?: number): Promise<boolean>;
/**
 * @deprecated Prefer choosing Dive for Cover in the Reaction Window.
 * Kept for remote socket fallback / legacy callers.
 */
export declare function promptDiveForCoverEscapeLocal(defender: any, tok: any | null): Promise<boolean>;
/** Per-creature AoE defense TN (Evade or Final Spell TN) before Raise increments. */
export declare function aoeCreatureNormalTn(params: {
    defender: any;
    isSpell: boolean;
    /** Spell Base TN without SR (Final = base + this creature's SR). */
    spellBaseTn?: number | null;
    /** Caster, so Spell Penetration reduces only this creature's SR. */
    caster?: any;
    /** Willing, aware target: Spell Resistance is 0. Spell Base TN is unchanged. */
    willing?: boolean;
}): number;
/**
 * Hit check for one creature against a shared AoE roll.
 * Final TN = Base TN + (Paid Raises × 4) is the only success threshold.
 */
export declare function aoeCreatureHitCheck(params: {
    attackTotal: number;
    normalTn: number;
    declaredRaiseSlots: number;
}): {
    hit: boolean;
    raiseTn: number;
    finalTn: number;
};
/**
 * Force the Instant AoE damage rules onto a flag bag: Power damage only, so the
 * damage dialog never adds Weapon Damage or Spell Focus damage.
 */
export declare function withInstantAoeFlags<T extends Record<string, any>>(flags: T | null | undefined): T & {
    ignoreWeaponDamage: true;
    instantAoe: true;
    aoeMeleeWeapon: true;
};
/** Shared AoE damage payload — rolled once, applied to every remaining hit. */
export type SharedAoeDamagePayload = {
    totalDamage: number;
    count8s?: number;
    specialsUsed?: string[];
    applicationLimitNotes?: string[];
    rollDetails?: string[];
    damageChatRolls?: any[];
    armorPenetration?: number;
    /** True when this payload already applied Specials to one target (the roller). */
    specialsAppliedToTargetId?: string | null;
};
export declare function toSharedAoeDamagePayload(result: {
    totalDamage?: number;
    count8s?: number;
    specialsUsed?: string[];
    applicationLimitNotes?: string[];
    rollDetails?: string[];
    damageChatRolls?: any[];
    attackContext?: {
        armorPenetration?: number;
    } | null;
    mitigation?: {
        phased?: boolean;
    } | null;
} | null | undefined): SharedAoeDamagePayload | null;
/** Confirm applying one shared AoE damage roll to many creatures. */
export declare function confirmSharedAoeDamageApply(opts: {
    totalDamage: number;
    specialsUsed?: readonly string[];
    targetNames: string[];
}): Promise<boolean>;
/**
 * Apply an already-rolled AoE payload to one creature (Specials + HP + movers).
 */
export declare function applySharedAoePayloadToTarget(params: {
    attacker: any;
    defender: any;
    tok: any | null;
    attackTotal: number;
    evadeTn: number;
    shared: SharedAoeDamagePayload;
    preDamage: any;
    /** Skip re-applying Specials when this defender already received them from the roll dialog. */
    skipSpecials?: boolean;
}): Promise<'damaged' | 'cancelled'>;
/**
 * Apply full printed payload to one AoE target via the normal damage dialog
 * (used for Autofire and other per-target paths). Prefer the shared-roll batch
 * helpers for classic AoE.
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
    /** When set, skip the damage dialog and apply this shared roll instead. */
    sharedDamage?: SharedAoeDamagePayload | null;
}): Promise<'escaped' | 'negated' | 'damaged' | 'cancelled'>;
/**
 * After the shared AoE attack roll: resolve every secondary token with its own
 * Evade / Final Spell TN check and Dive for Cover, then apply **one** shared
 * damage roll to every remaining hit (never re-roll per creature).
 *
 * `powerBonusDice` is ignored for damage (full payload). Kept for call-site
 * compatibility. There is no primary: every token in `secondaryTokenIds` is an
 * equal participant (the name is historical — prefer `resolveAoeFromSharedRoll`).
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
    /**
     * Damage already rolled for this AoE (optional). When set, every hit reuses
     * it — no damage dialog. When null (default), one dialog rolls the Power damage
     * once for the whole set of hits.
     */
    sharedDamage?: SharedAoeDamagePayload | null;
}): Promise<void>;
/**
 * Resolve an entire Instant AoE from ONE shared Attack/Casting roll. No Primary
 * Target: every token gets its own hit check, Dive for Cover and the same shared
 * Power damage roll + full printed Special. Default entry point for all Instant AoE.
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