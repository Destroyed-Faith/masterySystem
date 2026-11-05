/**
 * Freely named Professions. Stored on `system.specializations` so existing
 * summon maps, export, and XP history keep their key. Legacy rows may still
 * carry a Field; new rows use `origin` and an id of `profession:<name>`.
 * The 90-entry catalogue is suggestion data only — never a whitelist.
 */
import { STARTING_SPECIALIZATION_COUNT, STARTING_SPECIALIZATION_RANK } from './skill-raises.js';
export const SKILL_FIELDS = [
    'physical',
    'finesse',
    'survival',
    'science-craft',
    'occult',
    'social',
    'investigation',
    /** Universal free Spec only — never a paid starting Field. */
    'perception',
];
/** Fields a player may choose for paid Specializations (excludes universal Perception). */
export const PAID_SKILL_FIELDS = SKILL_FIELDS.filter((f) => f !== 'perception');
export const SKILL_FIELD_LABELS = {
    physical: 'Physical',
    finesse: 'Finesse',
    survival: 'Survival',
    'science-craft': 'Science & Craft',
    occult: 'Occult',
    social: 'Social',
    investigation: 'Investigation',
    perception: 'Perception (Universal)',
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
/** Identity for a new Profession. Not derived from a Field. */
export function professionIdentityKey(name) {
    return `profession:${normalizeSpecializationName(name)}`;
}
/** True when this row still uses the pre-K8 Field identity. */
export function isLegacyFieldSpecialization(spec) {
    if (isCharacterPerceptionSpec(spec))
        return false;
    return isSkillField(spec.field) && spec.field !== 'perception';
}
export function isSkillField(value) {
    return SKILL_FIELDS.includes(String(value || ''));
}
/** Free universal Perception — not one of the four starting Professions. */
export const CHARACTER_PERCEPTION_FIELD = 'perception';
/** Legacy id when Perception was wrongly stored under Investigation. */
export const CHARACTER_PERCEPTION_LEGACY_SPEC_ID = 'investigation:perception';
export const CHARACTER_PERCEPTION_SPEC_ID = specializationIdentityKey('Perception', CHARACTER_PERCEPTION_FIELD);
export const CHARACTER_PERCEPTION_SCOPE = 'Notice, search, and read the scene';
/** Matches `UNIVERSAL_PERCEPTION_RANK` in skill-check.ts. */
export const CHARACTER_PERCEPTION_MIN_RANK = 2;
/** Attribute Focus options for every Perception Check (Core Skill rules). */
export const PERCEPTION_FOCUS_ATTRIBUTES = ['wits', 'intellect', 'resolve'];
export function isPerceptionFocusAttribute(value) {
    return PERCEPTION_FOCUS_ATTRIBUTES.includes(String(value || ''));
}
export function isCharacterPerceptionSpec(spec) {
    const id = String(spec.id || '');
    return (id === CHARACTER_PERCEPTION_SPEC_ID ||
        id === CHARACTER_PERCEPTION_LEGACY_SPEC_ID ||
        normalizeSpecializationName(String(spec.name || '')) === 'perception' ||
        String(spec.field || '') === 'perception');
}
/** Paid Specs only — free Perception never consumes a starting / review slot. */
export function paidSpecializations(specs) {
    return specs.filter((s) => !isCharacterPerceptionSpec(s));
}
/**
 * Every character has Perception at least Rank 2 (free). Adds the Spec when
 * missing; raises Rank when below the floor. Never lowers a higher Rank.
 */
export function ensureCharacterHasPerceptionSpec(system) {
    const raw = system?.specializations;
    const list = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object'
            ? Object.values(raw)
            : [];
    const specializations = [];
    let foundIdx = -1;
    for (const s of list) {
        if (!s || !String(s.name ?? '').trim())
            continue;
        const field = isSkillField(s.field) ? s.field : undefined;
        const name = String(s.name).trim();
        const origin = String(s.origin ?? '').trim();
        const category = String(s.category ?? '').trim();
        const rec = {
            id: String(s.id || (field ? specializationIdentityKey(name, field) : professionIdentityKey(name))).trim(),
            name,
            ...(field ? { field } : {}),
            ...(origin ? { origin } : {}),
            ...(category ? { category } : {}),
            ...(s.startingSlot === true ? { startingSlot: true } : {}),
            scope: String(s.scope ?? ''),
            rank: Math.max(0, Math.floor(Number(s.rank) || 0)),
        };
        if (foundIdx < 0 && isCharacterPerceptionSpec(rec))
            foundIdx = specializations.length;
        specializations.push(rec);
    }
    if (foundIdx < 0) {
        specializations.push({
            id: CHARACTER_PERCEPTION_SPEC_ID,
            name: 'Perception',
            field: CHARACTER_PERCEPTION_FIELD,
            scope: CHARACTER_PERCEPTION_SCOPE,
            rank: CHARACTER_PERCEPTION_MIN_RANK,
        });
        return { specializations, changed: true };
    }
    const cur = specializations[foundIdx];
    const nextRank = Math.max(CHARACTER_PERCEPTION_MIN_RANK, Math.floor(Number(cur.rank) || 0));
    const nextScope = String(cur.scope || '').trim() || CHARACTER_PERCEPTION_SCOPE;
    // Always the universal Perception Field — never Investigation or another Skill Field.
    const nextField = CHARACTER_PERCEPTION_FIELD;
    if (nextRank === cur.rank &&
        nextScope === cur.scope &&
        nextField === cur.field &&
        cur.id === CHARACTER_PERCEPTION_SPEC_ID) {
        return { specializations, changed: false };
    }
    specializations[foundIdx] = {
        ...cur,
        id: CHARACTER_PERCEPTION_SPEC_ID,
        name: 'Perception',
        field: nextField,
        scope: nextScope,
        rank: nextRank,
    };
    return { specializations, changed: true };
}
export function validateSpecializationList(specs, opts) {
    const errors = [];
    const seen = new Set();
    for (const spec of specs) {
        const name = String(spec.name || '').trim();
        if (!name) {
            errors.push('Profession name is required.');
            continue;
        }
        const fieldRaw = String(spec.field || '');
        if (fieldRaw && !isSkillField(fieldRaw)) {
            errors.push(`Invalid Field for "${name}".`);
            continue;
        }
        const key = isCharacterPerceptionSpec(spec)
            ? CHARACTER_PERCEPTION_SPEC_ID
            : fieldRaw && isSkillField(fieldRaw) && fieldRaw !== 'perception'
                ? specializationIdentityKey(name, fieldRaw)
                : professionIdentityKey(name);
        if (seen.has(key)) {
            errors.push(`Duplicate Profession: ${name}.`);
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
        const paid = paidSpecializations(specs);
        if (paid.length !== STARTING_SPECIALIZATION_COUNT) {
            errors.push(`Starting characters need exactly ${STARTING_SPECIALIZATION_COUNT} Professions (Perception is free and does not count).`);
        }
        const ranks = paid.map((s) => Math.floor(Number(s.rank) || 0));
        if (ranks.length === STARTING_SPECIALIZATION_COUNT && !ranks.every((r) => r === STARTING_SPECIALIZATION_RANK)) {
            errors.push(`Each starting Profession must be Rank ${STARTING_SPECIALIZATION_RANK}.`);
        }
        for (const spec of paid) {
            if (!isLegacyFieldSpecialization(spec) && !String(spec.origin || '').trim()) {
                errors.push(`Origin required for "${String(spec.name || '').trim()}".`);
            }
        }
        const perception = specs.find((s) => isCharacterPerceptionSpec(s));
        if (perception) {
            const pRank = Math.floor(Number(perception.rank) || 0);
            if (pRank < CHARACTER_PERCEPTION_MIN_RANK) {
                errors.push(`Perception must be at least Rank ${CHARACTER_PERCEPTION_MIN_RANK} (free universal check).`);
            }
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
        .map((s) => {
        const field = isSkillField(s.field) ? s.field : undefined;
        const name = String(s.name);
        const origin = String(s.origin ?? '').trim();
        const category = String(s.category ?? '').trim();
        return {
            id: String(s.id ?? '').trim() ||
                (field ? specializationIdentityKey(name, field) : professionIdentityKey(name)),
            name,
            ...(field ? { field } : {}),
            ...(origin ? { origin } : {}),
            ...(category ? { category } : {}),
            ...(s.startingSlot === true ? { startingSlot: true } : {}),
            scope: s.scope,
            rank: Math.max(0, Math.floor(Number(s.rank) || 0)),
        };
    });
}
/**
 * Highest Rank among medical Professions: name or scope covers practical wound
 * care (medicine, medic, physician, surgery, first aid). One healer only —
 * ranks are not added together. Legacy Science & Craft rows named like medicine
 * still qualify.
 */
export function medicineSpecializationRank(system) {
    let best = 0;
    for (const spec of readActorSpecializations(system)) {
        if (isCharacterPerceptionSpec(spec))
            continue;
        const name = normalizeSpecializationName(String(spec.name ?? ''));
        const scope = String(spec.scope ?? '').toLowerCase();
        const medicineNamed = /\bmedic(ine|al)?\b/.test(name) ||
            name.includes('physician') ||
            name.includes('surgery') ||
            name.includes('field medic');
        const medicineScoped = /\bmedicine\b|\bmedic\b|\bfirst aid\b|\bwound care\b/.test(scope);
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
/**
 * Dice cap for a Summon task: Perception uses 2×owner MR; others 2×one mapped Profession Rank.
 * An unrelated Profession (scope does not cover the task) contributes 0.
 */
export function summonSkillDiceCap(opts) {
    if (opts.task === 'perception') {
        return 2 * Math.max(1, Math.floor(Number(opts.ownerMasteryRank) || 1));
    }
    if (opts.scopeCoversTask === false)
        return 0;
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