/**
 * Combat Raise resolution — Players Guide Universal Combat Raise Catalog.
 *
 * One decisive Final TN per target:
 *   Final TN = Applicable Base TN + (Paid Raises × 4)
 * Free Raises do not increase TN. Meeting the Final TN is the only hit path —
 * there is no "hit Normal TN / Raises Failed" partial outcome.
 */
import type { AoeSpec, DurationSpec, PowerSpecial, RangeSpec } from '../types/item.js';
import type { RadialCombatOption } from '../radial-menu/types.js';
export type RaiseEffectKind = 'damage' | 'specialPlus' | 'rangePlus' | 'aoeRadiusPlus' | 'durationPlus';
/** Combat outcomes: miss the Final TN, or hit with all declared Raises. */
export type RaiseOutcome = 'fail' | 'full';
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
    /** Free Raise (Intellect): no TN increase. */
    free?: boolean;
    /** Printed rank shown in the Raise menu. */
    printedRank?: number;
    /** Attack-card label, so the table can see which Raise was picked. */
    label?: string;
}
/** @deprecated Combat Raises have no Raise Cost. Kept for legacy call sites. */
export interface RaiseCostAllocation {
    damageDice: number;
    specialByKey: Record<string, number>;
}
export interface RaiseOption {
    id: string;
    label: string;
    effect: RaiseEffectKind;
    targetSpecialKey?: string;
    printedRank?: number;
    slots: 1 | 2;
}
export interface ResolvePowerSnapshotParams {
    base: PowerSnapshot;
    declaredRaises: DeclaredRaise[];
    outcome: RaiseOutcome | 'partial' | string;
    masteryRank: number;
    isSpell: boolean;
    /**
     * @deprecated Do not use for combat. Unassigned Free Raises must be allocated
     * explicitly — never auto-converted to Damage.
     */
    stoneBonusRaises?: number;
    /** @deprecated Ignored — Combat Raises have no Raise Cost. */
    spellCostOverride?: RaiseCostAllocation;
    /** @deprecated Ignored — Combat Raises have no Raise Cost. */
    waiveRaiseCost?: boolean;
}
/** Normalize stored / legacy outcomes. `partial` is always a miss for payload. */
export declare function normalizeRaiseOutcome(raw: unknown): RaiseOutcome;
/** Final TN for one target resolution. Free Raises are not included in `paidRaiseSlots`. */
export declare function computeFinalTn(baseTn: number, paidRaiseSlots: number): number;
/**
 * Base TN plus Final TN (sole success threshold).
 * `raiseTn` is an alias of `finalTn` for older callers.
 */
export declare function computeRaiseTns(normalTn: number, declaredRaiseSlots: number): {
    normalTn: number;
    raiseTn: number;
    finalTn: number;
};
/**
 * Combat: all-or-nothing against the Final TN.
 * Meeting Base TN but missing Final TN is a miss — never a partial hit.
 */
export declare function resolveRaiseOutcome(total: number, normalTn: number, declaredRaiseSlots: number, 
/** Optional roll bonus applied only when Paid Raises raised the TN. */
raiseTnRollBonus?: number): RaiseOutcome;
/**
 * Noncombat declared-raise bands (Rituals, Social): Base TN vs Raise TN.
 * Combat must not use this — use `resolveRaiseOutcome` instead.
 */
export declare function resolveDeclaredRaiseBands(total: number, normalTn: number, declaredRaiseSlots: number, raiseTnRollBonus?: number): 'fail' | 'partial' | 'full';
/**
 * Damage Raises stack. Special Raises stack when assigned to the same Special.
 * (Older code deduped Special Raises once — that contradicted the catalog.)
 */
export declare function dedupeDeclaredRaises(raises: DeclaredRaise[]): DeclaredRaise[];
/** Total raise slots from declared raise plan. */
export declare function countRaiseSlots(raises: DeclaredRaise[]): number;
/** Slots that increase the Final TN. Free Raises do not. */
export declare function paidRaiseSlots(raises: DeclaredRaise[]): number;
export declare function describeDeclaredRaise(raise: DeclaredRaise): string;
/** One line the whole table can read: which Raises were picked, and which are free. */
export declare function formatDeclaredRaiseList(raises: DeclaredRaise[]): string;
/** @deprecated Combat Raises have no Raise Cost. */
export declare function raiseCostPerSlot(masteryRank: number): number;
/** @deprecated Combat Raises have no Raise Cost. */
export declare function defaultSpellCostAllocation(snapshot: PowerSnapshot, totalValue: number): RaiseCostAllocation;
/** @deprecated Combat Raises have no Raise Cost. */
export declare function computeTotalRaiseCost(raiseSlots: number, masteryRank: number): number;
/** @deprecated Combat Raises have no Raise Cost. */
export declare function applyRaiseCost(snapshot: PowerSnapshot, cost: RaiseCostAllocation): PowerSnapshot;
/** Dice added by one Damage Raise. Single target: MR. AoE: ceil(MR/2). */
export declare function damageRaiseDicePerRaise(masteryRank: number, aoe: boolean): number;
/**
 * Successful Raise slots available for post-roll allocation.
 * Free Raises do not raise TN but still grant effects when the Final TN is met.
 */
