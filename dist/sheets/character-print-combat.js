/**
 * Combat roll previews for the printable character sheet (Battle Cheat page).
 * Mirrors in-game attack attribute + damage resolution without rolling dice.
 */
import { getPowerDefinitionRank } from '../utils/power-definition-rank.js';
import { getAttackAttributeForPowerTreeOrSchool } from '../utils/power-roll-attribute.js';
import { artifactSystemHasSpellFocus, resolveArtifactWeaponKind, } from '../utils/artifact-rules.js';
import { deriveArtifactWeaponDamage } from '../utils/artifact-base-derive.js';
import { getActorSpellFocusBonusDice } from '../utils/artifact-base-values.js';
import { resolveEquippedWeaponForAttackType } from '../utils/unarmed-fallback.js';
import { addD8Formulas, parseD8Count } from '../utils/dice-formula.js';
import { formatEffectReference } from '../utils/special-effects.js';
function isSpellPower(sys) {
    if (sys?.isSpell === true)
        return true;
    return Array.isArray(sys?.tags) && sys.tags.includes('spell');
}
function cleanPowerDamage(raw) {
    if (raw === null || raw === undefined || raw === '')
        return '0';
    const s = typeof raw === 'number' ? String(raw) : String(raw).trim();
    const stripped = s.replace(/^Weapon\s+(DMG|Damage)\s*\+\s*/i, '').trim() || '0';
    if (/^\d+$/.test(stripped)) {
        const n = parseInt(stripped, 10);
        return n <= 0 ? '0' : `${n}d8`;
    }
    return stripped;
}
function levelRow(sys, rank) {
    const levels = sys?.levels;
    if (!levels || typeof levels !== 'object' || Array.isArray(levels))
        return null;
    const key = String(getPowerDefinitionRank(rank, levels));
    return levels[key] ?? null;
}
function powerDamageForRank(sys, rank) {
    const row = levelRow(sys, rank);
    const dice = row?.effect?.dice ?? row?.roll?.damage;
    if (dice != null && String(dice).trim())
        return cleanPowerDamage(dice);
    return cleanPowerDamage(sys?.roll?.damage ?? '0');
}
/**
 * Resolve the chosen / fixed Specials for the power's current rank into a
 * display label (e.g. "Penetration(3), Stunned(2)"). The unbound template
 * placeholder key `SPECIAL` is skipped.
 */
