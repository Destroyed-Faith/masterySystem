/**
 * Combat roll previews for the printable character sheet (Battle Cheat page).
 * Compact cheat lines only — no long effect fluff.
 */
import { getPowerDefinitionRank } from '../utils/power-definition-rank.js';
import { getAttackAttributeForPowerTreeOrSchool } from '../utils/power-roll-attribute.js';
import { artifactLevelToTemplateRank } from '../utils/artifact-spell-pick.js';
import { getTemplate } from '../utils/powers/index.js';
import { artifactSystemHasSpellFocus, resolveArtifactWeaponKind, } from '../utils/artifact-rules.js';
import { deriveArtifactWeaponDamage } from '../utils/artifact-base-derive.js';
import { getActorSpellFocusBonusDice } from '../utils/artifact-base-values.js';
import { resolveEquippedWeaponForAttackType } from '../utils/unarmed-fallback.js';
import { addD8Formulas, parseD8Count } from '../utils/dice-formula.js';
import { formatEffectReference } from '../utils/special-effects.js';
export function isSpellPowerSys(sys) {
    if (sys?.isSpell === true)
        return true;
    return Array.isArray(sys?.tags) && sys.tags.includes('spell');
}
/** Short label for printable sheets (Spell badge tooltip). */
export function buildSpellPrintMeta(sys) {
    if (!isSpellPowerSys(sys))
        return { isSpell: false };
    const attrRaw = String(sys?.castingAttribute ?? 'intellect').trim();
    const attr = attrRaw ? attrRaw.charAt(0).toUpperCase() + attrRaw.slice(1) : '';
    const res = 'Spell Attack';
    return {
        isSpell: true,
        spellLabel: attr ? `${res} (${attr})` : res,
    };
}
export function buildArtifactRowSpellPrintMeta(row) {
    if (!row?.isSpell)
        return { isSpell: false };
    const attrRaw = String(row.castingAttribute ?? 'intellect').trim();
    const attr = attrRaw ? attrRaw.charAt(0).toUpperCase() + attrRaw.slice(1) : '';
    const res = 'Spell Attack';
    return {
        isSpell: true,
        spellLabel: attr ? `${res} (${attr})` : res,
    };
}
function cleanPowerDamage(raw) {
    if (raw === null || raw === undefined || raw === '')
        return '0';
    const s = typeof raw === 'number' ? String(raw) : String(raw).trim();
    const stripped = s.replace(/^\+?\s*/, '').replace(/^Weapon\s+(DMG|Damage)\s*\+\s*/i, '').trim() || '0';
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
    const rider = row?.mechanics?.damageRider?.flat;
    if (rider != null && String(rider).trim())
        return cleanPowerDamage(rider);
    return cleanPowerDamage(sys?.roll?.damage ?? '0');
}
function healDiceForRank(sys, rank) {
    const row = levelRow(sys, rank);
    const flat = row?.mechanics?.healing?.flat;
    if (flat != null && String(flat).trim())
        return cleanPowerDamage(flat);
    return powerDamageForRank(sys, rank);
}
function healFootnoteForRank(rank, aoe) {
    const hl = rank >= 15 ? 4 : rank >= 12 ? 3 : rank >= 8 ? 2 : rank >= 4 ? 1 : 0;
    if (hl <= 0)
        return '';
    const noun = hl === 1 ? 'Health Level' : 'Health Levels';
    let text = `Restore ${hl} ${noun} per Safe Haven Rest.`;
    if (aoe)
        text += ' Only one ally per use.';
    return text;
}
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
function isAoePower(sys, rank) {
    const row = levelRow(sys, rank);
    const typeStr = String(row?.type ?? '');
    if (/aoe|zone/i.test(typeStr))
        return true;
    const aoe = row?.aoe;
    if (!aoe || typeof aoe !== 'object')
        return false;
    const shape = String(aoe.shape ?? '').toLowerCase();
    if (!shape || shape === 'none')
        return false;
    return Number(aoe.radiusM) > 0;
}
function powerAttackTypeForRank(sys, rank) {
    const row = levelRow(sys, rank);
    const typeStr = String(row?.type ?? sys?.type ?? '');
    if (/ranged|zone/i.test(typeStr))
        return 'ranged';
    return 'melee';
}
function attackKindLabel(sys, rank) {
    const row = levelRow(sys, rank);
    const typeStr = String(row?.type ?? '');
    const aoe = isAoePower(sys, rank);
    const ranged = /ranged/i.test(typeStr);
    if (aoe)
        return ranged ? 'Ranged AoE Attack' : 'Melee AoE Attack';
    return ranged ? 'Ranged Attack' : 'Melee Attack';
}
function isHealPower(sys, rank) {
    const row = levelRow(sys, rank);
    if (row?.mechanics?.healing)
        return true;
    const sub = `${sys?.subfamily ?? ''} ${sys?.templateId ?? ''}`;
    return /heal/i.test(sub);
}
function isAttackPower(sys) {
    const action = sys?.cost?.action;
    if (action === 'attack' || action === true)
        return true;
    const slot = String(sys?.slot ?? '').toLowerCase();
    return slot === 'attack';
}
function powerTemplateKey(sys) {
    return `${sys?.subfamily ?? ''} ${sys?.templateId ?? ''}`.trim();
}
/** Martial weapon-attack templates always stack weapon damage (even if mis-tagged as Spell). */
function isWeaponAttackPower(sys) {
    return /weapon-attack|weapon-aoe|weapon-single|targeted-special|active-(melee|ranged)-weapon-|active-(melee|ranged)-(aoe-)?targeted-special/i.test(powerTemplateKey(sys));
}
function usesWeaponDamage(sys, rank) {
    const sub = powerTemplateKey(sys);
    if (/weapon-attack|weapon-aoe|weapon-single|targeted-special|active-(melee|ranged)-weapon-|active-(melee|ranged)-(aoe-)?targeted-special/i.test(sub)) {
        return true;
    }
    if (isAttackPower(sys) && !isSpellPowerSys(sys) && !isHealPower(sys, rank))
        return true;
    const row = levelRow(sys, rank);
    if (row?.mechanics?.damageRider && !isHealPower(sys, rank))
        return true;
    return false;
}
function weaponKind(weapon) {
    if (!weapon)
        return 'melee';
    if (weapon.type === 'artifact') {
        return resolveArtifactWeaponKind(weapon.system?.artifactWeapon, weapon.system?.baseProfile);
    }
    return weapon.system?.weaponType === 'ranged' ? 'ranged' : 'melee';
}
function isArtifactEquipped(item) {
    if (!item)
        return false;
    if (item.system?.equipped === true)
        return true;
    const binding = String(item.system?.binding ?? '').toLowerCase();
    return binding === 'bound' || binding === 'echo';
}
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
function equippedWeaponSpecialsLabels(items) {
    const labels = [];
    for (const item of items) {
        if (item?.type !== 'artifact' || !isArtifactEquipped(item))
            continue;
        const sys = item.system ?? {};
        const level = Math.max(1, Math.min(10, Number(sys.currentLevel) || Number(sys.level) || 1));
        const baseValues = Array.isArray(sys.baseValues) ? sys.baseValues : [];
        for (const bv of baseValues) {
            if (bv?.type !== 'weaponSpecial')
                continue;
            const unlock = bv.slot === 'b' ? 4 : bv.slot === 'c' ? 7 : 1;
            if (level < unlock)
                continue;
            const rank = Number(bv.value);
            const key = String(bv.label ?? '').trim();
            if (!key || !Number.isFinite(rank) || rank <= 0)
                continue;
            labels.push(formatEffectReference({ specialId: key.toLowerCase(), value: rank }));
        }
    }
    return labels;
}
function actorHasDualAttributeWeapon(items) {
    for (const item of items) {
        if (item?.type !== 'artifact' || !isArtifactEquipped(item))
            continue;
        const text = `${item.system?.description ?? ''} ${item.system?.lore ?? ''}`;
        if (/may use might or agility/i.test(text))
            return true;
    }
    return false;
}
function resolveAttackAttribute(actor, weapon, sys, attackType, items) {
    if (actorHasDualAttributeWeapon(items) && usesWeaponDamage(sys, Math.max(1, Number(sys.level ?? sys.rank) || 1))) {
        return 'Might / Agility';
    }
    if (sys.isSpell && sys.castingAttribute) {
        return capAttr(String(sys.castingAttribute).toLowerCase());
    }
    if (weapon) {
        const sysW = weapon.system ?? {};
        const innate = [
            ...(Array.isArray(sysW.innateAbilities) ? sysW.innateAbilities : []),
            ...(Array.isArray(sysW.artifactWeapon?.innateAbilities) ? sysW.artifactWeapon.innateAbilities : []),
            sysW.freeTrait,
            weapon.type === 'artifact' ? weapon.system?.freeTrait : '',
        ];
        if (innate.some((a) => String(a).toLowerCase().includes('finesse'))) {
            return 'Agility';
        }
    }
    const fromTree = getAttackAttributeForPowerTreeOrSchool(sys.tree);
    if (fromTree)
        return capAttr(fromTree);
    const attr = sys.roll?.attribute || sys.attribute;
    if (attr)
        return capAttr(String(attr).toLowerCase());
    return attackType === 'ranged' ? 'Agility' : 'Might';
}
function capAttr(key) {
    return key.charAt(0).toUpperCase() + key.slice(1);
}
function formatBattleRollFormula(weaponDmg, powerDmg, weaponSpecials, powerSpecials, spellFocusDice) {
    const parts = [];
    const wCount = parseD8Count(weaponDmg);
    const pCount = parseD8Count(powerDmg);
    if (wCount > 0)
        parts.push(`WD ${weaponDmg}`);
    if (pCount > 0)
        parts.push(powerDmg);
    for (const ws of weaponSpecials) {
        if (ws && !parts.includes(ws))
            parts.push(ws);
    }
    if (powerSpecials)
        parts.push(powerSpecials);
    let formula = parts.length ? parts.join(' + ') : '0';
    if (spellFocusDice > 0) {
        const base = wCount > 0 || pCount > 0 ? formula : '0';
        formula = `${addD8Formulas(base === '0' ? '0' : base, spellFocusDice)} (${spellFocusDice}d8 Spell Focus)`;
    }
    const show = parseD8Count(formula) > 0 || weaponSpecials.length > 0 || !!powerSpecials || spellFocusDice > 0;
    return { formula, show };
}
function shouldIncludeWeapon(slot, spell, weapon, attackType, sys, rank) {
    if (!weapon || !usesWeaponDamage(sys, rank))
        return false;
    if (spell && !isWeaponAttackPower(sys))
        return false;
    if (artifactSystemHasSpellFocus(weapon.system))
        return false;
    if (weaponKind(weapon) !== attackType)
        return false;
    return slot === 'active' || slot === 'reaction';
}
/**
 * Build compact battle-sheet lines for a power item.
 */
