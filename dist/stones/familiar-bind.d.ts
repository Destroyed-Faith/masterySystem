/**
 * Familiar binding: draft validation, stone pool accounting, persist/release on character.
 */
import { type FamiliarComputationInput, type FamiliarFinalStats, type FamiliarResult, type FamiliarSize, type MovementType, type SharedSenseGroup, type UpgradeCategory } from './familiar-rules.js';
export type FamiliarPoolAttr = 'might' | 'agility' | 'vitality' | 'intellect' | 'resolve' | 'influence' | 'wits';
export declare const FAMILIAR_POOL_ATTRS: FamiliarPoolAttr[];
export type FamiliarUpgradeRowDraft = {
    id: string;
    attribute: FamiliarPoolAttr | null;
    pickA: UpgradeCategory;
    pickB: UpgradeCategory;
};
export type FamiliarSenseDraft = {
    enabled: boolean;
    attribute: FamiliarPoolAttr | null;
};
export type FamiliarDraft = {
    name: string;
    img: string;
    movementType: MovementType;
    baseStoneAttr: FamiliarPoolAttr | null;
    upgradeRows: FamiliarUpgradeRowDraft[];
    sharedSight: FamiliarSenseDraft;
    sharedHearing: FamiliarSenseDraft;
    sharedTasteSmell: FamiliarSenseDraft;
    sharedTouch: FamiliarSenseDraft;
};
export type BoundFamiliarRecord = {
    id: string;
    name: string;
    img: string;
    movementType: MovementType;
    ownerActorId: string;
    baseStone: {
        attribute: FamiliarPoolAttr;
    };
    upgradeStones: {
        id: string;
        attribute: FamiliarPoolAttr;
        picks: [UpgradeCategory, UpgradeCategory];
    }[];
    sharedSenses: {
        group: SharedSenseGroup;
        attribute: FamiliarPoolAttr;
    }[];
    boundStoneCount: number;
    stats: FamiliarFinalStats;
    size: FamiliarSize;
    summonActorId?: string;
    locked: boolean;
};
export declare const SHARED_SENSE_UI: {
    key: SharedSenseGroup;
    field: keyof Pick<FamiliarDraft, 'sharedSight' | 'sharedHearing' | 'sharedTasteSmell' | 'sharedTouch'>;
    label: string;
    description: string;
}[];
export declare function emptyFamiliarDraft(): FamiliarDraft;
export declare function getSharedSenseLabel(group: SharedSenseGroup): string;
export declare function getFamiliarsFromActor(actor: any): BoundFamiliarRecord[];
export declare function countDraftBoundStones(draft: FamiliarDraft): number;
/** Stones assigned in draft per attribute (for pool reservation UI). */
export declare function collectDraftStoneCounts(draft: FamiliarDraft): Record<string, number>;
export declare function draftToComputationInput(draft: FamiliarDraft, masteryRank: number): FamiliarComputationInput;
export declare function buildFamiliarResultFromDraft(draft: FamiliarDraft, masteryRank: number): FamiliarResult | null;
export type FamiliarDraftValidation = {
    canBind: boolean;
    errors: string[];
    warnings: string[];
};
export declare function validateFamiliarDraft(draft: FamiliarDraft, masteryRank: number, existingFamiliarCount: number, spendableByAttr: Record<string, number>): FamiliarDraftValidation;
export declare function buildBoundFamiliarRecord(draft: FamiliarDraft, ownerActorId: string, familiarId: string, masteryRank: number): BoundFamiliarRecord;
export declare function getActorPoolSpendable(actor: any): Record<string, number>;
export declare function applySustainedDelta(stonePools: Record<string, any>, assignments: Record<string, number>, sign: 1 | -1): Record<string, any>;
export declare function familiarStoneAssignments(record: BoundFamiliarRecord): Record<string, number>;
export declare function progressionHighlightTiers(result: FamiliarResult | null): Record<string, number>;
export declare function parseD8Count(formula: string): number;
export declare function bindFamiliarToActor(actor: Actor, draft: FamiliarDraft, masteryRank: number): Promise<BoundFamiliarRecord | null>;
export declare function releaseFamiliarFromActor(actor: Actor, familiarId: string): Promise<BoundFamiliarRecord | null>;
//# sourceMappingURL=familiar-bind.d.ts.map