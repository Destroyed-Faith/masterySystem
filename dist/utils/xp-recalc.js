/**
 * Ground-truth XP recalculation.
 *
 * Recomputes a character's *invested* XP directly from the current build
 * (attributes, skills, power levels, artifact levels) measured against the
 * immutable post-creation baseline, then redistributes the two XP pools so that
 * `invested = freeSpent + regularSpent` with the **Free pool spent first**
 * (matching the live spend logic), and derives the correct available XP.
 *
 * This deliberately ignores the XP history log, so it self-corrects accounting
 * drift caused by buggy / duplicated refund entries (e.g. the old Combat
 * Package Wizard "power upgrade refund" over-refund).
 */
import { totalArtifactXpToLevel } from './artifact-actor-rules.js';
import { attributeBandCost, skillBandCost } from './constants.js';
import { calculatePowerDeletionRefund } from './power-xp-refund.js';
import { actorHasPostCreationSnapshot } from './xp-post-creation.js';
import { readSkillPointPool } from '../progression/skill-point-pool.js';
/** True when a power item was granted for free (artifact / echo) and never cost XP. */
function powerGrantedForFree(item) {
    const flags = item?.flags?.['mastery-system'] ?? {};
    if (flags.echoBound || flags.fromArtifact || flags.artifactGranted)
        return true;
    const system = item?.system ?? {};
    return system.echoBound === true || system.fromArtifact === true || system.artifactGranted === true;
}
const ATTRIBUTE_KEYS = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
function stepSum(from, to, costFor) {
    const start = Math.floor(Number(from) || 0);
    const end = Math.floor(Number(to) || 0);
    let sum = 0;
    for (let v = start + 1; v <= end; v++)
        sum += costFor(v);
    return sum;
}
/**
 * Recompute the correct XP balance for `actor` from its current build.
 * Returns `ok:false` with an `error` when no post-creation snapshot exists
 * (attributes / skills cannot be measured without a baseline).
 */