function resolvePowerSpecialsLabel(sys, rank) {
    const row = levelRow(sys, rank);
    const raw = Array.isArray(row?.specials)
        ? row.specials
        : Array.isArray(sys?.specials)
            ? sys.specials
            : [];
    const labels = [];
    for (const entry of raw) {
        if (typeof entry === 'string') {
            const s = entry.trim();
            if (s && !/^special\b/i.test(s))
                labels.push(s);
            continue;
        }
        const key = String(entry?.key ?? '').trim();
        if (!key || key.toUpperCase() === 'SPECIAL')
            continue;
        const value = entry?.value ?? entry?.rank;
        labels.push(formatEffectReference({ specialId: key, value }));
    }
    return labels.join(', ');
}
function powerAttackTypeForRank(sys, rank) {
    const row = levelRow(sys, rank);
    const typeStr = String(row?.type ?? sys?.type ?? '');
    if (/ranged|zone/i.test(typeStr))
        return 'ranged';
    return 'melee';
}
function isAttackPower(sys) {
    const action = sys?.cost?.action;
    if (action === 'attack' || action === true)
        return true;
    const slot = String(sys?.slot ?? '').toLowerCase();
    return slot === 'attack';
}
function weaponKind(weapon) {
    if (!weapon)
        return 'melee';
    if (weapon.type === 'artifact') {
        return resolveArtifactWeaponKind(weapon.system?.artifactWeapon, weapon.system?.baseProfile);
    }
    return weapon.system?.weaponType === 'ranged' ? 'ranged' : 'melee';
}
/** Resolve equipped weapon for print — prefer full artifact item for damage derivation. */
function resolveWeaponForPrint(items, attackType) {
    const resolved = resolveEquippedWeaponForAttackType(items, attackType);
    if (!resolved)
        return null;
    if (resolved.system?.fromArtifact && resolved.id) {
        const artifact = items.find((i) => i.id === resolved.id && i.type === 'artifact');
        if (artifact)
            return artifact;
    }
    return resolved;
}
function resolveWeaponBaseDamageString(weapon) {
    if (!weapon?.system)
        return '1d8';
    const sys = weapon.system;
    if (weapon.type === 'artifact' && artifactSystemHasSpellFocus(sys))
        return '0';
    const artifactLevel = Math.max(1, Math.min(10, Number(sys.currentLevel) || Number(sys.level) || 1));
    const derived = weapon.type === 'artifact'
        ? deriveArtifactWeaponDamage(sys.baseProfile, artifactLevel)
        : null;
    const artifactWeaponDamage = derived ??
        (typeof sys.artifactWeapon?.damage === 'string' ? sys.artifactWeapon.damage.trim() : '');
    const raw = (artifactWeaponDamage.length > 0 ? artifactWeaponDamage : undefined) ??
        sys.damage ??
        sys.weaponDamage ??
        sys.roll?.damage ??
        '1d8';
    return cleanPowerDamage(raw);
}
function resolveAttackAttribute(actor, weapon, sys, attackType) {
    if (sys.isSpell && sys.castingAttribute) {
        return String(sys.castingAttribute).toLowerCase();
    }
    const fromTree = getAttackAttributeForPowerTreeOrSchool(sys.tree);
    if (fromTree)
        return fromTree;
    const attr = sys.roll?.attribute || sys.attribute;
    if (attr)
        return String(attr).toLowerCase();
    if (weapon) {
        const innate = weapon.system?.innateAbilities || [];
        if (innate.some((a) => String(a).toLowerCase().includes('finesse'))) {
            return 'agility';
        }
    }
    return attackType === 'ranged' ? 'agility' : 'might';
}
function capAttr(key) {
    return key.charAt(0).toUpperCase() + key.slice(1);
}
function formatDamageDisplay(weaponDmg, powerDmg, spellFocusDice, specialsLabel) {
    const wCount = parseD8Count(weaponDmg);
    const pCount = parseD8Count(powerDmg);
    const hasDice = wCount > 0 || pCount > 0 || spellFocusDice > 0;
    if (!hasDice && !specialsLabel) {
        return { damage: '0', showDamage: false };
    }
    let main = '0';
    if (wCount > 0 && pCount > 0)
        main = `${weaponDmg} + ${powerDmg}`;
    else if (wCount > 0)
        main = weaponDmg;
    else if (pCount > 0)
        main = powerDmg;
    if (spellFocusDice > 0) {
        const total = addD8Formulas(main, spellFocusDice);
        main = `${total} (${spellFocusDice}d8 Spell Focus)`;
    }
    if (specialsLabel) {
        main = hasDice ? `${main} + ${specialsLabel}` : specialsLabel;
    }
    return { damage: main, showDamage: true };
}
/**
 * Build attack + damage preview for a power item on the printable Battle Sheet.
 * `slot` controls whether Attack / weapon damage apply (buffs = effect + power dice only).
 */
export function buildPrintCombatPreview(actor, powerItem, items, slot = 'active') {
    const sys = powerItem?.system ?? {};
    const rank = Math.max(1, Math.floor(Number(sys.level ?? sys.rank) || 1));
    const spell = isSpellPower(sys);
    const powerDmg = powerDamageForRank(sys, rank);
    const specialsLabel = resolvePowerSpecialsLabel(sys, rank);
    const spellFocusDice = spell ? getActorSpellFocusBonusDice(actor) : 0;
    if (slot === 'activeBuff') {
        const { damage, showDamage } = formatDamageDisplay('0', powerDmg, spellFocusDice, specialsLabel);
        if (!showDamage)
            return null;
        return {
            attackLabel: '',
            attackValue: 0,
            damage,
            showDamage,
            showAttack: false,
        };
    }
    if (!isAttackPower(sys))
        return null;
    const attackType = powerAttackTypeForRank(sys, rank);
    const weapon = resolveWeaponForPrint(items, attackType);
    const attrKey = resolveAttackAttribute(actor, weapon, sys, attackType);
    const attrValue = Math.max(0, Math.floor(Number(actor?.system?.attributes?.[attrKey]?.value) || 0));
    let weaponDmg = '0';
    if (slot === 'active' &&
        !spell &&
        weapon &&
        weaponKind(weapon) === attackType &&
        !artifactSystemHasSpellFocus(weapon.system)) {
        weaponDmg = resolveWeaponBaseDamageString(weapon);
    }
    const { damage, showDamage } = formatDamageDisplay(weaponDmg, powerDmg, spellFocusDice, specialsLabel);
    return {
        attackLabel: capAttr(attrKey),
        attackValue: attrValue,
        damage,
        showDamage,
        showAttack: true,
    };
}
//# sourceMappingURL=character-print-combat.js.map