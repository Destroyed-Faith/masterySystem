/**
 * Melee weapon AoE — secondary target resolution.
 *
 * Since the Area-TN rework the AoE roll hits every target in the area with a
 * single roll. Secondaries may spend their Reaction on **Dive for Cover**
 * (move up to 2 × own Mastery Rank meters; fully outside the area = not
 * affected). Targets that stay take the power splash dice, plus Hex/Sundered
 * vulnerability dice depending on whether the power was a spell.
 */

import {
  getActionEconomyActor,
  getRoundState,
  spendReactionAction,
} from './action-economy.js';
import { countNaturalEights } from './damage-mitigation.js';

/** Resolve a burst token id to a canvas actor (handles scene / placeable quirks). */
function resolveBurstTarget(tid: string): { defender: any; tok: any } | null {
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
 * @deprecated Legacy Body-save DC (pre Area-TN rules). Kept for old callers.
 */
export function aoeSecondaryBodySaveDc(masteryRank: number): number {
  const r = Math.max(1, Math.min(6, Math.floor(Number(masteryRank) || 1)));
  return r * 8;
}

/** Dive-for-Cover movement allowance of the diving creature (2 × own MR). */
export function diveForCoverDistanceM(actor: any): number {
  const mr = Math.max(1, Math.min(8, Math.floor(Number(actor?.system?.mastery?.rank) || 1)));
  return mr * 2;
}

/**
 * Offer Dive for Cover to a creature inside a successful AoE (primary or
 * secondary target alike). Spends the Reaction, lets the table move the
 * token, and asks whether it ended up fully outside the area.
 *
 * @returns true when the creature escaped (→ not affected by the AoE).
 */
export async function promptDiveForCoverEscape(defender: any, tok: any | null): Promise<boolean> {
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

  const outside = await confirmSpendReaction(
    `Dive for Cover — ${defender.name}`,
    `<p>Move the token up to <strong>${moveM} m</strong> now.</p>` +
      `<p>Is <strong>${defender.name}</strong> completely <strong>outside</strong> the AoE after the move?</p>`,
  );
  await ChatMessage.create({
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor: defender, token: tok?.document }),
    content: `<p><strong>${defender.name}</strong> — Dive for Cover (${moveM} m): ${
      outside
        ? '<strong>outside the area</strong> — not affected.'
        : '<strong>still inside</strong> — affected normally.'
    }</p>`,
  } as any);
  return outside;
}

/**
 * After the AoE roll reached the Area TN and primary damage is resolved:
 * every secondary is hit. Before the payload lands, each may spend a Reaction
 * on Dive for Cover (move up to 2 × own MR meters; fully outside = not
 * affected). Targets that stay take the splash dice + Hex/Sundered dice.
 */
