/**
 * Picks -> Level Progression compiler.
 *
 * The three Level 1/2/3 progression picks are the single source of truth for an
 * artifact's 1-10 Level Progression table. Each pick (a catalog Power or a Stone
 * Function) is expanded into three staged rows:
 *
 *   Pick L1 -> artifact levels 1 / 4 / 7   (stage I / II / III, PL 4 / 10 / 16)
 *   Pick L2 -> artifact levels 2 / 5 / 8
 *   Pick L3 -> artifact levels 3 / 6 / 9
 *
 * Power picks pull the real per-stage text (range / aoe / duration / effect /
 * special) from the catalog template's PL 4 / 10 / 16 rows, so the change at each
 * stage (radius, damage, special) is visible. There is no Level 10 row.
 */
import { getTemplate } from '../utils/powers/index.js';
import { renderRange, renderAoe, renderDuration, renderSpecials } from '../utils/power-rendering.js';
import { breathWeaponRowDisplay, isBreathWeaponName } from '../utils/breath-weapon.js';
import { STONE_POWERS, STONE_POWER_SUPPORT_TIER_SHIFT, STONE_TIER_HARD_MAX, effectiveStoneSupportPrefillTier, } from '../stones/stone-powers.js';
import { artifactPowerRowLabel, } from '../utils/artifact-power-pick.js';
import { catalogPowerRowLabel, catalogTemplateRequiresSpecial, } from '../utils/artifact-catalog-pick.js';
import { getEffect, getEffectBaseName } from '../utils/special-effects.js';
import { bindPoolSpecialsOnRow } from '../utils/powers/pool-special-ranks.js';
/** Roman numeral per stage index (0-based). */
const STAGE_NUMERALS = ['I', 'II', 'III'];
/** Default Power Levels for staged artifact rows (Basic / Improved / Greater). */
const DEFAULT_STAGE_POWER_LEVELS = ['4', '10', '16'];
function stagePowerLevelsForPick(pick) {
    const custom = pick.stagePowerLevels;
    if (Array.isArray(custom) && custom.length === STAGE_NUMERALS.length) {
        return custom;
    }
    return DEFAULT_STAGE_POWER_LEVELS;
}
function stageNumeralsForPick(pick) {
    const custom = pick.stageNumerals;
    if (Array.isArray(custom) && custom.length === STAGE_NUMERALS.length) {
        return custom;
    }
    return STAGE_NUMERALS;
}
const ATTRIBUTE_LABELS = {
    might: 'Might',
    agility: 'Agility',
    vitality: 'Vitality',
    intellect: 'Intellect',
    resolve: 'Resolve',
    influence: 'Influence',
    wits: 'Wits',
};
const STONE_KIND_LABELS = {
    stonePowerSupport: 'Stone Power Support',
    stonePool: 'Stone Pool',
    stoneRefresh: 'Stone Refresh',
    stoneBattery: 'Stone Battery',
};
/** `renderRange`/`renderAoe`/`renderDuration` return a placeholder for empty data; treat it as blank. */
function clean(s) {
    if (!s)
        return '';
    const t = s.trim();
    if (t === '—' || t === 'N/A')
        return '';
    return t;
}
/** Replace SPECIAL placeholder with the chosen Special key for preview / compile. */
function bindChosenSpecialRow(lr, chosenKey, templateId, level) {
    return bindPoolSpecialsOnRow(lr, chosenKey, templateId, Number(level) || 1);
}
/** Resolve the Special column for a level row (placeholder bind or aura-style). */
function specialTextForRow(lr, chosenKey, templateId, level) {
    if (!chosenKey)
        return clean(renderSpecials(lr.specials || []));
    const hasPlaceholder = (lr.specials || []).some((s) => s.key === 'SPECIAL');
    if (hasPlaceholder) {
        return clean(renderSpecials(bindChosenSpecialRow(lr, chosenKey, templateId, level).specials || []));
    }
    const placeholder = (lr.specials || []).find((s) => s.key === 'SPECIAL');
    const rank = placeholder?.rank ??
        lr.mechanics?.auraPayload?.x ??
        lr.mechanics?.modifySpecial?.amount;
    if (rank != null && Number.isFinite(Number(rank))) {
        return clean(renderSpecials([{ key: chosenKey, rank: Number(rank) }]));
    }
    const ef = getEffect(chosenKey);
    const label = ef ? getEffectBaseName(ef.name) : chosenKey;
    return label;
}
function powerPickDisplayName(pick, tpl) {
    if (pick.delivery && pick.chosenSpecial?.key) {
        return artifactPowerRowLabel(pick.delivery, pick.chosenSpecial.key);
    }
    if (pick.chosenSpecial?.key) {
        return catalogPowerRowLabel(tpl.templateName, pick.chosenSpecial.key);
    }
    return tpl.templateName;
}
/**
 * Staged ranks for optional Specials on weapon AoE artifact picks (Dragon Claws
 * Tail Sweep / similar). Catalog `active-*-weapon-aoe` rows ship `specials: []`;
 * the pick's chosen Special is printed here and injected at runtime via
 * `injectOptionalWeaponAoeChosenSpecial`.
 *
 * Push / Pull follow the same authored metre profile: 2 m / 6 m / 10 m (I / II / III).
 */