export function buildPrintCombatPreview(actor, powerItem, items, slot = 'active') {
    const sys = powerItem?.system ?? {};
    const rank = Math.max(1, Math.floor(Number(sys.level ?? sys.rank) || 1));
    const spell = isSpellPowerSys(sys);
    const heal = isHealPower(sys, rank);
    const weaponSpecials = equippedWeaponSpecialsLabels(items);
    if (slot === 'activeBuff') {
        const powerDmg = powerDamageForRank(sys, rank);
        const powerSpecials = resolvePowerSpecialsLabel(sys, rank);
        const spellFocusDice = spell ? getActorSpellFocusBonusDice(actor) : 0;
        const { formula, show } = formatBattleRollFormula('0', powerDmg, [], powerSpecials, spellFocusDice);
        if (!show)
            return null;
        return {
            attackLabel: '',
            attackValue: 0,
            rollKind: 'damage',
            damage: formula,
            showDamage: true,
            showAttack: false,
        };
    }
    if (heal) {
        const healDice = healDiceForRank(sys, rank);
        const aoe = isAoePower(sys, rank);
        const footnote = healFootnoteForRank(rank, aoe);
        if (parseD8Count(healDice) <= 0 && !footnote)
            return null;
        return {
            attackLabel: '',
            attackValue: 0,
            rollKind: 'heal',
            damage: healDice,
            footnote: footnote || undefined,
            showDamage: parseD8Count(healDice) > 0,
            showAttack: false,
        };
    }
    const attackType = powerAttackTypeForRank(sys, rank);
    const weapon = resolveWeaponForPrint(items, attackType);
    const powerDmg = powerDamageForRank(sys, rank);
    const powerSpecials = resolvePowerSpecialsLabel(sys, rank);
    const spellFocusDice = spell ? getActorSpellFocusBonusDice(actor) : 0;
    const isMartialRoll = isAttackPower(sys) ||
        (slot === 'reaction' && (parseD8Count(powerDmg) > 0 || weaponSpecials.length > 0));
    if (!isMartialRoll && parseD8Count(powerDmg) <= 0 && !powerSpecials && spellFocusDice <= 0) {
        return null;
    }
    let weaponDmg = '0';
    if (shouldIncludeWeapon(slot, spell, weapon, attackType, sys, rank)) {
        weaponDmg = resolveWeaponBaseDamageString(weapon);
    }
    const wsForRoll = shouldIncludeWeapon(slot, spell, weapon, attackType, sys, rank) ? weaponSpecials : [];
    const { formula, show } = formatBattleRollFormula(weaponDmg, powerDmg, wsForRoll, powerSpecials, spellFocusDice);
    const showAttack = isAttackPower(sys);
    const attr = showAttack
        ? resolveAttackAttribute(actor, weapon, sys, attackType, items)
        : '';
    return {
        attackKind: showAttack ? attackKindLabel(sys, rank) : undefined,
        attackLabel: attr,
        attackValue: 0,
        rollKind: show ? 'damage' : null,
        damage: formula,
        showDamage: show,
        showAttack,
    };
}
/** Battle preview for artifact level-progression rows flagged as Spells. */
export function buildPrintCombatPreviewForArtifactRow(actor, row, items, slot = 'active') {
    if (!row.isSpell || !row.powerTemplateId)
        return null;
    const tpl = getTemplate(row.powerTemplateId);
    if (!tpl?.levels)
        return null;
    const pl = artifactLevelToTemplateRank(row.level);
    let levelRow = tpl.levels[pl];
    if (!levelRow)
        return null;
    if (row.chosenSpecialKey) {
        const specials = (levelRow.specials || []).map((s) => s.key === 'SPECIAL' ? { ...s, key: row.chosenSpecialKey } : s);
        levelRow = { ...levelRow, specials };
    }
    const sys = {
        isSpell: true,
        castingAttribute: row.castingAttribute || 'intellect',
        spellResolution: row.spellResolution,
        level: Number(pl),
        rank: Number(pl),
        cost: tpl.cost,
        subfamily: tpl.subfamily,
        templateId: row.powerTemplateId,
        levels: { [pl]: levelRow },
    };
    return buildPrintCombatPreview(actor, { type: 'power', system: sys }, items, slot);
}
//# sourceMappingURL=character-print-combat.js.map