/**
 * Martial / Spell AoE resolution — per-creature Evade (or Final Spell TN) checks
 * with full printed payload on every remaining hit.
 *
 * One shared Attack/Spell Roll is compared separately against each creature.
 * A miss against one creature does not protect any other. Creatures that would
 * be hit may use Dive for Cover before payload.
 *
 * Instant AoE rules (Destroyed Faith Active Powers):
 *   - ONE shared Attack/Casting roll for the whole AoE.
 *   - ONE shared Power damage roll (if damaging): the same raw total goes to every
 *     hit creature; armor / DR / Temp HP / Phasing still resolve per creature.
 *   - The full printed Special goes to every hit creature (no distribution).
 *   - NO Primary Target. NO Weapon Damage. NO Spell Focus damage.
 *
 * Default (and only) flow: `resolveAoeFromSharedRoll` → every token gets its own
 * hit check + Dive for Cover; one damage dialog rolls the Power damage once
 * (against the first remaining hit, purely as the roll surface); one Apply-to-all
 * confirmation then applies the same payload to every other hit.
 */

import {
  getActionEconomyActor,
  getRoundState,
  spendReactionAction,
} from './action-economy.js';
import { actorParticipatesInReactions } from '../utils/npc-reactions.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
import {
  getTargetEvade,
  getTargetSpellResistance,
  spellResistanceAfterPenetration,
} from './attack-executor.js';
import { RAISE_INCREMENT } from '../utils/constants.js';

/** Resolve a burst token id to a canvas actor (handles scene / placeable quirks). */
export function resolveBurstTarget(tid: string): { defender: any; tok: any } | null {
  const placeables = (canvas as any)?.tokens?.placeables ?? [];
  const p = placeables.find((t: any) => t?.id === tid || t?.document?.id === tid);
  if (p?.actor) return { defender: p.actor, tok: p };
  const scene = (canvas as any)?.scene ?? (game as any).scenes?.active;
  const doc = scene?.tokens?.get?.(tid);
  if (doc?.actor) {
    const tok = placeables.find((t: any) => t.id === tid) ?? null;
    return { defender: doc.actor, tok };
  }
  return null;
}

async function confirmSpendReaction(title: string, html: string): Promise<boolean> {
  const Dialog: any = (globalThis as any).Dialog;
  try {
    if (Dialog?.confirm) {
      const ok = await Dialog.confirm({
        title,
        content: html,
        yes: () => true,
        no: () => false,
        defaultYes: false,
      } as any);
      return !!ok;
    }
  } catch {
    /* fall through */
  }
  const plain = String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return typeof globalThis !== 'undefined' && (globalThis as any).confirm?.(`${title}\n\n${plain}`);
}

/**
 * @deprecated Legacy Body-save DC (pre per-Evade AoE rules). Kept for old callers.
 */
export function aoeSecondaryBodySaveDc(masteryRank: number): number {
  const r = Math.max(1, Math.min(6, Math.floor(Number(masteryRank) || 1)));
  return r * 8;
}

/** Dive-for-Cover movement allowance of the diving creature (2 × own MR). */
export function diveForCoverDistanceM(actor: any): number {
  const mr = getRulesMasteryRank(actor);
  return mr * 2;
}

/**
 * Offer Dive for Cover to a creature that would be hit by an AoE.
 * Spends the Reaction, lets the table move the token, and asks whether it
 * ended up fully outside the area.
 *
 * @returns true when the creature escaped (→ not affected by the AoE).
 */
/**
 * Who decides Dive for Cover for `defender` on this client?
 * - GM, or a player who owns the defender → decide here.
 * - Otherwise (a player resolving an AoE against an NPC or someone else's PC)
 *   → route to a connected owner, else to the GM. Never ask the attacker.
 */
export function diveForCoverDeciderUserId(defender: any): { local: boolean; userId: string } {
  const g = globalThis as any;
  const user = g.game?.user;
  if (!user) return { local: true, userId: '' };
  const owns =
    !!defender &&
    (defender.isOwner === true ||
      (typeof defender.testUserPermission === 'function' && defender.testUserPermission(user, 'OWNER')));
  const isNpc = String(defender?.type || '') !== 'character';
  // GM decides for NPCs even when a player technically owns the NPC doc.
  if (user.isGM) return { local: true, userId: String(user.id) };
  if (owns && !isNpc) return { local: true, userId: String(user.id) };
  const users: any[] = Array.from(g.game?.users ?? []);
  if (!isNpc) {
    const owner = users.find(
      (u) =>
        u?.active &&
        !u.isGM &&
        String(u.id) !== String(user.id) &&
        typeof defender?.testUserPermission === 'function' &&
        defender.testUserPermission(u, 'OWNER'),
    );
    if (owner) return { local: false, userId: String(owner.id) };
  }
  const gm = g.game?.users?.activeGM ?? users.find((u) => u?.active && u.isGM);
  return { local: false, userId: gm ? String(gm.id) : '' };
}

