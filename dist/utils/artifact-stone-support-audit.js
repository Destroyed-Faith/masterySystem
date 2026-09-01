/**
 * Audit Artifact / Echo-Artifact Stone Power Supports against T2-start
 * abilities (Tier 1 does not exist).
 *
 * Support must never activate Tier 2 for these abilities. Tables that begin
 * support at T2 (Elorian Focus / Ringchain Kept from Sight, and any matching
 * General Artifact) are flagged for a manual Level Progression review —
 * this file does not invent replacement values.
 */
import { ECHO_ARTIFACTS } from './echo-artifacts.js';
import { GENERAL_ARTIFACTS } from './general-artifacts.js';
import { getStonePowerSupportPrefillTier } from './artifact-rules.js';
import { firstEffectiveStonePowerTier, stonePowerSkipsFirstTier, } from '../stones/stone-powers.js';
function stagedSupportPrefill(level, stages) {
    if (level < stages[0])
        return 0;
    if (level < stages[1])
        return 2;
    if (level < stages[2])
        return 3;
    return 4;
}
function recordIfTier2StartBypass(out, def, stonePowerId, unlockLevel, firstPrefillTier) {
    const id = String(stonePowerId || '').trim();
    if (!id || !stonePowerSkipsFirstTier(id))
        return;
    const firstEffective = firstEffectiveStonePowerTier(id);
    if (firstPrefillTier <= 0 || firstPrefillTier > firstEffective)
        return;
    out.push({
        artifactKey: def.key,
        artifactName: def.name,
        stonePowerId: id,
        unlockLevel,
        firstPrefillTier,
        firstEffectiveTier: firstEffective,
        reason: `${def.name} begins ${id} support at Tier ${firstPrefillTier}, which is the first published tier. The player must pay Tier 2 themselves — Level Progression needs a manual review before new values are implemented.`,
    });
}
function inspectDefinition(def) {
    const out = [];
    const top = def.stoneFunction;
    if (top?.kind === 'stonePowerSupport' && top.stonePowerId) {
        const unlock = Math.max(1, Number(top.level) || 1);
        recordIfTier2StartBypass(out, def, top.stonePowerId, unlock, getStonePowerSupportPrefillTier(unlock));
    }
    const specs = def.progressionPickSpecs || {};
    for (const key of [1, 2, 3]) {
        const fn = specs[key]?.stoneFunction;
        if (!fn || fn.kind !== 'stonePowerSupport' || !fn.stonePowerId)
            continue;
        const stages = fn.supportStages;
        const firstPrefill = stages
            ? stagedSupportPrefill(key, stages)
            : getStonePowerSupportPrefillTier(key);
        recordIfTier2StartBypass(out, def, fn.stonePowerId, key, firstPrefill);
    }
    for (const extra of def.extraStoneFunctions || []) {
        if (extra.kind !== 'stonePowerSupport' || !extra.stonePowerId)
            continue;
        const unlock = Math.max(1, Number(extra.level) || 1);
        const firstPrefill = extra.supportStages
            ? stagedSupportPrefill(unlock, extra.supportStages)
            : getStonePowerSupportPrefillTier(unlock);
        recordIfTier2StartBypass(out, def, extra.stonePowerId, unlock, firstPrefill);
    }
    return out;
}
export function auditTier2StartStonePowerSupports() {
    const seen = new Set();
    const out = [];
    const catalogs = [
        ...Object.values(ECHO_ARTIFACTS),
        ...Object.values(GENERAL_ARTIFACTS),
    ];
    for (const def of catalogs) {
        for (const hit of inspectDefinition(def)) {
            const key = `${hit.artifactKey}:${hit.stonePowerId}:${hit.unlockLevel}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            out.push(hit);
        }
    }
    return out.sort((a, b) => a.artifactKey.localeCompare(b.artifactKey));
}
/** @deprecated Use auditTier2StartStonePowerSupports */
export const auditBlankT1StonePowerSupports = auditTier2StartStonePowerSupports;
//# sourceMappingURL=artifact-stone-support-audit.js.map