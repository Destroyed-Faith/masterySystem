/**
 * Encounter Generator — input validation.
 */
import { ENCOUNTER_LIMITS } from './encounter-generator-types.js';
function clampInt(value, lo, hi, fallback) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(lo, Math.min(hi, n));
}
/** Normalize composition values into legal ranges. */
export function normalizeComposition(comp) {
    return {
        bossCount: clampInt(comp.bossCount, ENCOUNTER_LIMITS.minBosses, ENCOUNTER_LIMITS.maxBosses, 1),
        phasesPerBoss: clampInt(comp.phasesPerBoss, ENCOUNTER_LIMITS.minPhases, ENCOUNTER_LIMITS.maxPhases, 2),
        minionCount: clampInt(comp.minionCount, ENCOUNTER_LIMITS.minMinions, ENCOUNTER_LIMITS.maxMinions, 0),
        respawnCadence: clampInt(comp.respawnCadence, ENCOUNTER_LIMITS.minCadence, ENCOUNTER_LIMITS.maxCadence, 0),
    };
}
/** Validate the full selection prior to generation. */
export function validateEncounterSelection(selection) {
    if (!selection.selectedActorIds || selection.selectedActorIds.length === 0) {
        return { ok: false, error: 'Bitte waehle mindestens einen Charakter aus.' };
    }
    if (!selection.folderName || !selection.folderName.trim()) {
        return { ok: false, error: 'Bitte gib einen Namen fuer den Encounter ein.' };
    }
    return { ok: true, error: null };
}
//# sourceMappingURL=encounter-generator-validation.js.map