export async function promptDiveForCoverEscape(defender: any, tok: any | null): Promise<boolean> {
  if (!actorParticipatesInReactions(defender)) return false;
  const decider = diveForCoverDeciderUserId(defender);
  if (!decider.local) {
    if (!decider.userId) return false; // nobody online who may decide — no dive
    try {
      const { askRemoteUserDecision } = await import('./gm-relay.js');
      (globalThis as any).ui?.notifications?.info?.(`${defender.name}: Dive for Cover wird vom Besitzer/GM entschieden …`);
      return await askRemoteUserDecision(decider.userId, {
        type: 'remoteDiveForCover',
        actorUuid: String(defender.uuid || ''),
        actorId: String(defender.id || ''),
        tokenId: String(tok?.id || tok?.document?.id || ''),
      });
    } catch (err) {
      console.warn('Mastery System | remote Dive for Cover failed', err);
      return false;
    }
  }
  return promptDiveForCoverEscapeLocal(defender, tok);
}

/**
 * After Dive for Cover is chosen (Reaction already spent via the Reaction Window),
 * let the table move the token and confirm whether it left the area.
 */
export async function confirmDiveForCoverOutside(
  defender: any,
  tok: any | null,
  moveM?: number,
): Promise<boolean> {
  const meters = Math.max(0, Math.floor(Number(moveM) || diveForCoverDistanceM(defender)));
  const outside = await confirmSpendReaction(
    `Dive for Cover — ${defender.name}`,
    `<p>Move the token up to <strong>${meters} m</strong> now.</p>` +
      `<p>Is <strong>${defender.name}</strong> completely <strong>outside</strong> the AoE after the move?</p>` +
      `<p class="notes">This movement does not provoke Reactions.</p>`,
  );
  await ChatMessage.create({
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor: defender, token: tok?.document }),
    content: `<p><strong>${defender.name}</strong> — Dive for Cover (${meters} m): ${
      outside
        ? '<strong>outside the area</strong> — not affected.'
        : '<strong>still inside</strong> — affected normally.'
    }</p>`,
  } as any);
  return outside;
}

/**
 * @deprecated Prefer choosing Dive for Cover in the Reaction Window.
 * Kept for remote socket fallback / legacy callers.
 */
export async function promptDiveForCoverEscapeLocal(defender: any, tok: any | null): Promise<boolean> {
  if (!actorParticipatesInReactions(defender)) return false;
  const combat = (game as any).combat as Combat | null;
  const economyDef = getActionEconomyActor(defender) ?? defender;
  const rsReact = getRoundState(economyDef, combat);
  const reactions = Math.max(
    0,
    (rsReact.reactionActions?.total ?? 0) - (rsReact.reactionActions?.used ?? 0),
  );
  if (reactions <= 0) return false;

  const moveM = diveForCoverDistanceM(defender);
  const spend = await confirmSpendReaction(
    `Dive for Cover — ${defender.name}`,
    `<p><strong>Dive for Cover:</strong> Spend <strong>1 Reaction</strong> to immediately move up to <strong>${moveM} m</strong> (2 × Mastery Rank)?</p>` +
      `<p>If the movement takes you completely outside the AoE, you are not affected. This does not provoke Reactions.</p>`,
  );
  if (!spend) return false;

  const consumed = await spendReactionAction(economyDef, combat);
  if (!consumed) return false;

  return confirmDiveForCoverOutside(defender, tok, moveM);
}

/** Per-creature AoE defense TN (Evade or Final Spell TN) before Raise increments. */
export function aoeCreatureNormalTn(params: {
  defender: any;
  isSpell: boolean;
  /** Spell Base TN without SR (Final = base + this creature's SR). */
  spellBaseTn?: number | null;
  /** Caster, so Spell Penetration reduces only this creature's SR. */
  caster?: any;
  /** Willing, aware target: Spell Resistance is 0. Spell Base TN is unchanged. */
  willing?: boolean;
}): number {
  if (params.isSpell) {
    const base = Math.max(0, Math.floor(Number(params.spellBaseTn) || 0));
    if (params.willing) return base;
    const sr = params.caster
      ? spellResistanceAfterPenetration(params.defender, params.caster)
      : getTargetSpellResistance(params.defender);
    return base + sr;
  }
  return getTargetEvade(params.defender);
}

/**
 * Hit check for one creature against a shared AoE roll.
 * Final TN = Base TN + (Paid Raises × 4) is the only success threshold.
 */
export function aoeCreatureHitCheck(params: {
  attackTotal: number;
  normalTn: number;
  declaredRaiseSlots: number;
}): { hit: boolean; raiseTn: number; finalTn: number } {
  const slots = Math.max(0, Math.floor(Number(params.declaredRaiseSlots) || 0));
  const finalTn =
    slots > 0 ? params.normalTn + slots * RAISE_INCREMENT : params.normalTn;
  const total = Math.floor(Number(params.attackTotal) || 0);
  return { hit: total >= finalTn, raiseTn: finalTn, finalTn };
}

