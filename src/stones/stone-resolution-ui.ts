/**
 * Foundry presentation for the post-commit Stone resolution queue.
 * Healing and Stress Healing open a target dialog. Other interactive powers
 * keep the apply they already had.
 */

import { distanceBetweenActorsMeters } from '../combat/reaction-eligibility.js';
import { STONE_POWERS, resolveStonePowerId } from './stone-powers.js';
import { listSelectablePlayerActors } from './ally-stone-target.js';
import { getActionEconomyActor } from '../combat/action-economy.js';
import {
  RESOLVE_HEALING_PENDING_FLAG,
  armResolveHealingPending,
  describePendingHealing,
  isResolveHealingPendingExpired,
  isResolveHealingPendingLive,
  pendingHealingLegalTargetIds,
  pendingHealingRound,
  readResolveHealingPending,
  triggerResolveHealing,
  type ResolveHealingPending,
  type TriggerResolveHealingResult,
} from './resolve-healing-pending.js';
import {
  healingRankProfile,
  readHealthSnapshot,
  resolveHealthActor,
  resolveHealingSelection,
  resolveStressHealingSelection,
  stressHealingRankProfile,
  type HealthSnapshot,
  type StoneResolutionTicket,
  type StoneTargetCandidate,
} from './stone-resolution.js';

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function worldActors(): any[] {
  const g = globalThis as any;
  const out: any[] = [];
  const combatants = g.game?.combat?.combatants;
  if (combatants && typeof combatants[Symbol.iterator] === 'function') {
    for (const combatant of combatants) out.push(combatant);
  }
  const actors = g.game?.actors;
  if (actors && typeof actors[Symbol.iterator] === 'function') {
    for (const actor of actors) out.push(actor);
  }
  return out;
}

function combatantList(): any[] {
  const g = globalThis as any;
  const combatants = g.game?.combat?.combatants;
  if (!combatants) return [];
  if (typeof combatants[Symbol.iterator] === 'function') return [...combatants];
  if (Array.isArray(combatants.contents)) return combatants.contents;
  return [];
}

/** Combat token actor when one is placed. Unlinked tokens share the world id. */
function actorById(id: string, source: any, preferred?: any): any | null {
  const g = globalThis as any;
  return resolveHealthActor(id, source, combatantList(), g.game?.actors?.get?.(id) ?? null, preferred);
}

export function stoneTargetCandidates(source: any, preferred?: any): StoneTargetCandidate[] {
  const sourceId = String(source?.id || '').trim();
  const placed = actorById(sourceId, source, preferred) ?? source;
  const choices = listSelectablePlayerActors(worldActors(), sourceId);
  const out: StoneTargetCandidate[] = [];
  const seen = new Set<string>();
  const push = (candidate: StoneTargetCandidate) => {
    if (!candidate.id || seen.has(candidate.id)) return;
    seen.add(candidate.id);
    out.push(candidate);
  };
  if (sourceId) {
    push({
      id: sourceId,
      name: String(source?.name || 'You'),
      self: true,
      distanceM: 0,
    });
  }
  for (const choice of choices) {
    if (choice.id === sourceId) continue;
    const actor = actorById(choice.id, source);
    const distanceM = actor ? distanceBetweenActorsMeters(placed, actor) : null;
    push({
      id: choice.id,
      name: choice.name,
      self: false,
      distanceM,
    });
  }
  return out;
}

