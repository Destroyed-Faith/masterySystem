/**
 * Interactive Reaction Window — chat card with per-actor buttons.
 *
 * Phases:
 *  1. `defender` — direct target, right after the attack Roll (before damage).
 *  2. `allies` — nearby allies with Ally Armor/Evade/TempHP / Interpose (before damage).
 *  3. `others` — after the original attack fully resolves: Threatened Ranged OAs.
 *  4. `opportunity` — legacy/standalone OA-only window (same post-resolve rules).
 *
 * Each actor may spend exactly one Reaction per event. After a reaction is used
 * or declined, that actor drops off the card until nobody remains.
 * Post-attack OAs launch without pausing the summary (parallel OK).
 */
import { collectReactionWindowEntries, evaluateReactionEvadeNegation, isAllyReactionPower, } from './defender-reactions.js';
import { getActionEconomyActor, getReactionActionsSummary, markPowerUsedThisRound, spendReactionAction, } from './action-economy.js';
import { buildActorMechanicsBreakdown, resolvePowerMechanics } from '../utils/power-mechanics.js';
import { isBasicReactionItem } from './basic-combat.js';
import { getPrimaryTokenForActor } from '../utils/mechanics-adjacency.js';
import { buildReactionTriggerContext, evaluateReactionEligibility, isCounterDamageReaction, isGhostSlipReaction, isInterposeReaction, isParryFollowUpReaction, isRepositionReaction, isSpecialIncreaseReaction, } from './reaction-eligibility.js';
import { buildReflectionFormula, buildRiposteFormula, isReflectionReaction, isRiposteReaction, } from './parry.js';
const SOCKET_NAME = 'system.mastery-system';
const pendingWaiters = new Map();
/** Reaction windows currently resolving a blocking Counterattack/OA. */
const busyReactionMessages = new Set();
/**
 * Event ids the GM explicitly closed via “Reactions abgeschlossen”.
 * Must NOT be set on normal phase completion (defender Continue / auto-close),
 * because defender + others share one eventId — poisoning this set would block
 * the post-attack OA window.
 */
const closedReactionEvents = new Set();
let hooksRegistered = false;
let socketRegistered = false;
function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function emptyMitigation() {
    return { reactionArmorFlat: 0, reactionDrPct: 0 };
}
function userMayActForActor(actor) {
    const u = globalThis.game?.user;
    if (!u)
        return false;
    if (u.isGM)
        return true;
    return !!actor?.isOwner;
}
function mechanicsOf(item) {
    if (item?.mechanics && typeof item.mechanics === 'object') {
        return item.mechanics;
    }
    return resolvePowerMechanics(item);
}
function defenderEvadeFromActor(defender) {
    const sys = defender?.system;
    const total = Number(sys?.combat?.evadeTotal);
    if (Number.isFinite(total) && total > 0)
        return Math.floor(total);
    const evade = Number(sys?.combat?.evade);
    return Number.isFinite(evade) ? Math.max(0, Math.floor(evade)) : 0;
}
function readState(message) {
    const flags = message?.getFlag?.('mastery-system') || message?.flags?.['mastery-system'];
    const st = flags?.reactionWindow;
    if (!st || typeof st !== 'object')
        return null;
    return st;
}
function entriesForPhase(entries, phase) {
    if (phase === 'defender')
        return entries.filter((e) => e.role === 'defender');
    if (phase === 'allies')
        return entries.filter((e) => e.role === 'ally');
    if (phase === 'opportunity')
        return entries.filter((e) => e.role === 'opportunity');
    // After damage: Threatened Ranged OAs (ally mitigation already ran pre-damage).
    return entries.filter((e) => e.role === 'opportunity');
}
/**
 * Evade-focused reaction (Basic Evade or a reaction whose only combat effect
 * is an Evade bonus). These are grayed out when they cannot prevent the hit.
 */
function isEvadeOnlyReaction(power) {
    if (power?.basicReaction === 'evade')
        return true;
    const mech = mechanicsOf(power);
    const ev = Math.max(0, Math.floor(Number(mech?.evade) || 0));
    if (ev <= 0)
        return false;
    const armor = Math.max(0, Math.floor(Number(mech?.armor) || 0));
    const dr = Math.max(0, Math.floor(Number(mech?.damageReductionPct) || 0));
    if (armor > 0 || dr > 0)
        return false;
    if (power?.basicReaction === 'counterattack' || power?.basicReaction === 'guard')
        return false;
    return true;
}
/**
 * Whether an Evade-only reaction would raise Evade above the attack total.
 * - `true` / `false` when decidable
 * - `null` when not an evade-only reaction, or attack total unknown (keep enabled)
 */
