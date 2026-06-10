/**
 * Familiar binding: draft validation, stone pool accounting, persist/release on character.
 */
import { buildFamiliarResult, getMaxFamiliarCount, getMaxStonesPerFamiliar, } from './familiar-rules.js';
export const FAMILIAR_POOL_ATTRS = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence',
    'wits',
];
export const SHARED_SENSE_UI = [
    {
        key: 'sight',
        field: 'sharedSight',
        label: 'Sight',
        description: 'See through your Familiar\'s eyes while concentrating.',
    },
    {
        key: 'hearing',
        field: 'sharedHearing',
        label: 'Hearing',
        description: 'Hear what your Familiar hears while concentrating.',
    },
    {
        key: 'tasteSmell',
        field: 'sharedTasteSmell',
        label: 'Taste / Smell',
        description: 'Share taste and scent impressions from your Familiar.',
    },
    {
        key: 'touchPressure',
        field: 'sharedTouch',
        label: 'Touch / Pressure',
        description: 'Feel touch and pressure through your Familiar\'s body.',
    },
];
export function emptyFamiliarDraft() {
    const emptySense = () => ({ enabled: false, attribute: null });
    return {
        name: '',
        img: '',
        movementType: 'ground',
        baseStoneAttr: null,
        upgradeRows: [],
        sharedSight: emptySense(),
        sharedHearing: emptySense(),
        sharedTasteSmell: emptySense(),
        sharedTouch: emptySense(),
    };
}
export function getSharedSenseLabel(group) {
    return SHARED_SENSE_UI.find((s) => s.key === group)?.label ?? group;
}
export function getFamiliarsFromActor(actor) {
    const raw = actor?.system?.familiars;
    return Array.isArray(raw) ? raw : [];
}
export function countDraftBoundStones(draft) {
    let n = draft.baseStoneAttr ? 1 : 0;
    for (const row of draft.upgradeRows) {
        if (row.attribute)
            n += 1;
    }
    for (const s of SHARED_SENSE_UI) {
        const slot = draft[s.field];
        if (slot.enabled && slot.attribute)
            n += 1;
    }
    return n;
}
/** Stones assigned in draft per attribute (for pool reservation UI). */
export function collectDraftStoneCounts(draft) {
    const out = {};
    const bump = (attr) => {
        if (!attr)
            return;
        out[attr] = (out[attr] ?? 0) + 1;
    };
    bump(draft.baseStoneAttr);
    for (const row of draft.upgradeRows)
        bump(row.attribute);
    for (const s of SHARED_SENSE_UI) {
        const slot = draft[s.field];
        if (slot.enabled)
            bump(slot.attribute);
    }
    return out;
}
export function draftToComputationInput(draft, masteryRank) {
    const upgradeStones = draft.upgradeRows
        .filter((r) => r.attribute)
        .map((r) => ({
        id: r.id,
        picks: [r.pickA, r.pickB],
    }));
    const sharedSenses = [];
    for (const s of SHARED_SENSE_UI) {
        const slot = draft[s.field];
        if (slot.enabled && slot.attribute)
            sharedSenses.push(s.key);
    }
    return {
        familiarName: draft.name,
        movementType: draft.movementType,
        upgradeStones,
        sharedSenses,
        masteryRank,
    };
}
export function buildFamiliarResultFromDraft(draft, masteryRank) {
    try {
        return buildFamiliarResult(draftToComputationInput(draft, masteryRank));
    }
    catch {
        return null;
    }
}
export function validateFamiliarDraft(draft, masteryRank, existingFamiliarCount, spendableByAttr) {
    const errors = [];
    const warnings = [];
    const mr = Math.max(1, Math.floor(masteryRank) || 1);
    const maxFamiliars = getMaxFamiliarCount(mr);
    const maxStones = getMaxStonesPerFamiliar(mr);
    if (!draft.name.trim())
        errors.push('Name is required.');
    if (!draft.baseStoneAttr)
        errors.push('Assign a Base Bound Stone from your pool.');
    if (existingFamiliarCount >= maxFamiliars) {
        errors.push(`Maximum familiars reached (Mastery Rank × 4 = ${maxFamiliars}).`);
    }
    const draftCounts = collectDraftStoneCounts(draft);
    const total = countDraftBoundStones(draft);
    if (total > maxStones) {
        errors.push(`Bound stones (${total}) exceed per-Familiar cap (${maxStones}).`);
    }
    for (const [attr, need] of Object.entries(draftCounts)) {
        const have = spendableByAttr[attr] ?? 0;
        if (need > have) {
            errors.push(`Not enough ${attr} stones (need ${need}, have ${have} free).`);
        }
    }
    for (const row of draft.upgradeRows) {
        if (!row.attribute)
            errors.push('Each upgrade stone needs a pool stone assigned.');
        if (row.pickA === row.pickB)
            warnings.push('Upgrade stone has duplicate picks — only one counts.');
    }
    for (const s of SHARED_SENSE_UI) {
        const slot = draft[s.field];
        if (slot.enabled && !slot.attribute) {
            errors.push(`${s.label} requires a Bound Stone from your pool.`);
        }
    }
    const result = buildFamiliarResultFromDraft(draft, mr);
    if (result)
        warnings.push(...result.validationWarnings);
    return { canBind: errors.length === 0, errors, warnings };
}
export function buildBoundFamiliarRecord(draft, ownerActorId, familiarId, masteryRank) {
    const result = buildFamiliarResultFromDraft(draft, masteryRank);
    const upgradeStones = draft.upgradeRows
        .filter((r) => !!r.attribute)
        .map((r) => ({
        id: r.id,
        attribute: r.attribute,
        picks: [r.pickA, r.pickB],
    }));
    const sharedSenses = [];
    for (const s of SHARED_SENSE_UI) {
        const slot = draft[s.field];
        if (slot.enabled && slot.attribute) {
            sharedSenses.push({ group: s.key, attribute: slot.attribute });
        }
    }
    return {
        id: familiarId,
        name: draft.name.trim(),
        img: draft.img.trim(),
        movementType: draft.movementType,
        ownerActorId,
        baseStone: { attribute: draft.baseStoneAttr },
        upgradeStones,
        sharedSenses,
        boundStoneCount: result.totalBoundStones,
        stats: result.finalStats,
        size: result.size,
        locked: true,
    };
}
export function getActorPoolSpendable(actor) {
    const pools = actor?.system?.stonePools ?? {};
    const out = {};
    for (const attr of FAMILIAR_POOL_ATTRS) {
        const pool = pools[attr];
        if (!pool)
            continue;
        const current = Number(pool.current ?? pool.value ?? 0);
        const sustained = Number(pool.sustained ?? 0);
        const max = Number(pool.max ?? pool.maximum ?? 0);
        if (max <= 0 && current <= 0)
            continue;
        out[attr] = Math.max(0, current - sustained);
    }
    return out;
}
export function applySustainedDelta(stonePools, assignments, sign) {
    const next = foundry.utils.duplicate(stonePools);
    for (const [attr, count] of Object.entries(assignments)) {
        if (!next[attr])
            continue;
        const sustained = Number(next[attr].sustained ?? 0);
        next[attr].sustained = Math.max(0, sustained + sign * count);
    }
    return next;
}
export function familiarStoneAssignments(record) {
    const out = {};
    const bump = (attr) => {
        out[attr] = (out[attr] ?? 0) + 1;
    };
    bump(record.baseStone.attribute);
    for (const u of record.upgradeStones)
        bump(u.attribute);
    for (const s of record.sharedSenses)
        bump(s.attribute);
    return out;
}
export function progressionHighlightTiers(result) {
    if (!result)
        return {};
    return {
        HP: result.hpUpgrades,
        Armor: result.armorUpgrades,
        Evade: result.evadeUpgrades,
        Attack: result.attackUpgrades,
        Damage: result.damageUpgrades,
        'Ground (m)': result.movementType === 'ground' ? result.movementUpgrades : -1,
        'Flying (m)': result.movementType === 'flying' ? result.movementUpgrades : -1,
    };
}
export function parseD8Count(formula) {
    const m = String(formula || '').match(/^(\d+)d8$/i);
    return m ? Math.max(1, parseInt(m[1], 10)) : 1;
}
export async function bindFamiliarToActor(actor, draft, masteryRank) {
    const spendable = getActorPoolSpendable(actor);
    const existing = getFamiliarsFromActor(actor).length;
    const validation = validateFamiliarDraft(draft, masteryRank, existing, spendable);
    if (!validation.canBind) {
        ui.notifications?.warn(validation.errors[0] ?? 'Cannot bind familiar.');
        return null;
    }
    const id = typeof globalThis.foundry !== 'undefined' && foundry.utils?.randomID
        ? foundry.utils.randomID(16)
        : `fam-${Date.now()}`;
    const record = buildBoundFamiliarRecord(draft, actor.id, id, masteryRank);
    const assignments = familiarStoneAssignments(record);
    const stonePools = applySustainedDelta(actor.system?.stonePools ?? {}, assignments, 1);
    const familiars = [...getFamiliarsFromActor(actor), record];
    await actor.update({
        'system.familiars': familiars,
        'system.stonePools': stonePools,
    });
    return record;
}
export async function releaseFamiliarFromActor(actor, familiarId) {
    const familiars = getFamiliarsFromActor(actor);
    const idx = familiars.findIndex((f) => f.id === familiarId);
    if (idx < 0)
        return null;
    const record = familiars[idx];
    const assignments = familiarStoneAssignments(record);
    const stonePools = applySustainedDelta(actor.system?.stonePools ?? {}, assignments, -1);
    familiars.splice(idx, 1);
    await actor.update({
        'system.familiars': familiars,
        'system.stonePools': stonePools,
    });
    return record;
}
//# sourceMappingURL=familiar-bind.js.map