export const WEAPON_AOE_PICK_SPECIAL_RANKS = {
    lacerate: [3, 5, 7],
    push: [2, 6, 10],
    pull: [2, 6, 10],
};
/** Map catalog Power Level (default stages 4 / 10 / 16) → stage index 0..2. */
export function weaponAoeStageIndexFromPowerLevel(powerLevel) {
    const pl = Math.max(1, Math.floor(Number(powerLevel) || 1));
    if (pl <= 4)
        return 0;
    if (pl <= 10)
        return 1;
    return 2;
}
export function optionalWeaponAoeSpecialRank(specialKey, stageIndex) {
    const key = String(specialKey || '').trim().toLowerCase();
    const ranks = WEAPON_AOE_PICK_SPECIAL_RANKS[key];
    if (!ranks)
        return null;
    const idx = Math.max(0, Math.min(2, Math.floor(Number(stageIndex) || 0)));
    const rank = ranks[idx];
    return rank != null ? Math.max(0, Math.floor(Number(rank) || 0)) : null;
}
function optionalWeaponAoeSpecialText(chosenKey, stageIndex) {
    const ef = getEffect(chosenKey);
    const label = ef ? getEffectBaseName(ef.name) : chosenKey;
    const rank = optionalWeaponAoeSpecialRank(chosenKey, stageIndex);
    if (rank != null)
        return `${label}(${rank})`;
    return label;
}
/**
 * Weapon AoE templates do not carry a SPECIAL placeholder. When an artifact pick
 * chooses Push / Pull / Lacerate / …, inject that Special into the level row so
 * attack cards and forced movement see `Push(2)` / `Pull(2)` etc.
 */
