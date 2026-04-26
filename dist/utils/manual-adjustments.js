/** Canonical default — every bonus field is zero. */
export const DEFAULT_MANUAL_ADJUSTMENTS = {
    combat: { armor: 0, evade: 0, damageReductionPct: 0, initiative: 0 },
    rolls: {
        any: { flat: 0, dice: 0 },
        attack: { flat: 0, dice: 0 },
        skill: { flat: 0, dice: 0 },
        save: { flat: 0, dice: 0 },
        damage: { flat: 0, dice: 0 },
    },
    health: { barMaxBonus: 0 },
    stress: { barMaxBonus: 0 },
};
function intOrZero(v) {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
}
function normalizeRollBonus(raw) {
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
export function normalizeManualAdjustments(raw) {
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
            save: normalizeRollBonus(raw?.rolls?.save),
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
export function readManualAdjustments(actor) {
    return normalizeManualAdjustments(actor?.system?.manual);
}
/**
 * Total bonus for a specific roll kind = `rolls.any` + `rolls[kind]`.
 * Returns zeros when the kind is unknown (e.g. generic rolls).
 */
export function manualRollBonusForKind(adj, kind) {
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
 * (`'attack' | 'skill' | 'saveBody' | 'saveMind' | 'saveSpirit' | ...`)
 * into the manual-adjustments bucket key.
 */
export function manualKindFromRollKind(rollKind) {
    if (!rollKind)
        return null;
    if (rollKind === 'attack')
        return 'attack';
    if (rollKind === 'skill')
        return 'skill';
    if (rollKind === 'damage')
        return 'damage';
    if (rollKind.startsWith('save'))
        return 'save';
    return null;
}
//# sourceMappingURL=manual-adjustments.js.map