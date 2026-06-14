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
import { STONE_POWERS } from '../stones/stone-powers.js';
import { artifactPowerRowLabel, } from '../utils/artifact-power-pick.js';
/** Roman numeral per stage index (0-based). */
const STAGE_NUMERALS = ['I', 'II', 'III'];
/** Power Level consulted for each stage (Basic / Improved / Greater). */
const STAGE_POWER_LEVELS = ['4', '10', '16'];
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
function bindChosenSpecialRow(lr, chosenKey) {
    const specials = (lr.specials || []).map((s) => s.key === 'SPECIAL' ? { ...s, key: chosenKey } : s);
    return { ...lr, specials };
}
function powerPickDisplayName(pick, tpl) {
    if (pick.delivery && pick.chosenSpecial?.key) {
        return artifactPowerRowLabel(pick.delivery, pick.chosenSpecial.key);
    }
    return tpl.templateName;
}
/** Human-readable effect text for a Stone Function support row. */
function stoneFunctionEffect(sf) {
    const kindLabel = STONE_KIND_LABELS[sf.kind] || sf.kind;
    const attr = sf.attribute ? ATTRIBUTE_LABELS[sf.attribute] || sf.attribute : '';
    if (sf.kind === 'stonePowerSupport') {
        const sp = sf.stonePowerId ? STONE_POWERS[sf.stonePowerId] : undefined;
        const spName = sp?.name || sf.stonePowerId || '';
        return `${kindLabel}${attr ? ` (${attr})` : ''}${spName ? `: supports ${spName}` : ''}`;
    }
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
            const tpl = pick.powerTemplateId ? getTemplate(pick.powerTemplateId) : undefined;
            if (!tpl)
                continue;
            const displayBase = pick.displayName?.trim() || powerPickDisplayName(pick, tpl);
            const chosenKey = pick.chosenSpecial?.key;
            for (let s = 0; s < STAGE_NUMERALS.length; s++) {
                const level = baseLevel + 3 * s;
                const pl = STAGE_POWER_LEVELS[s];
                const lrRaw = tpl.levels[pl];
                if (!lrRaw)
                    continue;
                const lr = chosenKey ? bindChosenSpecialRow(lrRaw, chosenKey) : lrRaw;
                rows.push({
                    level,
                    name: `${displayBase} ${STAGE_NUMERALS[s]}`,
                    type: lr.type || tpl.category || 'Active',
                    range: clean(renderRange(lr.range ?? null)),
                    aoe: clean(renderAoe(lr.aoe ?? null)),
                    duration: clean(renderDuration(lr.duration)),
                    effect: lr.effect?.text || '',
                    special: clean(renderSpecials(lr.specials || [])),
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
            const effect = stoneFunctionEffect(pick.stoneFunction);
            // Stone Power Support keeps the established "Stone Support" name (matches the
            // seeded echo tables); the other stone kinds name the row after their kind.
            const baseName = pick.displayName?.trim() ||
                (pick.stoneFunction.kind === 'stonePowerSupport'
                    ? 'Stone Support'
                    : STONE_KIND_LABELS[pick.stoneFunction.kind] || 'Stone Function');
            for (let s = 0; s < STAGE_NUMERALS.length; s++) {
                const level = baseLevel + 3 * s;
                rows.push({
                    level,
                    name: `${baseName} ${STAGE_NUMERALS[s]}`,
                    type: 'Support',
                    range: 'Self',
                    aoe: '',
                    duration: 'Passive',
                    effect,
                    special: '',
                });
            }
        }
    }
    rows.sort((a, b) => a.level - b.level);
    return rows;
}
//# sourceMappingURL=progression-compiler.js.map