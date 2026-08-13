/**
 * Canonical Summon Power allowlist.
 * Movement Powers are excluded — they would bypass the Bond Movement upgrade.
 * Only listed Passives / Active Buffs / Reactions may be bought for a Body.
 */
import { getTemplate } from '../utils/powers/templates/index.js';
import { ppBudgetForLevel } from '../utils/powers/pp-budget.js';
import { maxSummonPowerLevel, powerTokenCostFromPp, standardPowerTokenCost, } from './summon-bond-rules.js';
export const SUMMON_POWER_ALLOWLIST = [
    // Actives — unarmed / bond-attack legal
    'active-melee-damage-t3',
    'active-melee-damage-t4',
    'active-ranged-damage-t3',
    'active-ranged-damage-t4',
    'active-melee-targeted-special',
    'active-ranged-targeted-special',
    'active-melee-health-level-heal',
    'active-ranged-health-level-heal',
    'active-mental-attack',
    // Summon-specific + simple defensive/offensive buffs
    'ab-summon-damage-aura',
    'ab-summon-armor-aura',
    'ab-armor',
    'ab-evade',
    'ab-temp-hp',
    'ab-damage',
    'ab-invisibility',
    // Passives that do not grant extra actions / stones / another bond
    'passive-fortified-frame',
    'passive-evade',
    'passive-temp-hp',
    'passive-regeneration',
    'passive-spell-resistance',
    'passive-ward',
    'passive-invisibility',
    'passive-thornhide',
    // Reactions — Bond still has only 1 Reaction / round
    'reaction-armor',
    'reaction-evade',
    'reaction-temp-hp',
    'reaction-reposition',
    'reaction-counter-damage',
];
export function isSummonPowerAllowed(templateId) {
    return SUMMON_POWER_ALLOWLIST.includes(templateId);
}
/** Written PP for a summon purchase: Active uses 30×Level; others use the standard table ×10. */
export function summonPowerPpCost(category, level, explicitPp) {
    if (explicitPp != null && Number.isFinite(explicitPp) && explicitPp > 0) {
        return Math.floor(explicitPp);
    }
    const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 1)));
    switch (category) {
        case 'active':
            return ppBudgetForLevel(lvl);
        case 'passive':
        case 'reaction':
            return 20 * lvl;
        case 'activeBuff':
            return 30 * lvl + 10;
        case 'movement':
            return 0;
        default:
            return 0;
    }
}
export function summonPowerTokenCost(category, level, explicitPp) {
    const pp = summonPowerPpCost(category, level, explicitPp);
    const fromPp = powerTokenCostFromPp(pp);
    if (fromPp > 0)
        return fromPp;
    const fallback = standardPowerTokenCost(category, level, explicitPp);
    return Math.max(1, fallback);
}
export function evaluateSummonPower(templateId, level, ownerMasteryRank) {
    const tpl = getTemplate(templateId);
    const name = tpl?.name ?? templateId;
    const category = String(tpl?.category ?? 'active');
    const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 1)));
    const maxLvl = maxSummonPowerLevel(ownerMasteryRank);
    const ppCost = summonPowerPpCost(category, lvl);
    const tokenCost = summonPowerTokenCost(category, lvl);
    if (category === 'movement') {
        return {
            templateId,
            name,
            category,
            level: lvl,
            ppCost,
            tokenCost: 0,
            legal: false,
            reason: 'Movement Powers cannot be bought as Body Powers — they would bypass the Bond Movement upgrade.',
        };
    }
    if (!tpl) {
        return {
            templateId,
            name,
            category,
            level: lvl,
            ppCost,
            tokenCost,
            legal: false,
            reason: 'Unknown power template.',
        };
    }
    if (!isSummonPowerAllowed(templateId)) {
        return {
            templateId,
            name,
            category,
            level: lvl,
            ppCost,
            tokenCost,
            legal: false,
            reason: 'Not on the canonical Summon Power allowlist.',
        };
    }
    if (lvl > maxLvl) {
        return {
            templateId,
            name,
            category,
            level: lvl,
            ppCost,
            tokenCost,
            legal: false,
            reason: `Power Level ${lvl} exceeds owner MR cap (max L${maxLvl}).`,
        };
    }
    return {
        templateId,
        name,
        category,
        level: lvl,
        ppCost,
        tokenCost,
        legal: true,
        reason: 'Legal for this Bond.',
    };
}
export function listSummonPowerCatalog(ownerMasteryRank, level = 1) {
    return SUMMON_POWER_ALLOWLIST.map((id) => evaluateSummonPower(id, level, ownerMasteryRank)).sort((a, b) => a.name.localeCompare(b.name));
}
//# sourceMappingURL=summon-power-allowlist.js.map