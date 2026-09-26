/**
 * Stone assignment commit → resolution queue.
 *
 * Placing Stones only plans. Confirm pays once, applies powers whose effect
 * is already determined, and queues powers that still need a target.
 * Tickets are idempotent: the same id is never inserted twice, and a
 * resolved ticket is never rolled again.
 */
import { STONE_POWERS, resolveStonePowerId, scaleStoneTier } from './stone-powers.js';
import { healDamage, healStressFromBars } from '../utils/calculations.js';
export const STONE_RESOLUTION_QUEUE_FLAG = 'stoneResolutionQueue';
/**
 * Powers whose committed rank still needs a target or another player choice.
 * Healing and Stress Healing roll in the queue. The others keep their existing
 * apply (prompt or pending flag) and run only after confirm.
 */
const INTERACTIVE_STONE_POWER_IDS = new Set([
    'resolve.healing',
    'resolve.stressHealing',
    'agility.safeMovement',
    'influence.aidRoll',
    'influence.regeneration',
    'influence.passiveSwap',
    'influence.notATarget',
    'wits.readIntent',
]);
export function stoneResolutionKind(powerId) {
    const id = resolveStonePowerId(powerId);
    if (INTERACTIVE_STONE_POWER_IDS.has(id))
        return 'interactive';
    const power = STONE_POWERS[id];
    if (power?.category === 'passive')
        return 'passive';
    return 'automatic';
}
/** Allocation never executes a power. Confirm is the only commit point. */
export function effectsFromAllocation() {
    return [];
}
export function stoneResolutionTicketId(combatId, round, powerId, tier) {
    return `${combatId}:${round}:${resolveStonePowerId(powerId)}:${Math.floor(Number(tier) || 0)}`;
}
export function readStoneResolutionQueue(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const row = raw;
    if (typeof row.combatId !== 'string' || !Array.isArray(row.tickets))
        return null;
    const tickets = [];
    for (const ticket of row.tickets) {
        if (!ticket || typeof ticket !== 'object')
            continue;
        const id = String(ticket.id || '');
        const powerId = resolveStonePowerId(String(ticket.powerId || ''));
        const tier = Math.floor(Number(ticket.tier) || 0);
        const status = ticket.status === 'resolved' ? 'resolved' : 'pending';
        if (!id || !powerId || tier < 1)
            continue;
        tickets.push({ id, powerId, tier, status });
    }
    return {
        combatId: row.combatId,
        round: Math.floor(Number(row.round) || 0),
        tickets,
    };
}
export function pendingStoneResolutions(queue) {
    if (!queue)
        return [];
    return queue.tickets.filter((ticket) => ticket.status === 'pending');
}
/**
 * Add interactive powers for this combat round. Resolved ids stay resolved.
 * A second confirm with the same power does not create another ticket.
 */
export function enqueueStoneResolutions(existing, combatId, round, incoming) {
    const same = !!existing && existing.combatId === combatId && Number(existing.round) === Number(round);
    const tickets = same ? existing.tickets.map((ticket) => ({ ...ticket })) : [];
    for (const row of incoming) {
        if (stoneResolutionKind(row.powerId) !== 'interactive')
            continue;
        const tier = Math.floor(Number(row.tier) || 0);
        if (tier < 1)
            continue;
        const id = stoneResolutionTicketId(combatId, round, row.powerId, tier);
        if (tickets.some((ticket) => ticket.id === id))
            continue;
        tickets.push({
            id,
            powerId: resolveStonePowerId(row.powerId),
            tier,
            status: 'pending',
        });
    }
    return { combatId, round, tickets };
}
export function markStoneResolutionResolved(queue, ticketId) {
    return {
        ...queue,
        tickets: queue.tickets.map((ticket) => ticket.id === ticketId ? { ...ticket, status: 'resolved' } : { ...ticket }),
    };
}
export function splitCommitEffects(powers) {
    const onCommit = [];
    const interactive = [];
    for (const power of powers) {
        if (stoneResolutionKind(power.powerId) === 'interactive')
            interactive.push(power);
        else
            onCommit.push(power);
    }
    return { onCommit, interactive };
}
/**
 * Confirm applies each automatic/passive power once and locks the assignment.
 * A later call (view-only reopen, refresh) does not fire them again.
 */
