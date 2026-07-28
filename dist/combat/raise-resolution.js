/**
 * Raise resolution — Players Guide Raise rules.
 *
 * Declared Raises create a Raise TN (+4 each) while Normal TN stays fixed.
 * Raise Cost is paid before the roll; restored only on full Raise success.
 */
import { RAISE_INCREMENT } from '../utils/constants.js';
import { clampAtZero, formatD8Count, parseD8Count } from '../utils/dice-formula.js';
import { artifactLevelToTemplateRank } from '../utils/artifact-spell-pick.js';
function cloneSnapshot(s) {
    return {
        ...s,
        specials: s.specials.map((x) => ({ ...x })),
    };
}
export function computeRaiseTns(normalTn, declaredRaiseSlots) {
    const base = Math.max(0, Math.floor(normalTn));
    const slots = Math.max(0, Math.floor(declaredRaiseSlots));
    return {
        normalTn: base,
        raiseTn: slots > 0 ? base + slots * RAISE_INCREMENT : base,
    };
}
/**
 * All-or-nothing: partial only when declared raises > 0 and total meets Normal TN
 * but not Raise TN.
 */
export function resolveRaiseOutcome(total, normalTn, declaredRaiseSlots, 
/** Intellect Spell Raises: bonus applied only when checking Raise TN. */
raiseTnRollBonus = 0) {
    const t = Number(total) || 0;
    const normal = Math.max(0, Math.floor(normalTn));
    const slots = Math.max(0, Math.floor(declaredRaiseSlots));
    const raiseBonus = Math.max(0, Math.floor(raiseTnRollBonus));
    if (t < normal)
        return 'fail';
    if (slots <= 0)
        return 'full';
    const { raiseTn } = computeRaiseTns(normal, slots);
    return t + raiseBonus >= raiseTn ? 'full' : 'partial';
}
/** Total raise slots from declared raise plan. */
export function countRaiseSlots(raises) {
    return raises.reduce((sum, r) => sum + (r.slots === 2 ? 2 : 1), 0);
}
/** Martial: MR d8 per raise slot. Spell: MR total value per raise slot. */
export function raiseCostPerSlot(masteryRank) {
    return Math.max(1, Math.floor(masteryRank));
}
/**
 * Default spell cost split: damage dice first, then special rank (largest first).
 */
export function defaultSpellCostAllocation(snapshot, totalValue) {
    let remaining = Math.max(0, Math.floor(totalValue));
    const out = { damageDice: 0, specialByKey: {} };
    const fromDamage = Math.min(snapshot.damageDice, remaining);
    out.damageDice = fromDamage;
    remaining -= fromDamage;
    if (remaining <= 0)
        return out;
    const sorted = [...snapshot.specials].sort((a, b) => b.rank - a.rank);
    for (const sp of sorted) {
        if (remaining <= 0)
            break;
        const take = Math.min(sp.rank, remaining);
        if (take > 0) {
            out.specialByKey[sp.key] = (out.specialByKey[sp.key] ?? 0) + take;
            remaining -= take;
        }
    }
    return out;
}
export function computeTotalRaiseCost(raiseSlots, masteryRank) {
    return raiseCostPerSlot(masteryRank) * Math.max(0, Math.floor(raiseSlots));
}
/** Apply raise cost to a snapshot (pre-roll state). */
export function applyRaiseCost(snapshot, cost) {
    const next = cloneSnapshot(snapshot);
    next.damageDice = clampAtZero(next.damageDice - cost.damageDice);
    for (const sp of next.specials) {
        const paid = cost.specialByKey[sp.key] ?? 0;
        sp.rank = clampAtZero(sp.rank - paid);
    }
    next.specials = next.specials.filter((sp) => sp.rank > 0);
    return next;
}
function applyOneRaiseEffect(snap, raise, masteryRank, isSpell) {
    const mr = Math.max(1, Math.floor(masteryRank));
    switch (raise.effect) {
        case 'damage':
            snap.damageDice += isSpell ? 1 : mr;
            break;
        case 'specialPlus': {
            const key = raise.targetSpecialKey;
            if (!key)
                break;
            const sp = snap.specials.find((s) => s.key === key);
            if (sp)
                sp.rank += mr;
            break;
        }
        case 'rangePlus':
            if (snap.hasRange && snap.rangeM != null)
                snap.rangeM += 4;
            break;
        case 'aoeRadiusPlus':
            if (snap.hasAoe && snap.aoeRadiusM != null)
                snap.aoeRadiusM += 1;
            break;
        case 'durationPlus':
            if (snap.hasDuration)
                snap.durationSteps += 1;
            break;
        default:
            break;
    }
}
/** Apply stone bonus as default damage raise (martial +MR, spell +1d8 each). */
function applyStoneBonusRaises(snap, count, masteryRank, isSpell) {
    const n = Math.max(0, Math.floor(count));
    const mr = Math.max(1, Math.floor(masteryRank));
    for (let i = 0; i < n; i++) {
        snap.damageDice += isSpell ? 1 : mr;
    }
}
/**
 * Resolve final power snapshot from base, declared raises, outcome, and stone bonus.
 */