/**
 * Force the Instant AoE damage rules onto a flag bag: Power damage only, so the
 * damage dialog never adds Weapon Damage or Spell Focus damage.
 */
export function withInstantAoeFlags<T extends Record<string, any>>(
  flags: T | null | undefined,
): T & { ignoreWeaponDamage: true; instantAoe: true; aoeMeleeWeapon: true } {
  return {
    ...((flags ?? {}) as T),
    ignoreWeaponDamage: true,
    instantAoe: true,
    aoeMeleeWeapon: true,
  };
}

/** Shared AoE damage payload — rolled once, applied to every remaining hit. */
export type SharedAoeDamagePayload = {
  totalDamage: number;
  count8s?: number;
  specialsUsed?: string[];
  applicationLimitNotes?: string[];
  rollDetails?: string[];
  damageChatRolls?: any[];
  armorPenetration?: number;
  /** True when this payload already applied Specials to one target (the roller). */
  specialsAppliedToTargetId?: string | null;
};

export function toSharedAoeDamagePayload(result: {
  totalDamage?: number;
  count8s?: number;
  specialsUsed?: string[];
  applicationLimitNotes?: string[];
  rollDetails?: string[];
  damageChatRolls?: any[];
  attackContext?: { armorPenetration?: number } | null;
  mitigation?: { phased?: boolean } | null;
} | null | undefined): SharedAoeDamagePayload | null {
  if (!result) return null;
  if (result.mitigation?.phased) return null;
  return {
    totalDamage: Math.max(0, Math.floor(Number(result.totalDamage) || 0)),
    count8s: Math.max(0, Math.floor(Number(result.count8s) || 0)),
    specialsUsed: Array.isArray(result.specialsUsed) ? [...result.specialsUsed] : [],
    applicationLimitNotes: Array.isArray(result.applicationLimitNotes)
      ? [...result.applicationLimitNotes]
      : undefined,
    rollDetails: Array.isArray(result.rollDetails) ? [...result.rollDetails] : undefined,
    damageChatRolls: Array.isArray(result.damageChatRolls) ? result.damageChatRolls : undefined,
    armorPenetration: Math.max(
      0,
      Math.floor(Number(result.attackContext?.armorPenetration) || 0),
    ),
  };
}

type AoePreDamageGate = {
  outcome: 'escaped' | 'negated' | 'ready';
  preDamage: any;
};

/** Dive for Cover + pre-damage reactions for one AoE hit. */
async function runAoePreDamageGate(params: {
  attacker: any;
  defender: any;
  tok: any | null;
  attackTotal: number;
  evadeTn: number;
  allowDiveForCover?: boolean;
}): Promise<AoePreDamageGate> {
  const { attacker, defender, tok, attackTotal, evadeTn } = params;
  const allowDive = params.allowDiveForCover !== false;
  const combat = (game as any).combat ?? null;
  const { runInteractiveReactionWindow } = await import('./reaction-window-chat.js');

  const phase1 = await runInteractiveReactionWindow({
    defender,
    attacker,
    combat,
    rawDamage: 0,
    attackTotal,
    evadeTn,
    hit: true,
    phase: 'defender',
    isAoE: true,
    allowDiveForCover: allowDive,
  });

  let preDamage = phase1;
  if (
    !phase1.mitigation?.negatedByEvade &&
    !phase1.mitigation?.phasedByReaction &&
    !phase1.mitigation?.escapedByDiveForCover
  ) {
    try {
      preDamage = await runInteractiveReactionWindow({
        defender,
        attacker,
        combat,
        rawDamage: 0,
        attackTotal,
        evadeTn,
        hit: true,
        phase: 'allies',
        eventId: phase1.eventId,
        spentActorIds: phase1.spentActorIds,
        used: phase1.used,
        priorMitigation: phase1.mitigation,
        silentIfEmpty: true,
        isAoE: true,
        allowDiveForCover: allowDive,
      });
    } catch {
      /* ignore */
    }
  }

  if (preDamage.mitigation?.escapedByDiveForCover) {
    return { outcome: 'escaped', preDamage };
  }
  if (preDamage.mitigation?.negatedByEvade || preDamage.mitigation?.phasedByReaction) {
    await ChatMessage.create({
      user: (game as any).user?.id,
      speaker: ChatMessage.getSpeaker({ actor: defender, token: tok?.document }),
      content: `<p><strong>AoE</strong> → <strong>${defender.name}</strong>: hit <strong>negated</strong> by reaction. No damage.</p>`,
    } as any);
    return { outcome: 'negated', preDamage };
  }
  return { outcome: 'ready', preDamage };
}

