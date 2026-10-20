/**
 * Martial / Spell AoE resolution — per-creature Evade (or Final Spell TN) checks
 * with full printed payload on every remaining hit.
 *
 * One shared Attack/Spell Roll is compared separately against each creature.
 * A miss against one creature does not protect any other. Creatures that would
 * be hit may use Dive for Cover before payload. Secondaries receive the same
 * full payload as the primary (weapon + power damage + specials), not splash-only.
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
 * Apply full printed payload to one AoE target via the normal damage dialog.
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
    return 'escaped';
  }

  if (preDamage.mitigation?.negatedByEvade || preDamage.mitigation?.phasedByReaction) {
    await ChatMessage.create({
      user: (game as any).user?.id,
      speaker: ChatMessage.getSpeaker({ actor: defender, token: tok?.document }),
      content: `<p><strong>AoE</strong> → <strong>${defender.name}</strong>: hit <strong>negated</strong> by reaction. No damage.</p>`,
    } as any);
    return 'negated';
  }

  const targetFlags: Record<string, any> = {
    ...flags,
    targetId: defender.id,
    targetTokenId: tok?.id ?? flags.targetTokenId,
    attackTotal,
    normalTn: evadeTn,
    baseEvade: evadeTn,
    targetEvade: evadeTn,
    aoeMeleeWeapon: true,
  };

  const { showDamageDialog, applyDamageToTarget, resolveForcedMovementAfterDamage } = await import(
    '../dice/damage-dialog.js'
  );
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

/**
 * After the shared AoE roll: resolve every secondary token with its own Evade /
 * Final Spell TN check, Dive for Cover, and full payload.
 *
 * `powerBonusDice` is ignored for damage (full payload via damage dialog).
 * Kept in the signature for call-site compatibility.
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
}): Promise<void> {
  const { attacker, secondaryTokenIds } = params;
  const isSpell = params.isSpell === true;
  const attackTotal = Math.floor(Number(params.attackTotal) || 0);
  const raiseSlots = Math.max(0, Math.floor(Number(params.declaredRaiseSlots) || 0));
  const flags = { ...(params.flags || {}) };
  const weaponId = params.weaponId ?? flags.weaponId ?? null;

  if (!secondaryTokenIds.length) return;

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

    await resolveAoeFullPayloadOnTarget({
      attacker,
      defender,
      tok,
      weaponId,
      flags: creatureFlags,
      attackTotal,
      evadeTn: finalTn,
      allowDiveForCover: true,
    });
  }
}

/**
 * Resolve an entire AoE from a shared roll with no attack-card primary path
 * (e.g. melee AoE with "no primary" / all secondaries).
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
