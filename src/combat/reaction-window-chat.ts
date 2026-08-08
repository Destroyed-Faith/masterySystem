/**
 * Interactive Reaction Window — chat card with per-actor buttons.
 *
 * Phases:
 *  1. `defender` — direct target, right after the attack Roll (before damage).
 *  2. `others` — after the original attack fully resolves: Threatened Ranged
 *     Opportunity Attacks + Ally reaction powers in one shrinking summary.
 *  3. `opportunity` — legacy/standalone OA-only window (same post-resolve rules).
 *
 * Each actor may spend exactly one Reaction per event. After a reaction is used
 * or declined, that actor drops off the card until nobody remains.
 * Post-attack OAs launch without pausing the summary (parallel OK).
 */

import {
  collectReactionWindowEntries,
  evaluateReactionEvadeNegation,
  isAllyReactionPower,
  type DefenderReactionMitigation,
  type ReactionWindowActorEntry,
} from './defender-reactions.js';
import {
  getActionEconomyActor,
  getReactionActionsSummary,
  markPowerUsedThisRound,
  spendReactionAction,
} from './action-economy.js';
import { buildActorMechanicsBreakdown, resolvePowerMechanics } from '../utils/power-mechanics.js';
import { isBasicReactionItem } from './basic-combat.js';
import { getPrimaryTokenForActor } from '../utils/mechanics-adjacency.js';

const SOCKET_NAME = 'system.mastery-system';

/**
 * - defender: target after attack roll (before damage)
 * - others: OA + allies after the original attack fully resolves
 * - opportunity: OA-only window (same timing / parallel rules as others)
 */
export type ReactionWindowPhase = 'defender' | 'others' | 'opportunity';

export interface ReactionWindowState {
  eventId: string;
  phase: ReactionWindowPhase;
  attackerId: string;
  defenderId: string;
  defenderTokenId?: string | null;
  attackTotal: number | null;
  evadeTn: number | null;
  rawDamage: number;
  hit: boolean;
  /** Actor ids that already spent a reaction on this event (shared across phases). */
  spentActorIds: string[];
  /** Log of used reactions for the card. */
  used: Array<{ actorId: string; actorName: string; powerId: string; powerName: string }>;
  /** Accumulated defender mitigation (ally spends do not merge here). */
  mitigation: DefenderReactionMitigation;
  resolved: boolean;
  /** Message id of the preceding damage chat (hit path), for optional updates. */
  damageMessageId?: string | null;
  /** Threatened Ranged OA token ids (enemies who may strike the shooter). */
  opportunityEnemyTokenIds?: string[];
  /** Nested reaction-counterattack windows: hide Counterattack to avoid deep pauses. */
  suppressCounterattack?: boolean;
  /**
   * True when this chat card was replaced by a newer copy posted below
   * (post-attack summary repost). Not a real close — waiters must not resolve.
   */
  superseded?: boolean;
}

/** Result of a reaction phase (mitigation + who already spent). */
export interface ReactionPhaseResult {
  mitigation: DefenderReactionMitigation;
  eventId: string;
  spentActorIds: string[];
  used: Array<{ actorId: string; actorName: string; powerId: string; powerName: string }>;
}

type PendingWaiter = {
  resolve: (mit: DefenderReactionMitigation) => void;
  mitigation: DefenderReactionMitigation;
};

const pendingWaiters = new Map<string, PendingWaiter>();
/** Reaction windows currently resolving a blocking Counterattack/OA. */
const busyReactionMessages = new Set<string>();
let hooksRegistered = false;
let socketRegistered = false;

function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function emptyMitigation(): DefenderReactionMitigation {
  return { reactionArmorFlat: 0, reactionDrPct: 0 };
}

function userMayActForActor(actor: any): boolean {
  const u = (globalThis as any).game?.user;
  if (!u) return false;
  if (u.isGM) return true;
  return !!actor?.isOwner;
}

function mechanicsOf(item: any): ReturnType<typeof resolvePowerMechanics> {
  if (item?.mechanics && typeof item.mechanics === 'object') {
    return item.mechanics as ReturnType<typeof resolvePowerMechanics>;
  }
  return resolvePowerMechanics(item);
}

function defenderEvadeFromActor(defender: Actor): number {
  const sys = (defender as any)?.system;
  const total = Number(sys?.combat?.evadeTotal);
  if (Number.isFinite(total) && total > 0) return Math.floor(total);
  const evade = Number(sys?.combat?.evade);
  return Number.isFinite(evade) ? Math.max(0, Math.floor(evade)) : 0;
}

