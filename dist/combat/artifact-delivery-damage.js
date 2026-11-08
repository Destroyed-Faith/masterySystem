/**
 * Unified Artifact Delivery Damage.
 *
 * Canonical rule: an Artifact may support any Delivery its wielder already
 * has. Form, equipment slot, weapon classification, and Spell Focus
 * classification do not gate Delivery eligibility for Artifacts.
 *
 * When an Artifact provides eligible delivery damage, that contribution
 * applies once for the selected Delivery — never as both Weapon Damage and
 * Spell Focus on the same attack.
 *
 * Preference when both Base Values exist on one Artifact:
 *   Martial → Weapon Damage (fallback: Spell Focus as Nd8)
 *   Spell   → Spell Focus   (fallback: Weapon Damage dice)
 *
 * Mundane equipment is unchanged; callers must keep mundane paths separate.
 * Special-only Attacks never receive delivery damage (enforced by callers via
 * martialWeaponDamageApplies / spellFocusDamageApplies).
 */
import { getArtifactBindingKind } from '../utils/artifact-actor-rules.js';
import { deriveArtifactWeaponDamage } from '../utils/artifact-base-derive.js';
import { spellFocusDiceFromSystem } from '../utils/artifact-rules.js';
function artifactLevel(sys) {
    return Math.max(1, Math.min(10, Number(sys?.currentLevel) || Number(sys?.level) || 1));
}
/** Leading Nd8 count from a damage formula (`5d8`, `+5d8`, bare `5`). */
export function parseNd8DiceCount(formula) {
    if (typeof formula === 'number' && Number.isFinite(formula)) {
        return Math.max(0, Math.floor(formula));
    }
    const s = String(formula ?? '').trim();
    if (!s)
        return 0;
    const m = s.match(/(\d+)\s*d\s*8/i) || s.match(/^(\d+)$/);
    if (!m)
        return 0;
    return Math.max(0, Math.floor(Number(m[1]) || 0));
}
/**
 * Authored / derived Weapon Damage dice on an Artifact item (0 when none).
 * Does not invent damage for Focus-only gear.
 */
export function resolveArtifactItemWeaponDamageDice(item) {
    return parseNd8DiceCount(resolveArtifactItemWeaponDamageFormula(item));
}
/** Nd8 formula for Artifact Weapon Damage, or '' when the Artifact has none. */
export function resolveArtifactItemWeaponDamageFormula(item) {
    if (!item || item.type !== 'artifact')
        return '';
    const sys = item.system || {};
    const level = artifactLevel(sys);
    const derived = deriveArtifactWeaponDamage(sys.baseProfile, level);
    if (derived)
        return derived;
    const aw = sys.artifactWeapon;
    const baked = typeof aw?.damage === 'string' ? aw.damage.trim() : '';
    if (baked && parseNd8DiceCount(baked) > 0)
        return baked;
    const bvs = Array.isArray(sys.baseValues) ? sys.baseValues : [];
    for (const bv of bvs) {
        if (String(bv?.type || '') !== 'weaponDamage')
            continue;
        const n = parseNd8DiceCount(bv?.value);
        if (n > 0)
            return `${n}d8`;
    }
    return '';
}
function isArtifactEquipped(item) {
    if (!item)
        return false;
    if (getArtifactBindingKind(item) === 'echo')
        return true;
    if (item.system?.equipped === true)
        return true;
    try {
        const flagSlot = item.getFlag?.('mastery-system', 'equipment')?.slot;
        if (typeof flagSlot === 'string' && flagSlot.length > 0)
            return true;
    }
    catch {
        /* ignore */
    }
    return false;
}
/**
 * One Artifact → one delivery contribution for the selected Delivery.
 * Returns null when the Artifact grants no delivery damage.
 */