export async function resolveAoeMeleeSecondaries(params: {
  attacker: any;
  attackerMasteryRank: number;
  secondaryTokenIds: string[];
  powerBonusDice: number;
  /** True when the AoE power is a spell (Hex applies); otherwise Sundered. */
  isSpell?: boolean;
  attackTotal?: number | null;
  evadeTn?: number | null;
}): Promise<void> {
  const { attacker, secondaryTokenIds, powerBonusDice } = params;
  const isSpell = params.isSpell === true;
  if (!secondaryTokenIds.length || powerBonusDice <= 0) return;

  const { getActiveSpecialValue } = await import('../system/active-specials.js');

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

    // ── Dive for Cover (Reaction) ────────────────────────────────────────
    const escaped = await promptDiveForCoverEscape(defender, tok);
    if (escaped) continue;

    if (typeof defender.prepareDerivedData === 'function') {
      try {
        defender.prepareDerivedData();
      } catch {
        /* ignore */
      }
    }

    // Phase 1 — secondary target reacts before splash damage is rolled.
    const combat = (game as any).combat ?? null;
    const { runInteractiveReactionWindow } = await import('./reaction-window-chat.js');
    const phase1 = await runInteractiveReactionWindow({
      defender,
      attacker,
      combat,
      rawDamage: 0,
      attackTotal: params.attackTotal ?? null,
      evadeTn: params.evadeTn ?? null,
      hit: true,
      phase: 'defender',
    });

    if (phase1.mitigation?.negatedByEvade) {
      await ChatMessage.create({
        user: (game as any).user?.id,
        speaker: ChatMessage.getSpeaker({ actor: defender, token: tok?.document }),
        content: `<p><strong>AoE secondary</strong> → <strong>${defender.name}</strong>: hit <strong>negated</strong> by Evade. No damage.</p>`,
      } as any);
      continue;
    }

    // ── Hex / Sundered vulnerability (+1d8 per 2 points, rounded up) ─────
    const vulnId = isSpell ? 'hex' : 'sundered';
    const vulnValue = Math.max(0, getActiveSpecialValue(defender, vulnId));
    const vulnDice = vulnValue > 0 ? Math.ceil(vulnValue / 2) : 0;
    const totalDice = powerBonusDice + vulnDice;

    const spec = `${totalDice}d8x`;
    let total = 0;
    let r: any = null;
    try {
      const RollCls = (globalThis as any).Roll;
      if (RollCls?.create) {
        r = await RollCls.create(spec).evaluate({ async: true });
        total = Math.max(0, Math.floor(Number(r?.total) || 0));
      }
    } catch (err) {
      console.warn('Mastery System | AoE secondary damage roll failed', spec, err);
    }
    const rollsArr = r ? [r] : [];
    const c8 = countNaturalEights(rollsArr);

    const vulnNote = vulnDice > 0
      ? ` + ${vulnDice}d8 ${isSpell ? 'Hex' : 'Sundered'}(${vulnValue})`
      : '';

    // Post damage roll, then apply HP with Phase-1 mitigation, then ally phase.
    const dmgMsg = await ChatMessage.create({
      user: (game as any).user?.id,
      speaker: ChatMessage.getSpeaker({ actor: attacker }),
      content: `<p><strong>AoE secondary</strong> → <strong>${defender.name}</strong>: ${total} (${powerBonusDice}d8 power${vulnNote}) <em>— applying…</em></p>`,
    } as any);

    let phasedOut = false;
    try {
      const { promptPhasingConsume, consumePhasingCharge } = await import('./phasing.js');
      phasedOut = await promptPhasingConsume(defender, { attacker, rawDamage: total });
      if (phasedOut) await consumePhasingCharge(defender);
    } catch {
      phasedOut = false;
    }

    let mitLine = '';
    if (phasedOut) {
      mitLine = `<p>Raw ${total} → Phased (ignored)</p>`;
    } else {
      const { applyDamageToTargetFromAoe } = await import('../dice/damage-dialog.js');
      const mit = await applyDamageToTargetFromAoe(defender, total, attacker, c8, {
        attackTotal: params.attackTotal ?? null,
        evadeTn: params.evadeTn ?? null,
        reactionMitigation: phase1.mitigation,
        skipReactionPrompt: true,
        skipPhasing: true,
      });
      mitLine = mit?.breakdownLine ? `<p>${mit.breakdownLine}</p>` : '';

      try {
        await runInteractiveReactionWindow({
          defender,
          attacker,
          combat,
          rawDamage: total,
          attackTotal: params.attackTotal ?? null,
          evadeTn: params.evadeTn ?? null,
          hit: true,
          damageMessageId: dmgMsg?.id ?? null,
          phase: 'others',
          eventId: phase1.eventId,
          spentActorIds: phase1.spentActorIds,
          used: phase1.used,
          priorMitigation: phase1.mitigation,
          silentIfEmpty: true,
        });
      } catch (allyErr) {
        console.warn('Mastery System | AoE secondary ally reaction window failed', allyErr);
      }
    }

    try {
      if (dmgMsg?.id) {
        await dmgMsg.update({
          content: `<p><strong>AoE secondary</strong> → <strong>${defender.name}</strong>: ${total} (${powerBonusDice}d8 power${vulnNote}) ${mitLine}</p>`,
        });
      }
    } catch {
      /* ignore */
    }
  }
}
