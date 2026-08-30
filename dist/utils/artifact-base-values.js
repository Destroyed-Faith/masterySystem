/**
 * Artifact Base Values → Actor Combat Stats aggregator
 *
 * Walks an actor's embedded artifact items and contributes the numeric
 * Base Values defined by the new Artifact spec (Artefacts.md) onto the
 * actor's derived combat stats.
 *
 * Only **equipped** artifacts contribute. An artifact is considered equipped
 * when:
 *   - `system.equipped === true`, OR
 *   - the mastery-system equipment flag is non-empty with a slot, OR
 *   - the artifact is echo-bound (echo-bound artifacts are intrinsic and
 *     always count).
 *
 * Contributions are returned as a structured breakdown so the character
 * sheet can show "Artifact: X" rows alongside Armor / Shield / Mechanics
 * / Manual rows.
 *
 * Slot-typed Base Value handling (per the spec):
 *   • mainHand / offHand → not aggregated here (weapon damage etc. is
 *     read by the damage roll pipeline directly from `baseValues`).
 *   • body                → armorBonus (always), or evade (only when no
 *                            body armor is equipped — "No-Armor Body Evade").
 *   • head                → headArmor (treated as additional armor).
 *   • feet                → movementBonus (m), evade baseline,
 *                            minorArmor (treated as armor).
 *   • amulet / ring        → minorArmor, evade, sense (informational).
 *
 * `sense` and `minorFeature` Base Values are exposed as informational
 * `notes` rows on the breakdown but do not modify combat numbers.
 */
import { getArtifactBindingKind } from './artifact-actor-rules.js';
import { parseSpellFocusDice } from './artifact-rules.js';
import { resolveArtifactBodyArmor, } from './artifact-armor-weight.js';
const WEIGHT_RANK = {
    light: 0,
    medium: 1,
    heavy: 2,
};
function emptyBreakdown() {
    return {
        armorBonus: 0,
        evadeBonus: 0,
        movementBonus: 0,
        headArmor: 0,
        minorArmor: 0,
        spellFocusBonusDice: 0,
        rows: {
            armor: [],
            evade: [],
            movement: [],
            headArmor: [],
            minorArmor: [],
            notes: [],
        },
        bodyArmorClassPenalty: null,
        bodyArmorClassInfo: null,
    };
}
function isArtifactEquipped(item) {
    if (!item)
        return false;
    // Echo-bound artifacts are intrinsic and always contribute.
    try {
        if (getArtifactBindingKind(item) === 'echo')
            return true;
    }
    catch {
        // ignore
    }
    const sysEq = item.system?.equipped;
    if (sysEq === true)
        return true;
    try {
        const flagSlot = item.getFlag?.('mastery-system', 'equipment')?.slot;
        if (typeof flagSlot === 'string' && flagSlot.length > 0)
            return true;
    }
    catch {
        // ignore
    }
    return false;
}
function actorHasEquippedBodyArmor(actor) {
    const items = Array.from(actor?.items ?? []);
    for (const it of items) {
        if (it.type === 'armor' && it.system?.equipped === true)
            return true;
    }
    return false;
}
function numericValueOf(bv) {
    if (typeof bv.value === 'number' && Number.isFinite(bv.value))
        return bv.value;
    if (typeof bv.value === 'string') {
        const trimmed = bv.value.trim();
        if (!trimmed)
            return 0;
        // Strip suffixes like " m", "+", "%" and read the leading number.
        const match = trimmed.match(/-?\d+(\.\d+)?/);
        if (match) {
            const n = Number(match[0]);
            if (Number.isFinite(n))
                return n;
        }
    }
    return 0;
}
function rowLabel(bv) {
    const slot = bv.slot ? `Slot ${String(bv.slot).toUpperCase()}` : '—';
    const label = bv.label ? ` · ${bv.label}` : '';
    return `${slot}${label}`;
}
/**
 * Aggregate Base Values from all equipped artifacts on the actor.
 * Pure function — never mutates the actor.
 */
