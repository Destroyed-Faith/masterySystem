/**
 * DF 2026-10-23 migration review — pure planning / update helpers (no Foundry globals).
 *
 * The review dialog (`df-2026-migration-review-dialog.ts`) is a thin UI on top
 * of these functions so the rules stay unit-testable:
 *
 * - Legacy Skills (name + rating) are listed for reference; names can be copied
 *   into five new Specializations. Every saved Spec is forced to Rank 2
 *   (starting budget: five × Rank 2). Legacy ratings are never converted.
 * - Minor Expressions with no exact Echo Imprint mapping are listed as
 *   "unmapped" so the GM can pick an Imprint by hand.
 * - Imprint proposals exceeding Mastery Rank are flagged for trimming.
 * - Saving writes ONLY `system.specializations`, `system.echoImprints` and a
 *   review-stamp flag. XP / Stones / Powers / Artifacts are never touched.
 */
import { ECHO_IMPRINTS, findEchoImprint, isSkillField, normalizeSpecializationName, specializationIdentityKey, validateEchoImprintSelections, validateSpecializationList, readSpecializations, STARTING_SPECIALIZATION_COUNT, STARTING_SPECIALIZATION_RANK, ensureCharacterHasPerceptionSpec, isCharacterPerceptionSpec, paidSpecializations, } from '../rules/index.js';
import { DF_2026_RULES_SCHEMA_VERSION } from '../rules/index.js';
import { SKILLS, SKILL_CATEGORIES } from '../utils/skills.js';
import { getMinorExpressionDefinition } from '../utils/minor-expressions.js';
import { DF_2026_LEGACY_SNAPSHOT_FLAG, MINOR_EXPRESSION_TO_IMPRINT, } from './df-2026-rules-migration.js';
/** Flag key stamped on an actor once the GM saved its review. */
export const DF_2026_REVIEWED_FLAG = 'df2026ReviewedAt';
const IMPRINT_ATTRIBUTES = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence',
    'wits',
];
/** Legacy Skill category → closest Specialization Field (suggestion only). */
const CATEGORY_TO_FIELD = {
    // Perception is a free universal Skill — do not suggest it as Investigation.
    [SKILL_CATEGORIES.AWARENESS]: 'investigation',
    [SKILL_CATEGORIES.PHYSICAL]: 'physical',
    [SKILL_CATEGORIES.KNOWLEDGE_CRAFT]: 'science-craft',
    [SKILL_CATEGORIES.SOCIAL]: 'social',
    [SKILL_CATEGORIES.SURVIVAL]: 'survival',
};
function readFlag(actor, key) {
    try {
        const v = actor?.getFlag?.('mastery-system', key);
        if (v !== undefined)
            return v;
    }
    catch {
        /* fall through */
    }
    return actor?.flags?.['mastery-system']?.[key];
}
function masteryRankOf(system) {
    return Math.max(1, Math.floor(Number(system?.mastery?.rank) || 2));
}
function legacyRating(value) {
    if (typeof value === 'number')
        return Math.max(0, Math.floor(value));
    if (value && typeof value === 'object') {
        const v = value;
        return Math.max(0, Math.floor(Number(v.rating ?? v.value ?? v.rank) || 0));
    }
    return Math.max(0, Math.floor(Number(value) || 0));
}
function legacyExpressionIds(source) {
    const list = Array.isArray(source?.selected)
        ? source.selected
        : Array.isArray(source)
            ? source
            : [];
    const seen = new Set();
    const out = [];
    for (const raw of list) {
        const id = String(raw ?? '').trim();
        if (!id || seen.has(id))
            continue;
        seen.add(id);
        out.push(id);
    }
    return out;
}
function currentImprintIds(system) {
    const raw = Array.isArray(system?.echoImprints) ? system.echoImprints : [];
    const seen = new Set();
    const out = [];
    for (const v of raw) {
        const id = String(v ?? '').trim();
        if (!id || seen.has(id) || !findEchoImprint(id))
            continue;
        seen.add(id);
        out.push(id);
    }
    return out;
}
function titleCase(key) {
    return key ? key.charAt(0).toUpperCase() + key.slice(1) : key;
}
/** Build the per-character review plan. Never mutates the actor. */
export function buildDf2026ReviewPlan(actor) {
    const system = actor?.system ?? {};
    const snapshot = readFlag(actor, DF_2026_LEGACY_SNAPSHOT_FLAG);
    const legacySkills = snapshot?.skills ?? system.skills ?? null;
    const legacyExpressions = snapshot?.minorExpressions ?? system.minorExpressions ?? null;
    const mr = masteryRankOf(system);
    const currentSpecsAll = readSpecializations(system);
    // Review UI picks five *paid* Specs; free Perception is auto-ensured on save.
    const currentSpecs = paidSpecializations(currentSpecsAll);
    const haveNames = new Set(currentSpecsAll.map((s) => normalizeSpecializationName(s.name)));
    const legacySkillsList = [];
    const specSuggestions = [];
    if (legacySkills && typeof legacySkills === 'object') {
        for (const [skillKey, value] of Object.entries(legacySkills)) {
            const rating = legacyRating(value);
            if (rating <= 0)
                continue;
            const def = SKILLS[skillKey];
            const name = def?.name ?? titleCase(skillKey);
            // Universal Perception is never a paid Spec suggestion.
            if (skillKey === 'perception' || normalizeSpecializationName(name) === 'perception') {
                legacySkillsList.push({
                    skillKey,
                    name,
                    field: 'perception',
                    rating,
                    categoryLabel: def?.category ? String(def.category) : 'Perception',
                });
                continue;
            }
            const field = (def && CATEGORY_TO_FIELD[def.category]) || 'physical';
            legacySkillsList.push({
                skillKey,
                name,
                field,
                rating,
                categoryLabel: def?.category ? String(def.category) : '',
            });
            if (haveNames.has(normalizeSpecializationName(name)))
                continue;
            specSuggestions.push({
                skillKey,
                suggestedName: name,
                suggestedField: field,
                legacyRating: rating,
            });
        }
        legacySkillsList.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
        specSuggestions.sort((a, b) => b.legacyRating - a.legacyRating || a.suggestedName.localeCompare(b.suggestedName));
    }
    const exprIds = legacyExpressionIds(legacyExpressions);
    const mappedImprintIds = [];
    const unmappedExpressions = [];
    for (const id of exprIds) {
        const mapped = MINOR_EXPRESSION_TO_IMPRINT[id];
        if (mapped && findEchoImprint(mapped)) {
            if (!mappedImprintIds.includes(mapped))
                mappedImprintIds.push(mapped);
        }
        else {
            const def = getMinorExpressionDefinition(id);
            unmappedExpressions.push({
                id,
                name: def?.name ?? id,
                attribute: def?.attribute ?? '',
            });
        }
    }
    const current = currentImprintIds(system);
    const proposed = [...current];
    for (const id of mappedImprintIds)
        if (!proposed.includes(id))
            proposed.push(id);
    const trimmed = proposed.length > mr ? proposed.slice(mr) : [];
    const imprintTrimWarning = trimmed.length
        ? `Imprints (${proposed.length}) exceed Mastery Rank ${mr}; drop ${trimmed.length} before saving.`
        : null;
    const warnings = [];
    if (legacySkillsList.length && currentSpecs.length < STARTING_SPECIALIZATION_COUNT) {
        warnings.push(`Pick exactly ${STARTING_SPECIALIZATION_COUNT} Specializations at Rank ${STARTING_SPECIALIZATION_RANK} (Perception is free and does not use a slot). Legacy Skill ratings are not converted.`);
    }
    for (const u of unmappedExpressions) {
        warnings.push(`Minor Expression "${u.name}" needs a manual Echo Imprint choice.`);
    }
    if (imprintTrimWarning)
        warnings.push(imprintTrimWarning);
    const alreadyReviewed = !!readFlag(actor, DF_2026_REVIEWED_FLAG);
    const needsReview = !alreadyReviewed &&
        (legacySkillsList.length > 0 ||
            currentSpecs.length < STARTING_SPECIALIZATION_COUNT ||
            unmappedExpressions.length > 0 ||
            !!imprintTrimWarning);
    return {
        actorId: String(actor?.id ?? ''),
        actorName: String(actor?.name ?? ''),
        masteryRank: mr,
        legacySkills: legacySkillsList,
        specSuggestions,
        currentSpecializations: currentSpecs,
        unmappedExpressions,
        mappedImprintIds,
        currentImprintIds: current,
        proposedImprintIds: proposed,
        trimmedImprintIds: trimmed,
        imprintTrimWarning,
        warnings,
        alreadyReviewed,
        needsReview,
    };
}
/** Review plans for every character; by default only those with open decisions. */
export function listDf2026ReviewPlans(actors, opts = {}) {
    const only = opts.onlyIds ? new Set(opts.onlyIds) : null;
    const plans = [];
    for (const actor of actors ?? []) {
        if (!actor || actor.type !== 'character')
            continue;
        if (only && !only.has(String(actor.id)))
            continue;
        // Pre-migration actors have no legacy snapshot yet and are handled by the migration itself.
        const version = String(actor.system?.progression?.rulesSchemaVersion ?? '');
        if (version !== DF_2026_RULES_SCHEMA_VERSION)
            continue;
        const plan = buildDf2026ReviewPlan(actor);
        if (opts.includeReviewed || plan.needsReview)
            plans.push(plan);
    }
    return plans;
}
/**
 * Normalize one GM-entered Specialization row.
 * Migration starter Specs are always Rank 2 (starting budget) — legacy ratings
 * and any typed Rank are ignored.
 */
