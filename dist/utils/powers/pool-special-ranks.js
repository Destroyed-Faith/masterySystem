/**
 * v0.9.9.0 printed ranks for Specials that remove Attack / Attribute Pool dice.
 *
 * Shared Active tables stay on the non-pool column (Corrode, Hex, Sundered,
 * Expose, Root, and the rest). These overrides apply only when the chosen
 * Special is Challenge, Disoriented, Soulburn, or Weaken.
 *
 * Source: docs/Rules/Canonical/Actives.md, ActiveBuffs.md, Reactions.md. Do not halve
 * a rank at runtime — the arrays below are the catalogue.
 */
import { aoeSpecialRadiusM, aoeSpecialRank, instantSpecialRank, zoneRadiusM, zoneSpecialRank, } from './instant-special-ranks.js';
export const POOL_REDUCING_SPECIAL_KEYS = ['challenge', 'disoriented', 'soulburn', 'weaken'];
const POOL_REDUCING = new Set(POOL_REDUCING_SPECIAL_KEYS);
export function isPoolReducingSpecial(key) {
    return POOL_REDUCING.has(String(key ?? '').trim().toLowerCase());
}
function clampLevel(level) {
    const n = Math.floor(Number(level) || 0);
    return Math.max(1, Math.min(16, n));
}
const MELEE_AOE_CHALLENGE = [1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4];
const RANGED_AOE_CHALLENGE = [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3];
const MELEE_AOE_POOL6 = [1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4];
const RANGED_AOE_POOL6 = [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3];
const ZONE_CHALLENGE = [null, null, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2];
const ZONE_POOL6 = [null, null, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2];
const POOL6 = new Set(['disoriented', 'soulburn', 'weaken']);
function rowFor(templateId, key) {
    switch (templateId) {
        case 'active-melee-aoe-damage-t5':
            return key === 'challenge' ? MELEE_AOE_CHALLENGE : undefined;
        case 'active-ranged-aoe-damage-t5':
            return key === 'challenge' ? RANGED_AOE_CHALLENGE : undefined;
        case 'active-melee-aoe-damage-t6':
            return POOL6.has(key) ? MELEE_AOE_POOL6 : undefined;
        case 'active-ranged-aoe-damage-t6':
            return POOL6.has(key) ? RANGED_AOE_POOL6 : undefined;
        case 'active-ranged-zone-t5':
            return key === 'challenge' ? ZONE_CHALLENGE : undefined;
        case 'active-ranged-zone-t6':
            return POOL6.has(key) ? ZONE_POOL6 : undefined;
        default:
            return undefined;
    }
}
/**
 * Printed rank for a pool-reducing Special on a known template.
 * `undefined` means "keep the shared non-pool table".
 * `null` means this level prints no Special.
 */
export function poolSpecialRankOverride(templateId, specialKey, level) {
    const id = String(templateId ?? '').trim();
    const key = String(specialKey ?? '').trim().toLowerCase();
    if (!id || !isPoolReducingSpecial(key))
        return undefined;
    const row = rowFor(id, key);
    if (!row)
        return undefined;
    const lvl = clampLevel(level);
    return row[lvl - 1];
}
/** Active Buff: Special Increase. Non-pool curve, or the pool-special curve when `key` is one. */
export function activeBuffSpecialIncrease(level, key) {
    const lvl = clampLevel(level);
    const normal = lvl >= 15 ? 4 : lvl >= 12 ? 3 : lvl >= 8 ? 2 : lvl >= 4 ? 1 : 0;
    if (!isPoolReducingSpecial(key))
        return normal;
    if (lvl >= 12)
        return 2;
    if (lvl >= 8)
        return 1;
    return normal;
}
/** Reaction: Special Increase. Narrower than the Active Buff curve. */
export function reactionSpecialIncrease(level, key) {
    const lvl = clampLevel(level);
    const normal = lvl >= 16 ? 3 : lvl >= 8 ? 2 : lvl >= 4 ? 1 : 0;
    if (!isPoolReducingSpecial(key))
        return normal;
    if (lvl >= 16)
        return 2;
    if (lvl >= 8)
        return 1;
    return normal;
}
export function specialIncreasePair(templateId, level) {
    if (templateId === 'ab-special-overdrive') {
        return {
            amount: activeBuffSpecialIncrease(level),
            poolAmount: activeBuffSpecialIncrease(level, 'challenge'),
        };
    }
    if (templateId === 'reaction-special-increase') {
        return {
            amount: reactionSpecialIncrease(level),
            poolAmount: reactionSpecialIncrease(level, 'challenge'),
        };
    }
    return null;
}
/** Instant Single-Special templates use per-Special printed ranks from docs/Rules/Canonical/Actives.md. */
function instantSpecialTemplateOverride(templateId, specialKey, level) {
    const id = String(templateId ?? '').trim();
    const m = id.match(/^active-(melee|ranged)-instant-special-t[3-6]$/);
    if (!m)
        return undefined;
    return instantSpecialRank(m[1], specialKey, level);
}
/**
 * AoE Special templates (`active-*-aoe-damage-t*`, special-only) use the
 * printed Melee/Ranged AoE Special table of the chosen Special (rank + radius).
 */