async function promptStoneTarget(args: {
  title: string;
  hint: string;
  legal: readonly StoneTargetCandidate[];
}): Promise<string | null> {
  if (!args.legal.length) return null;
  const DialogV2 = (globalThis as any).foundry?.applications?.api?.DialogV2;
  if (typeof DialogV2?.prompt !== 'function') return null;
  const optionsHtml = args.legal
    .map((candidate) => {
      const distance =
        candidate.self || candidate.distanceM == null ? '' : ` — ${candidate.distanceM} m`;
      const label = `${candidate.self ? `${candidate.name} (self)` : candidate.name}${distance}`;
      return `<option value="${escapeAttr(candidate.id)}">${escapeAttr(label)}</option>`;
    })
    .join('');
  try {
    const id = await DialogV2.prompt({
      window: { title: args.title },
      content: `<form class="mastery-dialog-form"><p class="md-hint">${escapeAttr(args.hint)}</p><label class="md-label">Target</label><select name="target" class="md-select">${optionsHtml}</select></form>`,
      ok: {
        label: 'Resolve',
        callback: (_event: unknown, button: any) => String(button?.form?.elements?.target?.value || ''),
      },
    });
    const picked = String(id || '').trim();
    return picked || null;
  } catch {
    return null;
  }
}

async function rollPool(formula: string): Promise<number> {
  const RollCls = (globalThis as any).Roll;
  if (typeof RollCls !== 'function') return 0;
  const roll = await new RollCls(formula).evaluate({ async: true });
  return Math.max(0, Math.floor(Number(roll?.total) || 0));
}

export async function postStonePowerChat(
  content: string,
  pendingCard?: { combatantId: string; round: number },
): Promise<void> {
  const ChatMessage = (globalThis as any).ChatMessage;
  if (typeof ChatMessage?.create !== 'function') return;
  const data: Record<string, unknown> = { content };
  if (pendingCard) data.flags = { 'mastery-system': { resolveHealingPendingCard: pendingCard } };
  await ChatMessage.create(data);
}

function healthSnapshot(actor: any): HealthSnapshot | null {
  return readHealthSnapshot(actor?.system?.health);
}

function stressSnapshot(actor: any): HealthSnapshot | null {
  return readHealthSnapshot(actor?.system?.stress);
}

async function writeTrack(target: any, key: 'health' | 'stress', track: HealthSnapshot): Promise<void> {
  if (!target || typeof target.update !== 'function') return;
  const { updateActorViaGm } = await import('../combat/gm-relay.js');
  await updateActorViaGm(target, {
    [`system.${key}.bars`]: track.bars,
    [`system.${key}.currentBar`]: track.currentBar,
  });
}

// ---------------------------------------------------------------------------
// Resolve Ability: Healing — R-05 §8 pending timing
// ---------------------------------------------------------------------------

/** Flags live on the same owner document as the resolution queue. */
function pendingFlagOwner(actor: any): any {
  return (getActionEconomyActor(actor) ?? actor) as any;
}

function liveCombatRef(): { id: string; round: number } | null {
  const combat = (globalThis as any).game?.combat;
  if (!combat?.id) return null;
  return { id: String(combat.id), round: Number(combat.round) || 0 };
}

/** Raw pending heal on an actor (may be spent / stale). */
export function readActorResolveHealingPending(actor: any): ResolveHealingPending | null {
  const owner = pendingFlagOwner(actor);
  return readResolveHealingPending(owner?.getFlag?.('mastery-system', RESOLVE_HEALING_PENDING_FLAG));
}

/** Pending heal that can be used right now, else null. */
export function getLiveResolveHealingPending(actor: any): ResolveHealingPending | null {
  const pending = readActorResolveHealingPending(actor);
  return isResolveHealingPendingLive(pending, liveCombatRef()) ? pending : null;
}

async function writeResolveHealingPending(
  actor: any,
  pending: ResolveHealingPending | null,
): Promise<void> {
  const owner = pendingFlagOwner(actor);
  if (!owner) return;
  if (pending) {
    if (typeof owner.setFlag === 'function') {
      await owner.setFlag('mastery-system', RESOLVE_HEALING_PENDING_FLAG, pending);
    }
    return;
  }
  if (typeof owner.unsetFlag === 'function') {
    await owner.unsetFlag('mastery-system', RESOLVE_HEALING_PENDING_FLAG);
  }
}

/**
 * Confirm Stone Assignment path: PREPARE the heal for this Round. Nothing is rolled and no
 * target is chosen yet. Returns true so the resolution ticket counts as handled; the Stones
 * are already spent and stay spent even if the heal expires unused.
 */
