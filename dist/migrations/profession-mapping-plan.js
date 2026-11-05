/**
 * K8 Profession mapping. Copies legacy Specialization rows forward.
 * Never invents a new occupation (Stealth stays Stealth until someone edits the name).
 */
import { isCharacterPerceptionSpec, isLegacyFieldSpecialization, professionIdentityKey, } from '../rules/specializations.js';
import { readSpecializations } from '../rules/specialization-roll.js';
export const K8_PROFESSIONS_REVIEWED_FLAG = 'k8ProfessionsReviewedAt';
export function planProfessionMapping(system) {
    const specs = readSpecializations(system);
    const legacy = specs.filter((spec) => isLegacyFieldSpecialization(spec));
    return {
        needsReview: legacy.length > 0,
        legacy: legacy.map((spec) => ({
            id: spec.id,
            name: spec.name,
            ...(spec.field ? { field: spec.field } : {}),
            scope: spec.scope,
            rank: spec.rank,
        })),
        drafts: legacy.map((spec) => ({
            legacyId: spec.id,
            keep: true,
            name: spec.name,
            origin: String(spec.origin || ''),
            scope: spec.scope,
            rank: spec.rank,
        })),
    };
}
export function applyProfessionMappingDrafts(system, drafts) {
    const current = readSpecializations(system);
    const byId = new Map(current.map((spec) => [spec.id, spec]));
    const drafted = new Set(drafts.map((draft) => draft.legacyId));
    const kept = [];
    for (const spec of current) {
        if (isCharacterPerceptionSpec(spec)) {
            kept.push(spec);
            continue;
        }
        if (!isLegacyFieldSpecialization(spec) && !drafted.has(spec.id)) {
            kept.push(spec);
        }
    }
    for (const draft of drafts) {
        const source = byId.get(draft.legacyId);
        if (!source || isCharacterPerceptionSpec(source)) {
            return { ok: false, error: 'Unknown stored Profession row.', specializations: current };
        }
        if (!draft.keep)
            continue;
        const name = String(draft.name || '').trim();
        const scope = String(draft.scope || '').trim();
        const origin = String(draft.origin || '').trim();
        if (!name || !scope) {
            return { ok: false, error: 'Each kept Profession needs a name and a scope.', specializations: current };
        }
        const rank = Math.max(Math.floor(Number(source.rank) || 1), Math.min(8, Math.floor(Number(draft.rank) || source.rank)));
        const sameName = name.toLowerCase() === source.name.trim().toLowerCase();
        kept.push({
            id: sameName ? source.id : professionIdentityKey(name),
            name,
            origin,
            scope,
            rank,
        });
    }
    return { ok: true, specializations: kept };
}
//# sourceMappingURL=profession-mapping-plan.js.map