/**
 * Party Combat Analyzer — per-PC profiles from selected World Actors.
 *
 * Values come from the same aggregation live Foundry combat uses
 * (`getTargetEvade`, `getTargetArmor`, `getTargetSpellResistance`,
 * mechanics breakdown, Basic Attack = weapon + MR×2d8).
 *
 * Three bands:
 *   Baseline  — always-on equipment/passives-in-totals, Basic Attack, 1 action
 *   Sustained — Baseline + currently active buffs; legal repeatable attacks
 *   Burst     — Sustained + stone extras / limited powers
 *
 * Inactive known buffs are listed separately and are NOT applied to solver
 * numbers. Passive mechanics.evade/armor stay unused (live combat zeroes
 * them) and are flagged for rules review.
 */
export interface PcSpecialOnHit {
    id: string;
    value: number;
}
export type AttackRole = 'basic' | 'power-rider' | 'spell' | 'power-only';
export interface PcAttackProfile {
    label: string;
    role: AttackRole;
    kind: 'martial' | 'spell';
    delivery: 'melee' | 'ranged';
    pool: number;
    keep: number;
    damageDice: number;
    flatDamage: number;
    penetration: number;
    specials: PcSpecialOnHit[];
    spellPowerLevel: number | null;
    /** Caster MR for spell TN (8 × MR). */
    casterMr: number;
    isMental: boolean;
    notes: string[];
}
export interface DefenseBand {
    evade: number;
    armor: number;
    drPct: number;
    spellResistance: number;
    phasingCharges: number;
    ward: number;
    damageNegationDice: number;
    notes: string[];
}
export interface OffenseBand {
    attack: PcAttackProfile;
    attacks: PcAttackProfile[];
    attackActions: number;
    notes: string[];
}
export interface KnownBuffPotential {
    name: string;
    evade?: number;
    armor?: number;
    drPct?: number;
    spellResistance?: number;
    ward?: number;
}
export interface PcCombatProfile {
    actorId: string;
    name: string;
    mr: number;
    /** Solver reads Sustained defense (effective live values, transients stripped). */
    evade: number;
    armor: number;
    drPct: number;
    spellResistance: number;
    parryPoolMax: number;
    phasingCharges: number;
    ward: number;
    damageNegationDice: number;
    reactionsPerRound: number;
    healthBars: number[];
    totalHealth: number;
    healthLevelSize: number;
    attacks: PcAttackProfile[];
    bestAttack: PcAttackProfile;
    attackActionsPerRound: number;
    stonesTotal: number;
    extraAttackStoneCost: number;
    burstBonusDamageDice: number;
    burstExtraActions: number;
    canCleanse: boolean;
    defense: {
        baseline: DefenseBand;
        sustained: DefenseBand;
        burst: DefenseBand;
    };
    offense: {
        baseline: OffenseBand;
        sustained: OffenseBand;
        burst: OffenseBand;
    };
    knownBuffs: KnownBuffPotential[];
    warnings: string[];
}
export interface PartyProfile {
    members: PcCombatProfile[];
    size: number;
    medianMr: number;
    warnings: string[];
}
/** Parse "3d8+2" / "12" / "2d8" into { dice, flat }. */
export declare function parseDamageString(raw: unknown): {
    dice: number;
    flat: number;
};
export declare function parseSpecialStrings(list: unknown): PcSpecialOnHit[];
export declare function analyzePc(actor: any): PcCombatProfile;
export declare function analyzePartyActors(actors: any[]): PartyProfile;
//# sourceMappingURL=party-analyzer.d.ts.map