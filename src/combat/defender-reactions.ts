/**
 * Defender reactions — prompted when incoming damage is applied (after Phasing).
 * Spends `RoundState.reactionActions`, marks `usedPowerIdsThisRound`, and applies
 * one-hit armor / reaction DR from power `mechanics` where present.
 *
 * Ghost Slip–style powers (`phasing.reactionSingleHit`) are omitted here: they
 * interact with the phasing step, not post-phasing mitigation.
 */

import {
  getActionEconomyActor,
  getAvailableReactionActions,
  getReactionActionsSummary,
  hasPowerBeenUsedThisRound,
  markPowerUsedThisRound,
  spendReactionAction,
} from './action-economy.js';
import { resolvePowerMechanics } from '../utils/power-mechanics.js';

export interface DefenderReactionMitigation {
  /** Extra flat armor for this damage instance only. */
  reactionArmorFlat: number;
  /** Extra DR% for this hit (stacked in mitigation with base DR). */
  reactionDrPct: number;
  /** Power display name if one was used. */
  powerName?: string;
}

function defenderActorForEconomy(defender: Actor): Actor {
  return (getActionEconomyActor(defender) ?? defender) as Actor;
}

function userMayPromptForActor(actor: any): boolean {
  const u = (globalThis as any).game?.user;
  if (!u) return false;
  if (u.isGM) return true;
  return !!actor?.isOwner;
}

async function postReactionChat(content: string, defender: any): Promise<void> {
  try {
    await (globalThis as any).ChatMessage?.create?.({
      user: (globalThis as any).game?.user?.id,
      speaker: (globalThis as any).ChatMessage?.getSpeaker?.({ actor: defender }),
      content: `<p class="mastery-reaction-msg">${content}</p>`,
    });
  } catch (e) {
    console.warn('Mastery System | defender-reactions chat failed', e);
  }
}

/**
 * Reaction-type power items the defender can still use this round (equipped, not used).
 */
export function getEligibleReactionPowers(defender: Actor, combat: Combat | null): any[] {
  if (!defender || !combat) return [];
  const owner = defenderActorForEconomy(defender) as Actor;
  const items = (owner as any).items;
  if (!items) return [];
  const out: any[] = [];
  for (const item of items) {
    if (item.type !== 'power') continue;
    const sys = item.system as any;
    if (sys?.powerType !== 'reaction') continue;
    if (sys?.equipped === false) continue;
    if (sys?.showInRadialMenu === false) continue;
    if (hasPowerBeenUsedThisRound(owner as Actor, combat, item.id)) continue;
    const mech = resolvePowerMechanics(item);
    if (mech?.phasing?.reactionSingleHit) continue;
    out.push(item);
  }
  return out;
}

function extractMitigationFromMechanics(mech: ReturnType<typeof resolvePowerMechanics>): DefenderReactionMitigation {
  if (!mech) return { reactionArmorFlat: 0, reactionDrPct: 0 };
  const reactionArmorFlat = Math.max(0, Math.floor(Number(mech.armor) || 0));
  const reactionDrPct = Math.max(0, Math.min(100, Math.floor(Number(mech.damageReductionPct) || 0)));
  return { reactionArmorFlat, reactionDrPct };
}

/**
 * After phasing: offer reaction spend + power selection for this hit.
 * No-op when user cannot prompt for defender, no reactions left, or no eligible powers.
 */
export async function promptDefenderReactionsBeforeMitigation(params: {
  defender: Actor;
  attacker: Actor;
  combat: Combat | null;
  rawDamage: number;
}): Promise<DefenderReactionMitigation> {
  const empty: DefenderReactionMitigation = { reactionArmorFlat: 0, reactionDrPct: 0 };
  const { defender, attacker, combat, rawDamage } = params;
  if (!defender || !combat) return empty;

  const economyDef = defenderActorForEconomy(defender);
  if (!userMayPromptForActor(economyDef)) return empty;

  const summary = getReactionActionsSummary(economyDef, combat);
  const defName = String((defender as any).name ?? 'Defender');

  if (summary.remaining <= 0) {
    await postReactionChat(
      `<strong>${defName}</strong> has <strong>no Reactions</strong> left this round (${summary.used}/${summary.total} used).`,
      defender,
    );
    return empty;
  }

  const powers = getEligibleReactionPowers(economyDef, combat);
  if (!powers.length) {
    await postReactionChat(
      `<strong>${defName}</strong> has <strong>${summary.remaining}</strong> Reaction(s) left but <strong>no eligible reaction powers</strong> (equipped, not yet used this round).`,
      defender,
    );
    return empty;
  }

  const Dialog: any = (globalThis as any).Dialog;
  if (!Dialog) return empty;

  const chosen: { item: any } | { item: null } = await new Promise((resolve) => {
    const buttons: Record<string, { label: string; callback: () => void }> = {
      decline: {
        label: (globalThis as any).game?.i18n?.localize?.('MASTERY.reactionDecline') ?? 'No reaction',
        callback: () => resolve({ item: null }),
      },
    };
    for (const item of powers) {
      const id = `react_${item.id}`;
      buttons[id] = {
        label: String(item.name ?? 'Reaction').slice(0, 48),
        callback: () => resolve({ item }),
      };
    }
    const attackerName = (attacker as any)?.name ?? 'Attacker';
    try {
      new Dialog({
        title:
          (globalThis as any).game?.i18n?.localize?.('MASTERY.reactionDialogTitle') ??
          `Reaction — ${defName}`,
        content: `<p><strong>${attackerName}</strong> deals <strong>${rawDamage}</strong> raw damage (after phasing checks).</p>
            <p>Spend <strong>1 Reaction</strong> (${summary.remaining}/${summary.total} left) and pick a power, or decline.</p>`,
        buttons,
        default: 'decline',
        close: () => resolve({ item: null }),
      } as any).render(true);
    } catch {
      resolve({ item: null });
    }
  });

  if (!chosen.item) return empty;

  const spent = await spendReactionAction(economyDef, combat);
  if (!spent) return empty;

  await markPowerUsedThisRound(economyDef, combat, chosen.item.id);

  const mech = resolvePowerMechanics(chosen.item);
  const mit = extractMitigationFromMechanics(mech);
  const ev = Math.max(0, Math.floor(Number(mech?.evade) || 0));

  let note = '';
  if (mit.reactionArmorFlat > 0) note += ` +${mit.reactionArmorFlat} Armor (this hit)`;
  if (mit.reactionDrPct > 0) note += ` +${mit.reactionDrPct}% DR (this hit)`;
  if (ev > 0) {
    note += ` <em>(+${ev} Evade is not applied retroactively after the hit — track manually if needed.)</em>`;
  }
  if (mech?.tempHP) {
    note += ` <em>(Temp HP from this reaction: apply manually or extend pipeline — declared: ${mech.tempHP})</em>`;
  }

  await postReactionChat(
    `<strong>${defName}</strong> uses <strong>${chosen.item.name}</strong> (1 Reaction spent).${note || ' (No numeric mitigation on this power.)'}`,
    defender,
  );

  return {
    reactionArmorFlat: mit.reactionArmorFlat,
    reactionDrPct: mit.reactionDrPct,
    powerName: chosen.item.name,
  };
}