function filterStatusSpecialLines(specialsUsed: readonly string[] | undefined): string[] {
  return (specialsUsed ?? []).filter((s) => {
    if (/^mark spent /i.test(s)) return false;
    if (/vulnerability/i.test(s) && /→/.test(s)) return false;
    if (/\(buff damage\)/i.test(s)) return false;
    if (/^penetration\s*\(/i.test(s.trim())) return false;
    if (/^precision\s*\(/i.test(s.trim())) return false;
    if (/^brutal\s*impact\s*\(/i.test(s.trim())) return false;
    return true;
  });
}

/** Confirm applying one shared AoE damage roll to many creatures. */
export async function confirmSharedAoeDamageApply(opts: {
  totalDamage: number;
  specialsUsed?: readonly string[];
  targetNames: string[];
}): Promise<boolean> {
  const names = opts.targetNames.filter(Boolean);
  if (!names.length) return false;
  const specials = filterStatusSpecialLines(opts.specialsUsed as string[] | undefined);
  const specialLine = specials.length
    ? `<p><strong>Specials:</strong> ${specials.map((s) => String(s)).join(', ')}</p>`
    : '';
  const list = names.map((n) => `<li>${String(n)}</li>`).join('');
  const html =
    `<div class="mastery-system-damage">` +
    `<p>Apply the <strong>same AoE damage roll</strong> to every remaining hit.</p>` +
    `<p><strong>Damage:</strong> ${Math.max(0, Math.floor(Number(opts.totalDamage) || 0))}</p>` +
    specialLine +
    `<p><strong>Targets (${names.length}):</strong></p><ul>${list}</ul>` +
    `<p class="notes">Armor, DR, Temp HP and Phasing still resolve per creature.</p>` +
    `</div>`;

  const Dialog: any = (globalThis as any).Dialog;
  try {
    if (Dialog?.confirm) {
      const ok = await Dialog.confirm({
        title: 'AoE Damage — Apply to All',
        content: html,
        yes: () => true,
        no: () => false,
        defaultYes: true,
      } as any);
      return !!ok;
    }
  } catch {
    /* fall through */
  }
  return confirmSharedAoeDamageApplyFallback(opts);
}

async function confirmSharedAoeDamageApplyFallback(opts: {
  totalDamage: number;
  specialsUsed?: readonly string[];
  targetNames: string[];
}): Promise<boolean> {
  const specials = filterStatusSpecialLines(opts.specialsUsed as string[] | undefined).join(', ');
  const msg =
    `Apply AoE damage ${opts.totalDamage}` +
    (specials ? ` + ${specials}` : '') +
    ` to: ${opts.targetNames.join(', ')}?`;
  return typeof globalThis !== 'undefined' && !!(globalThis as any).confirm?.(msg);
}

/**
 * Apply an already-rolled AoE payload to one creature (Specials + HP + movers).
 */
export async function applySharedAoePayloadToTarget(params: {
  attacker: any;
  defender: any;
  tok: any | null;
  attackTotal: number;
  evadeTn: number;
  shared: SharedAoeDamagePayload;
  preDamage: any;
  /** Skip re-applying Specials when this defender already received them from the roll dialog. */
  skipSpecials?: boolean;
}): Promise<'damaged' | 'cancelled'> {
  const { attacker, defender, tok, attackTotal, evadeTn, shared, preDamage } = params;
  const combat = (game as any).combat ?? null;
  const { applyDamageToTarget, resolveForcedMovementAfterDamage } = await import(
    '../dice/damage-dialog.js'
  );
  const { applySpecialStringsToTarget } = await import('./apply-special-effects.js');
  const { runInteractiveReactionWindow } = await import('./reaction-window-chat.js');

  const skipSpecials =
    params.skipSpecials === true ||
    String(shared.specialsAppliedToTargetId || '') === String(defender.id || '');

  let limitNotes: string[] = [];
  if (!skipSpecials) {
    const statusSpecials = filterStatusSpecialLines(shared.specialsUsed);
    if (statusSpecials.length) {
      try {
        limitNotes = await applySpecialStringsToTarget(defender, statusSpecials, attacker);
      } catch (err) {
        console.warn('Mastery System | AoE shared specials failed', err);
      }
    }
  }

  const details = Array.isArray(shared.rollDetails)
    ? shared.rollDetails.map((l) => `<li>${String(l)}</li>`).join('')
    : '';
  const allLimitNotes = [
    ...(Array.isArray(shared.applicationLimitNotes) ? shared.applicationLimitNotes : []),
    ...limitNotes,
  ];
  const limitHtml = allLimitNotes.length
    ? `<p class="mastery-damage-special-limit">${allLimitNotes.join('<br>')}</p>`
    : '';
  const aoeContent =
    `<div class="mastery-system-damage"><h3><i class="fas fa-sword"></i> AoE Damage: ${shared.totalDamage}</h3>` +
    (details ? `<ul class="mastery-damage-roll-list">${details}</ul>` : '') +
    `<p><strong>Target:</strong> ${defender.name}</p>${limitHtml}<p><em>— applying…</em></p></div>`;

  const aoeRolls = Array.isArray(shared.damageChatRolls)
    ? shared.damageChatRolls
        .map((r: any) => (typeof r?.toJSON === 'function' ? r.toJSON() : r))
        .filter(Boolean)
    : undefined;

  let dmgMsg: any = null;
  try {
    dmgMsg = await ChatMessage.create({
      user: (game as any).user?.id,
      speaker: ChatMessage.getSpeaker({ actor: attacker }),
      content: aoeContent,
      rolls: aoeRolls,
      sound: aoeRolls?.length ? CONFIG.sounds.dice : undefined,
    } as any);
  } catch {
    dmgMsg = null;
  }

  let phasedOut = false;
  try {
    const { promptPhasingConsume, consumePhasingCharge } = await import('./phasing.js');
    phasedOut = await promptPhasingConsume(defender, {
      attacker,
      rawDamage: shared.totalDamage,
    });
    if (phasedOut) await consumePhasingCharge(defender);
  } catch {
    phasedOut = false;
  }

  let mitLine = '';
  if (phasedOut) {
    mitLine = `Raw ${shared.totalDamage} → Phased (ignored)`;
  } else {
    const mit = await applyDamageToTarget(
      defender,
      shared.totalDamage,
      attacker,
      shared.count8s ?? 0,
      {
        attackTotal,
        evadeTn,
        armorPenetration: shared.armorPenetration ?? 0,
        reactionMitigation: preDamage?.mitigation,
        skipPhasing: true,
        skipReactionPrompt: true,
      },
    );
    mitLine = mit?.breakdownLine || `HP lost: ${mit?.barDamage ?? '?'}`;
    if (!mit?.phased) {
      await resolveForcedMovementAfterDamage(attacker, defender, shared.specialsUsed, 'AoE');
    }
  }

  try {
    if (dmgMsg?.id) {
      await dmgMsg.update({
        content:
          `<div class="mastery-system-damage"><h3><i class="fas fa-sword"></i> AoE Damage: ${shared.totalDamage}</h3>` +
          (details ? `<ul class="mastery-damage-roll-list">${details}</ul>` : '') +
          `<p><strong>Target:</strong> ${defender.name}</p>${limitHtml}<p>${mitLine}</p></div>`,
      });
    }
  } catch {
    /* ignore */
  }

  try {
    await runInteractiveReactionWindow({
      defender,
      attacker,
      combat,
      rawDamage: Math.max(0, Math.floor(Number(shared.totalDamage) || 0)),
      attackTotal,
      evadeTn,
      hit: true,
      phase: 'others',
      eventId: preDamage?.eventId,
      spentActorIds: preDamage?.spentActorIds,
      used: preDamage?.used,
      priorMitigation: preDamage?.mitigation,
      silentIfEmpty: true,
      isAoE: true,
    });
  } catch {
    /* ignore */
  }

  void tok;
  return 'damaged';
}

/**
 * Apply full printed payload to one AoE target via the normal damage dialog
 * (used for Autofire and other per-target paths). Prefer the shared-roll batch
 * helpers for classic AoE.
 */
export async function resolveAoeFullPayloadOnTarget(params: {
  attacker: any;
  defender: any;
  tok: any | null;
  weaponId: string | null;
  flags: Record<string, any>;
  attackTotal: number;
  evadeTn: number;
  allowDiveForCover?: boolean;
  /** When set, skip the damage dialog and apply this shared roll instead. */
  sharedDamage?: SharedAoeDamagePayload | null;
}): Promise<'escaped' | 'negated' | 'damaged' | 'cancelled'> {
  const {
    attacker,
    defender,
    tok,
    weaponId,
    flags,
    attackTotal,
    evadeTn,
  } = params;

  const gate = await runAoePreDamageGate({
    attacker,
    defender,
    tok,
    attackTotal,
    evadeTn,
    allowDiveForCover: params.allowDiveForCover,
  });
  if (gate.outcome === 'escaped') return 'escaped';
  if (gate.outcome === 'negated') return 'negated';
  const preDamage = gate.preDamage;

  if (params.sharedDamage) {
    return applySharedAoePayloadToTarget({
      attacker,
      defender,
      tok,
      attackTotal,
      evadeTn,
      shared: params.sharedDamage,
      preDamage,
    });
  }

  const targetFlags: Record<string, any> = {
    ...flags,
    targetId: defender.id,
    targetTokenId: tok?.id ?? flags.targetTokenId,
    attackTotal,
    normalTn: evadeTn,
    baseEvade: evadeTn,
    targetEvade: evadeTn,
    // Not Instant AoE (Autofire etc.): flags are inherited so weapon rules stay intact.
  };

  const { showDamageDialog, applyDamageToTarget, resolveForcedMovementAfterDamage } = await import(
    '../dice/damage-dialog.js'
  );
  const { runInteractiveReactionWindow } = await import('./reaction-window-chat.js');
  const combat = (game as any).combat ?? null;

  const damageResult = await showDamageDialog(
    attacker,
    defender,
    weaponId,
    targetFlags.selectedPowerId || null,
    0,
    targetFlags,
  );
  if (!damageResult) return 'cancelled';

  const details = Array.isArray(damageResult.rollDetails)
    ? (damageResult.rollDetails as string[]).map((l) => `<li>${String(l)}</li>`).join('')
    : '';
  const limitNotes = Array.isArray((damageResult as any).applicationLimitNotes)
    ? ((damageResult as any).applicationLimitNotes as string[])
    : [];
  const limitHtml = limitNotes.length
    ? `<p class="mastery-damage-special-limit">${limitNotes.join('<br>')}</p>`
    : '';
  const aoeContent =
    `<div class="mastery-system-damage"><h3><i class="fas fa-sword"></i> AoE Damage: ${damageResult.totalDamage}</h3>` +
    (details ? `<ul class="mastery-damage-roll-list">${details}</ul>` : '') +
    `<p><strong>Target:</strong> ${defender.name}</p>${limitHtml}<p><em>— applying…</em></p></div>`;
  const aoeRolls = Array.isArray(damageResult.damageChatRolls)
    ? damageResult.damageChatRolls
        .map((r: any) => (typeof r?.toJSON === 'function' ? r.toJSON() : r))
        .filter(Boolean)
    : undefined;

  let dmgMsg: any = null;
  const prePostedId = String((damageResult as any)?.prePostedChatMessageId || '');
  if (prePostedId) {
    dmgMsg = (game as any).messages?.get?.(prePostedId) ?? null;
    if (dmgMsg) {
      try {
        await dmgMsg.update({
          content: aoeContent,
          ...(aoeRolls?.length ? { rolls: aoeRolls, sound: CONFIG.sounds.dice } : {}),
        });
      } catch {
        dmgMsg = null;
      }
    }
  }
  if (!dmgMsg) {
    dmgMsg = await ChatMessage.create({
      user: (game as any).user?.id,
      speaker: ChatMessage.getSpeaker({ actor: attacker }),
      content: aoeContent,
      rolls: aoeRolls,
      sound: CONFIG.sounds.dice,
    } as any);
  }

  if (damageResult.pendingApply) {
    let phasedOut = false;
    try {
      const { promptPhasingConsume, consumePhasingCharge } = await import('./phasing.js');
      phasedOut = await promptPhasingConsume(defender, {
        attacker,
        rawDamage: damageResult.totalDamage,
      });
      if (phasedOut) await consumePhasingCharge(defender);
    } catch {
      phasedOut = false;
    }

    let mitLine = '';
    if (phasedOut) {
      mitLine = `Raw ${damageResult.totalDamage} → Phased (ignored)`;
    } else {
      const mit = await applyDamageToTarget(
        defender,
        damageResult.totalDamage,
        attacker,
        damageResult.count8s ?? 0,
        {
          attackTotal,
          evadeTn,
          reactionMitigation: preDamage.mitigation,
          skipPhasing: true,
          skipReactionPrompt: true,
          armorPenetration: Math.max(
            0,
            Math.floor(Number(damageResult.attackContext?.armorPenetration) || 0),
          ),
        },
      );
      mitLine = mit?.breakdownLine || `HP lost: ${mit?.barDamage ?? '?'}`;
      if (!mit?.phased) {
        await resolveForcedMovementAfterDamage(
          attacker,
          defender,
          damageResult.specialsUsed,
          'AoE',
        );
      }
    }

    try {
      if (dmgMsg?.id) {
        await dmgMsg.update({
          content:
            `<div class="mastery-system-damage"><h3><i class="fas fa-sword"></i> AoE Damage: ${damageResult.totalDamage}</h3>` +
            (details ? `<ul class="mastery-damage-roll-list">${details}</ul>` : '') +
            `<p><strong>Target:</strong> ${defender.name}</p>${limitHtml}<p>${mitLine}</p></div>`,
        });
      }
    } catch {
      /* ignore */
    }
  }

  try {
    await runInteractiveReactionWindow({
      defender,
      attacker,
      combat,
      rawDamage: Math.max(0, Math.floor(Number(damageResult?.totalDamage) || 0)),
      attackTotal,
      evadeTn,
      hit: true,
      phase: 'others',
      eventId: preDamage.eventId,
      spentActorIds: preDamage.spentActorIds,
      used: preDamage.used,
      priorMitigation: preDamage.mitigation,
      silentIfEmpty: true,
      isAoE: true,
    });
  } catch {
    /* ignore */
  }

  return 'damaged';
}

type AoePendingTarget = {
  defender: any;
  tok: any | null;
  evadeTn: number;
  flags: Record<string, any>;
  preDamage: any;
};

/**
 * After the shared AoE attack roll: resolve every secondary token with its own
 * Evade / Final Spell TN check and Dive for Cover, then apply **one** shared
 * damage roll to every remaining hit (never re-roll per creature).
 *
 * `powerBonusDice` is ignored for damage (full payload). Kept for call-site
 * compatibility. There is no primary: every token in `secondaryTokenIds` is an
 * equal participant (the name is historical — prefer `resolveAoeFromSharedRoll`).
 */
export async function resolveAoeMeleeSecondaries(params: {
  attacker: any;
  attackerMasteryRank: number;
  secondaryTokenIds: string[];
  powerBonusDice: number;
  /** True when the AoE power is a spell (Final Spell TN per creature). */
  isSpell?: boolean;
  attackTotal?: number | null;
  /** @deprecated Anchor TN — each creature uses its own defense now. */
  evadeTn?: number | null;
  /** Flags from the attack card (power id, raises, weapon, snapshot…). */
  flags?: Record<string, any> | null;
  weaponId?: string | null;
  declaredRaiseSlots?: number;
  /** Spell Base TN without SR. */
  spellBaseTn?: number | null;
  /**
   * Damage already rolled for this AoE (optional). When set, every hit reuses
   * it — no damage dialog. When null (default), one dialog rolls the Power damage
   * once for the whole set of hits.
   */
  sharedDamage?: SharedAoeDamagePayload | null;
}): Promise<void> {
  const { attacker, secondaryTokenIds } = params;
  const isSpell = params.isSpell === true;
  const attackTotal = Math.floor(Number(params.attackTotal) || 0);
  const raiseSlots = Math.max(0, Math.floor(Number(params.declaredRaiseSlots) || 0));
  const flags = { ...(params.flags || {}) };
  const weaponId = params.weaponId ?? flags.weaponId ?? null;

  if (!secondaryTokenIds.length) return;

  const pending: AoePendingTarget[] = [];

  for (const tid of secondaryTokenIds) {
    const resolved = resolveBurstTarget(tid);
    if (!resolved?.defender) {
      console.warn('Mastery System | AoE secondary: could not resolve token to actor', {
        tokenId: tid,
        sceneId: (canvas as any)?.scene?.id,
      });
      continue;
    }
    const { defender, tok } = resolved;

    if (typeof defender.prepareDerivedData === 'function') {
      try {
        defender.prepareDerivedData();
      } catch {
        /* ignore */
      }
    }

    const normalTn = aoeCreatureNormalTn({
      defender,
      isSpell,
      spellBaseTn: params.spellBaseTn ?? flags.spellBaseTn ?? null,
      caster: attacker,
      willing: flags.willingSpellTarget === true,
    });
    const { hit, finalTn } = aoeCreatureHitCheck({
      attackTotal,
      normalTn,
      declaredRaiseSlots: raiseSlots,
    });

    if (!hit) {
      await ChatMessage.create({
        user: (game as any).user?.id,
        speaker: ChatMessage.getSpeaker({ actor: attacker }),
        content: `<p><strong>AoE</strong> → <strong>${defender.name}</strong>: miss (roll ${attackTotal} vs Final TN ${finalTn}${
          raiseSlots > 0 ? ` = ${normalTn} + ${raiseSlots}×${RAISE_INCREMENT}` : ''
        }).</p>`,
      } as any);
      if (!isSpell) {
        try {
          const { maybeOfferSlip } = await import('../stones/agility-movement-ui.js');
          await maybeOfferSlip({
            defender,
            attacker,
            hit: false,
            isAttack: true,
          });
        } catch (slipErr) {
          console.warn('Mastery System | Slip offer failed', slipErr);
        }
      }
      continue;
    }

    const paidSlots = Math.max(0, Math.floor(Number(raiseSlots) || 0));
    const freeSlots = Math.max(0, Math.floor(Number(flags.freeRaiseSlots) || 0));
    const creatureFlags = {
      ...flags,
      raiseOutcome: 'full' as const,
      normalTn,
      raiseTn: finalTn,
      declaredRaiseSlots: paidSlots,
      freeRaiseSlots: freeSlots,
      successfulRaiseSlots: paidSlots + freeSlots,
      declaredRaises: Array.isArray(flags.declaredRaises) ? flags.declaredRaises : [],
      stoneBonusRaises: 0,
    };

    const gate = await runAoePreDamageGate({
      attacker,
      defender,
      tok,
      attackTotal,
      evadeTn: finalTn,
      allowDiveForCover: true,
    });
    if (gate.outcome !== 'ready') continue;

    pending.push({
      defender,
      tok,
      evadeTn: finalTn,
      flags: creatureFlags,
      preDamage: gate.preDamage,
    });
  }

  if (!pending.length) return;

  let shared = params.sharedDamage ?? null;
  let rollerId: string | null = null;

  // Open one damage dialog (against the first remaining hit, purely as the roll
  // surface) to roll the Power damage / Specials once, then share that payload
  // with every other hit. The roller is not a "primary" — same raw total for all.
  if (!shared) {
    const roller = pending[0]!;
    const targetFlags: Record<string, any> = {
      ...roller.flags,
      targetId: roller.defender.id,
      targetTokenId: roller.tok?.id ?? roller.flags.targetTokenId,
      attackTotal,
      normalTn: roller.evadeTn,
      baseEvade: roller.evadeTn,
      targetEvade: roller.evadeTn,
    };
    const { showDamageDialog, applyDamageToTarget, resolveForcedMovementAfterDamage } = await import(
      '../dice/damage-dialog.js'
    );
    const damageResult = await showDamageDialog(
      attacker,
      roller.defender,
      weaponId,
      targetFlags.selectedPowerId || null,
      0,
      targetFlags,
    );
    if (!damageResult || damageResult.mitigation?.phased) return;

    shared = toSharedAoeDamagePayload(damageResult);
    if (!shared) return;
    shared.specialsAppliedToTargetId = String(roller.defender.id || '');
    rollerId = String(roller.defender.id || '');

    // Apply HP to the roller (Specials already applied inside the dialog).
    let rollerMitLine = 'Applied (shared AoE roll).';
    if (damageResult.pendingApply) {
      let phasedOut = false;
      try {
        const { promptPhasingConsume, consumePhasingCharge } = await import('./phasing.js');
        phasedOut = await promptPhasingConsume(roller.defender, {
          attacker,
          rawDamage: damageResult.totalDamage,
        });
        if (phasedOut) await consumePhasingCharge(roller.defender);
      } catch {
        phasedOut = false;
      }
      if (phasedOut) {
        rollerMitLine = `Raw ${damageResult.totalDamage} → Phased (ignored)`;
      } else {
        const mit = await applyDamageToTarget(
          roller.defender,
          damageResult.totalDamage,
          attacker,
          damageResult.count8s ?? 0,
          {
            attackTotal,
            evadeTn: roller.evadeTn,
            armorPenetration: Math.max(
              0,
              Math.floor(Number(damageResult.attackContext?.armorPenetration) || 0),
            ),
            reactionMitigation: roller.preDamage?.mitigation,
            skipPhasing: true,
            skipReactionPrompt: true,
          },
        );
        rollerMitLine = mit?.breakdownLine || rollerMitLine;
        if (!mit?.phased) {
          await resolveForcedMovementAfterDamage(
            attacker,
            roller.defender,
            damageResult.specialsUsed,
            'AoE',
          );
        }
      }
    }
    try {
      const details = Array.isArray(damageResult.rollDetails)
        ? damageResult.rollDetails.map((l) => `<li>${String(l)}</li>`).join('')
        : '';
      await ChatMessage.create({
        user: (game as any).user?.id,
        speaker: ChatMessage.getSpeaker({ actor: attacker }),
        content:
          `<div class="mastery-system-damage"><h3><i class="fas fa-sword"></i> AoE Damage: ${damageResult.totalDamage}</h3>` +
          (details ? `<ul class="mastery-damage-roll-list">${details}</ul>` : '') +
          `<p><strong>Target:</strong> ${roller.defender.name}</p>` +
          `<p>${rollerMitLine}</p></div>`,
        rolls: Array.isArray(damageResult.damageChatRolls)
          ? damageResult.damageChatRolls
              .map((r: any) => (typeof r?.toJSON === 'function' ? r.toJSON() : r))
              .filter(Boolean)
          : undefined,
        sound: CONFIG.sounds.dice,
      } as any);
    } catch {
      /* ignore */
    }
  }

  const rest = rollerId
    ? pending.filter((p) => String(p.defender.id || '') !== rollerId)
    : pending;
  if (!rest.length || !shared) return;

  const ok = await confirmSharedAoeDamageApply({
    totalDamage: shared.totalDamage,
    specialsUsed: shared.specialsUsed,
    targetNames: rest.map((p) => String(p.defender.name || 'Target')),
  });
  if (!ok) return;

  for (const p of rest) {
    await applySharedAoePayloadToTarget({
      attacker,
      defender: p.defender,
      tok: p.tok,
      attackTotal,
      evadeTn: p.evadeTn,
      shared,
      preDamage: p.preDamage,
    });
  }
}

/**
 * Resolve an entire Instant AoE from ONE shared Attack/Casting roll. No Primary
 * Target: every token gets its own hit check, Dive for Cover and the same shared
 * Power damage roll + full printed Special. Default entry point for all Instant AoE.
 */
export async function resolveAoeFromSharedRoll(params: {
  attacker: any;
  tokenIds: string[];
  attackTotal: number;
  declaredRaiseSlots?: number;
  isSpell?: boolean;
  spellBaseTn?: number | null;
  flags?: Record<string, any> | null;
  weaponId?: string | null;
}): Promise<void> {
  await resolveAoeMeleeSecondaries({
    attacker: params.attacker,
    attackerMasteryRank: 1,
    secondaryTokenIds: params.tokenIds,
    powerBonusDice: 0,
    isSpell: params.isSpell,
    attackTotal: params.attackTotal,
    flags: params.flags,
    weaponId: params.weaponId,
    declaredRaiseSlots: params.declaredRaiseSlots,
    spellBaseTn: params.spellBaseTn,
  });
}
