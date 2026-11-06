/**
 * Verbose NPC attack targeting diagnostics.
 * Off by default. Enable with: game.masteryNpcTargetingDebug(true)
 * Filter browser console with:  MS NPC Targeting
 */
import { coerceNpcPhasesArray, resolveNpcAttackList, resolveNpcAttackTargeting, } from './npc-attack-model.js';
const PREFIX = '[MS NPC Targeting]';
/** Verbose targeting traces — quiet in normal play. */
export let NPC_TARGETING_DEBUG = false;
export function setNpcTargetingDebug(on) {
    NPC_TARGETING_DEBUG = !!on;
    console.log(`${PREFIX} debug ${NPC_TARGETING_DEBUG ? 'ON' : 'OFF'}`);
}
export function isNpcTargetingDebug() {
    return NPC_TARGETING_DEBUG;
}
export function npcTargetingSnap(row) {
    const t = resolveNpcAttackTargeting(row);
    return {
        name: String(row?.name || '—'),
        kind: String(row?.npcRangeKind ?? '∅'),
        meters: row?.npcRangeMeters ?? '∅',
        short: row?.npcRangeMinMeters ?? '∅',
        long: row?.npcRangeMeters ?? '∅',
        aoe: row?.npcAoeRadiusM ?? '∅',
        shape: String(row?.npcAoeShape ?? '∅'),
        burst: t.burstMeleeAoE,
        ranged: t.isRanged,
    };
}
export function npcTargetingLine(label, row) {
    const s = npcTargetingSnap(row);
    return `${PREFIX} ${label} → name="${s.name}" kind=${s.kind} short=${s.short} long=${s.long} aoe=${s.aoe} shape=${s.shape} burst=${s.burst} ranged=${s.ranged}`;
}
export function logNpcTargeting(label, detail) {
    if (!NPC_TARGETING_DEBUG)
        return;
    if (detail)
        console.log(`${PREFIX} ${label}`, detail);
    else
        console.log(`${PREFIX} ${label}`);
}
export function logNpcTargetingRow(label, row, extra) {
    if (!NPC_TARGETING_DEBUG)
        return;
    console.log(npcTargetingLine(label, row), extra ?? '');
}
/** Dump every attack combat will see from this system blob. */
export function logNpcAttackListDump(label, system, actorMeta) {
    if (!NPC_TARGETING_DEBUG)
        return;
    const phasesRaw = system?.phases;
    const phases = coerceNpcPhasesArray(phasesRaw);
    const { attacks, phaseIndex } = resolveNpcAttackList(system || {});
    const rows = attacks.map((atk, i) => ({
        index: i,
        ...npcTargetingSnap(atk),
        resolved: resolveNpcAttackTargeting(atk),
    }));
    console.log(`${PREFIX} ${label} — attack list`, {
        ...actorMeta,
        phasesIsArray: Array.isArray(phasesRaw),
        phasesType: phasesRaw == null ? 'null' : Array.isArray(phasesRaw) ? 'array' : typeof phasesRaw,
        phasesLen: phases.length,
        activePhaseIndex: system?.npcActivePhaseIndex,
        resolvedPhaseIndex: phaseIndex,
        rootBase: npcTargetingSnap(system?.npcBaseAttack),
        attackCount: rows.length,
        attacks: rows,
    });
    for (const r of rows) {
        console.log(`${PREFIX} ${label} — #${r.index} "${r.name}" kind=${r.kind} aoe=${r.aoe} shape=${r.shape} burst=${r.burst} ranged=${r.ranged}`);
    }
}
/** Compare sheet/world/token actor attack lists side by side. */
export function logNpcActorTargetingCompare(label, tokenActor, worldActor) {
    if (!NPC_TARGETING_DEBUG)
        return;
    logNpcAttackListDump(`${label} / token.actor`, tokenActor?.system, {
        actorId: tokenActor?.id,
        actorName: tokenActor?.name,
        isToken: !!tokenActor?.isToken,
        actorLink: tokenActor?.token?.document?.actorLink ?? tokenActor?.getActiveTokens?.()?.[0]?.document?.actorLink,
    });
    if (worldActor && worldActor !== tokenActor) {
        logNpcAttackListDump(`${label} / world.actor`, worldActor.system, {
            actorId: worldActor.id,
            actorName: worldActor.name,
            isToken: !!worldActor.isToken,
        });
        const tList = resolveNpcAttackList(tokenActor?.system || {});
        const wList = resolveNpcAttackList(worldActor.system || {});
        const mismatches = [];
        const n = Math.max(tList.attacks.length, wList.attacks.length);
        for (let i = 0; i < n; i++) {
            const ts = npcTargetingSnap(tList.attacks[i]);
            const ws = npcTargetingSnap(wList.attacks[i]);
            if (JSON.stringify(ts) !== JSON.stringify(ws)) {
                mismatches.push(`#${i}: token(${ts.kind}/${ts.aoe}/${ts.shape}) vs world(${ws.kind}/${ws.aoe}/${ws.shape})`);
            }
        }
        if (mismatches.length) {
            console.warn(`${PREFIX} ${label} — TOKEN vs WORLD MISMATCH`, mismatches);
        }
        else {
            console.log(`${PREFIX} ${label} — token and world attack targeting match`);
        }
    }
    else {
        console.log(`${PREFIX} ${label} — no separate world actor (or same reference)`);
    }
}
export function logNpcOptionBranch(label, option, targeting) {
    if (!NPC_TARGETING_DEBUG)
        return;
    const source = option?.source;
    const burst = !!option?.burstMeleeAoE;
    const tags = option?.tags || [];
    const isRangedTag = tags.includes('ranged');
    let branch = 'unknown';
    if (source === 'npc-attack') {
        if (!isRangedTag && burst)
            branch = 'MELEE_AOE_DIALOG';
        else if (!isRangedTag && !burst)
            branch = 'MELEE_SINGLE_TARGET';
        else if (isRangedTag && (option?.aoeShape === 'radius' || targeting?.rangedZone))
            branch = 'RANGE_AOE_ZONE';
        else if (isRangedTag)
            branch = 'RANGE_SINGLE_TARGET';
    }
    else if (source === 'power') {
        branch = burst ? 'POWER_MELEE_AOE' : 'POWER_OTHER';
    }
    console.log(`${PREFIX} ${label} — branch=${branch}`, {
        source,
        name: option?.name,
        id: option?.id,
        itemId: option?.item?.id,
        itemName: option?.item?.name,
        tags,
        burstMeleeAoE: burst,
        aoeShape: option?.aoeShape,
        aoeRadiusMeters: option?.aoeRadiusMeters,
        range: option?.range,
        npcAttackIndex: option?.npcAttackIndex,
        npcPhaseIndex: option?.npcPhaseIndex,
        npcAttackUsageKey: option?.npcAttackUsageKey,
        targeting,
    });
}
//# sourceMappingURL=npc-targeting-debug.js.map