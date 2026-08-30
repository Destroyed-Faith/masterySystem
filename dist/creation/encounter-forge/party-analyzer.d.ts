/**
 * Party Combat Analyzer — per-PC combat profiles from the actual selected
 * actors.
 *
 * The analyzer looks at what each selected character can really do: real
 * equipped/artifact weapons, attack powers, spells, specials, penetration,
 * stones, defenses (Evade, Armor, DR%, Spell Resistance, Parry, Phasing) and
 * the six-bar Health Level track.
 *
 * BASELINE NORMALIZATION: encounter generation uses a normalized baseline
 * combat state — healthy, no transient Temp HP, permanent equipment, current
 * legal Artifact Levels, full stone pools, no spent combat resources. Status
 * effects that are transient (Corrode / Expose stacks, ...) are stripped
 * from the derived totals; if the actor's stored state looks transient or
 * inconsistent, a warning is attached instead of silently using nonsense.
 *
 * Pure and Foundry-free: reads plain actor-shaped data, never throws on
 * partial data, usable directly from tests.
 */
export interface PcSpecialOnHit {
    id: string;
    value: number;
}
export interface PcAttackProfile {
    label: string;
    kind: 'martial' | 'spell';
    delivery: 'melee' | 'ranged';
    /** Attack pool = full attack attribute (weapon attacks; keep = MR). */
    pool: number;
    keep: number;
    /** Plain-d8 damage dice per hit (weapon + power rider for martial). */
    damageDice: number;
    /** Flat damage (Might melee bonus etc.). */
    flatDamage: number;
    /** Armor ignored by this attack (explicit Penetration specials). */
    penetration: number;
    /** Specials applied on hit. */
    specials: PcSpecialOnHit[];
    /** Power level for spell Casting TN; null for martial attacks. */
    spellPowerLevel: number | null;
}
export interface PcCombatProfile {
    actorId: string;
    name: string;
    mr: number;
    evade: number;
    armor: number;
    drPct: number;
    spellResistance: number;
    /** Max parry pool if a parry stance is available to this PC, else 0. */
    parryPoolMax: number;
    phasingCharges: number;
    reactionsPerRound: number;
    /** Max HP per health bar (index 0 = Healthy ... 5 = Incapacitated). */
    healthBars: number[];
    totalHealth: number;
    /** Size of one full health level (bar 0 max). */
    healthLevelSize: number;
    attacks: PcAttackProfile[];
    /** The profile the PC repeats every round (sustainable primary attack). */
    bestAttack: PcAttackProfile;
    attackActionsPerRound: number;
    stonesTotal: number;
    /** Stones needed for +1 attack action (ramp T1+T2 = 3). */
    extraAttackStoneCost: number;
    /** Best affordable one-round melee damage-dice burst from stones. */
    burstBonusDamageDice: number;
    canCleanse: boolean;
    warnings: string[];
}
export interface PartyProfile {
    members: PcCombatProfile[];
    size: number;
    /** Diagnostic only — never a balancing input. */
    medianMr: number;
    warnings: string[];
}
/** Parse "3d8+2" / "12" / "2d8" into { dice, flat }. */
export declare function parseDamageString(raw: unknown): {
    dice: number;
    flat: number;
};
/** Parse specials like ["Penetration(4)", "Lacerate(2)"] into id/value pairs. */
export declare function parseSpecialStrings(list: unknown): PcSpecialOnHit[];
/**
 * Build the combat profile for one character actor (prepared or plain data).
 */
export declare function analyzePc(actor: any): PcCombatProfile;
/** Analyze all selected party actors. */
export declare function analyzePartyActors(actors: any[]): PartyProfile;
//# sourceMappingURL=party-analyzer.d.ts.map