export function normalizeReviewSpecialization(raw) {
    const name = String(raw?.name ?? '').trim();
    if (!name)
        return null;
    // Perception is free universal — never saved as one of the five paid review Specs.
    if (isCharacterPerceptionSpec({ name, field: raw?.field, id: raw?.id }))
        return null;
    const fieldRaw = String(raw?.field ?? '');
    const field = isSkillField(fieldRaw) && fieldRaw !== 'perception' ? fieldRaw : 'physical';
    return {
        id: specializationIdentityKey(name, field),
        name,
        field,
        scope: String(raw?.scope ?? '').trim(),
        rank: STARTING_SPECIALIZATION_RANK,
    };
}
/**
 * Validate GM input and build the actor update. Touches ONLY
 * `system.specializations`, `system.echoImprints` and the review stamp flag.
 * Specializations must be exactly five at Rank 2 (same as character creation).
 */
export function buildDf2026ReviewUpdate(actor, input, now = new Date()) {
    const system = actor?.system ?? {};
    const specs = [];
    for (const row of input?.specializations ?? []) {
        const spec = normalizeReviewSpecialization(row);
        if (spec)
            specs.push(spec);
    }
    const imprintIds = [...new Set((input?.echoImprints ?? []).map((v) => String(v ?? '').trim()).filter(Boolean))];
    // Always keep free Perception alongside the five paid Specs.
    const withPerception = ensureCharacterHasPerceptionSpec({
        specializations: specs,
    }).specializations;
    const errors = [];
    errors.push(...validateSpecializationList(withPerception, { requireStartingBudget: true }).errors);
    const attributes = {};
    for (const attr of IMPRINT_ATTRIBUTES) {
        attributes[attr] = Math.floor(Number(system?.attributes?.[attr]?.value) || 0);
    }
    errors.push(...validateEchoImprintSelections({
        selectedIds: imprintIds,
        masteryRank: masteryRankOf(system),
        attributes,
    }).errors);
    if (errors.length) {
        return { ok: false, errors, update: null, specializations: withPerception, echoImprints: imprintIds };
    }
    return {
        ok: true,
        errors: [],
        update: {
            'system.specializations': withPerception,
            'system.echoImprints': imprintIds,
            [`flags.mastery-system.${DF_2026_REVIEWED_FLAG}`]: now.toISOString(),
        },
        specializations: withPerception,
        echoImprints: imprintIds,
    };
}
/** Validate and write one character's review. */
export async function applyDf2026Review(actor, input) {
    const result = buildDf2026ReviewUpdate(actor, input);
    if (result.ok && result.update) {
        await actor.update(result.update);
    }
    return result;
}
/** Catalogue helper for the dialog: Imprints grouped by attribute. */
export function imprintsByAttribute() {
    return IMPRINT_ATTRIBUTES.map((attribute) => ({
        attribute,
        imprints: ECHO_IMPRINTS.filter((e) => e.attribute === attribute).map((e) => ({
            id: e.id,
            name: e.name,
        })),
    })).filter((g) => g.imprints.length > 0);
}
//# sourceMappingURL=df-2026-migration-review-plan.js.map