async function presentHealing(source: any, combatant: any, tier: number): Promise<boolean> {
  const combat = (globalThis as any).game?.combat;
  if (!combat?.id) {
    (globalThis as any).ui?.notifications?.warn?.('Healing can only be prepared during an encounter.');
    return true;
  }
  const round = pendingHealingRound({ id: combat.id, round: combat.round });
  const owner = pendingFlagOwner(source);
  const existing = owner?.getFlag?.('mastery-system', RESOLVE_HEALING_PENDING_FLAG);
  const pending = armResolveHealingPending(existing, String(combat.id), round, tier);
  await writeResolveHealingPending(source, pending);
  try {
    (globalThis as any).Hooks?.callAll?.('masteryHealingBarRefresh');
    (globalThis as any).ui?.notifications?.info?.(
      `Healing prepared (${describePendingHealing(pending.rank)}). Use it from the Healing bar.`,
    );
  } catch {
    /* the flag is already written */
  }
  return true;
}

const resolveHealingInFlight = new Set<string>();

function pendingConfirm(title: string, content: string): Promise<boolean> {
  const g = globalThis as any;
  const DialogV2 = g.foundry?.applications?.api?.DialogV2;
  if (typeof DialogV2?.confirm === 'function') {
    return Promise.resolve(
      DialogV2.confirm({
        window: { title },
        content,
        yes: { label: 'Use Healing' },
        no: { label: 'Not now' },
      }),
    ).then((v: unknown) => v === true);
  }
  if (typeof g.Dialog?.confirm === 'function') {
    return Promise.resolve(g.Dialog.confirm({ title, content })).then((v: unknown) => !!v);
  }
  return Promise.resolve(false);
}

/**
 * Trigger the prepared Healing: choose target (unless preselected), offer Maximization on the
 * roll, roll, apply to the current Health Bar, mark spent. Safe against double-click.
 */
export async function usePendingResolveHealing(
  source: any,
  combatant: any,
  opts?: { targetActor?: any },
): Promise<TriggerResolveHealingResult> {
  const combatRef = liveCombatRef();
  const pending = readActorResolveHealingPending(source);
  const guardKey = `${combatRef?.id || ''}:${String(pendingFlagOwner(source)?.id || source?.id || '')}`;
  if (resolveHealingInFlight.has(guardKey)) {
    return { ok: false, restored: 0, targetId: null, reason: 'cancelled' };
  }
  resolveHealingInFlight.add(guardKey);
  try {
    const profile = healingRankProfile(pending?.rank ?? 1);
    const candidates = stoneTargetCandidates(source, combatant);
    const forcedTarget = opts?.targetActor ?? null;
    const forcedId = forcedTarget ? String(forcedTarget.id || '') : '';
    const resolveTarget = (targetId: string) =>
      forcedTarget && String(forcedTarget.id || '') === targetId
        ? forcedTarget
        : actorById(targetId, source, combatant);
    const result = await triggerResolveHealing({
      pending,
      combat: combatRef,
      sourceName: String(source?.name || 'Someone'),
      candidates,
      preselectedTargetId: forcedId || null,
      choose: (legal) =>
        promptStoneTarget({
          title: 'Healing',
          hint: `Choose yourself or one ally within ${profile.rangeM} m. Healing rolls ${profile.dice}d8 into the current Health Bar.`,
          legal,
        }),
      // Maximization is decided by the roll that is about to happen (R-02 / R-05 §8).
      roll: async (formula) => {
        let useFormula = formula;
        try {
          const { offerMaximization, maximizeDiceFormula } = await import('./stone-combat-effects.js');
          if (await offerMaximization(source, 'healing')) useFormula = maximizeDiceFormula(formula);
        } catch {
          useFormula = formula;
        }
        return rollPool(useFormula);
      },
      healthOf: (targetId) => healthSnapshot(resolveTarget(targetId)),
      writeHealth: async (targetId, health) => {
        await writeTrack(resolveTarget(targetId), 'health', health);
      },
      chat: postStonePowerChat,
      persist: (next) => writeResolveHealingPending(source, next),
    });
    if (!result.ok && result.reason === 'expired') {
      (globalThis as any).ui?.notifications?.warn?.('Prepared Healing expired with the Round.');
    }
    return result;
  } finally {
    resolveHealingInFlight.delete(guardKey);
  }
}