export function resolvePowerSnapshot(params) {
    const { base, declaredRaises, outcome, masteryRank, isSpell, stoneBonusRaises = 0, spellCostOverride, } = params;
    if (outcome === 'fail') {
        return cloneSnapshot(base);
    }
    const slots = countRaiseSlots(declaredRaises);
    const costValue = computeTotalRaiseCost(slots, masteryRank);
    const costAlloc = isSpell
        ? spellCostOverride ?? defaultSpellCostAllocation(base, costValue)
        : { damageDice: costValue, specialByKey: {} };
    if (outcome === 'partial') {
        return applyRaiseCost(base, costAlloc);
    }
    // Full success: cost restored (start from base), then apply raise effects + stones.
    const snap = cloneSnapshot(base);
    for (const r of declaredRaises) {
        applyOneRaiseEffect(snap, r, masteryRank, isSpell);
    }
    if (stoneBonusRaises > 0) {
        applyStoneBonusRaises(snap, stoneBonusRaises, masteryRank, isSpell);
    }
    return snap;
}
/** Pre-roll snapshot after paying raise cost (for UI preview). */
export function previewAfterRaiseCost(base, declaredRaises, masteryRank, isSpell, spellCostOverride) {
    const slots = countRaiseSlots(declaredRaises);
    if (slots <= 0)
        return cloneSnapshot(base);
    const costValue = computeTotalRaiseCost(slots, masteryRank);
    const cost = spellCostOverride ??
        (isSpell
            ? defaultSpellCostAllocation(base, costValue)
            : { damageDice: costValue, specialByKey: {} });
    return applyRaiseCost(base, cost);
}
export function buildAvailableRaiseOptions(snapshot, isSpell) {
    const options = [];
    const damageLabel = isSpell ? '+1d8 Spell Damage' : '+MR Damage Dice';
    options.push({
        id: 'damage',
        label: damageLabel,
        effect: 'damage',
        slots: 1,
    });
    for (const sp of snapshot.specials) {
        const name = sp.key.charAt(0).toUpperCase() + sp.key.slice(1);
        options.push({
            id: `special:${sp.key}`,
            label: `Increase ${name}(${sp.rank}) by +MR`,
            effect: 'specialPlus',
            targetSpecialKey: sp.key,
            slots: 1,
        });
    }
    if (snapshot.hasRange) {
        options.push({
            id: 'range',
            label: '+4 m Range',
            effect: 'rangePlus',
            slots: 1,
        });
    }
    if (snapshot.hasAoe) {
        options.push({
            id: 'aoe',
            label: '+1 m AoE Radius (2 Raises)',
            effect: 'aoeRadiusPlus',
            slots: 2,
        });
    }
    if (isSpell && snapshot.hasDuration) {
        options.push({
            id: 'duration',
            label: '+1 Duration Step (2 Raises)',
            effect: 'durationPlus',
            slots: 2,
        });
    }
    return options;
}
export function formatSnapshotSummary(snapshot) {
    const parts = [];
    if (snapshot.damageDice > 0)
        parts.push(formatD8Count(snapshot.damageDice));
    for (const sp of snapshot.specials) {
        const name = sp.key.charAt(0).toUpperCase() + sp.key.slice(1);
        parts.push(`${name}(${sp.rank})`);
    }
    if (snapshot.hasRange && snapshot.rangeM != null) {
        parts.push(`Range ${snapshot.rangeM}m`);
    }
    if (snapshot.hasAoe && snapshot.aoeRadiusM != null) {
        parts.push(`AoE ${snapshot.aoeRadiusM}m`);
    }
    if (snapshot.hasDuration && snapshot.durationSteps > 0) {
        parts.push(`Duration +${snapshot.durationSteps}`);
    }
    return parts.length ? parts.join(', ') : '—';
}
/** Build a PowerSnapshot from level row data (attack card / damage dialog). */
export function buildPowerSnapshotFromLevelData(levelData, fallbackDamage, fallbackSpecials) {
    let damageStr = fallbackDamage;
    const specials = [];
    if (levelData) {
        if (levelData.effect?.dice)
            damageStr = levelData.effect.dice;
        else if (levelData.roll?.damage)
            damageStr = levelData.roll.damage;
        if (Array.isArray(levelData.specials)) {
            for (const s of levelData.specials) {
                if (typeof s === 'string') {
                    const m = s.match(/^([^(]+)(?:\((\d+)\))?$/i);
                    if (m) {
                        specials.push({
                            key: m[1].trim().toLowerCase().replace(/\s+/g, '-'),
                            rank: m[2] ? parseInt(m[2], 10) : 1,
                        });
                    }
                }
                else if (s && typeof s === 'object') {
                    const key = String(s.key ?? s.type ?? '').toLowerCase();
                    // An unbound `SPECIAL` picker placeholder is not a real Special —
                    // never let it reach the damage/status pipeline as "Special(X)".
                    if (key === 'special')
                        continue;
                    const rank = Number(s.rank ?? s.value ?? 1);
                    if (key)
                        specials.push({ key, rank: Math.max(0, rank) });
                }
            }
        }
    }
    if (specials.length === 0 && fallbackSpecials.length) {
        for (const s of fallbackSpecials) {
            const m = String(s).match(/^([^(]+)(?:\((\d+)\))?$/i);
            if (m) {
                specials.push({
                    key: m[1].trim().toLowerCase().replace(/\s+/g, '-'),
                    rank: m[2] ? parseInt(m[2], 10) : 1,
                });
            }
        }
    }
    const range = levelData?.range ?? null;
    const aoe = levelData?.aoe ?? null;
    const duration = levelData?.duration ?? null;
    const hasRange = !!range &&
        range.kind === 'distance' &&
        typeof range.m === 'number' &&
        range.m > 0;
    const aoeRadius = aoe?.radiusM ?? aoe?.sizeM ?? aoe?.m ?? null;
    const hasAoe = !!aoe &&
        aoe.shape !== 'none' &&
        aoe.shape !== 'single' &&
        typeof aoeRadius === 'number' &&
        aoeRadius > 0;
    const hasDuration = !!duration &&
        duration.kind !== 'instant' &&
        duration.kind !== 'endOfTurn';
    return {
        damageDice: parseD8Count(damageStr),
        specials,
        rangeM: hasRange ? (range.m ?? null) : null,
        aoeRadiusM: hasAoe ? Number(aoeRadius) : null,
        durationSteps: hasDuration ? 1 : 0,
        hasRange,
        hasAoe,
        hasDuration,
    };
}
/**
 * Bind the `SPECIAL` picker placeholder in a level row to the item's chosen
 * Special. Catalog Martial/support templates carry `{ key: 'SPECIAL' }` rows;
 * item creation binds them into `system.levels`, but whenever level data is
 * (re-)read from the raw template the placeholder must be bound again —
 * otherwise the damage pipeline emits a meaningless "Special(X)" instead of
 * e.g. "Sundered(X)" and no status effect lands on the target.
 */
export function bindChosenSpecialIntoLevelData(levelData, chosenSpecialKey) {
    if (!levelData || !chosenSpecialKey || !Array.isArray(levelData.specials))
        return levelData;
    if (!levelData.specials.some((s) => s?.key === 'SPECIAL'))
        return levelData;
    return {
        ...levelData,
        specials: levelData.specials.map((s) => s?.key === 'SPECIAL' ? { ...s, key: chosenSpecialKey } : s),
    };
}
/** Parse raise plan JSON from attack card data attribute. */
export function parseDeclaredRaises(raw) {
    if (!raw)
        return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter((r) => r && typeof r.effect === 'string' && (r.slots === 1 || r.slots === 2));
    }
    catch {
        return [];
    }
}
export function snapshotToDamageFormula(snapshot) {
    return formatD8Count(snapshot.damageDice);
}
export function snapshotToSpecialStrings(snapshot) {
    return snapshot.specials.map((sp) => {
        const name = sp.key.charAt(0).toUpperCase() + sp.key.slice(1);
        return `${name}(${sp.rank})`;
    });
}
/** Load template level data for an artifact radial option flagged as a Spell. */
export async function loadPowerSnapshotForArtifactOption(option) {
    if (!option.artifactIsSpell || !option.artifactPowerTemplateId)
        return null;
    const templateId = option.artifactPowerTemplateId;
    const pl = artifactLevelToTemplateRank(option.artifactRowLevel || 1);
    const chosenKey = option.artifactChosenSpecialKey;
    let levelData = null;
    try {
        const powersModule = await import('../utils/powers/index.js');
        const templates = powersModule.ALL_POWER_TEMPLATES || [];
        const powerDef = templates.find((t) => t?.templateId === templateId);
        if (powerDef?.levels) {
            levelData = powerDef.levels[pl] ?? null;
            if (levelData && chosenKey) {
                const specials = (levelData.specials || []).map((s) => s.key === 'SPECIAL' ? { ...s, key: chosenKey } : s);
                levelData = { ...levelData, specials };
            }
        }
    }
    catch {
        /* template optional */
    }
    const fallbackSpecials = (levelData?.specials || []).map((s) => s.rank != null ? `${s.key}(${s.rank})` : s.key);
    const snapshot = buildPowerSnapshotFromLevelData(levelData, '0', fallbackSpecials);
    return { snapshot, isSpell: true, levelData };
}
/** Load template level data for a power item (attack card / damage dialog). */
export async function loadPowerSnapshotForItem(powerItem) {
    const powerSystem = powerItem?.system ?? {};
    const isSpell = powerSystem.isSpell === true ||
        (Array.isArray(powerSystem.tags) && powerSystem.tags.includes('spell'));
    const rawLevel = powerSystem.level || 1;
    const fallbackDamage = String(powerSystem.roll?.damage ?? '0');
    const fallbackSpecials = Array.isArray(powerSystem.specials)
        ? [...powerSystem.specials]
        : [];
    let levelData = null;
    try {
        const powersModule = await import('../utils/powers/index.js');
        const templates = powersModule.ALL_POWER_TEMPLATES || [];
        const templateId = powerSystem.templateId;
        let powerDef = null;
        if (templateId) {
            powerDef = templates.find((t) => t?.templateId === templateId);
        }
        if (!powerDef) {
            powerDef = templates.find((t) => t?.templateName === powerItem.name || t?.name === powerItem.name);
        }
        if (powerDef?.levels) {
            const { getPowerDefinitionRank } = await import('../utils/power-definition-rank.js');
            const definitionRank = getPowerDefinitionRank(rawLevel, powerSystem.levels || powerDef.levels);
            // Prefer the item's own bound levels (SPECIAL placeholder already
            // replaced by chosenSpecial at item creation) over the raw template.
            const levelsSource = powerSystem.levels || powerDef.levels;
            if (Array.isArray(levelsSource)) {
                levelData = levelsSource.find((l) => l.level === definitionRank);
            }
            else {
                levelData = levelsSource[String(definitionRank)];
            }
        }
    }
    catch {
        /* template optional */
    }
    levelData = bindChosenSpecialIntoLevelData(levelData, powerSystem.chosenSpecial?.key);
    const snapshot = buildPowerSnapshotFromLevelData(levelData, fallbackDamage, fallbackSpecials);
    return { snapshot, isSpell, levelData };
}
/** Map raise option id from UI to DeclaredRaise. */
export function declaredRaiseFromOptionId(optionId, options) {
    const opt = options.find((o) => o.id === optionId);
    if (!opt)
        return null;
    return {
        effect: opt.effect,
        targetSpecialKey: opt.targetSpecialKey,
        slots: opt.slots,
    };
}
//# sourceMappingURL=raise-resolution.js.map