export function simulateConfirmAssignment(state, args) {
    if (state.locked) {
        return {
            locked: true,
            fired: [...state.fired],
            queue: state.queue
                ? { ...state.queue, tickets: state.queue.tickets.map((ticket) => ({ ...ticket })) }
                : null,
        };
    }
    const { onCommit, interactive } = splitCommitEffects(args.powers);
    const fired = [...state.fired];
    for (const power of onCommit) {
        const key = `${resolveStonePowerId(power.powerId)}:${power.tier}`;
        if (fired.includes(key))
            continue;
        args.onAutomatic(power);
        fired.push(key);
    }
    return {
        locked: true,
        fired,
        queue: enqueueStoneResolutions(state.queue, args.combatId, args.round, interactive),
    };
}
export function healingRankProfile(tier) {
    return {
        dice: scaleStoneTier([4, 8, 12, 16], tier),
        rangeM: scaleStoneTier([2, 4, 8, 16], tier),
    };
}
export function stressHealingRankProfile(tier) {
    return {
        dice: scaleStoneTier([1, 2, 3, 4], tier),
        rangeM: scaleStoneTier([2, 4, 8, 16], tier),
    };
}
/** Self is always legal. An ally counts only when the measured distance is inside range. */
export function isLegalStoneTarget(candidate, rangeM) {
    if (candidate.self)
        return true;
    if (candidate.distanceM == null || !Number.isFinite(candidate.distanceM))
        return false;
    return candidate.distanceM <= rangeM;
}
export function legalStoneTargets(candidates, rangeM) {
    return candidates.filter((candidate) => isLegalStoneTarget(candidate, rangeM));
}
export function hpRestoredFromRoll(current, max, rolled) {
    const cur = Math.max(0, Math.floor(Number(current) || 0));
    const cap = Math.max(cur, Math.floor(Number(max) || 0));
    const roll = Math.max(0, Math.floor(Number(rolled) || 0));
    return Math.max(0, Math.min(roll, cap - cur));
}
export function applyHealingToCurrentBar(health, rolled) {
    const bars = (health.bars || []).map((bar) => ({ ...bar }));
    const currentBar = Math.max(0, Math.min(bars.length - 1, Math.floor(Number(health.currentBar) || 0)));
    const before = bars[currentBar] ? Math.floor(Number(bars[currentBar].current) || 0) : 0;
    const roll = Math.max(0, Math.floor(Number(rolled) || 0));
    if (bars[currentBar])
        healDamage(bars, currentBar, roll);
    const restored = bars[currentBar] ? Math.floor(Number(bars[currentBar].current) || 0) - before : 0;
    return { bars, currentBar, restored: Math.max(0, restored), rolled: roll };
}
export function stressRestoredFromBars(before, after) {
    const sum = (bars) => bars.reduce((total, bar) => total + Math.max(0, Math.floor(Number(bar?.current) || 0)), 0);
    return Math.max(0, sum(after) - sum(before));
}
export function applyStressHealingToBars(bars, currentBar, rolled) {
    const before = bars.map((bar) => ({ ...bar }));
    const roll = Math.max(0, Math.floor(Number(rolled) || 0));
    const healed = healStressFromBars(before, currentBar, roll);
    return {
        bars: healed.bars,
        currentBar: healed.currentBar,
        restored: stressRestoredFromBars(before, healed.bars),
        rolled: roll,
    };
}
export function escapeStoneChat(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
export function healingChatContent(args) {
    const source = escapeStoneChat(args.sourceName);
    const target = escapeStoneChat(args.targetName);
    const cap = args.restored < args.rolled
        ? `<p>Rolled <strong>${args.rolled}</strong> (${args.dice}d8). <strong>${args.restored} HP restored</strong> — the current Health Bar was only ${args.restored} HP short of maximum.</p>`
        : `<p>Rolled <strong>${args.rolled}</strong> (${args.dice}d8). <strong>${args.restored} HP restored</strong>.</p>`;
    return `<div class="mastery-stone-resolution"><p><strong>${source}</strong> — Healing</p><p>Target: <strong>${target}</strong></p>${cap}</div>`;
}
export function stressHealingChatContent(args) {
    const source = escapeStoneChat(args.sourceName);
    const target = escapeStoneChat(args.targetName);
    const cap = args.restored < args.rolled
        ? `<p>Rolled <strong>${args.rolled}</strong> (${args.dice}d8, ${args.rangeM} m). <strong>${args.restored} Stress removed</strong> — only ${args.restored} fit in the Stress bars.</p>`
        : `<p>Rolled <strong>${args.rolled}</strong> (${args.dice}d8, ${args.rangeM} m). <strong>${args.restored} Stress removed</strong>.</p>`;
    return `<div class="mastery-stone-resolution"><p><strong>${source}</strong> — Stress Healing</p><p>Target: <strong>${target}</strong></p>${cap}</div>`;
}
export async function resolveHealingSelection(args) {
    const profile = healingRankProfile(args.tier);
    if (profile.dice <= 0)
        return { ok: false, restored: 0, targetId: null };
    const legal = legalStoneTargets(args.candidates, profile.rangeM);
    const picked = String((await args.choose(legal)) || '').trim();
    if (!picked || !legal.some((candidate) => candidate.id === picked)) {
        return { ok: false, restored: 0, targetId: null };
    }
    const rolled = Math.max(0, Math.floor(Number(await args.roll(`${profile.dice}d8`)) || 0));
    const health = args.healthOf(picked);
    const applied = health
        ? applyHealingToCurrentBar(health, rolled)
        : { bars: [], currentBar: 0, restored: 0, rolled };
    if (health) {
        await args.writeHealth(picked, { bars: applied.bars, currentBar: applied.currentBar });
    }
    const targetName = legal.find((candidate) => candidate.id === picked)?.name || picked;
    try {
        await args.chat(healingChatContent({
            sourceName: args.sourceName,
            targetName,
            dice: profile.dice,
            rolled: applied.rolled,
            restored: applied.restored,
        }));
    }
    catch {
        /* the HP write already happened; chat must not cause a second heal */
    }
    return { ok: true, restored: applied.restored, targetId: picked };
}
export async function resolveStressHealingSelection(args) {
    const profile = stressHealingRankProfile(args.tier);
    if (profile.dice <= 0)
        return { ok: false, restored: 0, targetId: null };
    const legal = legalStoneTargets(args.candidates, profile.rangeM);
    const picked = String((await args.choose(legal)) || '').trim();
    if (!picked || !legal.some((candidate) => candidate.id === picked)) {
        return { ok: false, restored: 0, targetId: null };
    }
    const rolled = Math.max(0, Math.floor(Number(await args.roll(`${profile.dice}d8`)) || 0));
    const stress = args.stressOf(picked);
    const applied = stress
        ? applyStressHealingToBars(stress.bars, stress.currentBar, rolled)
        : { bars: [], currentBar: 0, restored: 0, rolled };
    if (stress) {
        await args.writeStress(picked, { bars: applied.bars, currentBar: applied.currentBar });
    }
    const targetName = legal.find((candidate) => candidate.id === picked)?.name || picked;
    try {
        await args.chat(stressHealingChatContent({
            sourceName: args.sourceName,
            targetName,
            dice: profile.dice,
            rolled: applied.rolled,
            restored: applied.restored,
            rangeM: profile.rangeM,
        }));
    }
    catch {
        /* Stress is already written */
    }
    return { ok: true, restored: applied.restored, targetId: picked };
}
//# sourceMappingURL=stone-resolution.js.map