export function buildArtifactBaseValueBreakdown(actor) {
    const out = emptyBreakdown();
    if (!actor?.items)
        return out;
    const hasBodyArmor = actorHasEquippedBodyArmor(actor);
    const items = Array.from(actor.items);
    for (const item of items) {
        if (item?.type !== 'artifact')
            continue;
        if (!isArtifactEquipped(item))
            continue;
        const sys = item.system || {};
        const slot = String(sys.slot || '');
        const baseValues = Array.isArray(sys.baseValues) ? sys.baseValues : [];
        if (baseValues.length === 0)
            continue;
        const source = item.name || 'Artifact';
        const currentLevel = Number(sys.currentLevel) || Number(sys.level) || 1;
        for (const bv of baseValues) {
            // A Base Value at slot "a" unlocks at level 1, "b" at level 4, "c" at level 7.
            const unlockLevel = bv.slot === 'b' ? 4 : bv.slot === 'c' ? 7 : 1;
            if (currentLevel < unlockLevel)
                continue;
            const type = (bv.type || 'minorFeature');
            const value = numericValueOf(bv);
            const contribLabel = rowLabel(bv);
            switch (type) {
                case 'bodyArmor': {
                    const resolved = resolveArtifactBodyArmor(bv, sys);
                    const armorValue = resolved ? resolved.totalArmor : value;
                    const row = {
                        source,
                        type,
                        value: armorValue,
                        label: contribLabel,
                        ...(resolved
                            ? {
                                armorWeightClass: resolved.weightClass,
                                baseArmor: resolved.baseArmor,
                                bonusArmor: resolved.bonusArmor,
                                typeLabel: resolved.typeLabel,
                            }
                            : {}),
                    };
                    if (slot === 'body') {
                        out.armorBonus += armorValue;
                        out.rows.armor.push(row);
                        if (resolved) {
                            const rank = WEIGHT_RANK[resolved.weightClass];
                            const curInfo = out.bodyArmorClassInfo;
                            const curRank = curInfo?.weightClass === 'heavy'
                                ? 2
                                : curInfo?.weightClass === 'medium'
                                    ? 1
                                    : curInfo
                                        ? 0
                                        : -1;
                            if (rank >= curRank) {
                                out.bodyArmorClassInfo = {
                                    weightClass: resolved.weightClass,
                                    typeLabel: resolved.typeLabel,
                                    source,
                                };
                            }
                            if (resolved.evadeModifier !== 0 ||
                                resolved.initiativeModifier !== 0 ||
                                resolved.skillPenaltyDice > 0) {
                                const cur = out.bodyArmorClassPenalty;
                                const curPenRank = cur?.weightClass === 'heavy' ? 2 : cur?.weightClass === 'medium' ? 1 : cur ? 0 : -1;
                                if (rank > curPenRank) {
                                    out.bodyArmorClassPenalty = {
                                        weightClass: resolved.weightClass,
                                        typeLabel: resolved.typeLabel,
                                        source,
                                        evade: resolved.evadeModifier,
                                        initiative: resolved.initiativeModifier,
                                        skillPenalty: resolved.skillPenalty,
                                        skillPenaltyDice: resolved.skillPenaltyDice,
                                    };
                                }
                            }
                        }
                    }
                    else {
                        out.minorArmor += armorValue;
                        out.rows.minorArmor.push(row);
                    }
                    break;
                }
                case 'headArmor':
                    if (slot === 'head') {
                        out.headArmor += value;
                        out.rows.headArmor.push({ source, type, value, label: contribLabel });
                    }
                    else {
                        // Per spec the same scaling table covers Head + Feet Minor Armor.
                        out.minorArmor += value;
                        out.rows.minorArmor.push({ source, type, value, label: contribLabel });
                    }
                    break;
                case 'evade':
                    // "No-Armor Body Evade" only applies when no body armor is equipped.
                    if (slot === 'body' && hasBodyArmor) {
                        out.rows.notes.push({
                            source,
                            type,
                            value,
                            label: `${contribLabel} (suppressed — Body Armor equipped)`,
                        });
                    }
                    else {
                        out.evadeBonus += value;
                        out.rows.evade.push({ source, type, value, label: contribLabel });
                    }
                    break;
                case 'movement':
                    out.movementBonus += value;
                    out.rows.movement.push({ source, type, value, label: contribLabel });
                    break;
                case 'shieldValue':
                    // Artifact shields: Shield Value stacks with Armor Value as normal
                    // Armor resolution (e.g. Starfallen Forceshield).
                    out.armorBonus += value;
                    out.rows.armor.push({ source, type, value, label: contribLabel });
                    break;
                case 'spellFocus': {
                    const dice = parseSpellFocusDice(bv.value);
                    out.spellFocusBonusDice += dice;
                    out.rows.notes.push({
                        source,
                        type,
                        value: dice,
                        label: `${contribLabel} (+${dice}d8 to Spells)`,
                    });
                    break;
                }
                case 'weaponDamage':
                case 'thrownRange':
                case 'weaponSpecial':
                case 'sense':
                case 'minorFeature':
                default:
                    out.rows.notes.push({ source, type, value, label: contribLabel });
                    break;
            }
        }
    }
    return out;
}
/**
 * Total Spell Focus bonus dice (d8) added to Spell damage: equipped
 * weapon-slot artifacts PLUS mundane weapons with a printed
 * `Spell Focus (+Xd8)` innate (Wand / Runestaff, PG weapon table).
 */
export function getActorSpellFocusBonusDice(actor) {
    let total = buildArtifactBaseValueBreakdown(actor).spellFocusBonusDice;
    const items = actor?.items ? Array.from(actor.items) : [];
    for (const it of items) {
        if (it?.type !== 'weapon' || it?.system?.equipped !== true)
            continue;
        const innates = Array.isArray(it.system?.innateAbilities) ? it.system.innateAbilities : [];
        for (const innate of innates) {
            const m = String(innate ?? '').match(/spell\s*focus[^\d]*(\d+)\s*d8/i);
            if (m)
                total += Math.max(0, Math.floor(Number(m[1]) || 0));
        }
    }
    return total;
}
//# sourceMappingURL=artifact-base-values.js.map