function aoeSpecialTemplateOverride(templateId, specialKey, level) {
    const m = String(templateId ?? '').trim().match(/^active-(melee|ranged)-aoe-damage-t[3-6]$/);
    if (!m)
        return undefined;
    const flavour = m[1];
    const rank = aoeSpecialRank(flavour, specialKey, level);
    const radiusM = aoeSpecialRadiusM(flavour, specialKey, level);
    if (rank === undefined && radiusM === undefined)
        return undefined;
    return { rank, radiusM };
}
/**
 * Ranged Persistent Special Zones use the printed Zone table of their tier.
 * Specials without a printed Zone row (Root) keep the template value.
 */
function zoneTemplateOverride(templateId, specialKey, level) {
    const m = String(templateId ?? '').trim().match(/^active-ranged-zone-t([3-6])$/);
    if (!m)
        return undefined;
    const tier = Number(m[1]);
    const rank = zoneSpecialRank(tier, specialKey, level);
    if (rank === undefined)
        return undefined;
    return { rank, radiusM: zoneRadiusM(tier, level) || undefined };
}
/**
 * Bind a `SPECIAL` placeholder and replace the shared-table rank with the
 * printed rank of the chosen Special (Single Target Special, AoE Special,
 * Persistent Zone, or a pool-reducing override). AoE Special and Zone rows also take the printed Radius. Root
 * still cannot print below Root(2).
 */
export function bindPoolSpecialsOnRow(row, chosenKey, templateId, level) {
    const key = String(chosenKey ?? '').trim();
    if (!key || !Array.isArray(row?.specials))
        return row;
    if (!row.specials.some((s) => s?.key === 'SPECIAL'))
        return row;
    const table = aoeSpecialTemplateOverride(templateId, key, level) ?? zoneTemplateOverride(templateId, key, level);
    const override = instantSpecialTemplateOverride(templateId, key, level) ??
        table?.rank ??
        poolSpecialRankOverride(templateId, key, level);
    const specials = row.specials.map((s) => {
        if (s?.key !== 'SPECIAL')
            return s;
        const bound = { ...s, key };
        if (typeof override === 'number')
            bound.rank = override;
        if (key === 'root' && (bound.rank ?? 0) > 0 && (bound.rank ?? 0) < 2)
            bound.rank = 2;
        return bound;
    });
    let effect = row.effect;
    if (typeof override === 'number' && effect?.text && /rank \d+/.test(effect.text)) {
        effect = { ...effect, text: effect.text.replace(/rank \d+/, `rank ${override}`) };
    }
    let aoe = row.aoe;
    const radiusOverride = table?.radiusM;
    if (typeof radiusOverride === 'number' && aoe && typeof aoe === 'object') {
        if (effect?.text && typeof aoe.radiusM === 'number') {
            effect = { ...effect, text: effect.text.replace(`**${aoe.radiusM} m**`, `**${radiusOverride} m**`) };
        }
        aoe = { ...aoe, radiusM: radiusOverride };
    }
    return {
        ...row,
        specials,
        ...(effect ? { effect } : {}),
        ...(aoe ? { aoe } : {}),
    };
}
//# sourceMappingURL=pool-special-ranks.js.map