/**
 * Raise resolution — Players Guide Raise rules.
 *
 * Declared Raises create a Raise TN (+4 each) while Normal TN stays fixed.
 * Raise Cost is paid before the roll; restored only on full Raise success.
 */
import type { AoeSpec, DurationSpec, PowerSpecial, RangeSpec } from '../types/item.js';
import type { RadialCombatOption } from '../radial-menu/types.js';
export type RaiseEffectKind = 'damage' | 'specialPlus' | 'rangePlus' | 'aoeRadiusPlus' | 'durationPlus';
export type RaiseOutcome = 'fail' | 'partial' | 'full';
export interface PowerSpecialEntry {
    key: string;
    rank: number;
}
export interface PowerSnapshot {
    damageDice: number;
    specials: PowerSpecialEntry[];
    rangeM: number | null;
    aoeRadiusM: number | null;
    durationSteps: number;
    hasRange: boolean;
    hasAoe: boolean;
    hasDuration: boolean;
}
export interface DeclaredRaise {
    effect: RaiseEffectKind;
    targetSpecialKey?: string;
    /** Raise slots consumed (1 or 2 per option). */
    slots: 1 | 2;
}
export interface RaiseCostAllocation {
    /** d8 removed from damage pool for spell mixed cost. */
    damageDice: number;
    /** Special rank value removed, keyed by special key. */
    specialByKey: Record<string, number>;
}
export interface RaiseOption {
    id: string;
    label: string;
    effect: RaiseEffectKind;
    targetSpecialKey?: string;
    slots: 1 | 2;
}
export interface ResolvePowerSnapshotParams {
    base: PowerSnapshot;
    declaredRaises: DeclaredRaise[];
    outcome: RaiseOutcome;
    masteryRank: number;
    isSpell: boolean;
    /** Free bonus raise effects on full success (stones). */
    stoneBonusRaises?: number;
    /** Player-chosen spell raise cost split (from attack card). */
    spellCostOverride?: RaiseCostAllocation;
}
export declare function computeRaiseTns(normalTn: number, declaredRaiseSlots: number): {
    normalTn: number;
    raiseTn: number;
};
/**
 * All-or-nothing: partial only when declared raises > 0 and total meets Normal TN
 * but not Raise TN.
 */
export declare function resolveRaiseOutcome(total: number, normalTn: number, declaredRaiseSlots: number, 
/** Intellect Spell Raises: bonus applied only when checking Raise TN. */
raiseTnRollBonus?: number): RaiseOutcome;
/** Total raise slots from declared raise plan. */
export declare function countRaiseSlots(raises: DeclaredRaise[]): number;
/** Martial: MR d8 per raise slot. Spell: MR total value per raise slot. */
export declare function raiseCostPerSlot(masteryRank: number): number;
/**
 * Default spell cost split: damage dice first, then special rank (largest first).
 */
export declare function defaultSpellCostAllocation(snapshot: PowerSnapshot, totalValue: number): RaiseCostAllocation;
export declare function computeTotalRaiseCost(raiseSlots: number, masteryRank: number): number;
/** Apply raise cost to a snapshot (pre-roll state). */
export declare function applyRaiseCost(snapshot: PowerSnapshot, cost: RaiseCostAllocation): PowerSnapshot;
/**
 * Resolve final power snapshot from base, declared raises, outcome, and stone bonus.
 */
export declare function resolvePowerSnapshot(params: ResolvePowerSnapshotParams): PowerSnapshot;
/** Pre-roll snapshot after paying raise cost (for UI preview). */
export declare function previewAfterRaiseCost(base: PowerSnapshot, declaredRaises: DeclaredRaise[], masteryRank: number, isSpell: boolean, spellCostOverride?: RaiseCostAllocation): PowerSnapshot;
export declare function buildAvailableRaiseOptions(snapshot: PowerSnapshot, isSpell: boolean): RaiseOption[];
export declare function formatSnapshotSummary(snapshot: PowerSnapshot): string;
/** Build a PowerSnapshot from level row data (attack card / damage dialog). */
export declare function buildPowerSnapshotFromLevelData(levelData: {
    effect?: {
        dice?: string;
    };
    roll?: {
        damage?: string;
    };
    specials?: Array<PowerSpecial | string>;
    range?: RangeSpec | null;
    aoe?: AoeSpec | null;
    duration?: DurationSpec | null;
} | null, fallbackDamage: string, fallbackSpecials: string[]): PowerSnapshot;
/** Parse raise plan JSON from attack card data attribute. */
export declare function parseDeclaredRaises(raw: string | null | undefined): DeclaredRaise[];
export declare function snapshotToDamageFormula(snapshot: PowerSnapshot): string;
export declare function snapshotToSpecialStrings(snapshot: PowerSnapshot): string[];
/** Load template level data for an artifact radial option flagged as a Spell. */
export declare function loadPowerSnapshotForArtifactOption(option: RadialCombatOption): Promise<{
    snapshot: PowerSnapshot;
    isSpell: boolean;
    levelData: any | null;
} | null>;
/** Load template level data for a power item (attack card / damage dialog). */
export declare function loadPowerSnapshotForItem(powerItem: any): Promise<{
    snapshot: PowerSnapshot;
    isSpell: boolean;
    levelData: any | null;
}>;
/** Map raise option id from UI to DeclaredRaise. */
export declare function declaredRaiseFromOptionId(optionId: string, options: RaiseOption[]): DeclaredRaise | null;
//# sourceMappingURL=raise-resolution.d.ts.map