function readState(message: any): ReactionWindowState | null {
  const flags = message?.getFlag?.('mastery-system') || message?.flags?.['mastery-system'];
  const st = flags?.reactionWindow;
  if (!st || typeof st !== 'object') return null;
  return st as ReactionWindowState;
}

function entriesForPhase(
  entries: ReactionWindowActorEntry[],
  phase: ReactionWindowPhase,
): ReactionWindowActorEntry[] {
  if (phase === 'defender') return entries.filter((e) => e.role === 'defender');
  if (phase === 'opportunity') return entries.filter((e) => e.role === 'opportunity');
  // After damage: allies (and any leftover OA if still listed).
  return entries.filter((e) => e.role === 'ally' || e.role === 'opportunity');
}

/** Basic Guard / Evade / Counterattack — only for the defender pre-damage window. */
function isSmallBasicReaction(power: any): boolean {
  if (!isBasicReactionItem(power)) return false;
  if (String(power?.id || '') === 'basic-reaction-opportunity-attack') return false;
  const kind = String(power?.basicReaction || '');
  return kind === 'guard' || kind === 'evade' || kind === 'counterattack';
}

function filterEntriesForCard(
  entries: ReactionWindowActorEntry[],
  state: ReactionWindowState,
): ReactionWindowActorEntry[] {
  const spent = new Set(state.spentActorIds.map(String));
  const phaseEntries = entriesForPhase(entries, state.phase ?? 'defender');
  const postAttack = state.phase === 'others' || state.phase === 'opportunity';
  return phaseEntries
    .map((e) => {
      const id = String((e.actor as any)?.id ?? '');
      if (!id || spent.has(id)) {
        return { ...e, powers: [], remaining: 0 };
      }
      // On a miss, Guard has nothing to absorb — still allow Evade/Counter/other.
      let powers = e.powers;
      if (!state.hit) {
        powers = powers.filter((p) => p?.basicReaction !== 'guard');
      }
      // Phase 1 is defensive window for the target — ally-only powers stay out.
      if (state.phase === 'defender') {
        powers = powers.filter((p) => !isAllyReactionPower(p));
      }
      // Post-attack summary: OA + real Ally powers only — no Guard/Evade/Counter.
      if (postAttack) {
        powers = powers.filter((p) => !isSmallBasicReaction(p));
      }
      // Reaction Counterattack already paused one attack — don't nest another.
      if (state.suppressCounterattack) {
        powers = powers.filter(
          (p) =>
            p?.basicReaction !== 'counterattack' ||
            String(p?.id || '') === 'basic-reaction-opportunity-attack',
        );
      }
      return { ...e, powers };
    })
    .filter((e) => {
      const id = String((e.actor as any)?.id ?? '');
      if (spent.has(id)) return false;
      return e.remaining > 0 && e.powers.length > 0;
    });
}