/**
 * Damage hook (R-05 §8): before incoming damage takes HP from `target`, offer any live prepared
 * Healing whose owner may legally heal that target (self, or an ally inside the rank's range).
 * Only the healer's owner (or the GM) is prompted. Returns total HP restored.
 */
export async function offerPendingResolveHealingBeforeDamage(
  target: any,
  incomingDamage: number,
): Promise<{ offered: number; used: number; restored: number }> {
  const out = { offered: 0, used: 0, restored: 0 };
  const g = globalThis as any;
  const combat = g.game?.combat;
  const incoming = Math.max(0, Math.floor(Number(incomingDamage) || 0));
  if (!combat?.id || !target || incoming <= 0) return out;
  const targetId = String(target.id || '');
  if (!targetId) return out;
  const combatRef = { id: String(combat.id), round: Number(combat.round) || 0 };
  const combatants = combatantList();
  // The damaged creature's own Healing first, then allies.
  const ordered = [...combatants].sort((a, b) => {
    const aSelf = String(a?.actor?.id || a?.actorId || '') === targetId ? 0 : 1;
    const bSelf = String(b?.actor?.id || b?.actorId || '') === targetId ? 0 : 1;
    return aSelf - bSelf;
  });
  for (const combatant of ordered) {
    const healer = combatant?.actor;
    if (!healer) continue;
    const pending = readActorResolveHealingPending(healer);
    if (!isResolveHealingPendingLive(pending, combatRef)) continue;
    const isSelf = String(healer.id || '') === targetId;
    if (!g.game?.user?.isGM && healer.isOwner !== true) continue;
    const candidates = stoneTargetCandidates(healer, combatant);
    if (!pendingHealingLegalTargetIds(pending!, candidates).includes(targetId)) continue;
    out.offered += 1;
    const profile = healingRankProfile(pending!.rank);
    const who = escapeAttr(String(healer.name || 'Someone'));
    const whom = isSelf ? 'themselves' : escapeAttr(String(target.name || 'the target'));
    const yes = await pendingConfirm(
      `Healing — ${String(healer.name || 'Someone')}`,
      `<p><strong>${who}</strong> has prepared Healing (${profile.dice}d8, ${profile.rangeM} m).</p>` +
        `<p>Use it on <strong>${whom}</strong> before <strong>${incoming}</strong> damage is applied to HP?</p>`,
    );
    if (!yes) continue;
    const result = await usePendingResolveHealing(healer, combatant, { targetActor: target });
    if (result.ok) {
      out.used += 1;
      out.restored += result.restored;
    }
  }
  return out;
}

/** Drop spent / stale prepared Healing (call on Round change and combat end). */
export async function expireStaleResolveHealingPending(combat: any): Promise<number> {
  const combatRef = combat?.id ? { id: String(combat.id), round: Number(combat.round) || 0 } : null;
  let cleared = 0;
  const rows: any[] = [];
  const bag = combat?.combatants;
  if (bag) {
    if (typeof bag[Symbol.iterator] === 'function') rows.push(...bag);
    else if (Array.isArray(bag.contents)) rows.push(...bag.contents);
  }
  for (const combatant of rows) {
    const actor = combatant?.actor;
    if (!actor) continue;
    const pending = readActorResolveHealingPending(actor);
    if (!pending) {
      const raw = pendingFlagOwner(actor)?.getFlag?.('mastery-system', RESOLVE_HEALING_PENDING_FLAG);
      if (raw == null) continue;
    }
    if (pending && !isResolveHealingPendingExpired(pending, combatRef)) continue;
    try {
      await writeResolveHealingPending(actor, null);
      cleared += 1;
    } catch {
      /* ignore */
    }
  }
  return cleared;
}

