/**
 * Resolve which Level Progression rows are *active* on an artifact at a given
 * level. Echo artifacts unlock up to three ability slots (L1 / L2 / L3); each
 * slot upgrades at L4 and L7 (stages I → II → III). Level-10 Ultimate rows are
 * separate and only appear at L10.
 */
import { deriveLevelProgressionFromPicks } from '../artifacts/progression-compiler.js';
/** Full 1–10 table: picks-derived rows when present, else the authored definition. */
export function resolveFullLevelProgression(authored, picks) {
    const fromPicks = deriveLevelProgressionFromPicks(picks);
    if (fromPicks.length > 0) {
        const ultimates = (authored || []).filter(isUltimateProgressionRow);
        return [...fromPicks, ...ultimates].sort((a, b) => (Number(a.level) || 0) - (Number(b.level) || 0));
    }
    return [...(authored || [])];
}
function clampArtifactLevel(level) {
    return Math.max(1, Math.min(10, Math.floor(Number(level) || 1)));
}
/** Level-10 capstone rows (e.g. True Dragon Head) — not a fourth staged slot. */
export function isUltimateProgressionRow(row) {
    if (Number(row.level) !== 10)
        return false;
    const type = String(row.type || '').toLowerCase();
    if (type === 'ultimate')
        return true;
    return /^true\b/i.test(String(row.name || '').trim());
}
/** Which of the three standard pick slots a staged row belongs to (0..2). */
export function progressionSlotIndex(row) {
    const lvl = Number(row.level) || 1;
    return (lvl - 1) % 3;
}
/**
 * Return the ability rows visible at `currentLevel`: 1 slot at L1, 2 at L2,
 * 3 from L3 onward (stages upgrade in place; count never exceeds three).
 */
export function visibleAbilityRows(allRows, currentLevel) {
    const level = clampArtifactLevel(currentLevel);
    const sorted = [...(allRows || [])].sort((a, b) => (Number(a.level) || 0) - (Number(b.level) || 0));
    const ultimates = sorted.filter(isUltimateProgressionRow);
    const staged = sorted.filter((r) => !isUltimateProgressionRow(r));
    const out = [];
    for (let slot = 0; slot < 3; slot++) {
        const unlockAt = slot + 1;
        if (level < unlockAt)
            continue;
        const slotRows = staged.filter((r) => progressionSlotIndex(r) === slot);
        const best = slotRows
            .filter((r) => (Number(r.level) || 0) <= level)
            .sort((a, b) => (Number(b.level) || 0) - (Number(a.level) || 0))[0];
        if (best)
            out.push(best);
    }
    if (level >= 10) {
        for (const u of ultimates)
            out.push(u);
    }
    // Slot order (Breath → Roar → Recovery), ultimate last — not raw level numbers.
    return out.sort((a, b) => {
        const au = isUltimateProgressionRow(a);
        const bu = isUltimateProgressionRow(b);
        if (au !== bu)
            return au ? 1 : -1;
        return progressionSlotIndex(a) - progressionSlotIndex(b);
    });
}
//# sourceMappingURL=artifact-visible-abilities.js.map