function evadeReactionWouldNegateHit(power, state) {
    if (!isEvadeOnlyReaction(power))
        return null;
    if (!state.hit)
        return false;
    const mech = mechanicsOf(power);
    const bonus = Math.max(0, Math.floor(Number(mech?.evade) || 0));
    const evadeTnRaw = Math.floor(Number(state.evadeTn));
    // Need a known Normal TN / Evade baseline from the attack card.
    if (!Number.isFinite(evadeTnRaw) || evadeTnRaw <= 0)
        return null;
    const evEval = evaluateReactionEvadeNegation(evadeTnRaw, bonus, state.attackTotal);
    if (evEval.unknown)
        return null;
    return evEval.negates;
}
function filterEntriesForCard(entries, state, actors) {
    const spent = new Set(state.spentActorIds.map(String));
    const phase = state.phase ?? 'defender';
    const phaseEntries = entriesForPhase(entries, phase);
    const g = globalThis;
    const defender = actors?.defender ??
        (state.defenderId ? g.game?.actors?.get?.(state.defenderId) : null) ??
        null;
    const attacker = actors?.attacker ??
        (state.attackerId ? g.game?.actors?.get?.(state.attackerId) : null) ??
        null;
    return phaseEntries
        .map((e) => {
        const id = String(e.actor?.id ?? '');
        if (!id || spent.has(id)) {
            return { ...e, powers: [], remaining: 0 };
        }
        // Opportunity reactors: range is reactor ↔ shooter, not original defender ↔ shooter.
        const rangeSubject = e.role === 'opportunity'
            ? e.actor
            : phase === 'allies'
                ? defender
                : e.role === 'defender'
                    ? e.actor
                    : defender;
        const ctx = buildReactionTriggerContext({
            phase,
            hit: state.hit,
            attackTotal: state.attackTotal,
            evadeTn: state.evadeTn,
            defender: rangeSubject,
            attacker,
            allyDistanceM: e.role === 'ally' ? e.distanceM : null,
            suppressCounterattack: state.suppressCounterattack,
            hasParryThisHit: !!state.hasParryThisHit,
            attackType: state.attackType ?? null,
            isAoE: !!state.isAoE,
        });
        const powers = e.powers.filter((p) => evaluateReactionEligibility(p, ctx).shown);
        return { ...e, powers };
    })
        .filter((e) => {
        const id = String(e.actor?.id ?? '');
        if (spent.has(id))
            return false;
        return e.remaining > 0 && e.powers.length > 0;
    });
}
function buildReactionWindowHtml(state, entries, attackerName, defenderName) {
    const phase = state.phase ?? 'defender';
    const actionable = filterEntriesForCard(entries, state);
    const remainingN = actionable.length;
    const remainingSuffix = !state.resolved && remainingN > 0 ? ` — ${remainingN} remaining` : '';
    const title = phase === 'defender'
        ? '⚡ Reaction Window — Target'
        : phase === 'allies'
            ? `⚡ Reaction Window — Allies${remainingSuffix}`
            : phase === 'opportunity'
                ? `⚡ Threatened Ranged — Reactions${remainingSuffix}`
                : `⚡ After attack — Threatened Reactions${remainingSuffix}`;
    const hasThreatened = (state.opportunityEnemyTokenIds?.length ?? 0) > 0;
    let hitLine;
    if (phase === 'opportunity') {
        hitLine = `<p><strong>${escHtml(attackerName)}</strong>'s attack is done — enemies who had the shooter in melee reach may spend a <strong>Reaction</strong> (offensive Reactions vs the shooter, in parallel).</p>`;
    }
    else if (phase === 'others') {
        const dmgBit = state.hit
            ? `damage applied (${Math.max(0, Math.floor(state.rawDamage))})`
            : 'attack resolved';
        hitLine = hasThreatened
            ? `<p><strong>${escHtml(attackerName)}</strong> → <strong>${escHtml(defenderName)}</strong> — ${dmgBit}. Threatened enemies may spend a <strong>Reaction</strong> (Counterattack / Counter Damage / Special Increase). Summary shrinks as each acts or Declines.</p>`
            : `<p><strong>${escHtml(attackerName)}</strong> → <strong>${escHtml(defenderName)}</strong> — ${dmgBit}.</p>`;
    }
    else if (phase === 'allies') {
        hitLine = state.hit
            ? `<p>Nearby allies may protect <strong>${escHtml(defenderName)}</strong> before damage (Ally Armor / Evade / Temp HP / Interpose).</p>`
            : `<p>Attack missed — ally damage buffers are not needed.</p>`;
    }
    else if (state.hit) {
        hitLine =
            state.rawDamage > 0
                ? `<p><strong>${escHtml(attackerName)}</strong> → <strong>${escHtml(defenderName)}</strong> (hit — react before damage).</p>`
                : `<p><strong>${escHtml(attackerName)}</strong> → <strong>${escHtml(defenderName)}</strong> (hit — react before damage).</p>`;
    }
    else {
        hitLine = `<p><strong>${escHtml(attackerName)}</strong> → <strong>${escHtml(defenderName)}</strong> — attack <strong>missed</strong>. Target may still react.</p>`;
    }
    const usedBlock = state.used.length > 0
        ? `<div class="ms-reaction-window-used" style="margin:0.4em 0;">
          <div style="opacity:0.9;font-size:0.92em;"><strong>Used this event:</strong></div>
          <ul style="margin:0.2em 0 0 1.2em;padding:0;">
            ${state.used
            .map((u) => `<li><strong>${escHtml(u.actorName)}</strong> — ${escHtml(u.powerName)}</li>`)
            .join('')}
          </ul>
        </div>`
        : '';
    let body;
    if (state.resolved) {
        body = state.gmClosed
            ? `<p style="opacity:0.9;"><strong>GM:</strong> Reactions abgeschlossen — keine weiteren Karten.</p>${usedBlock}`
            : `<p style="opacity:0.9;">Reaction window closed.</p>${usedBlock}`;
    }
    else if (!actionable.length) {
        if (phase === 'opportunity' || (phase === 'others' && hasThreatened)) {
            const oppEntries = entries.filter((e) => e.role === 'opportunity');
            const skipLines = oppEntries.length > 0
                ? `<ul style="margin:0.25em 0 0 1.2em;padding:0;">${oppEntries
                    .map((e) => {
                    const left = Math.max(0, Math.floor(Number(e.remaining) || 0));
                    const tot = Math.max(0, Math.floor(Number(e.total) || 0));
                    const why = left <= 0
                        ? `no Reactions left this round (${tot - left}/${tot} used)`
                        : 'no usable offensive Reaction (Counterattack / Counter Damage / Special Increase)';
                    return `<li><strong>${escHtml(e.name)}</strong> — ${escHtml(why)}</li>`;
                })
                    .join('')}</ul>`
                : '';
            body = `<p>No Threatened Reactions available right now.</p>${skipLines}${usedBlock}`;
        }
        else if (phase === 'allies') {
            body = `<p>No nearby allies with an Ally Reaction / Interpose ready.</p>${usedBlock}`;
        }
        else if (phase === 'others') {
            body = `<p>No Threatened Reactions available.</p>${usedBlock}`;
        }
        else {
            const def = entries.find((e) => e.role === 'defender');
            const defId = def ? String(def.actor?.id ?? '') : '';
            const defSpent = defId && state.spentActorIds.map(String).includes(defId);
            body = `<p>${defSpent
                ? `<strong>${escHtml(defenderName)}</strong> already used a Reaction for this event.`
                : def
                    ? def.remaining <= 0
                        ? `<strong>${escHtml(defenderName)}</strong> has <strong>no Reactions left</strong> this round (${def.total - def.remaining}/${def.total} used).`
                        : `<strong>${escHtml(defenderName)}</strong> has Reaction(s) left but <strong>no eligible reaction powers</strong>.`
                    : 'No one can react.'}</p>${usedBlock}`;
        }
    }
    else {
        const blocks = actionable
            .map((e) => {
            const actorId = String(e.actor.id ?? '');
            const role = e.role === 'defender' ? 'target' : e.role === 'opportunity' ? 'opportunity' : 'ally';
            const dist = e.role === 'ally' && e.distanceM != null ? ` · ${e.distanceM} m` : '';
            const buttons = e.powers
                .map((p) => {
                const pid = String(p.id ?? '');
                const pname = String(p?.name ?? 'Reaction').trim();
                const label = pname.length > 42 ? `${pname.slice(0, 39)}…` : pname;
                const evadeOk = evadeReactionWouldNegateHit(p, state);
                // Evade-only reactions that cannot prevent this hit → grayed out.
                if (evadeOk === false) {
                    const why = !state.hit
                        ? 'Attack already missed'
                        : 'Will not prevent the hit';
                    return `<button type="button" class="ms-reaction-use-btn ms-reaction-use-btn--disabled"
                data-actor-id="${escHtml(actorId)}"
                data-power-id="${escHtml(pid)}"
                data-evade-useless="1"
                disabled
                aria-disabled="true"
                title="${escHtml(why)}">
                <i class="fas fa-bolt"></i> ${escHtml(label)}
              </button>`;
                }
                const tip = evadeOk === true
                    ? `${pname} — would prevent the hit`
                    : pname;
                return `<button type="button" class="ms-reaction-use-btn"
              data-actor-id="${escHtml(actorId)}"
              data-power-id="${escHtml(pid)}"
              title="${escHtml(tip)}">
              <i class="fas fa-bolt"></i> ${escHtml(label)}
            </button>`;
            })
                .join('');
            return `<div class="ms-reaction-window-actor" data-actor-id="${escHtml(actorId)}" style="margin:0.55em 0;">
          <div><strong>${escHtml(e.name)}</strong>
            <span style="opacity:0.85">(${role}${dist}) — Reactions ${e.remaining}/${e.total}</span>
          </div>
          <div class="ms-reaction-window-buttons" style="display:flex;flex-wrap:wrap;gap:0.35em;margin-top:0.35em;">
            ${buttons}
            <button type="button" class="ms-reaction-decline-btn" data-actor-id="${escHtml(actorId)}"
              title="Skip for this character (still counts as their one chance for this event)">
              Decline
            </button>
          </div>
        </div>`;
        })
            .join('');
        const actionableIds = new Set(actionable.map((e) => String(e.actor?.id ?? '')));
        const skippedOpp = phase === 'others' || phase === 'opportunity'
            ? entries.filter((e) => e.role === 'opportunity' &&
                !actionableIds.has(String(e.actor?.id ?? '')))
            : [];
        const skippedBlock = skippedOpp.length > 0
            ? `<div class="ms-reaction-window-skipped" style="margin:0.45em 0;opacity:0.9;font-size:0.92em;">
            <div><strong>Cannot react (Threatened):</strong></div>
            <ul style="margin:0.2em 0 0 1.2em;padding:0;">
              ${skippedOpp
                .map((e) => {
                const left = Math.max(0, Math.floor(Number(e.remaining) || 0));
                const tot = Math.max(0, Math.floor(Number(e.total) || 0));
                const why = left <= 0
                    ? `no Reactions left (${tot - left}/${tot} used)`
                    : 'no usable offensive Reaction';
                return `<li><strong>${escHtml(e.name)}</strong> — ${escHtml(why)}</li>`;
            })
                .join('')}
            </ul>
          </div>`
            : '';
        const intro = phase === 'defender'
            ? `<p>The <strong>target</strong> may use <strong>one</strong> Reaction now (before damage):</p>`
            : phase === 'opportunity' || (phase === 'others' && hasThreatened)
                ? `<p>Each listed combatant may spend <strong>one</strong> Reaction vs the shooter (Counterattack / Counter Damage / Special Increase). Cards open in parallel — original attack already finished:</p>`
                : `<p>Each ally may use <strong>one</strong> Reaction for this event:</p>`;
        body = `${intro}${blocks}${skippedBlock}${usedBlock}`;
    }
    const continueHint = phase === 'defender'
        ? state.hit
            ? 'Continue to the damage roll.'
            : 'Close the window.'
        : remainingN > 0
            ? 'Close early (remaining actors skip).'
            : 'Close the window.';
    const postAttack = phase === 'others' || phase === 'opportunity';
    const continueBtn = state.resolved
        ? ''
        : `<div class="ms-reaction-window-actions" style="margin-top:0.6em;display:flex;flex-wrap:wrap;gap:0.45em;align-items:center;">
        ${phase === 'defender'
            ? `<button type="button" class="ms-reaction-continue-btn">
          <i class="fas fa-check"></i> Continue
        </button>`
            : ''}
        ${postAttack
            ? `<button type="button" class="ms-reaction-gm-close-btn" title="GM only — stop further reaction cards for this attack">
          <i class="fas fa-gavel"></i> Reactions abgeschlossen
        </button>`
            : `<button type="button" class="ms-reaction-gm-close-btn" title="GM only — close this reaction window">
          <i class="fas fa-gavel"></i> GM: Close
        </button>`}
        <span class="ms-reaction-continue-hint" style="opacity:0.85;font-size:0.88em;">
          ${escHtml(continueHint)}
        </span>
      </div>`;
    return `<div class="mastery-reaction-window" data-reaction-event="${escHtml(state.eventId)}" data-reaction-phase="${escHtml(phase)}">
      <strong>${title}</strong>
      ${hitLine}
      ${body}
      ${continueBtn}
    </div>`;
}
async function resolveActors(state) {
    const g = globalThis;
    let defender = null;
    if (state.defenderTokenId) {
        const tokenDoc = g.canvas?.scene?.tokens?.get?.(state.defenderTokenId);
        if (tokenDoc?.actor)
            defender = tokenDoc.actor;
    }
    if (!defender)
        defender = g.game?.actors?.get?.(state.defenderId) ?? null;
    const attacker = g.game?.actors?.get?.(state.attackerId) ?? null;
    const combat = g.game?.combat ?? null;
    return { attacker, defender, combat };
}
function buildSupersededReactionHtml(state, remainingN) {
    const phase = state.phase ?? 'others';
    const label = phase === 'opportunity' || phase === 'others'
        ? 'Threatened Reactions'
        : 'After attack — Reactions';
    const rem = remainingN > 0 ? `${remainingN} remaining` : 'updated';
    return `<div class="mastery-reaction-window" data-reaction-event="${escHtml(state.eventId)}" data-reaction-phase="${escHtml(phase)}" data-reaction-superseded="1">
      <strong>⚡ ${escHtml(label)}</strong>
      <p style="opacity:0.85;margin:0.35em 0 0;">Summary moved below ↓ <em>(${escHtml(rem)})</em></p>
    </div>`;
}
/**
 * Refresh the reaction card. For post-attack phases (`others` / `opportunity`),
 * posts a **new** chat message at the bottom (so the GM doesn't scroll) and
 * supersedes the previous card. Returns the active message id.
 */
