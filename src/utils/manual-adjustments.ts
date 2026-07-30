/**
 * Manual Adjustments — player/GM-authored additive overrides.
 *
 * The `CharacterData.manual` block lets a player (or GM) layer static
 * bonuses on top of the computed stats (armor / evade / DR% / initiative),
 * add flat + bonus-d8 to specific roll kinds, and tack extra HP / stress
 * onto each bar without having to change the underlying attribute values.
 *
 * Every field is additive — `0` means "no bonus". The helpers below normalize
 * partial objects coming from older save files into the full canonical shape
 * so the rest of the codebase can read `system.manual.combat.evade` without
 * null-checking every layer.
 */
import type { ManualAdjustments, ManualRollBonus } from '../types/actor.js';

/** Canonical default — every bonus field is zero. */
export const DEFAULT_MANUAL_ADJUSTMENTS: ManualAdjustments = {
    combat: { armor: 0, evade: 0, damageReductionPct: 0, initiative: 0 },
    rolls: {
        any: { flat: 0, dice: 0 },
        attack: { flat: 0, dice: 0 },
        skill: { flat: 0, dice: 0 },
        damage: { flat: 0, dice: 0 },
    },
    health: { barMaxBonus: 0 },
    stress: { barMaxBonus: 0 },
};

function intOrZero(v: unknown): number {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function normalizeRollBonus(raw: any): ManualRollBonus {
    return {
        flat: intOrZero(raw?.flat),
        dice: Math.max(0, intOrZero(raw?.dice)),
    };
}

/**
 * Return a fully-populated `ManualAdjustments` object, filling in zeros for
 * any missing fields. Safe to call on `system.manual` even when it is
 * `undefined` (old actors). Never mutates the input.
 */
export function normalizeManualAdjustments(raw: any): ManualAdjustments {
    return {
        combat: {
            armor: intOrZero(raw?.combat?.armor),
            evade: intOrZero(raw?.combat?.evade),
            damageReductionPct: intOrZero(raw?.combat?.damageReductionPct),
            initiative: intOrZero(raw?.combat?.initiative),
        },
        rolls: {
            any: normalizeRollBonus(raw?.rolls?.any),
            attack: normalizeRollBonus(raw?.rolls?.attack),
            skill: normalizeRollBonus(raw?.rolls?.skill),
            damage: normalizeRollBonus(raw?.rolls?.damage),
        },
        health: { barMaxBonus: intOrZero(raw?.health?.barMaxBonus) },
        stress: { barMaxBonus: intOrZero(raw?.stress?.barMaxBonus) },
    };
}

/**
 * Read the manual adjustments from an actor, returning zero-defaults when
 * the actor has never opened the Manual Adjustments card.
 */
export function readManualAdjustments(actor: any): ManualAdjustments {
    return normalizeManualAdjustments(actor?.system?.manual);
}

/**
 * Total bonus for a specific roll kind = `rolls.any` + `rolls[kind]`.
 * Returns zeros when the kind is unknown (e.g. generic rolls).
 */
export function manualRollBonusForKind(
    adj: ManualAdjustments,
    kind: 'attack' | 'skill' | 'damage' | null | undefined,
): ManualRollBonus {
    const any = adj.rolls.any;
    if (!kind || !(kind in adj.rolls)) {
        return { flat: any.flat, dice: any.dice };
    }
    const specific = adj.rolls[kind];
    return {
        flat: any.flat + specific.flat,
        dice: any.dice + specific.dice,
    };
}

/**
 * Normalize the roll-handler's `rollKind` strings
 * (`'attack' | 'skill' | 'damage' | 'generic'`) into the
 * manual-adjustments bucket key.
 */
export function manualKindFromRollKind(
    rollKind: string | null | undefined,
): 'attack' | 'skill' | 'damage' | null {
    if (!rollKind) return null;
    if (rollKind === 'attack') return 'attack';
    if (rollKind === 'skill') return 'skill';
    if (rollKind === 'damage') return 'damage';
    return null;
}