/** Bind the "Use Healing now" button on prepared-Healing chat cards. */
export function registerResolveHealingChatHandlers(): void {
  const Hooks = (globalThis as any).Hooks;
  if (!Hooks?.on) return;
  Hooks.on('renderChatMessageHTML', (message: any, htmlRaw: any) => {
    try {
      const root: HTMLElement | null = htmlRaw?.jquery || htmlRaw?.[0] ? htmlRaw[0] : htmlRaw;
      const btn = root?.querySelector?.('.mastery-resolve-healing-use') as HTMLButtonElement | null;
      if (!btn || btn.dataset.msBound === '1') return;
      btn.dataset.msBound = '1';
      const meta =
        message?.getFlag?.('mastery-system', 'resolveHealingPendingCard') ??
        message?.flags?.['mastery-system']?.resolveHealingPendingCard;
      btn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        const combat = (globalThis as any).game?.combat;
        const combatant = meta?.combatantId ? combat?.combatants?.get?.(meta.combatantId) : null;
        const actor = combatant?.actor;
        if (!actor) {
          (globalThis as any).ui?.notifications?.warn?.('Healing owner is not in this combat.');
          return;
        }
        const user = (globalThis as any).game?.user;
        if (!user?.isGM && actor.isOwner !== true) {
          (globalThis as any).ui?.notifications?.warn?.('Only the owner can use this Healing.');
          return;
        }
        btn.disabled = true;
        const result = await usePendingResolveHealing(actor, combatant);
        if (!result.ok) btn.disabled = result.reason === 'spent' || result.reason === 'expired';
      });
    } catch (err) {
      console.warn('Mastery System | resolve healing chat bind failed', err);
    }
  });
}

async function presentStressHealing(source: any, combatant: any, tier: number): Promise<boolean> {
  const profile = stressHealingRankProfile(tier);
  const candidates = stoneTargetCandidates(source, combatant);
  const result = await resolveStressHealingSelection({
    sourceName: String(source?.name || 'Someone'),
    tier,
    candidates,
    choose: (legal) =>
      promptStoneTarget({
        title: 'Stress Healing',
        hint: `Choose yourself or one ally within ${profile.rangeM} m. Stress Healing rolls ${profile.dice}d8.`,
        legal,
      }),
    roll: rollPool,
    stressOf: (targetId) => stressSnapshot(actorById(targetId, source, combatant)),
    writeStress: async (targetId, stress) => {
      await writeTrack(actorById(targetId, source, combatant), 'stress', stress);
    },
    chat: postStonePowerChat,
  });
  return result.ok;
}

/** Resolve one committed ticket. False means the player still has to choose. */
export async function presentStoneResolution(
  actor: any,
  combatant: any,
  ticket: StoneResolutionTicket,
): Promise<boolean> {
  if (ticket.status === 'resolved') return true;
  const powerId = resolveStonePowerId(ticket.powerId);
  if (powerId === 'resolve.healing') return presentHealing(actor, combatant, ticket.tier);
  if (powerId === 'agility.safeMovement') {
    const { presentSafeMovement } = await import('./agility-movement-ui.js');
    return presentSafeMovement(actor, ticket.tier);
  }
  const power = STONE_POWERS[powerId];
  if (!power) return true;
  const canPrompt =
    typeof (globalThis as any).foundry?.applications?.api?.DialogV2?.prompt === 'function';
  await power.apply({ actor, combatant, tier: ticket.tier, cost: 0 });
  if (powerId === 'influence.cleanse' && canPrompt) {
    const waiting = actor?.getFlag?.('mastery-system', 'pendingCleanse');
    if (waiting) return false;
  }
  try {
    await postStonePowerChat(
      `<div class="mastery-stone-resolution"><p><strong>${String(actor?.name || 'Someone')}</strong> — ${power.name}</p><p>Rank ${ticket.tier}.</p></div>`,
    );
  } catch {
    /* the apply already landed */
  }
  return true;
}