async function refreshReactionCard(messageId, state) {
    const g = globalThis;
    const message = g.game?.messages?.get?.(messageId);
    if (!message)
        return messageId;
    const { attacker, defender, combat } = await resolveActors(state);
    if (!defender || !combat)
        return messageId;
    const entries = collectReactionWindowEntries({
        defender,
        attacker,
        combat,
        opportunityEnemyTokenIds: state.opportunityEnemyTokenIds ?? [],
    });
    const html = buildReactionWindowHtml(state, entries, String(attacker?.name ?? 'Attacker'), String(defender?.name ?? 'Defender'));
    const content = `<div class="mastery-reaction-msg">${html}</div>`;
    const postAttack = state.phase === 'others' || state.phase === 'opportunity';
    const eventClosed = closedReactionEvents.has(String(state.eventId || ''));
    const shouldRepost = postAttack && !state.resolved && !state.superseded && !state.gmClosed && !eventClosed;
    if (shouldRepost) {
        const remainingN = filterEntriesForCard(entries, state).length;
        const supersededState = {
            ...state,
            resolved: true,
            superseded: true,
        };
        try {
            await message.update({
                content: `<div class="mastery-reaction-msg">${buildSupersededReactionHtml(state, remainingN)}</div>`,
                flags: {
                    'mastery-system': {
                        ...(message.flags?.['mastery-system'] || {}),
                        reactionWindow: supersededState,
                    },
                },
            });
        }
        catch (err) {
            console.warn('Mastery System | reaction window supersede failed', err);
        }
        try {
            const newMsg = await g.ChatMessage?.create?.({
                user: g.game?.user?.id,
                speaker: g.ChatMessage?.getSpeaker?.({ actor: defender }),
                content,
                flags: {
                    'mastery-system': {
                        reactionWindow: { ...state, superseded: false },
                    },
                },
            });
            const newId = String(newMsg?.id ?? '');
            if (newId) {
                const waiter = pendingWaiters.get(messageId);
                if (waiter) {
                    pendingWaiters.delete(messageId);
                    pendingWaiters.set(newId, waiter);
                }
                if (busyReactionMessages.has(messageId)) {
                    busyReactionMessages.delete(messageId);
                    busyReactionMessages.add(newId);
                }
                return newId;
            }
        }
        catch (err) {
            console.warn('Mastery System | reaction window repost failed', err);
        }
    }
    try {
        await message.update({
            content,
            flags: {
                'mastery-system': {
                    ...(message.flags?.['mastery-system'] || {}),
                    reactionWindow: state,
                },
            },
        });
    }
    catch (err) {
        console.warn('Mastery System | reaction window refresh failed', err);
    }
    return messageId;
}
function findPowerForActor(entry, powerId) {
    if (!entry)
        return null;
    return entry.powers.find((p) => String(p.id) === powerId) ?? null;
}
async function launchBasicCounterattack(defender, attacker, opts) {
    const awaitResolution = opts?.awaitResolution !== false;
    const label = opts?.label || 'Counterattack';
    const defTok = getPrimaryTokenForActor(defender);
    const atkTok = getPrimaryTokenForActor(attacker);
    if (!defTok || !atkTok) {
        throw new Error(`Missing tokens for ${label}`);
    }
    const { createMeleeAttackCard } = await import('./attack-executor.js');
    const option = {
        id: 'weapon-attack',
        name: `${label} (Basic Attack)`,
        description: 'Basic Attack — Weapon Damage + MR × 2d8. No Active Power effects.',
        slot: 'attack',
        source: 'maneuver',
        tags: ['attack', 'basic', 'counterattack'],
        selectedPowerId: null,
        costsAction: false,
    };
    const messageId = await createMeleeAttackCard(defTok, atkTok, option);
    if (!messageId) {
        throw new Error(`${label} attack card was not created`);
    }
    if (!awaitResolution) {
        globalThis.ui?.notifications?.info?.(`${label}: attack card opened — roll when ready (original attack already finished).`);
        return;
    }
    const { waitForAttackResolution } = await import('./attack-resolution-wait.js');
    globalThis.ui?.notifications?.info?.(`${label}: Roll this attack now. Original damage is paused until it finishes (or you Skip).`);
    // Block the original attack pipeline until this Counterattack is rolled +
    // resolved (or skipped). Otherwise Dummy damage continues immediately.
    await waitForAttackResolution(messageId);
}
/**
 * Apply a chosen reaction for one actor. Updates economy + returns defender mitigation delta.
 */
