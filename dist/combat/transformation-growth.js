/**
 * Universal Transformation Growth (Core — Form and Transformation).
 *
 * Growth G occupies `1 + 3×G×(G+1)` Hexes, adds +2 m melee Reach per Growth,
 * grants G additional 0-penalty Growth Health Bars, and reduces Push/Pull by
 * Growth × MR meters. Uses: Mastery Rank times per Safe Haven Rest.
 *
 * Titan Scars grants max Growth 1 / 2 / 3 at Artifact Levels 1 / 4 / 7.
 * This is an Artifact Function (Transformation), not Active Buff: Growth Form.
 */
const GEOMETRY = {
    0: {
        occupiedHexes: 1,
        adjacentHexes: 6,
        meleeReachM: 2,
        reachBonusM: 0,
        additionalHealthBars: 0,
        pushPullReductionFactor: 0,
        rangeDoubled: false,
    },
    1: {
        occupiedHexes: 7,
        adjacentHexes: 12,
        meleeReachM: 4,
        reachBonusM: 2,
        additionalHealthBars: 1,
        pushPullReductionFactor: 1,
        rangeDoubled: false,
    },
    2: {
        occupiedHexes: 19,
        adjacentHexes: 18,
        meleeReachM: 6,
        reachBonusM: 4,
        additionalHealthBars: 2,
        pushPullReductionFactor: 2,
        rangeDoubled: true,
    },
    3: {
        occupiedHexes: 37,
        adjacentHexes: 24,
        meleeReachM: 8,
        reachBonusM: 6,
        additionalHealthBars: 3,
        pushPullReductionFactor: 3,
        rangeDoubled: true,
    },
};
export function clampGrowthRank(raw) {
    const n = Math.floor(Number(raw) || 0);
    if (n >= 3)
        return 3;
    if (n >= 2)
        return 2;
    if (n >= 1)
        return 1;
    return 0;
}
/** Max Growth granted by Titan Scars at the given Artifact Level. */
export function titanScarsMaxGrowth(artifactLevel) {
    const lvl = Math.max(1, Math.min(10, Math.floor(Number(artifactLevel) || 1)));
    if (lvl >= 7)
        return 3;
    if (lvl >= 4)
        return 2;
    return 1;
}
export function growthGeometry(growth) {
    const g = clampGrowthRank(growth);
    return { growth: g, ...GEOMETRY[g] };
}
/** Occupied Hex count for Growth G: 1 + 3×G×(G+1). */
export function growthOccupiedHexes(growth) {
    return growthGeometry(growth).occupiedHexes;
}
export function pushPullReductionMeters(growth, masteryRank) {
    const g = growthGeometry(growth);
    const mr = Math.max(1, Math.floor(Number(masteryRank) || 1));
    return Math.max(0, g.pushPullReductionFactor * mr);
}
/** Safe Haven Rest uses for size-changing Transformation = Mastery Rank. */
export function transformationUsesPerRest(masteryRank) {
    return Math.max(1, Math.floor(Number(masteryRank) || 1));
}
const GROWTH_FLAG = 'transformationGrowth';
const GROWTH_BARS_FLAG = 'growthHealthBars';
export function peekActorGrowth(actor) {
    if (!actor)
        return 0;
    try {
        const fromFlag = actor.getFlag?.('mastery-system', GROWTH_FLAG);
        if (fromFlag != null)
            return clampGrowthRank(fromFlag?.rank ?? fromFlag);
    }
    catch {
        /* ignore */
    }
    const nested = actor.flags?.['mastery-system']?.[GROWTH_FLAG];
    if (nested != null)
        return clampGrowthRank(nested?.rank ?? nested);
    return 0;
}
function vitalityHp(actor) {
    const vit = Math.max(1, Math.floor(Number(actor?.system?.attributes?.vitality?.value) || 1));
    return vit * 4;
}
function readPersistedGrowthBars(actor) {
    try {
        const raw = actor?.getFlag?.('mastery-system', GROWTH_BARS_FLAG);
        if (Array.isArray(raw))
            return raw.map(normalizeGrowthBar);
    }
    catch {
        /* ignore */
    }
    const nested = actor?.flags?.['mastery-system']?.[GROWTH_BARS_FLAG];
    if (Array.isArray(nested))
        return nested.map(normalizeGrowthBar);
    return [];
}
function normalizeGrowthBar(b) {
    const max = Math.max(1, Math.floor(Number(b?.max) || 1));
    const current = Math.max(0, Math.min(max, Math.floor(Number(b?.current) || 0)));
    return {
        name: String(b?.name || 'Growth'),
        max,
        current,
        penalty: 0,
        scarred: current <= 0 || b?.scarred === true,
        growthBar: true,
    };
}
async function writePersistedGrowthBars(actor, bars) {
    if (!actor)
        return;
    if (typeof actor.setFlag === 'function') {
        await actor.setFlag('mastery-system', GROWTH_BARS_FLAG, bars);
        return;
    }
    actor.flags = actor.flags || {};
    actor.flags['mastery-system'] = actor.flags['mastery-system'] || {};
    actor.flags['mastery-system'][GROWTH_BARS_FLAG] = bars;
}
/**
 * Ensure persisted Growth Bars exist up to `count` (Vitality×4 HP, 0 penalty).
 * Existing damage / Scarred state is preserved; new bars start full.
 */
