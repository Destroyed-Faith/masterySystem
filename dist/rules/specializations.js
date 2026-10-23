/**
 * Free-named Specializations organized into seven Fields.
 * Replaces the fixed purchasable Skill catalog.
 */
export const SKILL_FIELDS = [
    'physical',
    'finesse',
    'survival',
    'science-craft',
    'occult',
    'social',
    'investigation',
];
export const SKILL_FIELD_LABELS = {
    physical: 'Physical',
    finesse: 'Finesse',
    survival: 'Survival',
    'science-craft': 'Science & Craft',
    occult: 'Occult',
    social: 'Social',
    investigation: 'Investigation',
};
export function normalizeSpecializationName(name) {
    return String(name || '')
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}
export function specializationIdentityKey(name, field) {
    return `${field}:${normalizeSpecializationName(name)}`;
}
export function isSkillField(value) {
    return SKILL_FIELDS.includes(String(value || ''));
}
export function validateSpecializationList(specs, opts) {
    const errors = [];
    const seen = new Set();
    for (const spec of specs) {
        const name = String(spec.name || '').trim();
        if (!name) {
            errors.push('Specialization name is required.');
            continue;
        }
        if (!isSkillField(String(spec.field || ''))) {
            errors.push(`Invalid Field for "${name}".`);
            continue;
        }
        const key = specializationIdentityKey(name, spec.field);
        if (seen.has(key)) {
            errors.push(`Duplicate Specialization: ${name} (${SKILL_FIELD_LABELS[spec.field]}).`);
        }
        seen.add(key);
        const rank = Math.floor(Number(spec.rank) || 0);
        if (rank < 1 || rank > 8) {
            errors.push(`Rank for "${name}" must be 1–8 (got ${rank}).`);
        }
        if (!String(spec.scope || '').trim()) {
            errors.push(`Scope required for "${name}".`);
        }
    }
    if (opts?.requireStartingBudget) {
        if (specs.length !== 5) {
            errors.push('Starting characters need exactly five Specializations.');
        }
        const ranks = specs.map((s) => Math.floor(Number(s.rank) || 0));
        if (!ranks.every((r) => r === 2)) {
            errors.push('Each starting Specialization must be Rank 2.');
        }
        const totalRanks = ranks.reduce((a, b) => a + b, 0);
        if (totalRanks !== 10) {
            errors.push(`Starting Rank total must be 10 (20 Creation Points); got ${totalRanks}.`);
        }
    }
    return { ok: errors.length === 0, errors };
}
/** Read an actor's Specialization list tolerant of array / keyed-object shapes. */
export function readActorSpecializations(system) {
    const raw = system?.specializations;
    const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.values(raw) : [];
    return list
        .filter((s) => s && String(s.name ?? '').trim())
        .map((s) => ({
        id: String(s.id ?? '').trim() || specializationIdentityKey(String(s.name), s.field),
        name: String(s.name),
        field: s.field,
        scope: s.scope,
        rank: Math.max(0, Math.floor(Number(s.rank) || 0)),
    }));
}
/**
 * Highest Rank among Medicine-like Specializations: name or scope mentions
 * medicine / medic / healing, or a Science & Craft Spec named Medicine.
 */
export function medicineSpecializationRank(system) {
    let best = 0;
    for (const spec of readActorSpecializations(system)) {
        const name = normalizeSpecializationName(String(spec.name ?? ''));
        const scope = String(spec.scope ?? '').toLowerCase();
        const medicineNamed = /\bmedic(ine|al)?\b/.test(name) || name.includes('physician') || name.includes('surgery');
        const medicineScoped = /\bmedicine\b|\bmedic\b|\bfirst aid\b/.test(scope);
        const scienceCraftMedicine = spec.field === 'science-craft' && name.startsWith('medic');
        if (medicineNamed || medicineScoped || scienceCraftMedicine) {
            best = Math.max(best, Math.floor(Number(spec.rank) || 0));
        }
    }
    return best;
}
/** Closed Summon task list (owner mapping). */
export const SUMMON_TASKS = [
    'perception',
    'tracking',
    'navigation',
    'weather-sense',
    'stealth',
    'concealment',
    'athletics',
    'acrobatics',
    'search',
    'survival',
];
export function summonTaskSlotCount(boundStones) {
    const n = Math.max(0, Math.floor(Number(boundStones) || 0));
    if (n <= 0)
        return 0;
    if (n === 1)
        return 2;
    if (n === 2)
        return 3;
    return 4;
}
/** Dice cap for a Summon task: Perception uses 2×owner MR; others 2×one matching Spec Rank. */
export function summonSkillDiceCap(opts) {
    if (opts.task === 'perception') {
        return 2 * Math.max(1, Math.floor(Number(opts.ownerMasteryRank) || 1));
    }
    return 2 * Math.max(0, Math.floor(Number(opts.matchingSpecializationRank) || 0));
}
export function isSummonTask(value) {
    return SUMMON_TASKS.includes(value);
}
/** Drop unknown tasks / blank ids from a stored map. */
export function normalizeSummonTaskSpecMap(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object')
        return out;
    for (const [task, id] of Object.entries(raw)) {
        const spec = String(id ?? '').trim();
        if (isSummonTask(task) && spec)
            out[task] = spec;
    }
    return out;
}
/** Number of mapped tasks that still need a Spec (Perception uses owner MR, no Spec). */
function mappedTaskCount(map) {
    return Object.keys(map).length;
}
/**
 * Validate a Summon Bond's task mapping. Summons never receive Free Raises;
 * the task list is capped by `summonTaskSlotCount(boundStones)`.
 */
export function validateSummonTaskSpecMap(opts) {
    const errors = [];
    const map = normalizeSummonTaskSpecMap(opts.map);
    const slots = summonTaskSlotCount(opts.boundStones);
    if (mappedTaskCount(map) > slots) {
        errors.push(`Summon has ${mappedTaskCount(map)} mapped tasks but only ${slots} slot${slots === 1 ? '' : 's'} (Bound Stones).`);
    }
    const ids = new Set(opts.ownerSpecs.map((s) => String(s.id ?? '')));
    for (const [task, specId] of Object.entries(map)) {
        if (task === 'perception')
            continue; // uses 2 × owner MR; mapping optional
        if (!ids.has(String(specId)))
            errors.push(`Task ${task}: owner Specialization not found.`);
    }
    return errors;
}
/** Dice cap per mapped task using the mapped owner Spec Rank (Perception: owner MR). */
export function summonTaskDiceCaps(opts) {
    const out = {};
    const map = normalizeSummonTaskSpecMap(opts.map);
    for (const task of Object.keys(map)) {
        const spec = opts.ownerSpecs.find((s) => String(s.id ?? '') === map[task]);
        out[task] = summonSkillDiceCap({
            task,
            ownerMasteryRank: opts.ownerMasteryRank,
            matchingSpecializationRank: spec?.rank ?? 0,
        });
    }
    return out;
}
/** Summons never receive Free Raises (DF 2026). */
export const SUMMON_FREE_RAISES = 0;
//# sourceMappingURL=specializations.js.map