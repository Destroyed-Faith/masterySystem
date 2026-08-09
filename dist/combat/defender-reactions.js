/**
 * Defender reactions — eligibility + Evade negation helpers.
 *
 * Interactive spend UI lives in `reaction-window-chat.ts` (chat buttons posted
 * after the damage roll). Ghost Slip–style powers (`phasing.reactionSingleHit`)
 * are omitted here: they interact with the phasing step, not post-phasing mitigation.
 */
import { getActionEconomyActor, getReactionActionsSummary, hasPowerBeenUsedThisRound, } from './action-economy.js';
import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { buildArtifactReactionOptions } from '../radial-menu/artifact-options.js';
import { getPrimaryTokenForActor } from '../utils/mechanics-adjacency.js';
import { distanceBetweenTokensMeters } from './threatened-ranged.js';
import { buildBasicReactionItems, isBasicReactionItem } from './basic-combat.js';
/**
 * Reaction Evade vs a known attack total.
 * Hit rule is attack ≥ Evade, so the reaction negates only when
 * (baseEvade + bonus) > attackTotal.
 */
export function evaluateReactionEvadeNegation(baseEvade, bonus, attackTotal) {
    const base = Math.max(0, Math.floor(Number(baseEvade) || 0));
    const b = Math.max(0, Math.floor(Number(bonus) || 0));
    const effectiveEvade = base + b;
    const atk = attackTotal == null || !Number.isFinite(Number(attackTotal))
        ? null
        : Math.floor(Number(attackTotal));
    if (atk == null) {
        return { baseEvade: base, bonus: b, effectiveEvade, attackTotal: null, negates: false, unknown: true };
    }
    return {
        baseEvade: base,
        bonus: b,
        effectiveEvade,
        attackTotal: atk,
        negates: b > 0 && effectiveEvade > atk,
        unknown: false,
    };
}
function defenderActorForEconomy(defender) {
    return (getActionEconomyActor(defender) ?? defender);
}
/**
 * Reaction-type power items the defender can still use this round (equipped, not used).
 *
 * Includes:
 *   - regular `power` items with `system.powerType === 'reaction'`, and
 *   - synthetic items materialized from each equipped artifact's
 *     `system.levelProgression` rows of type `'Reaction'` (up to
 *     `system.currentLevel`). Synthetic items carry an `id` like
 *     `artifact-reaction:<artifactItemId>:<level>` so they participate
 *     in the same once-per-round bookkeeping.
 */
export function getEligibleReactionPowers(defender, combat) {
    if (!defender || !combat)
        return [];
    const owner = defenderActorForEconomy(defender);
    const items = owner.items;
    if (!items)
        return [];
    const out = [];
    for (const item of items) {
        if (item.type !== 'power')
            continue;
        const sys = item.system;
        if (sys?.powerType !== 'reaction')
            continue;
        if (sys?.equipped === false)
            continue;
        if (sys?.showInRadialMenu === false)
            continue;
        if (hasPowerBeenUsedThisRound(owner, combat, item.id))
            continue;
        // Ghost Slip (phasing.reactionSingleHit) stays in the pool; the Reaction
        // Window eligibility layer hides it unless Passive Phasing + hit apply.
        out.push(item);
    }
    try {
        const artifactReactions = buildArtifactReactionOptions(owner);
        for (const opt of artifactReactions) {
            if (hasPowerBeenUsedThisRound(owner, combat, opt.id))
                continue;
            out.push({
                id: opt.id,
                name: opt.name,
                type: 'artifact',
                system: { powerType: 'reaction', description: opt.description },
                artifactReactionMeta: {
                    artifactItemId: opt.item?.id,
                    artifactName: opt.item?.name,
                    description: opt.description,
                },
            });
        }
    }
    catch (err) {
        console.warn('Mastery System | defender-reactions: artifact reaction collection failed', err);
    }
    try {
        for (const basic of buildBasicReactionItems(owner)) {
            out.push(basic);
        }
    }
    catch (err) {
        console.warn('Mastery System | defender-reactions: basic reaction injection failed', err);
    }
    return dedupeOverlappingBasicReactions(out);
}
/**
 * If the actor already has a real Evade/Guard reaction power, hide the matching
 * Basic Reaction so the window does not list "Reaction: Evade" and "Evade".
 */
