/**
 * Foundry presentation for the post-commit Stone resolution queue.
 * Healing and Stress Healing open a target dialog. Other interactive powers
 * keep the apply they already had.
 */

import { distanceBetweenActorsMeters } from '../combat/reaction-eligibility.js';
import { STONE_POWERS, resolveStonePowerId } from './stone-powers.js';
import { listSelectablePlayerActors } from './ally-stone-target.js';
import {
  healingRankProfile,
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

function actorById(id: string, source: any): any | null {
  if (String(source?.id || '') === id) return source;
  const g = globalThis as any;
  const fromCombat = g.game?.combat?.combatants?.find?.(
    (combatant: any) => String(combatant?.actor?.id || combatant?.actorId || '') === id,
  )?.actor;
  if (fromCombat) return fromCombat;
  return g.game?.actors?.get?.(id) ?? null;
}

export function stoneTargetCandidates(source: any): StoneTargetCandidate[] {
  const sourceId = String(source?.id || '').trim();
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
    const distanceM = actor ? distanceBetweenActorsMeters(source, actor) : null;
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

export async function postStonePowerChat(content: string): Promise<void> {
  const ChatMessage = (globalThis as any).ChatMessage;
  if (typeof ChatMessage?.create !== 'function') return;
  await ChatMessage.create({ content });
}

function healthSnapshot(actor: any): HealthSnapshot | null {
  const health = actor?.system?.health;
  if (!Array.isArray(health?.bars) || !health.bars.length) return null;
  return {
    bars: health.bars.map((bar: HealthSnapshot['bars'][number]) => ({ ...bar })),
    currentBar: Math.floor(Number(health.currentBar) || 0),
  };
}

function stressSnapshot(actor: any): HealthSnapshot | null {
  const stress = actor?.system?.stress;
  if (!Array.isArray(stress?.bars) || !stress.bars.length) return null;
  return {
    bars: stress.bars.map((bar: HealthSnapshot['bars'][number]) => ({ ...bar })),
    currentBar: Math.floor(Number(stress.currentBar) || 0),
  };
}

async function presentHealing(source: any, tier: number): Promise<boolean> {
  const profile = healingRankProfile(tier);
  const candidates = stoneTargetCandidates(source);
  const result = await resolveHealingSelection({
    sourceName: String(source?.name || 'Someone'),
    tier,
    candidates,
    choose: (legal) =>
      promptStoneTarget({
        title: 'Healing',
        hint: `Choose yourself or one ally within ${profile.rangeM} m. Healing rolls ${profile.dice}d8 into the current Health Bar.`,
        legal,
      }),
    roll: rollPool,
    healthOf: (targetId) => healthSnapshot(actorById(targetId, source)),
    writeHealth: async (targetId, health) => {
      const target = actorById(targetId, source);
      await target?.update?.({
        'system.health.bars': health.bars,
        'system.health.currentBar': health.currentBar,
      });
    },
    chat: postStonePowerChat,
  });
  return result.ok;
}

async function presentStressHealing(source: any, tier: number): Promise<boolean> {
  const profile = stressHealingRankProfile(tier);
  const candidates = stoneTargetCandidates(source);
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
    stressOf: (targetId) => stressSnapshot(actorById(targetId, source)),
    writeStress: async (targetId, stress) => {
      const target = actorById(targetId, source);
      await target?.update?.({
        'system.stress.bars': stress.bars,
        'system.stress.currentBar': stress.currentBar,
      });
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
  if (powerId === 'resolve.healing') return presentHealing(actor, ticket.tier);
  if (powerId === 'resolve.stressHealing') return presentStressHealing(actor, ticket.tier);
  if (powerId === 'agility.safeMovement') {
    const { presentSafeMovement } = await import('./agility-movement-ui.js');
    return presentSafeMovement(actor, ticket.tier);
  }
  const power = STONE_POWERS[powerId];
  if (!power) return true;
  const canPrompt =
    typeof (globalThis as any).foundry?.applications?.api?.DialogV2?.prompt === 'function';
  await power.apply({ actor, combatant, tier: ticket.tier, cost: 0 });
  if (powerId === 'influence.regeneration' && canPrompt) {
    const waiting = actor?.getFlag?.('mastery-system', 'pendingAllyRegeneration');
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
