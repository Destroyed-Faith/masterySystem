/**
 * Summon Bond create / release / stone accounting (V2).
 * Canonical workflow — do not use the legacy Familiar editor for creation.
 */
import type { BoundFamiliarRecord } from '../types/actor.js';
import { computeSummonBond, type SharedSenseGroup, type SummonBondUpgradeSpend, type SummonMovementMode, type SummonSkillId } from './summon-bond-rules.js';
export type StonePoolAttr = 'might' | 'agility' | 'vitality' | 'intellect' | 'resolve' | 'influence' | 'wits';
export declare const STONE_POOL_ATTRS: StonePoolAttr[];
export type SummonPowerRef = {
    templateId: string;
    level: number;
    tokenCost: number;
    category?: string;
};
export type SummonBodyRecord = {
    id: string;
    hp: number;
    armor: number;
    evade: number;
    sharedSenses: SharedSenseGroup[];
    powers: SummonPowerRef[];
    dormant: boolean;
    summonActorId?: string;
    /** Purchases used to rebuild spend. */
    hpPurchases?: number;
    armorPurchases?: number;
    evadePurchases?: number;
};
export type SummonBondRecord = {
    id: string;
    name: string;
    img: string;
    expression: string;
    ownerActorId: string;
    boundStoneCount: number;
    /** Attribute keys used for each bound stone (length === boundStoneCount). */
    stoneAttributes: StonePoolAttr[];
    bonusTokens: number;
    movementMode: SummonMovementMode;
    movementM: number;
    attackDice: number;
    damageDice: number;
    summonAttacks: number;
    specialKey?: string | null;
    specialValue: number;
    selectedSkills: SummonSkillId[];
    skillDiceAlloc: Partial<Record<SummonSkillId, number>>;
    spend: SummonBondUpgradeSpend;
    bodies: SummonBodyRecord[];
    activationTiming: 'before' | 'after';
    needsRedistribution: boolean;
    locked: boolean;
};
export declare function getSummonBondsFromActor(actor: any): SummonBondRecord[];
export declare function getFamiliarsFromActor(actor: any): BoundFamiliarRecord[];
export declare function createBaseBody(partial?: Partial<SummonBodyRecord>): SummonBodyRecord;
export declare function createEmptyBond(opts: {
    name: string;
    img?: string;
    ownerActorId: string;
    movementMode: SummonMovementMode;
    stoneAttributes: StonePoolAttr[];
    expression?: string;
}): SummonBondRecord;
/** Migrate a V1 familiar record into a V2 bond stub (tokens unspent for redistribution). */
export declare function migrateFamiliarToBond(familiar: BoundFamiliarRecord, ownerActorId: string): SummonBondRecord;
export declare function recomputeBondDerived(bond: SummonBondRecord): SummonBondRecord;
export declare function validateBondSkillAlloc(bond: SummonBondRecord, ownerSkillRatings: Record<string, number>): string[];
export declare function persistSummonBonds(actor: any, bonds: SummonBondRecord[]): Promise<void>;
export declare function bindSummonBond(actor: any, bond: SummonBondRecord): Promise<SummonBondRecord | null>;
export declare function releaseSummonBond(actor: any, bondId: string): Promise<SummonBondRecord | null>;
export declare function tokensSummary(bond: SummonBondRecord): {
    available: number;
    spent: number;
    remaining: number;
    skillSlots: number;
};
export declare function bondStoneAssignments(bond: SummonBondRecord): Record<string, number>;
export declare function syncBodiesFromSpend(bond: SummonBondRecord): SummonBondRecord;
export type BondRitualValidation = {
    ok: boolean;
    errors: string[];
    warnings: string[];
    computed: ReturnType<typeof computeSummonBond>;
};
export declare function validateBondRitual(bond: SummonBondRecord, ownerSkillRatings?: Record<string, number>, ownerMasteryRank?: number): BondRitualValidation;
/** Create a new Summon Bond, debit Bound Stones from the owner's pool, clear legacy familiars. */
export declare function createSummonBondWithStones(actor: any, opts: {
    name: string;
    img?: string;
    expression?: string;
    movementMode: SummonMovementMode;
    stoneAttributes: StonePoolAttr[];
    bonusTokens?: number;
    activationTiming?: 'before' | 'after';
}): Promise<{
    bond: SummonBondRecord | null;
    errors: string[];
}>;
/** Persist an edited bond list entry (no stone debit). */
export declare function upsertSummonBond(actor: any, bond: SummonBondRecord): Promise<void>;
/**
 * Apply Bond Ritual: validate spend, sync bodies, clear needsRedistribution,
 * restore dormant bodies to full HP.
 */
export declare function applyBondRitual(actor: any, bondDraft: SummonBondRecord, ownerSkillRatings?: Record<string, number>): Promise<{
    bond: SummonBondRecord | null;
    errors: string[];
    warnings: string[];
}>;
/** Add Bound Stones during a Bond Ritual (debits pool; marks needsRedistribution). */
export declare function addBoundStonesToBond(actor: any, bondId: string, attributes: StonePoolAttr[]): Promise<{
    bond: SummonBondRecord | null;
    errors: string[];
}>;
/** Remove Bound Stones during a Bond Ritual (credits pool; may force redistrib). */
export declare function removeBoundStonesFromBond(actor: any, bondId: string, indices: number[]): Promise<{
    bond: SummonBondRecord | null;
    errors: string[];
}>;
/** Set Artifact-generated bonus Tokens on a Bond (not Bound Stones). */
export declare function setBondBonusTokens(actor: any, bondId: string, bonusTokens: number): Promise<SummonBondRecord | null>;
/**
 * Dissolve / release a Summon Bond via Bond Ritual: return Bound Stones, delete body actors.
 */
export declare function dissolveSummonBond(actor: any, bondId: string, deleteActors?: (id: string | undefined) => Promise<void>): Promise<{
    removed: SummonBondRecord | null;
    errors: string[];
}>;
/** Owner skill ratings helper for ritual validation. */
export declare function ownerSkillRatingsFromActor(actor: any): Record<string, number>;
//# sourceMappingURL=summon-bond-bind.d.ts.map