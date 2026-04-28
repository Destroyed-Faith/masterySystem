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
import { buildActorMechanicsBreakdown, resolvePowerMechanics } from '../utils/power-mechanics.js';

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

  const i18n = (globalThis as any).game?.i18n;
  const loc = (k: string, fb: string) => {
    const s = i18n?.localize?.(k);
    return s && !String(s).startsWith('MASTERY.') ? String(s) : fb;
  };
  const chosen: { item: any } | { item: null } = await new Promise((resolve) => {
    const attackerName = (attacker as any)?.name ?? 'Attacker';
    const titleRaw = loc('MASTERY.reactionDialogTitle', 'Reaction — {defender}');
    const dialogTitle = titleRaw.replace(/\{defender\}/g, defName);
    const bodyIntro = `<p><strong>${attackerName}</strong> deals <strong>${rawDamage}</strong> raw damage (after phasing checks).</p>
            <p>Spend <strong>1 Reaction</strong> (${summary.remaining}/${summary.total} left) and pick a power, or decline.</p>`;

    if (powers.length >= 2) {
      const optionsHtml = powers
        .map((item) => {
          const pnm = String(item.name ?? 'Reaction').trim();
          const label = pnm.length > 80 ? `${pnm.slice(0, 77)}…` : pnm;
          return `<option value="${(item as any).id}">${label}</option>`;
        })
        .join('');
      try {
        new Dialog({
          title: dialogTitle,
          content: `${bodyIntro}
            <label for="ms-reaction-pick" style="display:block; margin-top:0.5em; font-size:0.9em; opacity:0.9">Reaction power</label>
            <select id="ms-reaction-pick" class="ms-reaction-pick" style="width:100%; margin-top:0.25em; margin-bottom:0.5em;">${optionsHtml}</select>`,
          buttons: {
            apply: {
              label: loc('MASTERY.reactionUse', 'Use reaction'),
              callback: (html: JQuery) => {
                const id = String(html.find('#ms-reaction-pick').val() || '');
                const item = powers.find((p) => (p as any).id === id) ?? null;
                resolve({ item });
              },
            },
            decline: {
              label: loc('MASTERY.reactionDecline', 'Decline (no reaction)'),
              callback: () => resolve({ item: null }),
            },
          },
          default: 'apply',
          close: () => resolve({ item: null }),
        } as any).render(true);
      } catch {
        resolve({ item: null });
      }
      return;
    }

    // 1 power: one named button + Decline
    const buttons: Record<string, { label: string; callback: () => void }> = {};
    for (const item of powers) {
      const id = `react_${(item as any).id}`;
      const pnm = String(item.name ?? 'Reaction').trim();
      buttons[id] = {
        label: pnm.length > 48 ? `${pnm.slice(0, 45)}…` : pnm,
        callback: () => resolve({ item }),
      };
    }
    buttons.decline = {
      label: loc('MASTERY.reactionDecline', 'Decline (no reaction)'),
      callback: () => resolve({ item: null }),
    };
    try {
      new Dialog({
        title: dialogTitle,
        content: bodyIntro,
        buttons,
        default: powers.length ? `react_${(powers[0] as any).id}` : 'decline',
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
  let mit = extractMitigationFromMechanics(mech);
  const ev = Math.max(0, Math.floor(Number(mech?.evade) || 0));

  // Reaction DR% only applies when this defender already has continuous DR% on
  // the sheet. Use the same actor document that receives damage (token / linked
  // actor), not only `economyDef`: for unlinked PCs `getActionEconomyActor`
  // points at the world actor while passives and `prepareDerivedData` live on
  // the token actor — gating on the prototype wrongly saw 0% and stripped reaction DR.
  let reactionDrBlocked = false;
  if (mit.reactionDrPct > 0) {
    const drSubject = defender as any;
    if (typeof drSubject.prepareDerivedData === 'function') {
      try {
        drSubject.prepareDerivedData();
      } catch {
        /* ignore */
      }
    }
    const bd = buildActorMechanicsBreakdown(drSubject);
    const passiveBase = bd.damageReductionPct.passive.reduce((s, r) => s + (r.value || 0), 0);
    const sheetDr = Math.max(0, Math.floor(Number(drSubject.system?.combat?.damageReductionPct) || 0));
    const totalFromBreakdown = Math.max(0, Math.floor(Number(bd.totals?.damageReductionPct) || 0));
    if (passiveBase <= 0 && sheetDr <= 0 && totalFromBreakdown <= 0) {
      mit = { ...mit, reactionDrPct: 0 };
      reactionDrBlocked = true;
    }
  }

  let note = '';
  if (mit.reactionArmorFlat > 0) note += ` +${mit.reactionArmorFlat} Armor (this hit)`;
  if (mit.reactionDrPct > 0) note += ` +${mit.reactionDrPct}% DR (this hit)`;
  if (reactionDrBlocked) {
    note +=
      ' <em>(Reaction DR% needs slotted <strong>Damage Reduction</strong> DR% and/or a sustained DR% on the character sheet.)</em>';
  }
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