export function injectOptionalWeaponAoeChosenSpecial(levelData, chosenSpecialKey, templateId, powerLevel) {
    if (!levelData || !chosenSpecialKey)
        return levelData;
    if (!/weapon-aoe/i.test(String(templateId || '')))
        return levelData;
    const key = String(chosenSpecialKey).trim();
    if (!key)
        return levelData;
    const specials = Array.isArray(levelData.specials) ? [...levelData.specials] : [];
    if (specials.some((s) => String(s?.key || '').toUpperCase() === 'SPECIAL')) {
        return levelData;
    }
    if (specials.some((s) => String(s?.key || '').toLowerCase() === key.toLowerCase())) {
        return levelData;
    }
    const rank = optionalWeaponAoeSpecialRank(key, weaponAoeStageIndexFromPowerLevel(powerLevel));
    if (rank == null || rank <= 0)
        return levelData;
    return {
        ...levelData,
        specials: [...specials, { key: key.toLowerCase(), rank }],
    };
}
/** Human-readable effect text for a Stone Function support row at stage I / II / III. */
function stoneFunctionEffect(sf, stageIndex) {
    const attr = sf.attribute ? ATTRIBUTE_LABELS[sf.attribute] || sf.attribute : '';
    const attrLabel = attr ? `${attr} ` : '';
    if (sf.kind === 'stonePowerSupport') {
        const sp = sf.stonePowerId
            ? STONE_POWERS[sf.stonePowerId]
            : undefined;
        const spName = sp?.name || sf.stonePowerId || 'Stone Power';
        const powerId = sf.stonePowerId || '';
        const shift = powerId ? STONE_POWER_SUPPORT_TIER_SHIFT[powerId] ?? 0 : 0;
        const printedRank = Math.min(STONE_TIER_HARD_MAX, stageIndex + 2 + shift);
        const prefillRank = powerId
            ? effectiveStoneSupportPrefillTier(powerId, printedRank)
            : printedRank;
        const lowerRanks = Array.from({ length: Math.max(0, prefillRank - 1) }, (_, i) => i + 1).join(', ');
        const many = lowerRanks.includes(',');
        const payNote = lowerRanks
            ? ` Rank${many ? 's' : ''} ${lowerRanks} must still be paid normally.`
            : '';
        return `Supports the ${attrLabel}Ability: ${spName} Stone Power and pre-fills Rank ${prefillRank}.${payNote}`;
    }
    if (sf.kind === 'stonePool') {
        const amount = [2, 4, 8][stageIndex];
        return `After each Safe Haven Rest, store ${amount} ${attrLabel}Stone${amount === 1 ? '' : 's'}. These Stones may only be used for this Artifact's listed ${attrLabel}Stone functions.`;
    }
    if (sf.kind === 'stoneRefresh') {
        const amount = [1, 2, 4][stageIndex];
        return `Restore ${amount} spent ${attrLabel}Stone${amount === 1 ? '' : 's'}.`;
    }
    if (sf.kind === 'stoneBattery') {
        const cap = [10, 20, 40][stageIndex];
        return `Gain a ${attrLabel}Stone Battery (capacity ${cap}).`;
    }
    const kindLabel = STONE_KIND_LABELS[sf.kind] || sf.kind;
    return `${kindLabel}${attr ? ` (${attr})` : ''}`;
}
/**
 * Expand the up-to-three progression picks into a Level Progression table.
 * Returns rows for levels 1-9 (no Level 10 Ultimate), sorted by level.
 */