export function dedupeOverlappingBasicReactions(powers) {
    if (!powers?.length)
        return powers ?? [];
    const nonBasic = powers.filter((p) => !isBasicReactionItem(p));
    const hasPowerEvade = nonBasic.some((p) => {
        const mech = resolvePowerMechanics(p);
        if ((Number(mech?.evade) || 0) > 0)
            return true;
        const tid = String(p?.system?.templateId ?? '').toLowerCase();
        if (tid.includes('evade') && !tid.includes('ally'))
            return true;
        const name = String(p?.name ?? '').toLowerCase();
        return /\bevade\b/.test(name) && !/\bally\b/.test(name);
    });
    const hasPowerGuard = nonBasic.some((p) => {
        const tid = String(p?.system?.templateId ?? '').toLowerCase();
        const name = String(p?.name ?? '').toLowerCase();
        if (tid.includes('guard') || tid === 'reaction-armor' || tid.includes('pure-defense')) {
            return true;
        }
        return /\bguard\b/.test(name) || /^reaction:\s*armor\b/.test(name);
    });
    return powers.filter((p) => {
        if (p?.basicReaction === 'evade' && hasPowerEvade)
            return false;
        if (p?.basicReaction === 'guard' && hasPowerGuard)
            return false;
        return true;
    });
}
const INITIATIVE_GAIN_TEMPLATE = 'reaction-initiative-gain';
const ALLY_REACTION_RANGE_M = 4;
/** Ally-protection reactions (help another creature in range). */
export function isAllyReactionPower(item) {
    const tid = String(item?.system?.templateId ?? '').toLowerCase();
    if (tid.startsWith('reaction-ally-'))
        return true;
    const sub = String(item?.system?.subfamily ?? '').toLowerCase();
    if (sub === 'ally')
        return true;
    const name = String(item?.name ?? '').toLowerCase();
    return /\bally\b/.test(name);
}
/** Synthetic Interpose button (ally ≤2 m takes half damage). */
export function buildInterposeReactionItem() {
    return {
        id: 'basic-reaction-interpose',
        name: 'Interpose',
        type: 'basic-reaction',
        system: {
            powerType: 'reaction',
            templateId: 'basic-interpose',
            description: 'When an ally within 2 m takes damage, step in and take half of it (rounded up to you).',
        },
        basicReaction: 'interpose',
        mechanics: {},
    };
}
/** Synthetic Opportunity Attack button (Threatened Ranged / leaving reach). */
export function buildOpportunityAttackReactionItem(actor) {
    const mr2 = Math.max(2, Math.floor(Number(actor?.system?.mastery?.rank) || 2) * 2);
    return {
        id: 'basic-reaction-opportunity-attack',
        name: 'Opportunity Attack',
        type: 'basic-reaction',
        system: {
            powerType: 'reaction',
            templateId: 'basic-opportunity-attack',
            description: `Spend 1 Reaction to make a Basic Attack (Weapon + ${mr2}d8) against the creature that provoked you.`,
        },
        basicReaction: 'counterattack',
        mechanics: {},
    };
}
/** Duplicate Initiative Gain sources do not stack — keep only the highest version. */
function dedupeInitiativeGainReactions(powers) {
    const gainers = powers.filter((item) => {
        const mech = resolvePowerMechanics(item);
        const tid = String(item?.system?.templateId ?? '');
        return (mech?.initiativeGain ?? 0) > 0 || tid === INITIATIVE_GAIN_TEMPLATE;
    });
    if (gainers.length <= 1)
        return powers;
    let best = gainers[0];
    let bestVal = Math.max(0, Math.floor(Number(resolvePowerMechanics(best)?.initiativeGain) || 0));
    for (let i = 1; i < gainers.length; i++) {
        const val = Math.max(0, Math.floor(Number(resolvePowerMechanics(gainers[i])?.initiativeGain) || 0));
        if (val > bestVal) {
            best = gainers[i];
            bestVal = val;
        }
    }
    const bestId = best.id;
    return powers.filter((item) => {
        const mech = resolvePowerMechanics(item);
        const tid = String(item?.system?.templateId ?? '');
        const isGain = (mech?.initiativeGain ?? 0) > 0 || tid === INITIATIVE_GAIN_TEMPLATE;
        if (!isGain)
            return true;
        return item.id === bestId;
    });
}
/**
 * Defender + nearby allies + Threatened Ranged opportunity attackers.
 * - defender: own reactions
 * - allies: Ally-* reactions only (within 4 m)
 * - opportunity: Opportunity Attack (token ids from Threatened Ranged)
 */
