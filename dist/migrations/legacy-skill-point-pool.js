/**
 * Legacy Skill Point pool — retired.
 *
 * DF Professions replaced creation Skill Points. Migration-only: the
 * legacy-cleanup migration converts leftover unspent points to Free XP and
 * removes `system.skillPoints`.
 */
function toCount(value) {
    const n = Math.floor(Number(value) || 0);
    return n > 0 ? n : 0;
}
/** Raw leftover Skill Points still stored on an actor (pre-retirement). */
export function readLegacySkillPointResidue(system) {
    const raw = system?.skillPoints;
    const placed = {};
    const rawPlaced = raw?.placed;
    if (rawPlaced && typeof rawPlaced === 'object') {
        for (const [key, value] of Object.entries(rawPlaced)) {
            const n = toCount(value);
            if (n > 0)
                placed[key] = n;
        }
    }
    return { unspent: toCount(raw?.unspent), placed };
}
/**
 * Convert leftover unspent Skill Points to Free XP and clear the pool.
 * Placed ranks stay on Skills; only the obsolete currency is removed.
 */
export function planSkillPointRetirement(system) {
    const residue = readLegacySkillPointResidue(system);
    const hasPlaced = Object.keys(residue.placed).length > 0;
    if (residue.unspent <= 0 && !hasPlaced) {
        return { needed: false, convertedXp: 0, updates: {} };
    }
    const freeNow = Math.max(0, Math.floor(Number(system?.points?.xpFree) || 0));
    const freeEarned = Math.max(0, Math.floor(Number(system?.xp?.freeEarned) || 0));
    return {
        needed: true,
        convertedXp: residue.unspent,
        updates: {
            'system.skillPoints': { unspent: 0, placed: {} },
            ...(residue.unspent > 0
                ? {
                    'system.points.xpFree': freeNow + residue.unspent,
                    'system.xp.freeEarned': freeEarned + residue.unspent,
                }
                : {}),
        },
    };
}
//# sourceMappingURL=legacy-skill-point-pool.js.map