function buildReactionWindowHtml(
  state: ReactionWindowState,
  entries: ReactionWindowActorEntry[],
  attackerName: string,
  defenderName: string,
): string {
  const phase = state.phase ?? 'defender';
  const actionable = filterEntriesForCard(entries, state);
  const remainingN = actionable.length;
  const remainingSuffix =
    !state.resolved && remainingN > 0 ? ` — ${remainingN} remaining` : '';
  const title =
    phase === 'defender'
      ? '⚡ Reaction Window — Target'
      : phase === 'opportunity'
        ? `⚡ Opportunity Attacks${remainingSuffix}`
        : `⚡ After attack — Reactions${remainingSuffix}`;

  const hasOa = (state.opportunityEnemyTokenIds?.length ?? 0) > 0;
  let hitLine: string;
  if (phase === 'opportunity') {
    hitLine = `<p><strong>${escHtml(attackerName)}</strong>'s attack is done — enemies in melee reach may spend a <strong>Reaction</strong> for an Opportunity Attack (in parallel).</p>`;
  } else if (phase === 'others') {
    const dmgBit = state.hit
      ? `damage applied (${Math.max(0, Math.floor(state.rawDamage))})`
      : 'attack resolved';
    hitLine = hasOa
      ? `<p><strong>${escHtml(attackerName)}</strong> → <strong>${escHtml(defenderName)}</strong> — ${dmgBit}. Threatened enemies may Opportunity Attack; nearby allies may use Ally Reactions. Summary shrinks as each acts or Declines.</p>`
      : `<p><strong>${escHtml(attackerName)}</strong> → <strong>${escHtml(defenderName)}</strong> — ${dmgBit}. Nearby allies may react.</p>`;
  } else if (state.hit) {
    hitLine =
      state.rawDamage > 0
        ? `<p><strong>${escHtml(attackerName)}</strong> → <strong>${escHtml(defenderName)}</strong> (hit — react before damage).</p>`
        : `<p><strong>${escHtml(attackerName)}</strong> → <strong>${escHtml(defenderName)}</strong> (hit — react before damage).</p>`;
  } else {
    hitLine = `<p><strong>${escHtml(attackerName)}</strong> → <strong>${escHtml(defenderName)}</strong> — attack <strong>missed</strong>. Target may still react.</p>`;
  }

  const usedBlock =
    state.used.length > 0
      ? `<div class="ms-reaction-window-used" style="margin:0.4em 0;">
          <div style="opacity:0.9;font-size:0.92em;"><strong>Used this event:</strong></div>
          <ul style="margin:0.2em 0 0 1.2em;padding:0;">
            ${state.used
              .map(
                (u) =>
                  `<li><strong>${escHtml(u.actorName)}</strong> — ${escHtml(u.powerName)}</li>`,
              )
              .join('')}
          </ul>
        </div>`
      : '';

  let body: string;
  if (state.resolved) {
    body = `<p style="opacity:0.9;">Reaction window closed.</p>${usedBlock}`;
  } else if (!actionable.length) {
    if (phase === 'opportunity') {
      body = `<p>No opportunity attackers with a Reaction ready.</p>${usedBlock}`;
    } else if (phase === 'others') {
      body = `<p>No nearby allies with an Ally Reaction ready.</p>${usedBlock}`;
    } else {
      const def = entries.find((e) => e.role === 'defender');
      const defId = def ? String((def.actor as any)?.id ?? '') : '';
      const defSpent = defId && state.spentActorIds.map(String).includes(defId);
      body = `<p>${
        defSpent
          ? `<strong>${escHtml(defenderName)}</strong> already used a Reaction for this event.`
          : def
            ? def.remaining <= 0
              ? `<strong>${escHtml(defenderName)}</strong> has <strong>no Reactions left</strong> this round (${def.total - def.remaining}/${def.total} used).`
              : `<strong>${escHtml(defenderName)}</strong> has Reaction(s) left but <strong>no eligible reaction powers</strong>.`
            : 'No one can react.'
      }</p>${usedBlock}`;
    }
  } else {
    const blocks = actionable
      .map((e) => {
        const actorId = String((e.actor as any).id ?? '');
        const role =
          e.role === 'defender' ? 'target' : e.role === 'opportunity' ? 'opportunity' : 'ally';
        const dist = e.role === 'ally' && e.distanceM != null ? ` · ${e.distanceM} m` : '';
        const buttons = e.powers
          .map((p) => {
            const pid = String((p as any).id ?? '');
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
    const intro =
      phase === 'defender'
        ? `<p>The <strong>target</strong> may use <strong>one</strong> Reaction now (before damage):</p>`
        : phase === 'opportunity'
          ? `<p>Each listed combatant may spend <strong>one</strong> Reaction for an Opportunity Attack (cards open in parallel — original attack already finished):</p>`
          : hasOa
            ? `<p>Each listed combatant may spend <strong>one</strong> Reaction (Opportunity Attack and/or Ally powers). Cards open in parallel:</p>`
            : `<p>Each ally may use <strong>one</strong> Reaction for this event:</p>`;
    body = `${intro}${blocks}${usedBlock}`;
  }

  const continueHint =
    phase === 'defender'
      ? state.hit
        ? 'Continue to the damage roll.'
        : 'Close the window.'
      : remainingN > 0
        ? 'Continue to close early (remaining actors skip).'
        : 'Close the window.';

  const continueBtn = state.resolved
    ? ''
    : `<div class="ms-reaction-window-actions" style="margin-top:0.6em;">
        <button type="button" class="ms-reaction-continue-btn">
          <i class="fas fa-check"></i> Continue
        </button>
        <span class="ms-reaction-continue-hint" style="opacity:0.85;font-size:0.88em;margin-left:0.4em;">
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

async function resolveActors(state: ReactionWindowState): Promise<{
  attacker: Actor | null;
  defender: Actor | null;
  combat: Combat | null;
}> {
  const g = globalThis as any;
  let defender: Actor | null = null;
  if (state.defenderTokenId) {
    const tokenDoc = g.canvas?.scene?.tokens?.get?.(state.defenderTokenId);
    if (tokenDoc?.actor) defender = tokenDoc.actor;
  }
  if (!defender) defender = g.game?.actors?.get?.(state.defenderId) ?? null;
  const attacker = g.game?.actors?.get?.(state.attackerId) ?? null;
  const combat = g.game?.combat ?? null;
  return { attacker, defender, combat };
}

function buildSupersededReactionHtml(state: ReactionWindowState, remainingN: number): string {
  const phase = state.phase ?? 'others';
  const label =
    phase === 'opportunity' ? 'Opportunity Attacks' : 'After attack — Reactions';
  const rem =
    remainingN > 0 ? `${remainingN} remaining` : 'updated';
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
async function refreshReactionCard(
  messageId: string,
  state: ReactionWindowState,
): Promise<string> {
  const g = globalThis as any;
  const message = g.game?.messages?.get?.(messageId);
  if (!message) return messageId;
  const { attacker, defender, combat } = await resolveActors(state);
  if (!defender || !combat) return messageId;

  const entries = collectReactionWindowEntries({
    defender,
    attacker,
    combat,
    opportunityEnemyTokenIds: state.opportunityEnemyTokenIds ?? [],
  });
  const html = buildReactionWindowHtml(
    state,
    entries,
    String((attacker as any)?.name ?? 'Attacker'),
    String((defender as any)?.name ?? 'Defender'),
  );

  const content = `<div class="mastery-reaction-msg">${html}</div>`;
  const postAttack = state.phase === 'others' || state.phase === 'opportunity';
  const shouldRepost = postAttack && !state.resolved && !state.superseded;

  if (shouldRepost) {
    const remainingN = filterEntriesForCard(entries, state).length;
    const supersededState: ReactionWindowState = {
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
    } catch (err) {
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
    } catch (err) {
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
  } catch (err) {
    console.warn('Mastery System | reaction window refresh failed', err);
  }
  return messageId;
}

function findPowerForActor(entry: ReactionWindowActorEntry | undefined, powerId: string): any | null {
  if (!entry) return null;
  return entry.powers.find((p) => String((p as any).id) === powerId) ?? null;
}

async function launchBasicCounterattack(
  defender: Actor,
  attacker: Actor,
  opts?: { awaitResolution?: boolean; label?: string },
): Promise<void> {
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
    slot: 'attack' as const,
    source: 'maneuver' as const,
    tags: ['attack', 'basic', 'counterattack'],
    selectedPowerId: null,
    costsAction: false,
  };
  const messageId = await createMeleeAttackCard(defTok, atkTok, option as any);
  if (!messageId) {
    throw new Error(`${label} attack card was not created`);
  }
  if (!awaitResolution) {
    (globalThis as any).ui?.notifications?.info?.(
      `${label}: attack card opened — roll when ready (original attack already finished).`,
    );
    return;
  }
  const { waitForAttackResolution } = await import('./attack-resolution-wait.js');
  (globalThis as any).ui?.notifications?.info?.(
    `${label}: Roll this attack now. Original damage is paused until it finishes (or you Skip).`,
  );
  // Block the original attack pipeline until this Counterattack is rolled +
  // resolved (or skipped). Otherwise Dummy damage continues immediately.
  await waitForAttackResolution(messageId);
}

/**
 * Apply a chosen reaction for one actor. Updates economy + returns defender mitigation delta.
 */
async function executeReactionSpend(params: {
  state: ReactionWindowState;
  actor: Actor;
  power: any;
  role: 'defender' | 'ally' | 'opportunity';
  attacker: Actor | null;
  combat: Combat;
  defender: Actor;
}): Promise<{ state: ReactionWindowState; note: string }> {
  const { actor, power, role, attacker, combat, defender } = params;
  let state = { ...params.state, spentActorIds: [...params.state.spentActorIds], used: [...params.state.used] };
  const economy = (getActionEconomyActor(actor) ?? actor) as Actor;
  const actorId = String((economy as any).id ?? (actor as any).id);
  const actorName = String((actor as any).name ?? 'Actor');

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

  // Threatened Ranged OA: open attack card without blocking the summary
  // (original attack already finished; multiple OAs may run in parallel).
  if (role === 'opportunity') {
    note = ` <em>(Opportunity Attack vs ${String((attacker as any)?.name ?? 'the shooter')} — card opened, roll when ready.)</em>`;
    if (attacker) {
      try {
        await launchBasicCounterattack(actor, attacker, {
          awaitResolution: false,
          label: 'Opportunity Attack',
        });
      } catch (err) {
        console.warn('Mastery System | Opportunity Attack launch failed', err);
        (globalThis as any).ui?.notifications?.warn?.(
          'Opportunity Attack: could not open attack card — resolve manually.',
        );
      }
    }
    return { state, note };
  }

  // Ally reactions: spend + announce only (table resolves narrative effects).
  if (role === 'ally' || isAllyReactionPower(power)) {
    note = ` <em>(Ally Reaction — resolve its effect for ${String((defender as any).name ?? 'the target')}.)</em>`;
    if (isCounterattack && attacker) {
      try {
        await launchBasicCounterattack(actor, attacker);
        note += ' <em>(Counterattack finished.)</em>';
      } catch (err) {
        console.warn('Mastery System | Ally counterattack launch failed', err);
      }
    }
    return { state, note };
  }

  // Defender mitigation
  const evadeTnRaw = Math.floor(Number(state.evadeTn));
  const baseEvade =
    Number.isFinite(evadeTnRaw) && evadeTnRaw > 0 ? evadeTnRaw : defenderEvadeFromActor(defender);
  const attackTotal =
    state.attackTotal != null && Number.isFinite(Number(state.attackTotal))
      ? Math.floor(Number(state.attackTotal))
      : null;

  const reactionArmorFlat = Math.max(0, Math.floor(Number(mech?.armor) || 0));
  let reactionDrPct = Math.max(0, Math.min(100, Math.floor(Number(mech?.damageReductionPct) || 0)));
  const iniGain = Math.max(0, Math.floor(Number(mech?.initiativeGain) || 0));
  const ev = Math.max(0, Math.floor(Number(mech?.evade) || 0));
  const evEval = evaluateReactionEvadeNegation(baseEvade, ev, attackTotal);

  let reactionDrBlocked = false;
  if (reactionDrPct > 0 && !evEval.negates) {
    const drSubject = defender as any;
    if (typeof drSubject.prepareDerivedData === 'function') {
      try {
        drSubject.prepareDerivedData();
      } catch {
        /* ignore */
      }
    }
    const bd = buildActorMechanicsBreakdown(drSubject);
    const passiveBase = bd.damageReductionPct.passive.reduce((s: number, r: any) => s + (r.value || 0), 0);
    const sheetDr = Math.max(0, Math.floor(Number(drSubject.system?.combat?.damageReductionPct) || 0));
    const totalFromBreakdown = Math.max(0, Math.floor(Number(bd.totals?.damageReductionPct) || 0));
    if (passiveBase <= 0 && sheetDr <= 0 && totalFromBreakdown <= 0) {
      reactionDrPct = 0;
      reactionDrBlocked = true;
    }
  }

  if (!state.hit) {
    note += ' <em>(Attack missed — Guard/Evade mitigation not applied.)</em>';
  } else if (ev > 0) {
    if (evEval.unknown) {
      note += ` <em>(+${ev} Evade — attack total missing, could not auto-negate.)</em>`;
    } else if (evEval.negates) {
      note += ` +${ev} Evade (${evEval.baseEvade}→${evEval.effectiveEvade} vs Attack ${evEval.attackTotal}) — <strong>hit negated, no damage</strong>.`;
    } else {
      note += ` +${ev} Evade (${evEval.baseEvade}→${evEval.effectiveEvade} vs Attack ${evEval.attackTotal}) — still a hit.`;
    }
  }
  if (state.hit && !evEval.negates) {
    if (reactionArmorFlat > 0) note += ` +${reactionArmorFlat} Armor (this hit)`;
    if (reactionDrPct > 0) note += ` +${reactionDrPct}% DR (this hit)`;
    if (reactionDrBlocked) {
      note +=
        ' <em>(Reaction DR% needs slotted <strong>Damage Reduction</strong> DR% and/or a sustained DR% on the character sheet.)</em>';
    }
  }
  if (iniGain > 0) {
    note += ` <em>(+${iniGain} Initiative applies after this attack fully resolves.)</em>`;
  }
  if (isCounterattack) {
    note += ` <em>(Basic Counterattack vs ${String((attacker as any)?.name ?? 'attacker')} — resolve it now; original damage is paused.)</em>`;
    if (attacker) {
      try {
        await launchBasicCounterattack(actor, attacker);
        note += ' <em>(Counterattack finished.)</em>';
      } catch (err) {
        console.warn('Mastery System | Counterattack launch failed', err);
        (globalThis as any).ui?.notifications?.warn?.(
          'Counterattack: could not open attack card — resolve manually.',
        );
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
    } else {
      const prev = state.mitigation || emptyMitigation();
      state.mitigation = {
        reactionArmorFlat: (prev.reactionArmorFlat || 0) + reactionArmorFlat,
        reactionDrPct: Math.min(100, (prev.reactionDrPct || 0) + reactionDrPct),
        initiativeGain:
          (prev.initiativeGain || 0) + iniGain > 0
            ? (prev.initiativeGain || 0) + iniGain
            : undefined,
        powerName: power.name,
        reactionEvadeBonus: ev > 0 ? ev : prev.reactionEvadeBonus,
        effectiveEvade: ev > 0 ? evEval.effectiveEvade : prev.effectiveEvade,
        counterattack: isCounterattack || prev.counterattack || undefined,
      };
    }
  } else if (iniGain > 0) {
    state.mitigation = {
      ...emptyMitigation(),
      initiativeGain: iniGain,
      powerName: power.name,
      counterattack: isCounterattack || undefined,
    };
  }

  return { state, note };
}

async function closeReactionWindow(messageId: string, state: ReactionWindowState): Promise<void> {
  state = { ...state, resolved: true };
  await refreshReactionCard(messageId, state);

  const waiter = pendingWaiters.get(messageId);
  if (waiter) {
    waiter.resolve(state.mitigation || emptyMitigation());
    pendingWaiters.delete(messageId);
  }

  try {
    (globalThis as any).game?.socket?.emit?.(SOCKET_NAME, {
      type: 'reactionWindowResolved',
      messageId,
      mitigation: state.mitigation,
    });
  } catch {
    /* ignore */
  }
}

function entriesFromState(
  state: ReactionWindowState,
  defender: Actor,
  attacker: Actor | null,
  combat: Combat,
): ReactionWindowActorEntry[] {
  return collectReactionWindowEntries({
    defender,
    attacker,
    combat,
    opportunityEnemyTokenIds: state.opportunityEnemyTokenIds ?? [],
  });
}

async function handleUseClick(messageId: string, actorId: string, powerId: string): Promise<void> {
  const g = globalThis as any;
  const message = g.game?.messages?.get?.(messageId);
  if (!message) return;
  const state = readState(message);
  if (!state || state.resolved) return;
  if (busyReactionMessages.has(messageId)) {
    g.ui?.notifications?.warn?.('Finish the pending Counterattack / Opportunity Attack first.');
    return;
  }

  const { attacker, defender, combat } = await resolveActors(state);
  if (!defender || !combat) return;

  const entries = entriesFromState(state, defender, attacker, combat);
  const actionable = filterEntriesForCard(entries, state);
  const entry = actionable.find((e) => String((e.actor as any).id) === actorId);
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

  // Only the defender's pre-damage Counterattack pauses the original attack.
  // Post-attack OAs must not freeze the shrinking summary.
  const blocksOriginal =
    state.phase === 'defender' && power?.basicReaction === 'counterattack';

  // Announce immediately so the table sees the spend before a long Counterattack wait.
  await g.ChatMessage?.create?.({
    user: g.game?.user?.id,
    speaker: g.ChatMessage?.getSpeaker?.({ actor: entry.actor }),
    content: `<p class="mastery-reaction-msg"><strong>${escHtml(String((entry.actor as any).name))}</strong> uses <strong>${escHtml(String(power.name))}</strong> (1 Reaction spent).${
      blocksOriginal
        ? ' <em>(Original damage paused until this attack is rolled or skipped.)</em>'
        : ''
    }</p>`,
  });

  if (blocksOriginal) {
    busyReactionMessages.add(messageId);
    try {
      const $msg = $(`.message[data-message-id="${messageId}"]`);
      $msg
        .find('.ms-reaction-continue-btn, .ms-reaction-use-btn, .ms-reaction-decline-btn')
        .prop('disabled', true);
    } catch {
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
  } finally {
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
  if (waiter) waiter.mitigation = next.mitigation || emptyMitigation();
}

async function handleDeclineClick(messageId: string, actorId: string): Promise<void> {
  const g = globalThis as any;
  const message = g.game?.messages?.get?.(messageId);
  if (!message) return;
  const state = readState(message);
  if (!state || state.resolved) return;

  const { attacker, defender, combat } = await resolveActors(state);
  if (!defender || !combat) return;

  const entries = entriesFromState(state, defender, attacker, combat);
  const entry = entries.find((e) => String((e.actor as any).id) === actorId);
  if (!entry) return;
  if (!userMayActForActor(entry.actor)) {
    g.ui?.notifications?.warn?.('You do not control this character.');
    return;
  }

  const next: ReactionWindowState = {
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

async function handleContinueClick(messageId: string): Promise<void> {
  const g = globalThis as any;
  const message = g.game?.messages?.get?.(messageId);
  if (!message) return;
  const state = readState(message);
  if (!state || state.resolved) return;
  if (busyReactionMessages.has(messageId)) {
    g.ui?.notifications?.warn?.(
      'Finish the pending Counterattack / Opportunity Attack before continuing.',
    );
    return;
  }

  const u = g.game?.user;
  const { defender } = await resolveActors(state);
  // GM, damage roller (pending waiter on this client), or defender owner may continue.
  const canContinue =
    !!u?.isGM ||
    pendingWaiters.has(messageId) ||
    (!!defender && userMayActForActor(defender));
  if (!canContinue) {
    g.ui?.notifications?.warn?.('Only the GM or the defending side can continue.');
    return;
  }

  await closeReactionWindow(messageId, state);
}

function emptyPhaseResult(eventId?: string): ReactionPhaseResult {
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
export async function runInteractiveReactionWindow(params: {
  defender: Actor;
  attacker: Actor;
  combat: Combat | null;
  rawDamage: number;
  attackTotal?: number | null;
  evadeTn?: number | null;
  hit: boolean;
  damageMessageId?: string | null;
  /** Defaults to `defender` for backward compatibility. */
  phase?: ReactionWindowPhase;
  /** Carry over from a prior phase of the same attack event. */
  eventId?: string;
  spentActorIds?: string[];
  used?: ReactionWindowState['used'];
  priorMitigation?: DefenderReactionMitigation;
  /**
   * When true and nobody can act, skip posting a chat card (used for ally phase).
   * Defender phase still posts an info card so the table sees "no reactions left".
   */
  silentIfEmpty?: boolean;
  /** Threatened Ranged: token ids that may spend a Reaction for an Opportunity Attack. */
  opportunityEnemyTokenIds?: string[] | null;
  /** Hide Counterattack buttons (nested reaction-counterattack resolution). */
  suppressCounterattack?: boolean;
}): Promise<ReactionPhaseResult> {
  const phase: ReactionWindowPhase = params.phase ?? 'defender';
  const empty = emptyPhaseResult(params.eventId);
  empty.spentActorIds = [...(params.spentActorIds ?? [])];
  empty.used = [...(params.used ?? [])];
  empty.mitigation = params.priorMitigation ?? emptyMitigation();

  const { defender, attacker, combat, rawDamage, hit } = params;
  if (!defender || !combat) return empty;

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
  const state: ReactionWindowState = {
    eventId: params.eventId || empty.eventId,
    phase,
    attackerId: String((attacker as any)?.id ?? ''),
    defenderId: String((defender as any)?.id ?? ''),
    defenderTokenId: defToken?.id ?? null,
    attackTotal:
      params.attackTotal != null && Number.isFinite(Number(params.attackTotal))
        ? Math.floor(Number(params.attackTotal))
        : null,
    evadeTn:
      params.evadeTn != null && Number.isFinite(Number(params.evadeTn))
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
  };

  const actionable = filterEntriesForCard(entries, state);
  if (!actionable.length) {
    if (params.silentIfEmpty || phase === 'others') {
      return {
        mitigation: state.mitigation,
        eventId: state.eventId,
        spentActorIds: state.spentActorIds,
        used: state.used,
      };
    }
    state.resolved = true;
  }

  const html = buildReactionWindowHtml(
    state,
    entries,
    String((attacker as any)?.name ?? 'Attacker'),
    String((defender as any)?.name ?? 'Defender'),
  );

  const g = globalThis as any;
  let message: any;
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
  } catch (err) {
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

  return new Promise<ReactionPhaseResult>((resolve) => {
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

export function registerReactionWindowChatHandlers(): void {
  if (!hooksRegistered) {
    hooksRegistered = true;

    $(document)
      .off('click.msReactionUse', '.ms-reaction-use-btn')
      .on('click.msReactionUse', '.ms-reaction-use-btn', async (ev: JQuery.ClickEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        const btn = $(ev.currentTarget);
        const messageId = String(btn.closest('.message').attr('data-message-id') || '');
        const actorId = String(btn.attr('data-actor-id') || '');
        const powerId = String(btn.attr('data-power-id') || '');
        if (!messageId || !actorId || !powerId) return;
        btn.prop('disabled', true);
        try {
          await handleUseClick(messageId, actorId, powerId);
        } finally {
          btn.prop('disabled', false);
        }
      });

    $(document)
      .off('click.msReactionDecline', '.ms-reaction-decline-btn')
      .on('click.msReactionDecline', '.ms-reaction-decline-btn', async (ev: JQuery.ClickEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        const btn = $(ev.currentTarget);
        const messageId = String(btn.closest('.message').attr('data-message-id') || '');
        const actorId = String(btn.attr('data-actor-id') || '');
        if (!messageId || !actorId) return;
        await handleDeclineClick(messageId, actorId);
      });

    $(document)
      .off('click.msReactionContinue', '.ms-reaction-continue-btn')
      .on('click.msReactionContinue', '.ms-reaction-continue-btn', async (ev: JQuery.ClickEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        const btn = $(ev.currentTarget);
        const messageId = String(btn.closest('.message').attr('data-message-id') || '');
        if (!messageId) return;
        await handleContinueClick(messageId);
      });

    $(document)
      .off('click.msSkipAwaitedAttack', '.ms-skip-awaited-attack-btn')
      .on('click.msSkipAwaitedAttack', '.ms-skip-awaited-attack-btn', async (ev: JQuery.ClickEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        const btn = $(ev.currentTarget);
        const messageId = String(btn.closest('.message').attr('data-message-id') || '');
        if (!messageId) return;
        const { completeAttackResolution, isAwaitingAttackResolution } = await import(
          './attack-resolution-wait.js'
        );
        if (!isAwaitingAttackResolution(messageId)) {
          (globalThis as any).ui?.notifications?.warn?.(
            'This attack is not waiting to unblock another action.',
          );
          return;
        }
        btn.prop('disabled', true);
        completeAttackResolution(messageId, { status: 'skipped' });
        try {
          const msg = (globalThis as any).game?.messages?.get?.(messageId);
          if (msg) {
            const content = String(msg.content || '');
            const note =
              '<p class="ms-awaited-attack-skipped" style="opacity:0.9;"><em>Counterattack skipped — original damage continues.</em></p>';
            if (!content.includes('ms-awaited-attack-skipped')) {
              await msg.update({ content: `${content}${note}` });
            }
          }
        } catch {
          /* ignore */
        }
        (globalThis as any).ui?.notifications?.info?.('Counterattack skipped — original damage continues.');
      });

    Hooks.on('updateChatMessage', (message: any) => {
      try {
        const st = readState(message);
        // Superseded cards are replaced by a newer copy below — not a real close.
        if (!st?.resolved || st.superseded) return;
        const id = String(message?.id ?? '');
        const waiter = pendingWaiters.get(id);
        if (!waiter) return;
        waiter.resolve(st.mitigation || emptyMitigation());
        pendingWaiters.delete(id);
      } catch (err) {
        console.warn('Mastery System | reaction window updateChatMessage', err);
      }
    });
  }

  if (!socketRegistered) {
    socketRegistered = true;
    try {
      (globalThis as any).game?.socket?.on?.(SOCKET_NAME, (payload: any) => {
        if (payload?.type !== 'reactionWindowResolved') return;
        const id = String(payload.messageId || '');
        const waiter = pendingWaiters.get(id);
        if (!waiter) return;
        waiter.resolve(payload.mitigation || emptyMitigation());
        pendingWaiters.delete(id);
      });
    } catch (err) {
      console.warn('Mastery System | reaction window socket register failed', err);
    }
  }
}