export declare function successfulRaiseSlotCount(paidSlots: number, freeSlots: number): number;
/** True when every Raise slot has an eligible effect chosen. */
export declare function isRaiseAllocationComplete(plan: DeclaredRaise[], requiredSlots: number, options: RaiseOption[]): boolean;
/**
 * Resolve final power snapshot from base, declared raises, and outcome.
 * Fail → base unchanged (caller must not apply payload).
 * Full → apply every explicitly allocated Raise effect only.
 * Never invent Damage Raises for unassigned slots.
 */
export declare function resolvePowerSnapshot(params: ResolvePowerSnapshotParams): PowerSnapshot;
/** Pre-roll preview: Combat Raises do not strip the pool. */
export declare function previewAfterRaiseCost(base: PowerSnapshot, _declaredRaises: DeclaredRaise[], _masteryRank: number, _isSpell: boolean, _spellCostOverride?: RaiseCostAllocation): PowerSnapshot;
/**
 * Sum every legal Damage Pool component for regression checks.
 * Raise dice are the bonus from successful Damage Raises only.
 */
export declare function sumCombatDamagePoolDice(parts: {
    weaponDice?: number;
    powerDice?: number;
    passiveDice?: number;
    raiseDice?: number;
    otherDice?: number;
}): number;
export declare function buildAvailableRaiseOptions(snapshot: PowerSnapshot, _isSpell: boolean, opts?: {
    hasWeaponDamage?: boolean;
}): RaiseOption[];
/** One line: 11d8 (5d8 Lor-Keth's Staff + 4d8 Power + 2d8 Raise). */
export declare function formatHitBreakdown(weaponDice: number | undefined, powerDice: number, extra?: {
    raiseDice?: number;
    specials?: PowerSpecialEntry[];
    weaponName?: string;
}): string;
/** Weapon dice plus power dice, so 4d8 total is not read as the Raise itself. */
export declare function formatAttackDiceLine(powerDice: number, weaponDice?: number, weaponName?: string): string;
/**
 * What a full Raise actually changes. Specials that stay put are named, so
 * Penetration on the weapon is not mistaken for a Raise the player took.
 */
export declare function describeSnapshotDelta(base: PowerSnapshot, resolved: PowerSnapshot, weaponDice?: number): string;
export declare function formatRaiseResultLine(params: {
    outcome: 'full' | 'fail' | 'partial';
    base: PowerSnapshot;
    resolved: PowerSnapshot;
    declared: DeclaredRaise[];
    lostCostLabel?: string;
    weaponDice?: number;
}): string;
export declare function formatSnapshotSummary(snapshot: PowerSnapshot): string;
/** Labeled result so "3d8, Range 12m" is not read as the Raise itself. */
export declare function formatRaiseOutcomeBody(snapshot: PowerSnapshot): string;
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
/**
 * Bind the `SPECIAL` picker placeholder in a level row to the item's chosen
 * Special.
 */
export declare function bindChosenSpecialIntoLevelData(levelData: any | null, chosenSpecialKey: string | null | undefined, templateId?: string | null, level?: number | null): any | null;
/** Parse raise plan JSON from attack card data attribute. */
export declare function parseDeclaredRaises(raw: string | null | undefined): DeclaredRaise[];
export declare function snapshotToDamageFormula(snapshot: PowerSnapshot): string;
export declare function snapshotToSpecialStrings(snapshot: PowerSnapshot): string[];
/**
 * Older Dragon Claws rows stored Rending Spiral as a plain weapon AoE
 * (`active-melee-weapon-aoe`), which adds bonus dice and never applies Lacerate.
 * The printed profile is Melee AoE Attack + Lacerate.
 */
export declare function canonicalArtifactAttackTemplateId(option: RadialCombatOption): string;
/** Load catalog level data for an artifact Active (Frost Throw, spells, …). */
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