export function ensureGrowthBarStates(existing, count, hpPerBar) {
    const out = [];
    const n = Math.max(0, Math.floor(Number(count) || 0));
    const hp = Math.max(1, Math.floor(Number(hpPerBar) || 1));
    for (let i = 0; i < Math.max(n, existing.length); i++) {
        const prev = existing[i];
        if (prev) {
            out.push({
                ...normalizeGrowthBar(prev),
                name: `Growth ${i + 1}`,
                max: hp,
                // Keep absolute damage; clamp to new max if Vitality changed.
                current: Math.min(hp, Math.max(0, Math.floor(Number(prev.current) || 0))),
                scarred: (Number(prev.current) || 0) <= 0 || prev.scarred === true,
            });
        }
        else if (i < n) {
            out.push({
                name: `Growth ${i + 1}`,
                max: hp,
                current: hp,
                penalty: 0,
                scarred: false,
                growthBar: true,
            });
        }
    }
    // Keep hidden bars beyond current Growth for persistence when shrinking.
    return out;
}
function stripGrowthBarsFromHealth(bars) {
    return (bars || []).filter((b) => !(b?.growthBar === true || /^Growth\s+\d+/i.test(String(b?.name || ''))));
}
/**
 * Sync visible Growth Bars onto actor.system.health.bars for the active Growth rank.
 * When Growth is 0, Growth Bars are removed from the visible list but persist in the flag.
 */