export function collectReactionWindowEntries(params) {
    const { defender, attacker, combat } = params;
    const out = [];
    const economyDef = defenderActorForEconomy(defender);
    const defSummary = getReactionActionsSummary(economyDef, combat);
    const defPowers = dedupeInitiativeGainReactions(getEligibleReactionPowers(economyDef, combat));
    out.push({
        actor: economyDef,
        name: String(defender.name ?? 'Defender'),
        remaining: defSummary.remaining,
        total: defSummary.total,
        powers: defPowers,
        role: 'defender',
        distanceM: 0,
    });
    const seenActorIds = new Set([
        String(economyDef.id ?? ''),
        String(defender.id ?? ''),
    ]);
    const attackerId = attacker?.id ?? null;
    if (attackerId)
        seenActorIds.add(String(attackerId));
    try {
        const defToken = getPrimaryTokenForActor(defender);
        if (defToken && typeof canvas !== 'undefined') {
            for (const token of canvas.tokens?.placeables ?? []) {
                if (!token?.actor || token.id === defToken.id)
                    continue;
                const other = token.actor;
                const otherId = String(other.id ?? '');
                if (!otherId || seenActorIds.has(otherId))
                    continue;
                const dd = defToken.document?.disposition ?? defToken.disposition;
                const od = token.document?.disposition ?? token.disposition;
                const HOSTILE = globalThis.CONST?.TOKEN_DISPOSITIONS?.HOSTILE ?? -1;
                if (od === HOSTILE)
                    continue;
                if (dd !== od)
                    continue;
                const dist = distanceBetweenTokensMeters(defToken, token);
                if (!Number.isFinite(dist) || dist > ALLY_REACTION_RANGE_M)
                    continue;
                const economyAlly = defenderActorForEconomy(other);
                const allyId = String(economyAlly.id ?? otherId);
                if (seenActorIds.has(allyId))
                    continue;
                seenActorIds.add(allyId);
                seenActorIds.add(otherId);
                const summary = getReactionActionsSummary(economyAlly, combat);
                if (summary.remaining <= 0)
                    continue;
                const allyPowers = getEligibleReactionPowers(economyAlly, combat).filter(isAllyReactionPower);
                // Basic Interpose — take half damage for an adjacent ally (≤2 m).
                const powersForAlly = dist <= 2.05 ? [...allyPowers, buildInterposeReactionItem()] : allyPowers;
                if (!powersForAlly.length)
                    continue;
                out.push({
                    actor: economyAlly,
                    name: String(other.name ?? 'Ally'),
                    remaining: summary.remaining,
                    total: summary.total,
                    powers: powersForAlly,
                    role: 'ally',
                    distanceM: Math.round(dist * 10) / 10,
                });
            }
        }
    }
    catch (err) {
        console.warn('Mastery System | reaction window ally scan failed', err);
    }
    // Threatened Ranged / similar: named opportunity token ids.
    const oppIds = (params.opportunityEnemyTokenIds ?? [])
        .map((id) => String(id || '').trim())
        .filter(Boolean);
    const oppDebug = [];
    if (oppIds.length && typeof canvas !== 'undefined') {
        try {
            for (const tid of oppIds) {
                const token = canvas.tokens?.placeables?.find((t) => t?.id === tid) ||
                    canvas.scene?.tokens?.get?.(tid)?.object ||
                    null;
                const actor = (token?.actor || null);
                if (!actor) {
                    oppDebug.push({ tokenId: tid, skip: 'token-or-actor-not-found' });
                    continue;
                }
                const economyOpp = defenderActorForEconomy(actor);
                const oppActorId = String(economyOpp.id ?? actor.id ?? '');
                const name = String(actor.name ?? token?.name ?? 'Opportunity');
                if (!oppActorId) {
                    oppDebug.push({ tokenId: tid, name, skip: 'no-actor-id' });
                    continue;
                }
                if (seenActorIds.has(oppActorId)) {
                    oppDebug.push({
                        tokenId: tid,
                        name,
                        skip: 'already-listed-or-is-defender/attacker',
                        actorId: oppActorId,
                    });
                    continue;
                }
                seenActorIds.add(oppActorId);
                const summary = getReactionActionsSummary(economyOpp, combat);
                // Always list OA candidates (even at 0 Reactions) so the post-attack
                // card can explain why Alaris/Fynn cannot strike — never silent-skip.
                out.push({
                    actor: economyOpp,
                    name,
                    remaining: summary.remaining,
                    total: summary.total,
                    powers: summary.remaining > 0
                        ? [buildOpportunityAttackReactionItem(economyOpp)]
                        : [],
                    role: 'opportunity',
                    distanceM: null,
                });
                oppDebug.push({
                    tokenId: tid,
                    name,
                    included: true,
                    canAct: summary.remaining > 0,
                    reactions: summary,
                    ...(summary.remaining <= 0 ? { note: 'no-reactions-left' } : {}),
                });
            }
        }
        catch (err) {
            console.warn('Mastery System | reaction window opportunity scan failed', err);
        }
    }
    else if (!oppIds.length) {
        oppDebug.push({ skip: 'no-opportunity-token-ids-on-event' });
    }
    const includedOpp = out.filter((e) => e.role === 'opportunity').map((e) => e.name);
    console.log(`[MS Threatened Ranged] Phase-2/others opportunity build ids=[${oppIds.join(', ') || 'none'}] ` +
        `included=[${includedOpp.join(', ') || 'none'}]`);
    for (const row of oppDebug) {
        console.log(`[MS Threatened Ranged]   OA row: ${JSON.stringify(row)}`);
    }
    return out;
}
/**
 * @deprecated Prefer `runInteractiveReactionWindow` from `reaction-window-chat.ts`.
 */
export async function promptDefenderReactionsBeforeMitigation(params) {
    const { runInteractiveReactionWindow } = await import('./reaction-window-chat.js');
    const result = await runInteractiveReactionWindow({
        defender: params.defender,
        attacker: params.attacker,
        combat: params.combat,
        rawDamage: params.rawDamage,
        attackTotal: params.attackTotal ?? null,
        evadeTn: params.evadeTn ?? null,
        hit: true,
        phase: 'defender',
    });
    return result.mitigation;
}
//# sourceMappingURL=defender-reactions.js.map