export function resolveArtifactItemDeliveryContribution(item, delivery) {
    if (!item || item.type !== 'artifact')
        return null;
    const sys = item.system || {};
    const wdFormula = resolveArtifactItemWeaponDamageFormula(item);
    const wdDice = parseNd8DiceCount(wdFormula);
    const sfDice = spellFocusDiceFromSystem(sys);
    const name = String(item.name || 'Artifact').trim() || 'Artifact';
    const itemId = item.id != null ? String(item.id) : undefined;
    if (delivery === 'spell') {
        if (sfDice > 0) {
            return { name, dice: sfDice, formula: `${sfDice}d8`, kind: 'spellFocus', itemId };
        }
        if (wdDice > 0) {
            return { name, dice: wdDice, formula: wdFormula || `${wdDice}d8`, kind: 'weaponDamage', itemId };
        }
        return null;
    }
    // Martial
    if (wdDice > 0) {
        return { name, dice: wdDice, formula: wdFormula || `${wdDice}d8`, kind: 'weaponDamage', itemId };
    }
    if (sfDice > 0) {
        return { name, dice: sfDice, formula: `${sfDice}d8`, kind: 'spellFocus', itemId };
    }
    return null;
}
/**
 * Martial formula for a resolved Artifact weapon (including Focus-only fallback).
 * Returns null when the item is not an Artifact or grants no delivery damage.
 */
export function resolveMartialArtifactWeaponFormula(weaponOrArtifact) {
    if (!weaponOrArtifact)
        return null;
    // Virtual weapons from artifactToVirtualWeapon keep type 'weapon' + fromArtifact.
    const fromArtifact = weaponOrArtifact.type === 'artifact' ||
        !!weaponOrArtifact.system?.fromArtifact ||
        !!weaponOrArtifact.flags?.['mastery-system']?.artifactWeaponSourceId;
    if (!fromArtifact && weaponOrArtifact.type !== 'artifact')
        return null;
    if (weaponOrArtifact.type === 'artifact') {
        const c = resolveArtifactItemDeliveryContribution(weaponOrArtifact, 'martial');
        return c ? c.formula : null;
    }
    // Already virtualized: prefer baked damage, else re-derive from flags if needed.
    const baked = String(weaponOrArtifact.system?.damage || '').trim();
    if (baked && parseNd8DiceCount(baked) > 0)
        return baked;
    return null;
}
/**
 * Equipped Artifacts' delivery contributions for the selected Delivery.
 * Each Artifact contributes at most once.
 */
export function listArtifactDeliveryDamageSources(actor, delivery) {
    const out = [];
    if (!actor?.items)
        return out;
    const items = Array.from(actor.items);
    for (const item of items) {
        if (item?.type !== 'artifact')
            continue;
        if (!isArtifactEquipped(item))
            continue;
        const c = resolveArtifactItemDeliveryContribution(item, delivery);
        if (c && c.dice > 0)
            out.push(c);
    }
    return out;
}
export function sumArtifactDeliveryDice(actor, delivery) {
    return listArtifactDeliveryDamageSources(actor, delivery).reduce((n, s) => n + s.dice, 0);
}
/**
 * Spell delivery damage sources: unified Artifact contributions plus mundane
 * weapons that print a Spell Focus (+Xd8) innate (unchanged mundane path).
 */
export function listSpellDeliveryDamageSources(actor) {
    const sources = listArtifactDeliveryDamageSources(actor, 'spell').map((s) => ({ name: s.name, dice: s.dice }));
    const items = actor?.items ? Array.from(actor.items) : [];
    for (const it of items) {
        if (it?.type !== 'weapon' || it?.system?.equipped !== true)
            continue;
        if (it.system?.fromArtifact)
            continue;
        const innates = Array.isArray(it.system?.innateAbilities) ? it.system.innateAbilities : [];
        let dice = 0;
        for (const innate of innates) {
            const m = String(innate ?? '').match(/spell\s*focus[^\d]*(\d+)\s*d8/i);
            if (m)
                dice += Math.max(0, Math.floor(Number(m[1]) || 0));
        }
        if (dice > 0) {
            sources.push({ name: String(it.name || 'Weapon').trim() || 'Weapon', dice });
        }
    }
    return sources;
}
export function getSpellDeliveryBonusDice(actor) {
    return listSpellDeliveryDamageSources(actor).reduce((sum, s) => sum + s.dice, 0);
}
//# sourceMappingURL=artifact-delivery-damage.js.map