async function executeReactionSpend(params) {
    const { actor, power, role, attacker, combat, defender } = params;
    let state = { ...params.state, spentActorIds: [...params.state.spentActorIds], used: [...params.state.used] };
    const economy = (getActionEconomyActor(actor) ?? actor);
    const actorId = String(economy.id ?? actor.id);
    const actorName = String(actor.name ?? 'Actor');
    if (state.spentActorIds.map(String).includes(actorId)) {
        return { state, note: 'Already reacted this event.' };
    }
    const summary = getReactionActionsSummary(economy, combat);
    if (summary.remaining <= 0) {
        return { state, note: 'No Reactions left.' };
    }
    const spent = await spendReactionAction(economy, combat);
    if (!spent) {
        return { state, note: 'Could not spend Reaction.' };
    }
    if (!isBasicReactionItem(power) && !power?.npcConfiguredReaction) {
        await markPowerUsedThisRound(economy, combat, power.id);
    }
    state.spentActorIds.push(actorId);
    state.used.push({
        actorId,
        actorName,
        powerId: String(power.id),
        powerName: String(power.name ?? 'Reaction'),
    });
    let note = '';
    const npcSpecials = Array.isArray(power?.npcReactionSpecials) ? power.npcReactionSpecials : [];
    if (npcSpecials.length && attacker) {
        try {
            const { applyNpcReactionSpecialsToTarget } = await import('../utils/npc-reactions.js');
            const limitNotes = await applyNpcReactionSpecialsToTarget(attacker, npcSpecials.map(String), actor);
            note += ` <em>(Specials: ${npcSpecials.join(', ')}.)</em>`;
            if (limitNotes.length)
                note += ` <em>${limitNotes.join(' ')}</em>`;
        }
        catch (err) {
            console.warn('Mastery System | NPC reaction specials failed', err);
        }
    }
    const mech = mechanicsOf(power);
    const isCounterattack = power?.basicReaction === 'counterattack';
    // Threatened Ranged: offensive reactions vs the shooter. Original attack
    // already finished — Counterattack cards open in parallel (non-blocking).
    if (role === 'opportunity' && isCounterattack) {
        note = ` <em>(Counterattack vs ${String(attacker?.name ?? 'the shooter')} — card opened, roll when ready.)</em>`;
        if (attacker) {
            try {
                await launchBasicCounterattack(actor, attacker, {
                    awaitResolution: false,
                    label: 'Counterattack',
                });
            }
            catch (err) {
                console.warn('Mastery System | Threatened Counterattack launch failed', err);
                globalThis.ui?.notifications?.warn?.('Counterattack: could not open attack card — resolve manually.');
            }
        }
        return { state, note };
    }
    // Interpose: ally takes half of the incoming damage (applied at HP-apply time).
    if (isInterposeReaction(power) || role === 'ally' && power?.basicReaction === 'interpose') {
        const prev = state.mitigation || emptyMitigation();
        state.mitigation = {
            ...prev,
            interposeActorId: actorId,
            interposeActorName: actorName,
            powerName: power.name,
        };
        note = ` <em>(Interpose — ${actorName} will take half of the damage dealt to ${String(defender.name ?? 'the target')}.)</em>`;
        return { state, note };
    }
    // Ally mitigation merges into the shared defender mitigation (pre-damage allies phase).
    const allyMitigation = role === 'ally' || isAllyReactionPower(power);
    // Ghost Slip — ignore the hit via reaction phasing charge.
    if (isGhostSlipReaction(power)) {
        try {
            const { triggerGhostSlipReaction } = await import('./phasing.js');
            const ok = await triggerGhostSlipReaction(defender, combat, String(power.id || 'ghost-slip'));
            if (ok) {
                state.mitigation = {
                    reactionArmorFlat: 0,
                    reactionDrPct: 0,
                    powerName: power.name,
                    phasedByReaction: true,
                    negatedByEvade: true,
                };
                note = ' <em>(Ghost Slip — hit ignored via Phasing.)</em>';
            }
            else {
                note = ' <em>(Ghost Slip failed — no phasing charge consumed.)</em>';
            }
        }
        catch (err) {
            console.warn('Mastery System | Ghost Slip reaction failed', err);
            note = ' <em>(Ghost Slip failed — resolve manually.)</em>';
        }
        return { state, note };
    }
    // Riposte / Reflection — after a Full Parry (no new attack roll).
    if (state.hasParryThisHit && attacker && isParryFollowUpReaction(power)) {
        const rider = String(mech?.damageRider?.flat ?? '').replace(/^\+/, '');
        try {
            let formula = '';
            let label = '';
            if (isRiposteReaction(power)) {
                formula = buildRiposteFormula(actor, rider);
                label = 'Riposte';
            }
            else if (isReflectionReaction(power)) {
                formula = buildReflectionFormula(state.rawDamage, attacker, rider);
                label = 'Reflection';
                // Reflection also prevents any residual triggering damage on the defender.
                state.mitigation = {
                    ...(state.mitigation || emptyMitigation()),
                    negatedByEvade: true,
                    powerName: power.name,
                };
            }
            else {
                formula = buildRiposteFormula(actor, rider);
                label = String(power.name ?? 'Parry Follow-up');
            }
            if (formula && formula !== '0') {
                const roll = await new globalThis.Roll(formula).evaluate({ async: true });
                const total = Math.max(0, Math.floor(Number(roll?.total) || 0));
                const { applyDamageToTarget } = await import('../dice/damage-dialog.js');
                await applyDamageToTarget(attacker, total, actor, 0, {
                    skipPhasing: true,
                    skipReactionPrompt: true,
                });
                note += ` <em>(${label} ${formula} → ${total} to ${String(attacker.name)}.)</em>`;
                await globalThis.ChatMessage?.create?.({
                    user: globalThis.game?.user?.id,
                    speaker: globalThis.ChatMessage?.getSpeaker?.({ actor }),
                    content: `<p class="mastery-reaction-msg"><strong>${escHtml(actorName)}</strong> ${escHtml(label)}: <strong>${escHtml(formula)}</strong> → <strong>${total}</strong> to <strong>${escHtml(String(attacker.name))}</strong>.</p>`,
                });
            }
            else {
                note += ` <em>(${label} — no damage formula.)</em>`;
            }
        }
        catch (err) {
            console.warn('Mastery System | Parry follow-up reaction failed', err);
            note += ' <em>(Parry follow-up failed — resolve manually.)</em>';
        }
        return { state, note };
    }
    // Defender / Ally mitigation
    const evadeTnRaw = Math.floor(Number(state.evadeTn));
    const baseEvade = Number.isFinite(evadeTnRaw) && evadeTnRaw > 0 ? evadeTnRaw : defenderEvadeFromActor(defender);
    const attackTotal = state.attackTotal != null && Number.isFinite(Number(state.attackTotal))
        ? Math.floor(Number(state.attackTotal))
        : null;
    const reactionArmorFlat = Math.max(0, Math.floor(Number(mech?.armor) || 0));
    let reactionDrPct = Math.max(0, Math.min(100, Math.floor(Number(mech?.damageReductionPct) || 0)));
    const iniGain = Math.max(0, Math.floor(Number(mech?.initiativeGain) || 0));
    const ev = Math.max(0, Math.floor(Number(mech?.evade) || 0));
    const tempHpGain = Math.max(0, Math.floor(Number(String(mech?.tempHP ?? '').replace(/[^\d.-]/g, '')) || 0));
    const evEval = evaluateReactionEvadeNegation(baseEvade, ev, attackTotal);
    let reactionDrBlocked = false;
    if (reactionDrPct > 0 && !evEval.negates) {
        const drSubject = defender;
        if (typeof drSubject.prepareDerivedData === 'function') {
            try {
                drSubject.prepareDerivedData();
            }
            catch {
                /* ignore */
            }
        }
        const bd = buildActorMechanicsBreakdown(drSubject);
        const passiveBase = bd.damageReductionPct.passive.reduce((s, r) => s + (r.value || 0), 0);
        const sheetDr = Math.max(0, Math.floor(Number(drSubject.system?.combat?.damageReductionPct) || 0));
        const totalFromBreakdown = Math.max(0, Math.floor(Number(bd.totals?.damageReductionPct) || 0));
        if (passiveBase <= 0 && sheetDr <= 0 && totalFromBreakdown <= 0) {
            reactionDrPct = 0;
            reactionDrBlocked = true;
        }
    }
    if (allyMitigation) {
        note += ` <em>(Ally Reaction for ${String(defender.name ?? 'the target')})</em>`;
    }
    if (!state.hit) {
        note += ' <em>(Attack missed — Guard/Evade mitigation not applied.)</em>';
    }
    else if (ev > 0) {
        if (evEval.unknown) {
            note += ` <em>(+${ev} Evade — attack total missing, could not auto-negate.)</em>`;
        }
        else if (evEval.negates) {
            note += ` +${ev} Evade (${evEval.baseEvade}→${evEval.effectiveEvade} vs Attack ${evEval.attackTotal}) — <strong>hit negated, no damage</strong>.`;
        }
        else {
            note += ` +${ev} Evade (${evEval.baseEvade}→${evEval.effectiveEvade} vs Attack ${evEval.attackTotal}) — still a hit.`;
        }
    }
    if (state.hit && !evEval.negates) {
        if (reactionArmorFlat > 0)
            note += ` +${reactionArmorFlat} Armor (this hit)`;
        if (reactionDrPct > 0)
            note += ` +${reactionDrPct}% DR (this hit)`;
        if (tempHpGain > 0)
            note += ` +${tempHpGain} Temp HP`;
        if (reactionDrBlocked) {
            note +=
                ' <em>(Reaction DR% needs slotted <strong>Damage Reduction</strong> DR% and/or a sustained DR% on the character sheet.)</em>';
        }
    }
    if (iniGain > 0) {
        note += ` <em>(+${iniGain} Initiative applies after this attack fully resolves.)</em>`;
    }
    // Grant Temp HP onto the defender immediately so mitigation can absorb it.
    if (state.hit && !evEval.negates && tempHpGain > 0) {
        try {
            const cur = Math.max(0, Math.floor(Number(defender.system?.health?.tempHP ?? 0) || 0));
            await defender.update?.({ 'system.health.tempHP': cur + tempHpGain });
        }
        catch (err) {
            console.warn('Mastery System | reaction Temp HP grant failed', err);
        }
    }
    // Counter Damage (+ optional Push confirm).
    // Threatened Ranged reactors were not the hit target — still allowed vs shooter.
    const allowOffensiveVsShooter = state.hit || role === 'opportunity';
    if (allowOffensiveVsShooter && attacker && isCounterDamageReaction(power)) {
        const flat = String(mech?.damageRider?.flat ?? '').replace(/^\+/, '');
        if (flat) {
            try {
                const roll = await new globalThis.Roll(flat).evaluate({ async: true });
                const total = Math.max(0, Math.floor(Number(roll?.total) || 0));
                const { applyDamageToTarget } = await import('../dice/damage-dialog.js');
                await applyDamageToTarget(attacker, total, actor, 0, {
                    skipPhasing: true,
                    skipReactionPrompt: true,
                });
                note += ` <em>(Counter Damage ${flat} → ${total} to ${String(attacker.name)}.)</em>`;
                await globalThis.ChatMessage?.create?.({
                    user: globalThis.game?.user?.id,
                    speaker: globalThis.ChatMessage?.getSpeaker?.({ actor }),
                    content: `<p class="mastery-reaction-msg"><strong>${escHtml(actorName)}</strong> Counter Damage: <strong>${escHtml(flat)}</strong> → <strong>${total}</strong> to <strong>${escHtml(String(attacker.name))}</strong>.</p>`,
                });
            }
            catch (err) {
                console.warn('Mastery System | Counter Damage failed', err);
                note += ' <em>(Counter Damage failed — resolve manually.)</em>';
            }
        }
        try {
            const { readPushPullMetersFromPower, offerForcedMovementFromActors } = await import('./forced-movement.js');
            const { push: pushM, pull: pullM } = readPushPullMetersFromPower(power);
            if (pushM > 0 || pullM > 0) {
                const bits = [];
                if (pushM > 0)
                    bits.push(`Push ${pushM} m (away)`);
                if (pullM > 0)
                    bits.push(`Pull ${pullM} m (toward)`);
                note += ` <em>(${bits.join(' / ')} — choose a highlighted cell.)</em>`;
                // Canvas mode: only cells farther (Push) / closer (Pull) than current.
                await offerForcedMovementFromActors({
                    movedActor: attacker,
                    referenceActor: actor,
                    pushM,
                    pullM,
                    labelPrefix: 'Counter Damage',
                });
            }
        }
        catch (err) {
            console.warn('Mastery System | Counter Damage Push/Pull targeting failed', err);
            note += ' <em>(Push/Pull targeting failed — move manually.)</em>';
        }
    }
    // Special Increase — bump an existing Special on the attacker / shooter.
    if (allowOffensiveVsShooter && attacker && isSpecialIncreaseReaction(power)) {
        const amount = Math.max(0, Math.floor(Number(mech?.modifySpecial?.amount) || 0));
        if (amount > 0) {
            try {
                const { readActiveSpecials } = await import('../system/active-specials.js');
                const list = readActiveSpecials(attacker);
                if (!list.length) {
                    note += ' <em>(Special Increase — attacker has no active Special to raise.)</em>';
                }
                else {
                    let chosenIdx = 0;
                    if (list.length > 1) {
                        const Dialog = globalThis.Dialog;
                        const options = list
                            .map((s, i) => `<option value="${i}">${escHtml(String(s.id))} (${Math.floor(Number(s.value) || 0)})</option>`)
                            .join('');
                        chosenIdx = await new Promise((resolve) => {
                            if (!Dialog) {
                                resolve(0);
                                return;
                            }
                            new Dialog({
                                title: 'Special Increase — choose Special',
                                content: `<p>Increase which Special by <strong>+${amount}</strong>?</p>
                  <select id="ms-special-inc" style="width:100%">${options}</select>`,
                                buttons: {
                                    ok: {
                                        label: 'Increase',
                                        callback: (html) => {
                                            const v = Number($(html).find('#ms-special-inc').val());
                                            resolve(Number.isFinite(v) ? v : 0);
                                        },
                                    },
                                    cancel: { label: 'Skip', callback: () => resolve(-1) },
                                },
                                default: 'ok',
                                close: () => resolve(-1),
                            }).render(true);
                        });
                    }
                    if (chosenIdx >= 0 && chosenIdx < list.length) {
                        const chosen = list[chosenIdx];
                        const raw = Array.isArray(attacker.system?.statusEffects)
                            ? [...attacker.system.statusEffects]
                            : [];
                        let updated = false;
                        for (let i = 0; i < raw.length; i++) {
                            const entry = raw[i];
                            const eid = String(entry?.id || entry?.name || '').toLowerCase();
                            if (eid === chosen.id.toLowerCase() || String(entry?.name || '').toLowerCase().includes(chosen.id)) {
                                raw[i] = { ...entry, value: Math.max(0, Math.floor(Number(entry?.value) || 0)) + amount };
                                updated = true;
                                break;
                            }
                        }
                        if (updated) {
                            await attacker.update?.({ 'system.statusEffects': raw });
                            note += ` <em>(Special Increase — ${chosen.id} ${chosen.value}→${chosen.value + amount}.)</em>`;
                        }
                        else {
                            note += ` <em>(Special Increase +${amount} on ${chosen.id} — apply manually.)</em>`;
                        }
                    }
                }
            }
            catch (err) {
                console.warn('Mastery System | Special Increase failed', err);
                note += ' <em>(Special Increase — resolve at the table.)</em>';
            }
        }
    }
    // Reposition — chat prompt (no forced token move).
    if (isRepositionReaction(power)) {
        const meters = Math.max(0, Math.floor(Number(mech?.movementBonus) || 0));
        if (meters > 0) {
            note += ` <em>(Reposition — move up to ${meters} m after this resolves.)</em>`;
            globalThis.ui?.notifications?.info?.(`${actorName}: Reposition — move up to ${meters} m (normal legal movement).`);
        }
    }
    // Defender Counterattack (pre-damage) — blocks until resolved. Threatened
    // Counterattack already returned above with awaitResolution: false.
    if (isCounterattack && role !== 'opportunity') {
        note += ` <em>(Basic Counterattack vs ${String(attacker?.name ?? 'attacker')} — resolve it now; original damage is paused.)</em>`;
        if (attacker) {
            try {
                await launchBasicCounterattack(actor, attacker);
                note += ' <em>(Counterattack finished.)</em>';
            }
            catch (err) {
                console.warn('Mastery System | Counterattack launch failed', err);
                globalThis.ui?.notifications?.warn?.('Counterattack: could not open attack card — resolve manually.');
            }
        }
    }
    if (state.hit) {
        if (evEval.negates) {
            state.mitigation = {
                reactionArmorFlat: 0,
                reactionDrPct: 0,
                reactionTempHP: 0,
                initiativeGain: iniGain > 0 ? iniGain : undefined,
                powerName: power.name,
                negatedByEvade: true,
                reactionEvadeBonus: ev,
                effectiveEvade: evEval.effectiveEvade,
                counterattack: isCounterattack || undefined,
            };
        }
        else {
            const prev = state.mitigation || emptyMitigation();
            state.mitigation = {
                reactionArmorFlat: (prev.reactionArmorFlat || 0) + reactionArmorFlat,
                reactionDrPct: Math.min(100, (prev.reactionDrPct || 0) + reactionDrPct),
                reactionTempHP: (prev.reactionTempHP || 0) + tempHpGain || undefined,
                initiativeGain: (prev.initiativeGain || 0) + iniGain > 0
                    ? (prev.initiativeGain || 0) + iniGain
                    : undefined,
                powerName: power.name,
                reactionEvadeBonus: ev > 0 ? ev : prev.reactionEvadeBonus,
                effectiveEvade: ev > 0 ? evEval.effectiveEvade : prev.effectiveEvade,
                counterattack: isCounterattack || prev.counterattack || undefined,
                interposeActorId: prev.interposeActorId,
                interposeActorName: prev.interposeActorName,
            };
        }
    }
    else if (iniGain > 0) {
        state.mitigation = {
            ...(state.mitigation || emptyMitigation()),
            initiativeGain: (state.mitigation?.initiativeGain || 0) + iniGain,
            powerName: power.name,
            counterattack: isCounterattack || state.mitigation?.counterattack || undefined,
        };
    }
    return { state, note };
}
async function closeReactionWindow(messageId, state, opts) {
    const eventId = String(state.eventId || '');
    const gmClosed = !!opts?.gmClosed || !!state.gmClosed;
    // Only GM “Reactions abgeschlossen” locks the whole attack event.
    // Normal phase close (target Continue / last Decline) must leave others/OA usable.
    if (gmClosed && eventId)
        closedReactionEvents.add(eventId);
    state = {
        ...state,
        resolved: true,
        superseded: false,
        gmClosed,
    };
    // In-place final card (resolved → no repost).
    await refreshReactionCard(messageId, state);
    const waiter = pendingWaiters.get(messageId);
    if (waiter) {
        waiter.resolve(state.mitigation || emptyMitigation());
        pendingWaiters.delete(messageId);
    }
    try {
        globalThis.game?.socket?.emit?.(SOCKET_NAME, {
            type: 'reactionWindowResolved',
            messageId,
            eventId,
            gmClosed,
            mitigation: state.mitigation,
        });
    }
    catch {
        /* ignore */
    }
}
function entriesFromState(state, defender, attacker, combat) {
    return collectReactionWindowEntries({
        defender,
        attacker,
        combat,
        opportunityEnemyTokenIds: state.opportunityEnemyTokenIds ?? [],
    });
}
async function handleUseClick(messageId, actorId, powerId) {
    const g = globalThis;
    const message = g.game?.messages?.get?.(messageId);
    if (!message)
        return;
    const state = readState(message);
    if (!state || state.resolved)
        return;
    if (state.gmClosed || closedReactionEvents.has(String(state.eventId || ''))) {
        g.ui?.notifications?.warn?.('GM has closed reactions for this attack.');
        return;
    }
    if (busyReactionMessages.has(messageId)) {
        g.ui?.notifications?.warn?.('Finish the pending Counterattack first.');
        return;
    }
    const { attacker, defender, combat } = await resolveActors(state);
    if (!defender || !combat)
        return;
    const entries = entriesFromState(state, defender, attacker, combat);
    const actionable = filterEntriesForCard(entries, state);
    const entry = actionable.find((e) => String(e.actor.id) === actorId);
    if (!entry) {
        g.ui?.notifications?.warn?.('This character can no longer react for this event.');
        return;
    }
    if (!userMayActForActor(entry.actor)) {
        g.ui?.notifications?.warn?.('You do not control this character.');
        return;
    }
    const power = findPowerForActor(entry, powerId);
    if (!power) {
        g.ui?.notifications?.warn?.('Reaction power not available.');
        return;
    }
    // Evade that cannot prevent this hit must stay unusable (matches grayed UI).
    if (evadeReactionWouldNegateHit(power, state) === false) {
        g.ui?.notifications?.warn?.(!state.hit ? 'Attack already missed — Evade will not change that.' : 'Will not prevent the hit.');
        return;
    }
    // Only the defender's pre-damage Counterattack pauses the original attack.
    // Post-attack OAs must not freeze the shrinking summary.
    const blocksOriginal = state.phase === 'defender' && power?.basicReaction === 'counterattack';
    // Announce immediately so the table sees the spend before a long Counterattack wait.
    await g.ChatMessage?.create?.({
        user: g.game?.user?.id,
        speaker: g.ChatMessage?.getSpeaker?.({ actor: entry.actor }),
        content: `<p class="mastery-reaction-msg"><strong>${escHtml(String(entry.actor.name))}</strong> uses <strong>${escHtml(String(power.name))}</strong> (1 Reaction spent).${blocksOriginal
            ? ' <em>(Original damage paused until this attack is rolled or skipped.)</em>'
            : ''}</p>`,
    });
    if (blocksOriginal) {
        busyReactionMessages.add(messageId);
        try {
            const $msg = $(`.message[data-message-id="${messageId}"]`);
            $msg
                .find('.ms-reaction-continue-btn, .ms-reaction-use-btn, .ms-reaction-decline-btn')
                .prop('disabled', true);
        }
        catch {
            /* ignore */
        }
    }
    let next = state;
    let note = '';
    try {
        const spent = await executeReactionSpend({
            state,
            actor: entry.actor,
            power,
            role: entry.role,
            attacker,
            combat,
            defender,
        });
        next = spent.state;
        note = spent.note;
    }
    finally {
        busyReactionMessages.delete(messageId);
    }
    if (note) {
        await g.ChatMessage?.create?.({
            user: g.game?.user?.id,
            speaker: g.ChatMessage?.getSpeaker?.({ actor: entry.actor }),
            content: `<p class="mastery-reaction-msg">${note}</p>`,
        });
    }
    const still = filterEntriesForCard(entriesFromState(next, defender, attacker, combat), next);
    if (!still.length) {
        await closeReactionWindow(messageId, next);
        return;
    }
    const activeId = await refreshReactionCard(messageId, next);
    const waiter = pendingWaiters.get(activeId);
    if (waiter)
        waiter.mitigation = next.mitigation || emptyMitigation();
}
async function handleDeclineClick(messageId, actorId) {
    const g = globalThis;
    const message = g.game?.messages?.get?.(messageId);
    if (!message)
        return;
    const state = readState(message);
    if (!state || state.resolved)
        return;
    if (state.gmClosed || closedReactionEvents.has(String(state.eventId || ''))) {
        g.ui?.notifications?.warn?.('GM has closed reactions for this attack.');
        return;
    }
    const { attacker, defender, combat } = await resolveActors(state);
    if (!defender || !combat)
        return;
    const entries = entriesFromState(state, defender, attacker, combat);
    const entry = entries.find((e) => String(e.actor.id) === actorId);
    if (!entry)
        return;
    if (!userMayActForActor(entry.actor)) {
        g.ui?.notifications?.warn?.('You do not control this character.');
        return;
    }
    const next = {
        ...state,
        spentActorIds: [...state.spentActorIds, actorId],
    };
    const still = filterEntriesForCard(entriesFromState(next, defender, attacker, combat), next);
    if (!still.length) {
        await closeReactionWindow(messageId, next);
        return;
    }
    await refreshReactionCard(messageId, next);
}
async function handleContinueClick(messageId) {
    const g = globalThis;
    const message = g.game?.messages?.get?.(messageId);
    if (!message)
        return;
    const state = readState(message);
    if (!state || state.resolved)
        return;
    if (busyReactionMessages.has(messageId)) {
        g.ui?.notifications?.warn?.('Finish the pending Counterattack before continuing.');
        return;
    }
    const u = g.game?.user;
    const { defender } = await resolveActors(state);
    // GM, damage roller (pending waiter on this client), or defender owner may continue.
    const canContinue = !!u?.isGM ||
        pendingWaiters.has(messageId) ||
        (!!defender && userMayActForActor(defender));
    if (!canContinue) {
        g.ui?.notifications?.warn?.('Only the GM or the defending side can continue.');
        return;
    }
    await closeReactionWindow(messageId, state);
}
/** GM: permanently end this reaction event — no further reposts. */
async function handleGmCloseClick(messageId) {
    const g = globalThis;
    const message = g.game?.messages?.get?.(messageId);
    if (!message)
        return;
    const state = readState(message);
    if (!state || state.resolved)
        return;
    if (!g.game?.user?.isGM) {
        g.ui?.notifications?.warn?.('Only the GM can close reactions for everyone.');
        return;
    }
    await closeReactionWindow(messageId, state, { gmClosed: true });
    g.ui?.notifications?.info?.('Reactions abgeschlossen — keine weiteren Karten für diesen Angriff.');
}
function emptyPhaseResult(eventId) {
    return {
        mitigation: emptyMitigation(),
        eventId: eventId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        spentActorIds: [],
        used: [],
    };
}
/**
 * Post an interactive Reaction Window for one phase and wait until it is closed.
 *
 * - `defender`: call after the attack Roll (before damage dialog).
 * - `others` / `opportunity`: call after the attack fully resolves; each
 *   Use/Decline reposts a fresh summary at the bottom of chat.
 */
