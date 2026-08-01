/**
 * Summon Bond create / release / stone accounting (V2).
 */
import type { BoundFamiliarRecord } from '../types/actor.js';
import { type SharedSenseGroup, type SummonBondUpgradeSpend, type SummonMovementMode, type SummonSkillId } from './summon-bond-rules.js';
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
//# sourceMappingURL=summon-bond-bind.d.ts.map