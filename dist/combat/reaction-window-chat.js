/**
 * Interactive Reaction Window — chat card with per-actor buttons.
 *
 * Flow:
 *  - Posted AFTER the damage roll chat (hit) or after the attack roll (miss).
 *  - Each eligible actor may spend exactly one Reaction for this event.
 *  - After a reaction is used, the card refreshes for remaining actors.
 *  - GM / owners can Continue to close the window (damage apply resumes).
 */
import { collectReactionWindowEntries, evaluateReactionEvadeNegation, isAllyReactionPower, } from './defender-reactions.js';
import { getActionEconomyActor, getReactionActionsSummary, markPowerUsedThisRound, spendReactionAction, } from './action-economy.js';
import { buildActorMechanicsBreakdown, resolvePowerMechanics } from '../utils/power-mechanics.js';
import { isBasicReactionItem } from './basic-combat.js';
import { getPrimaryTokenForActor } from '../utils/mechanics-adjacency.js';
const SOCKET_NAME = 'system.mastery-system';
const pendingWaiters = new Map();
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
function filterEntriesForCard(entries, state) {
    const spent = new Set(state.spentActorIds.map(String));
    return entries
        .map((e) => {
        const id = String(e.actor?.id ?? '');
        if (!id || spent.has(id)) {
            return { ...e, powers: [], remaining: 0 };
        }
        // On a miss, Guard has nothing to absorb — still allow Evade/Counter/other.
        let powers = e.powers;
        if (!state.hit) {
            powers = powers.filter((p) => p?.basicReaction !== 'guard');
        }
        return { ...e, powers };
    })
        .filter((e) => {
        // Keep spent actors out of the actionable list entirely.
        const id = String(e.actor?.id ?? '');
        if (spent.has(id))
            return false;
        return e.remaining > 0 && e.powers.length > 0;
    });
}
function buildReactionWindowHtml(state, entries, attackerName, defenderName) {
    const actionable = filterEntriesForCard(entries, state);
    const hitLine = state.hit
        ? `<p><strong>${escHtml(attackerName)}</strong> → <strong>${escHtml(defenderName)}</strong> (raw ${Math.max(0, Math.floor(state.rawDamage))} after phasing).</p>`
        : `<p><strong>${escHtml(attackerName)}</strong> → <strong>${escHtml(defenderName)}</strong> — attack <strong>missed</strong>. Reactions are still available.</p>`;
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
        body = `<p style="opacity:0.9;">Reaction window closed.</p>${usedBlock}`;
    }
    else if (!actionable.length) {
        const def = entries.find((e) => e.role === 'defender');
        const defId = def ? String(def.actor?.id ?? '') : '';
        const defSpent = defId && state.spentActorIds.map(String).includes(defId);
        const allyNames = entries
            .filter((e) => e.role === 'ally')
            .map((e) => e.name)
            .filter(Boolean);
        body = `<p>${defSpent
            ? `<strong>${escHtml(defenderName)}</strong> already used a Reaction for this event.`
            : def
                ? def.remaining <= 0
                    ? `<strong>${escHtml(defenderName)}</strong> has <strong>no Reactions left</strong> this round (${def.total - def.remaining}/${def.total} used).`
                    : `<strong>${escHtml(defenderName)}</strong> has Reaction(s) left but <strong>no eligible reaction powers</strong>.`
                : 'No one can react.'}</p>
      <p>Nearby allies within 4 m: ${allyNames.length
            ? allyNames.map((n) => escHtml(n)).join(', ')
            : 'none with an Ally Reaction ready'}.</p>
      ${usedBlock}`;
    }
    else {
        const blocks = actionable
            .map((e) => {
            const actorId = String(e.actor.id ?? '');
            const role = e.role === 'defender' ? 'target' : 'ally';
            const dist = e.role === 'ally' && e.distanceM != null ? ` · ${e.distanceM} m` : '';
            const buttons = e.powers
                .map((p) => {
                const pid = String(p.id ?? '');
                const pname = String(p?.name ?? 'Reaction').trim();
                const label = pname.length > 42 ? `${pname.slice(0, 39)}…` : pname;
                return `<button type="button" class="ms-reaction-use-btn"
              data-actor-id="${escHtml(actorId)}"
              data-power-id="${escHtml(pid)}"
              title="${escHtml(pname)}">
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
        body = `<p>Each character may use <strong>one</strong> Reaction for this event:</p>${blocks}${usedBlock}`;
    }
    const continueBtn = state.resolved
        ? ''
        : `<div class="ms-reaction-window-actions" style="margin-top:0.6em;">
        <button type="button" class="ms-reaction-continue-btn">
          <i class="fas fa-check"></i> Continue
        </button>
        <span class="ms-reaction-continue-hint" style="opacity:0.85;font-size:0.88em;margin-left:0.4em;">
          Close the window${state.hit ? ' and apply damage' : ''}.
        </span>
      </div>`;
    return `<div class="mastery-reaction-window" data-reaction-event="${escHtml(state.eventId)}">
      <strong>⚡ Reaction Window</strong>
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
async function refreshReactionCard(messageId, state) {
    const g = globalThis;
    const message = g.game?.messages?.get?.(messageId);
    if (!message)
        return;
    const { attacker, defender, combat } = await resolveActors(state);
    if (!defender || !combat)
        return;
    const entries = collectReactionWindowEntries({
        defender,
        attacker,
        combat,
    });
    const html = buildReactionWindowHtml(state, entries, String(attacker?.name ?? 'Attacker'), String(defender?.name ?? 'Defender'));
    const content = `<p class="mastery-reaction-msg">${html}</p>`;
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
}
function findPowerForActor(entry, powerId) {
    if (!entry)
        return null;
    return entry.powers.find((p) => String(p.id) === powerId) ?? null;
}
async function launchBasicCounterattack(defender, attacker) {
    const defTok = getPrimaryTokenForActor(defender);
    const atkTok = getPrimaryTokenForActor(attacker);
    if (!defTok || !atkTok) {
        throw new Error('Missing tokens for Counterattack');
    }
    const { createMeleeAttackCard } = await import('./attack-executor.js');
    const option = {
        id: 'weapon-attack',
        name: 'Counterattack (Basic Attack)',
        description: 'Basic Attack — Weapon Damage + MR × 2d8. No Active Power effects.',
        slot: 'attack',
        source: 'maneuver',
        tags: ['attack', 'basic', 'counterattack'],
        selectedPowerId: null,
        costsAction: false,
    };
    await createMeleeAttackCard(defTok, atkTok, option);
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
    if (!isBasicReactionItem(power)) {
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
    const mech = mechanicsOf(power);
    const isCounterattack = power?.basicReaction === 'counterattack';
    // Ally reactions: spend + announce only (table resolves narrative effects).
    if (role === 'ally' || isAllyReactionPower(power)) {
        note = ` <em>(Ally Reaction — resolve its effect for ${String(defender.name ?? 'the target')}.)</em>`;
        if (isCounterattack && attacker) {
            try {
                await launchBasicCounterattack(actor, attacker);
                note += ' <em>(Counterattack queued.)</em>';
            }
            catch (err) {
                console.warn('Mastery System | Ally counterattack launch failed', err);
            }
        }
        return { state, note };
    }
    // Defender mitigation
    const evadeTnRaw = Math.floor(Number(state.evadeTn));
    const baseEvade = Number.isFinite(evadeTnRaw) && evadeTnRaw > 0 ? evadeTnRaw : defenderEvadeFromActor(defender);
    const attackTotal = state.attackTotal != null && Number.isFinite(Number(state.attackTotal))
        ? Math.floor(Number(state.attackTotal))
        : null;
    const reactionArmorFlat = Math.max(0, Math.floor(Number(mech?.armor) || 0));
    let reactionDrPct = Math.max(0, Math.min(100, Math.floor(Number(mech?.damageReductionPct) || 0)));
    const iniGain = Math.max(0, Math.floor(Number(mech?.initiativeGain) || 0));
    const ev = Math.max(0, Math.floor(Number(mech?.evade) || 0));
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
        if (reactionDrBlocked) {
            note +=
                ' <em>(Reaction DR% needs slotted <strong>Damage Reduction</strong> DR% and/or a sustained DR% on the character sheet.)</em>';
        }
    }
    if (iniGain > 0) {
        note += ` <em>(+${iniGain} Initiative applies after this attack fully resolves.)</em>`;
    }
    if (isCounterattack) {
        note += ` <em>(Basic Counterattack queued against ${String(attacker?.name ?? 'attacker')}.)</em>`;
        if (attacker) {
            try {
                await launchBasicCounterattack(defender, attacker);
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
                initiativeGain: (prev.initiativeGain || 0) + iniGain > 0
                    ? (prev.initiativeGain || 0) + iniGain
                    : undefined,
                powerName: power.name,
                reactionEvadeBonus: ev > 0 ? ev : prev.reactionEvadeBonus,
                effectiveEvade: ev > 0 ? evEval.effectiveEvade : prev.effectiveEvade,
                counterattack: isCounterattack || prev.counterattack || undefined,
            };
        }
    }
    else if (iniGain > 0) {
        state.mitigation = {
            ...emptyMitigation(),
            initiativeGain: iniGain,
            powerName: power.name,
            counterattack: isCounterattack || undefined,
        };
    }
    return { state, note };
}
async function closeReactionWindow(messageId, state) {
    state = { ...state, resolved: true };
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
            mitigation: state.mitigation,
        });
    }
    catch {
        /* ignore */
    }
}
async function handleUseClick(messageId, actorId, powerId) {
    const g = globalThis;
    const message = g.game?.messages?.get?.(messageId);
    if (!message)
        return;
    const state = readState(message);
    if (!state || state.resolved)
        return;
    const { attacker, defender, combat } = await resolveActors(state);
    if (!defender || !combat)
        return;
    const entries = collectReactionWindowEntries({ defender, attacker, combat });
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
    const { state: next, note } = await executeReactionSpend({
        state,
        actor: entry.actor,
        power,
        role: entry.role,
        attacker,
        combat,
        defender,
    });
    await g.ChatMessage?.create?.({
        user: g.game?.user?.id,
        speaker: g.ChatMessage?.getSpeaker?.({ actor: entry.actor }),
        content: `<p class="mastery-reaction-msg"><strong>${escHtml(String(entry.actor.name))}</strong> uses <strong>${escHtml(String(power.name))}</strong> (1 Reaction spent).${note}</p>`,
    });
    const still = filterEntriesForCard(collectReactionWindowEntries({ defender, attacker, combat }), next);
    if (!still.length) {
        await closeReactionWindow(messageId, next);
        return;
    }
    await refreshReactionCard(messageId, next);
    const waiter = pendingWaiters.get(messageId);
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
    const { attacker, defender, combat } = await resolveActors(state);
    if (!defender || !combat)
        return;
    const entries = collectReactionWindowEntries({ defender, attacker, combat });
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
    const still = filterEntriesForCard(collectReactionWindowEntries({ defender, attacker, combat }), next);
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
/**
 * Post the interactive Reaction Window and wait until it is closed.
 * Call this AFTER the damage chat message on a hit (or after the attack roll on a miss).
 */
export async function runInteractiveReactionWindow(params) {
    const empty = emptyMitigation();
    const { defender, attacker, combat, rawDamage, hit } = params;
    if (!defender || !combat)
        return empty;
    const defToken = getPrimaryTokenForActor(defender);
    const entries = collectReactionWindowEntries({ defender, attacker, combat });
    const state = {
        eventId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
        spentActorIds: [],
        used: [],
        mitigation: empty,
        resolved: false,
        damageMessageId: params.damageMessageId ?? null,
    };
    // Nothing to do — post info card (already closed) and return immediately.
    const actionable = filterEntriesForCard(entries, state);
    if (!actionable.length) {
        state.resolved = true;
    }
    const html = buildReactionWindowHtml(state, entries, String(attacker?.name ?? 'Attacker'), String(defender?.name ?? 'Defender'));
    const g = globalThis;
    let message;
    try {
        message = await g.ChatMessage?.create?.({
            user: g.game?.user?.id,
            speaker: g.ChatMessage?.getSpeaker?.({ actor: defender }),
            content: `<p class="mastery-reaction-msg">${html}</p>`,
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
    if (!messageId || state.resolved)
        return empty;
    return new Promise((resolve) => {
        pendingWaiters.set(messageId, { resolve, mitigation: empty });
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
        Hooks.on('updateChatMessage', (message) => {
            try {
                const st = readState(message);
                if (!st?.resolved)
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