export async function runInteractiveReactionWindow(params) {
    const phase = params.phase ?? 'defender';
    const empty = emptyPhaseResult(params.eventId);
    empty.spentActorIds = [...(params.spentActorIds ?? [])];
    empty.used = [...(params.used ?? [])];
    empty.mitigation = params.priorMitigation ?? emptyMitigation();
    const { defender, attacker, combat, rawDamage, hit } = params;
    if (!defender || !combat)
        return empty;
    const { actorParticipatesInReactions } = await import('../utils/npc-reactions.js');
    const defenderMayReact = actorParticipatesInReactions(defender);
    const oppIds = (params.opportunityEnemyTokenIds ?? [])
        .map((id) => String(id || '').trim())
        .filter(Boolean);
    const defToken = getPrimaryTokenForActor(defender);
    const entries = collectReactionWindowEntries({
        defender,
        attacker,
        combat,
        opportunityEnemyTokenIds: oppIds,
    });
    const state = {
        eventId: params.eventId || empty.eventId,
        phase,
        attackerId: String(attacker?.id ?? ''),
        defenderId: String(defender?.id ?? ''),
        defenderTokenId: defToken?.id ?? null,
        attackTotal: params.attackTotal != null && Number.isFinite(Number(params.attackTotal))
            ? Math.floor(Number(params.attackTotal))
            : null,
        evadeTn: params.evadeTn != null && Number.isFinite(Number(params.evadeTn))
            ? Math.floor(Number(params.evadeTn))
            : null,
        rawDamage: Math.max(0, Math.floor(rawDamage)),
        hit,
        spentActorIds: [...(params.spentActorIds ?? [])],
        used: [...(params.used ?? [])],
        mitigation: params.priorMitigation ?? emptyMitigation(),
        resolved: false,
        damageMessageId: params.damageMessageId ?? null,
        opportunityEnemyTokenIds: oppIds,
        suppressCounterattack: !!params.suppressCounterattack,
        hasParryThisHit: !!params.hasParryThisHit,
        attackType: params.attackType ?? null,
        isAoE: !!params.isAoE,
    };
    const actionable = filterEntriesForCard(entries, state);
    // Threatened Ranged named OAs must always produce a post-attack card — even
    // when every threatener is out of Reactions (explain why; don't silent-skip).
    const mustShowOpportunityCard = oppIds.length > 0 && (phase === 'others' || phase === 'opportunity');
    if (!actionable.length) {
        if (phase === 'defender' && !defenderMayReact && !mustShowOpportunityCard) {
            return {
                mitigation: state.mitigation,
                eventId: state.eventId,
                spentActorIds: state.spentActorIds,
                used: state.used,
            };
        }
        if (!mustShowOpportunityCard && (params.silentIfEmpty || phase === 'others')) {
            return {
                mitigation: state.mitigation,
                eventId: state.eventId,
                spentActorIds: state.spentActorIds,
                used: state.used,
            };
        }
        // Info card only (defender empty, or OA threateners all spent) — still post.
        if (!mustShowOpportunityCard) {
            state.resolved = true;
        }
    }
    const html = buildReactionWindowHtml(state, entries, String(attacker?.name ?? 'Attacker'), String(defender?.name ?? 'Defender'));
    const g = globalThis;
    let message;
    try {
        message = await g.ChatMessage?.create?.({
            user: g.game?.user?.id,
            speaker: g.ChatMessage?.getSpeaker?.({ actor: defender }),
            content: `<div class="mastery-reaction-msg">${html}</div>`,
            flags: {
                'mastery-system': {
                    reactionWindow: state,
                },
            },
        });
    }
    catch (err) {
        console.warn('Mastery System | reaction window create failed', err);
        return empty;
    }
    const messageId = String(message?.id ?? '');
    if (!messageId || state.resolved) {
        return {
            mitigation: state.mitigation,
            eventId: state.eventId,
            spentActorIds: state.spentActorIds,
            used: state.used,
        };
    }
    return new Promise((resolve) => {
        pendingWaiters.set(messageId, {
            resolve: (mit) => {
                // Re-read latest spent/used from the message when possible.
                const msg = g.game?.messages?.get?.(messageId);
                const latest = readState(msg) || state;
                resolve({
                    mitigation: mit || latest.mitigation || emptyMitigation(),
                    eventId: latest.eventId || state.eventId,
                    spentActorIds: latest.spentActorIds || state.spentActorIds,
                    used: latest.used || state.used,
                });
            },
            mitigation: state.mitigation,
        });
    });
}
export function registerReactionWindowChatHandlers() {
    if (!hooksRegistered) {
        hooksRegistered = true;
        $(document)
            .off('click.msReactionUse', '.ms-reaction-use-btn')
            .on('click.msReactionUse', '.ms-reaction-use-btn', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const btn = $(ev.currentTarget);
            const messageId = String(btn.closest('.message').attr('data-message-id') || '');
            const actorId = String(btn.attr('data-actor-id') || '');
            const powerId = String(btn.attr('data-power-id') || '');
            if (!messageId || !actorId || !powerId)
                return;
            btn.prop('disabled', true);
            try {
                await handleUseClick(messageId, actorId, powerId);
            }
            finally {
                btn.prop('disabled', false);
            }
        });
        $(document)
            .off('click.msReactionDecline', '.ms-reaction-decline-btn')
            .on('click.msReactionDecline', '.ms-reaction-decline-btn', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const btn = $(ev.currentTarget);
            const messageId = String(btn.closest('.message').attr('data-message-id') || '');
            const actorId = String(btn.attr('data-actor-id') || '');
            if (!messageId || !actorId)
                return;
            await handleDeclineClick(messageId, actorId);
        });
        $(document)
            .off('click.msReactionContinue', '.ms-reaction-continue-btn')
            .on('click.msReactionContinue', '.ms-reaction-continue-btn', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const btn = $(ev.currentTarget);
            const messageId = String(btn.closest('.message').attr('data-message-id') || '');
            if (!messageId)
                return;
            await handleContinueClick(messageId);
        });
        $(document)
            .off('click.msReactionGmClose', '.ms-reaction-gm-close-btn')
            .on('click.msReactionGmClose', '.ms-reaction-gm-close-btn', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const btn = $(ev.currentTarget);
            const messageId = String(btn.closest('.message').attr('data-message-id') || '');
            if (!messageId)
                return;
            btn.prop('disabled', true);
            try {
                await handleGmCloseClick(messageId);
            }
            finally {
                btn.prop('disabled', false);
            }
        });
        $(document)
            .off('click.msSkipAwaitedAttack', '.ms-skip-awaited-attack-btn')
            .on('click.msSkipAwaitedAttack', '.ms-skip-awaited-attack-btn', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const btn = $(ev.currentTarget);
            const messageId = String(btn.closest('.message').attr('data-message-id') || '');
            if (!messageId)
                return;
            const { completeAttackResolution, isAwaitingAttackResolution } = await import('./attack-resolution-wait.js');
            if (!isAwaitingAttackResolution(messageId)) {
                globalThis.ui?.notifications?.warn?.('This attack is not waiting to unblock another action.');
                return;
            }
            btn.prop('disabled', true);
            completeAttackResolution(messageId, { status: 'skipped' });
            try {
                const msg = globalThis.game?.messages?.get?.(messageId);
                if (msg) {
                    const content = String(msg.content || '');
                    const note = '<p class="ms-awaited-attack-skipped" style="opacity:0.9;"><em>Counterattack skipped — original damage continues.</em></p>';
                    if (!content.includes('ms-awaited-attack-skipped')) {
                        await msg.update({ content: `${content}${note}` });
                    }
                }
            }
            catch {
                /* ignore */
            }
            globalThis.ui?.notifications?.info?.('Counterattack skipped — original damage continues.');
        });
        Hooks.on('updateChatMessage', (message) => {
            try {
                const st = readState(message);
                // Superseded cards are replaced by a newer copy below — not a real close.
                if (!st?.resolved || st.superseded)
                    return;
                const id = String(message?.id ?? '');
                const waiter = pendingWaiters.get(id);
                if (!waiter)
                    return;
                waiter.resolve(st.mitigation || emptyMitigation());
                pendingWaiters.delete(id);
            }
            catch (err) {
                console.warn('Mastery System | reaction window updateChatMessage', err);
            }
        });
    }
    if (!socketRegistered) {
        socketRegistered = true;
        try {
            globalThis.game?.socket?.on?.(SOCKET_NAME, (payload) => {
                if (payload?.type !== 'reactionWindowResolved')
                    return;
                const eventId = String(payload.eventId || '');
                // Mirror GM-close lock across clients only — not every phase resolve.
                if (payload.gmClosed && eventId)
                    closedReactionEvents.add(eventId);
                const id = String(payload.messageId || '');
                const waiter = pendingWaiters.get(id);
                if (!waiter)
                    return;
                waiter.resolve(payload.mitigation || emptyMitigation());
                pendingWaiters.delete(id);
            });
        }
        catch (err) {
            console.warn('Mastery System | reaction window socket register failed', err);
        }
    }
}
//# sourceMappingURL=reaction-window-chat.js.map