export function deriveLevelProgressionFromPicks(picks) {
    const rows = [];
    const byLevel = new Map();
    for (const p of picks || []) {
        const lvl = Number(p?.level);
        if (lvl >= 1 && lvl <= 3)
            byLevel.set(lvl, p);
    }
    for (const baseLevel of [1, 2, 3]) {
        const pick = byLevel.get(baseLevel);
        if (!pick || pick.kind === 'none')
            continue;
        if (pick.kind === 'power') {
            const chosenKey = pick.chosenSpecial?.key;
            const powerLevels = stagePowerLevelsForPick(pick);
            const numerals = stageNumeralsForPick(pick);
            const perStageTemplates = Array.isArray(pick.stageTemplateIds) &&
                pick.stageTemplateIds.length === STAGE_NUMERALS.length
                ? pick.stageTemplateIds
                : null;
            const perStageNames = Array.isArray(pick.stageNames) && pick.stageNames.length === STAGE_NUMERALS.length
                ? pick.stageNames
                : null;
            for (let s = 0; s < STAGE_NUMERALS.length; s++) {
                const level = baseLevel + 3 * s;
                const pl = powerLevels[s];
                const templateId = perStageTemplates?.[s] || pick.powerTemplateId || '';
                const tpl = templateId ? getTemplate(templateId) : undefined;
                if (!tpl)
                    continue;
                const displayBase = pick.displayName?.trim() || powerPickDisplayName(pick, tpl);
                const isWeaponAoe = /weapon-aoe/.test(templateId);
                const lrRaw = tpl.levels[pl];
                if (!lrRaw)
                    continue;
                const lr = chosenKey ? bindChosenSpecialRow(lrRaw, chosenKey, templateId, Number(pl) || 1) : lrRaw;
                // Printed artifact-exclusive profiles override the catalog effect text.
                const effectOverride = pick.stageEffectTexts?.[s]?.trim();
                const effectText = effectOverride
                    ? effectOverride
                    : chosenKey && catalogTemplateRequiresSpecial(templateId)
                        ? (lr.effect?.text || '').replace(/\bSPECIAL\b/g, chosenKey)
                        : (lr.effect?.text || '');
                const specialCol = pick.isSpell
                    ? [specialTextForRow(lrRaw, chosenKey, templateId, Number(pl) || 1), 'Spell'].filter(Boolean).join(', ')
                    : chosenKey && isWeaponAoe && !catalogTemplateRequiresSpecial(templateId)
                        ? optionalWeaponAoeSpecialText(chosenKey, s)
                        : specialTextForRow(lrRaw, chosenKey, templateId, Number(pl) || 1);
                const rowName = perStageNames?.[s]?.trim() || `${displayBase} ${numerals[s]}`;
                // Dragon Head Breath Weapon: dual Damage/Ruin Cone lengths (Core specialty).
                const rangeAoe = isBreathWeaponName(rowName)
                    ? breathWeaponRowDisplay(level)
                    : { range: clean(renderRange(lr.range ?? null)), aoe: clean(renderAoe(lr.aoe ?? null)) };
                rows.push({
                    level,
                    name: rowName,
                    type: lr.type || tpl.category || 'Active',
                    range: rangeAoe.range,
                    aoe: rangeAoe.aoe,
                    duration: clean(renderDuration(lr.duration)),
                    effect: effectText,
                    special: specialCol,
                    powerTemplateId: templateId,
                    chosenSpecialKey: chosenKey,
                    ...(pick.isSpell
                        ? {
                            isSpell: true,
                            castingAttribute: pick.castingAttribute || 'intellect',
                            spellResolution: pick.spellResolution || tpl.spellHints?.defaultResolution || 'spellAttack',
                        }
                        : {}),
                });
            }
        }
        else if (pick.kind === 'authored' && Array.isArray(pick.authoredStages)) {
            // Bespoke line: emit the stored staged rows verbatim at levels
            // base / base+3 / base+6 (stage I / II / III). No catalog lookup.
            const stages = pick.authoredStages.slice(0, STAGE_NUMERALS.length);
            for (let s = 0; s < stages.length; s++) {
                const stored = stages[s];
                if (!stored)
                    continue;
                const level = baseLevel + 3 * s;
                rows.push({
                    level,
                    name: stored.name || '',
                    type: stored.type || '',
                    range: stored.range || '',
                    aoe: stored.aoe || '',
                    duration: stored.duration || '',
                    effect: stored.effect || '',
                    special: stored.special || '',
                });
            }
        }
        else if (pick.kind === 'stoneFunction' && pick.stoneFunction) {
            const baseName = pick.displayName?.trim() ||
                (pick.stoneFunction.kind === 'stonePowerSupport'
                    ? 'Stone Support'
                    : STONE_KIND_LABELS[pick.stoneFunction.kind] || 'Stone Function');
            const numerals = stageNumeralsForPick(pick);
            for (let s = 0; s < STAGE_NUMERALS.length; s++) {
                const level = baseLevel + 3 * s;
                const sf = pick.stoneFunction;
                rows.push({
                    level,
                    name: `${baseName} ${numerals[s]}`,
                    type: STONE_KIND_LABELS[sf.kind] || 'Support',
                    range: 'Self',
                    aoe: '',
                    duration: sf.kind === 'stonePowerSupport' || sf.kind === 'stoneRefresh' ? 'Instant' : 'Passive',
                    effect: stoneFunctionEffect(sf, s),
                    special: sf.stonePowerId || sf.kind,
                });
            }
        }
    }
    rows.sort((a, b) => a.level - b.level);
    return rows;
}
//# sourceMappingURL=progression-compiler.js.map