export function computeGroundTruthXp(actor) {
    const system = actor?.system ?? {};
    const xp = system.xp ?? {};
    const points = system.points ?? {};
    const totalEarned = Math.max(0, Math.floor(Number(xp.totalEarned) || 0));
    const freeEarned = Math.max(0, Math.floor(Number(xp.freeEarned) || 0));
    const previousAvailable = Math.max(0, Math.floor(Number(points.xp) || 0));
    const previousFreeAvailable = Math.max(0, Math.floor(Number(points.xpFree) || 0));
    const previousSpent = Math.max(0, Math.floor(Number(xp.totalSpent) || 0));
    const previousFreeSpent = Math.max(0, Math.floor(Number(xp.freeSpent) || 0));
    const base = {
        totalEarned,
        freeEarned,
        previousAvailable,
        previousFreeAvailable,
        previousSpent,
        previousFreeSpent,
    };
    const snap = xp.postCreationProgress;
    if (!snap?.attributes || !actorHasPostCreationSnapshot(actor)) {
        return {
            ok: false,
            error: 'Kein Post-Creation-Snapshot vorhanden. Ohne diese Baseline lassen sich investierte Attribut-/Skill-XP nicht messen.',
            ...base,
            attributeSpent: 0,
            skillSpent: 0,
            powerSpent: 0,
            artifactSpent: 0,
            totalInvested: 0,
            regularSpent: previousSpent,
            freeSpent: previousFreeSpent,
            available: previousAvailable,
            freeAvailable: previousFreeAvailable,
            delta: 0,
            freeDelta: 0,
            totalDelta: 0,
            changed: false,
        };
    }
    let attributeSpent = 0;
    for (const k of ATTRIBUTE_KEYS) {
        const baseVal = Number(snap.attributes[k] ?? 2);
        const curVal = Number(system.attributes?.[k]?.value ?? baseVal);
        if (curVal > baseVal)
            attributeSpent += stepSum(baseVal, curVal, attributeBandCost);
    }
    let skillSpent = 0;
    const curSkills = system.skills ?? {};
    const snapSkills = snap.skills ?? {};
    // Ranks paid with unspent Skill Points are not XP; they raise the baseline.
    const placedSkillPoints = readSkillPointPool(system).placed;
    const skillKeys = new Set([...Object.keys(curSkills), ...Object.keys(snapSkills)]);
    for (const key of skillKeys) {
        const baseVal = Number(snapSkills[key] ?? 0) + Number(placedSkillPoints[key] ?? 0);
        const curVal = Number(curSkills[key] ?? 0);
        if (curVal > baseVal)
            skillSpent += stepSum(baseVal, curVal, skillBandCost);
    }
    const powerItems = (actor.items?.filter?.((i) => i.type === 'power') ?? []);
    let powerSpent = 0;
    for (const item of powerItems) {
        if (powerGrantedForFree(item))
            continue;
        // Same rules as delete-refund: full ladder for XP purchases, upgrades only
        // for creation / GM / Startfähigkeit grants.
        powerSpent += calculatePowerDeletionRefund(item);
    }
    const artifactItems = actor.items?.filter?.((i) => i.type === 'artifact') ?? [];
    let artifactSpent = 0;
    for (const item of artifactItems) {
        const level = Math.max(1, Math.floor(Number(item?.system?.level) || 1));
        if (level > 1)
            artifactSpent += totalArtifactXpToLevel(level);
    }
    const totalInvested = attributeSpent + skillSpent + powerSpent + artifactSpent;
    // Free pool is spent first, then regular (mirrors the live spend logic).
    const freeSpent = Math.min(freeEarned, totalInvested);
    const regularSpent = Math.max(0, totalInvested - freeSpent);
    const freeAvailable = Math.max(0, freeEarned - freeSpent);
    const available = Math.max(0, totalEarned - regularSpent);
    const delta = available - previousAvailable;
    const freeDelta = freeAvailable - previousFreeAvailable;
    const totalDelta = available + freeAvailable - (previousAvailable + previousFreeAvailable);
    const changed = available !== previousAvailable ||
        freeAvailable !== previousFreeAvailable ||
        regularSpent !== previousSpent ||
        freeSpent !== previousFreeSpent;
    return {
        ok: true,
        ...base,
        attributeSpent,
        skillSpent,
        powerSpent,
        artifactSpent,
        totalInvested,
        regularSpent,
        freeSpent,
        available,
        freeAvailable,
        delta,
        freeDelta,
        totalDelta,
        changed,
    };
}
/** HTML breakdown for the GM confirm dialog. */
export function formatXpRecalcHtml(actorName, r) {
    if (!r.ok) {
        return `<p class="xp-recalc-error"><strong>${actorName}:</strong> ${r.error}</p>`;
    }
    const fmt = (n) => `${n > 0 ? '+' : ''}${n}`;
    const totalEarnedAll = r.totalEarned + r.freeEarned;
    const spendable = r.available + r.freeAvailable;
    const previousSpendable = r.previousAvailable + r.previousFreeAvailable;
    return (`<div class="xp-recalc-dialog">` +
        `<p>Neuberechnung der verfügbaren XP für <strong>${actorName}</strong> aus dem aktuellen Build:</p>` +
        `<table class="xp-recalc-table" style="width:100%;border-collapse:collapse;margin:8px 0;">` +
        `<tbody>` +
        `<tr><td>Verdient gesamt</td><td style="text-align:right;"><strong>${totalEarnedAll}</strong></td></tr>` +
        `<tr><td>− Attribute</td><td style="text-align:right;">${r.attributeSpent}</td></tr>` +
        `<tr><td>− Skills</td><td style="text-align:right;">${r.skillSpent}</td></tr>` +
        `<tr><td>− Powers</td><td style="text-align:right;">${r.powerSpent}</td></tr>` +
        `<tr><td>− Artefakte</td><td style="text-align:right;">${r.artifactSpent}</td></tr>` +
        `<tr style="border-top:1px solid rgba(255,255,255,0.2);"><td>= Investiert</td><td style="text-align:right;"><strong>${r.totalInvested}</strong></td></tr>` +
        `</tbody></table>` +
        `<p class="xp-recalc-result" style="margin:6px 0;">Verfügbar zum Verteilen: <strong>${spendable}</strong> XP` +
        (r.changed ? ` &nbsp;(vorher ${previousSpendable}, Änderung <strong>${fmt(r.totalDelta)}</strong>)` : ` &nbsp;(unverändert)`) +
        `.</p>` +
        `</div>`);
}
/**
 * Persist `computeGroundTruthXp` onto the actor (pools + spent counters).
 * No-op when nothing changed. Throws / returns error result when snapshot missing.
 */
export async function applyGroundTruthXp(actor, opts = {}) {
    const r = computeGroundTruthXp(actor);
    if (!r.ok || !r.changed)
        return r;
    const system = actor?.system ?? {};
    const xp = system.xp ?? {};
    const history = Array.isArray(xp.history) ? [...xp.history] : [];
    history.push({
        ts: Date.now(),
        userId: opts.userId || '',
        userName: opts.userName || 'GM',
        kind: 'adjust',
        category: 'xp',
        amount: r.totalDelta,
        note: opts.note || 'GM: XP aus Build neu berechnet',
        before: {
            available: r.previousAvailable,
            freeAvailable: r.previousFreeAvailable,
            totalSpent: r.previousSpent,
            freeSpent: r.previousFreeSpent,
        },
        after: {
            available: r.available,
            freeAvailable: r.freeAvailable,
            totalSpent: r.regularSpent,
            freeSpent: r.freeSpent,
            invested: {
                attributes: r.attributeSpent,
                skills: r.skillSpent,
                powers: r.powerSpent,
                artifacts: r.artifactSpent,
                total: r.totalInvested,
            },
        },
    });
    await actor.update({
        'system.points.xp': r.available,
        'system.points.xpFree': r.freeAvailable,
        'system.xp.totalSpent': r.regularSpent,
        'system.xp.freeSpent': r.freeSpent,
        'system.xp.history': history.slice(-200),
    });
    return r;
}
//# sourceMappingURL=xp-recalc.js.map