export async function syncGrowthHealthBars(actor, rank) {
    if (!actor?.system?.health)
        return;
    const g = growthGeometry(rank);
    const hp = vitalityHp(actor);
    let persisted = readPersistedGrowthBars(actor);
    // Capture damage from currently visible Growth Bars before rewriting.
    const currentBars = Array.isArray(actor.system.health.bars)
        ? actor.system.health.bars
        : [];
    const visibleGrowth = currentBars.filter((b) => b?.growthBar === true || /^Growth\s+\d+/i.test(String(b?.name || '')));
    if (visibleGrowth.length) {
        for (let i = 0; i < visibleGrowth.length; i++) {
            const v = normalizeGrowthBar(visibleGrowth[i]);
            if (persisted[i]) {
                persisted[i] = { ...persisted[i], current: v.current, scarred: v.scarred, max: hp };
            }
            else {
                persisted[i] = { ...v, name: `Growth ${i + 1}`, max: hp };
            }
        }
    }
    persisted = ensureGrowthBarStates(persisted, Math.max(g.additionalHealthBars, persisted.length), hp);
    await writePersistedGrowthBars(actor, persisted);
    const normal = stripGrowthBarsFromHealth(currentBars);
    const visible = g.additionalHealthBars > 0
        ? persisted.slice(0, g.additionalHealthBars).map((b, i) => ({
            name: `Growth ${i + 1}`,
            max: hp,
            current: Math.min(hp, Math.max(0, Number(b.current) || 0)),
            penalty: 0,
            scarred: (Number(b.current) || 0) <= 0 || b.scarred === true,
            growthBar: true,
        }))
        : [];
    const nextBars = [...visible, ...normal];
    const patch = {
        'system.health.bars': nextBars,
    };
    // Prefer the first non-scarred Growth Bar, else first normal open bar.
    const firstOpen = nextBars.findIndex((b) => (Number(b?.current) || 0) > 0);
    if (firstOpen >= 0)
        patch['system.health.currentBar'] = firstOpen;
    if (typeof actor.update === 'function') {
        await actor.update(patch);
    }
    else {
        actor.system.health.bars = nextBars;
        if (firstOpen >= 0)
            actor.system.health.currentBar = firstOpen;
    }
}
export async function setActorGrowth(actor, rank, opts) {
    const next = clampGrowthRank(rank);
    if (!actor)
        return next;
    const payload = { rank: next, updatedAt: Date.now() };
    if (typeof actor.setFlag === 'function') {
        await actor.setFlag('mastery-system', GROWTH_FLAG, payload);
    }
    else {
        actor.flags = actor.flags || {};
        actor.flags['mastery-system'] = actor.flags['mastery-system'] || {};
        actor.flags['mastery-system'][GROWTH_FLAG] = payload;
    }
    try {
        await syncGrowthHealthBars(actor, next);
    }
    catch (err) {
        if (!opts?.quiet) {
            console.warn('Mastery System | Transformation Growth Health Bars sync failed', err);
        }
    }
    try {
        const token = actor.getActiveTokens?.()?.[0] ?? actor.token;
        const doc = token?.document ?? token;
        if (doc && typeof doc.update === 'function') {
            // Footprint scales with Growth: G0=1, G1=2, G2=3, G3=4 token squares.
            const size = next === 0 ? 1 : next === 1 ? 2 : next === 2 ? 3 : 4;
            await doc.update({ width: size, height: size });
        }
    }
    catch (err) {
        if (!opts?.quiet) {
            console.warn('Mastery System | Transformation Growth token resize failed', err);
        }
    }
    return next;
}
/** Activate Titan Growth to the highest rank the artifact currently grants. */
export async function activateTitanGrowth(actor, artifactLevel) {
    const max = titanScarsMaxGrowth(artifactLevel);
    const current = peekActorGrowth(actor);
    if (current >= max) {
        // Toggle off when already at max.
        await setActorGrowth(actor, 0);
        return { ok: true, rank: 0 };
    }
    // Spend one Transformation use per Safe Haven Rest.
    try {
        const { canSpendArtifactRestUse, spendArtifactRestUse, masteryRankOf } = await import('./artifact-rest-uses.js');
        const maxUses = transformationUsesPerRest(masteryRankOf(actor));
        if (!canSpendArtifactRestUse(actor, 'titanGrowth', maxUses)) {
            return { ok: false, rank: current, reason: 'No Transformation uses remaining this Safe Haven Rest.' };
        }
        const spent = await spendArtifactRestUse(actor, 'titanGrowth', maxUses);
        if (!spent.ok) {
            return { ok: false, rank: current, reason: 'No Transformation uses remaining this Safe Haven Rest.' };
        }
    }
    catch (err) {
        console.warn('Mastery System | Titan Growth use spend failed', err);
    }
    const rank = await setActorGrowth(actor, max);
    return { ok: true, rank };
}
//# sourceMappingURL=transformation-growth.js.map