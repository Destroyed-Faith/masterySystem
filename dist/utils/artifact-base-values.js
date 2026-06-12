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
function emptyBreakdown() {
    return {
        armorBonus: 0,
        evadeBonus: 0,
        movementBonus: 0,
        headArmor: 0,
        minorArmor: 0,
        rows: {
            armor: [],
            evade: [],
            movement: [],
            headArmor: [],
            minorArmor: [],
            notes: [],
        },
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
                case 'bodyArmor':
                    // Body Armor base value adds to actor Armor Total when the
                    // artifact is in the body slot. On head / feet / accessory
                    // slots it is treated as "Minor Armor" (still adds to total
                    // but shown in a separate row).
                    if (slot === 'body') {
                        out.armorBonus += value;
                        out.rows.armor.push({ source, type, value, label: contribLabel });
                    }
                    else {
                        out.minorArmor += value;
                        out.rows.minorArmor.push({ source, type, value, label: contribLabel });
                    }
                    break;
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
//# sourceMappingURL=artifact-base-values.js.map