/**
 * Detect / repair Dragon Head embeds whose Breath Weapon row cannot reach the
 * combat UI (stale "Artifact Active" type, missing Breath row, empty progression).
 *
 * The radial classifier historically treated "Artifact Active" as passive and
 * skipped Breath entirely. Seed stamps alone could mark embeds "current" without
 * pushing Melee AoE catalogue rows — this helper is the content-health check.
 */
import { buildEchoProgressionPicks, getEchoArtifact } from './echo-artifacts.js';
import { resolveFullLevelProgression, visibleAbilityRows, } from './artifact-visible-abilities.js';
import { isBreathWeaponName } from './breath-weapon.js';
export function isDragonHeadArtifactKey(key) {
    return String(key || '').trim() === 'dragonHead';
}
/**
 * True when a Dragon Head embed at `level` will not expose usable Breath modes
 * from its stored `levelProgression` (missing row or pre-catalogue type label).
 */
export function dragonHeadBreathProgressionBroken(levelProgression, artifactLevel) {
    const level = Math.max(1, Math.min(10, Math.floor(Number(artifactLevel) || 1)));
    const rows = visibleAbilityRows(levelProgression, level);
    const breath = rows.find((r) => isBreathWeaponName(r.name));
    if (!breath)
        return true;
    const type = String(breath.type || '').trim().toLowerCase();
    // Pre–Melee AoE Core label; catalogue / tree nodes use "Melee AoE".
    if (type.includes('artifact active'))
        return true;
    return false;
}
/** Rebuild visible level-progression rows for Dragon Head at a given level. */
export function rebuildDragonHeadVisibleProgression(artifactLevel) {
    const def = getEchoArtifact('dragonHead');
    if (!def)
        return [];
    const picks = buildEchoProgressionPicks(def);
    const full = resolveFullLevelProgression(def.levelProgression, picks);
    return visibleAbilityRows(full, artifactLevel);
}
/**
 * Patch an embedded Dragon Head item's levelProgression (and optional powers)
 * when Breath content is broken. Preserves currentLevel / identity.
 * @returns true when a patch was applied.
 */
export function patchDragonHeadBreathProgression(item) {
    if (!item || item.type !== 'artifact')
        return false;
    const sys = item.system || {};
    const level = Math.max(1, Math.min(10, Math.floor(Number(sys.currentLevel ?? sys.level) || 1)));
    if (!dragonHeadBreathProgressionBroken(sys.levelProgression, level))
        return false;
    const next = rebuildDragonHeadVisibleProgression(level);
    if (next.length === 0)
        return false;
    sys.levelProgression = next;
    return true;
}
//# sourceMappingURL=dragon-head-breath-repair.js.map