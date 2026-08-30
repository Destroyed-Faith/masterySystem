/**
 * Defender reactions — eligibility + Evade negation helpers.
 *
 * Interactive spend UI lives in `reaction-window-chat.ts` (chat buttons posted
 * after the damage roll). Ghost Slip–style powers (`phasing.reactionSingleHit`)
 * are omitted here: they interact with the phasing step, not post-phasing mitigation.
 */

import {
  getActionEconomyActor,
  getReactionActionsSummary,
  hasPowerBeenUsedThisRound,
} from './action-economy.js';
import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { buildArtifactReactionOptions } from '../radial-menu/artifact-options.js';
import { getPrimaryTokenForActor } from '../utils/mechanics-adjacency.js';
import { distanceBetweenTokensMeters } from './threatened-ranged.js';
import { buildBasicReactionItems, isBasicReactionItem } from './basic-combat.js';
import {
  actorParticipatesInReactions,
  materializeNpcReactionPowers,
} from '../utils/npc-reactions.js';

export interface DefenderReactionMitigation {
  /** Extra flat armor for this damage instance only. */
  reactionArmorFlat: number;
  /** Extra DR% for this hit (stacked in mitigation with base DR). */
  reactionDrPct: number;
  /** Temporary HP granted by a reaction before this damage applies. */
  reactionTempHP?: number;
  /** Initiative gained after the attack fully resolves (Reaction: Initiative Gain). */
  initiativeGain?: number;
  /** Power display name if one was used. */
  powerName?: string;
  /** Reaction Evade raised the TN above the attack total — no damage. */
  negatedByEvade?: boolean;
  /** Ghost Slip / reaction phasing ignored the hit. */
  phasedByReaction?: boolean;
  /** Evade bonus from the chosen reaction (0 if none). */
  reactionEvadeBonus?: number;
  /** Evade TN used for the comparison (base + bonus when negated/applied). */
  effectiveEvade?: number;
  /** Basic Counterattack: spawn a Basic Attack after this hit resolves. */
  counterattack?: boolean;
  /** Interpose: ally actor id taking half of the damage. */
  interposeActorId?: string;
  interposeActorName?: string;
}

export interface ReactionEvadeEval {
  baseEvade: number;
  bonus: number;
  effectiveEvade: number;
  attackTotal: number | null;
  /** True when attack total is known and effective Evade exceeds it. */
  negates: boolean;
  /** True when we cannot decide (missing attack total). */
  unknown: boolean;
}

/**
 * Reaction Evade vs a known attack total.
 * Hit rule is attack ≥ Evade, so the reaction negates only when
 * (baseEvade + bonus) > attackTotal.
 */
export function evaluateReactionEvadeNegation(
  baseEvade: number,
  bonus: number,
  attackTotal: number | null | undefined,
): ReactionEvadeEval {
  const base = Math.max(0, Math.floor(Number(baseEvade) || 0));
  const b = Math.max(0, Math.floor(Number(bonus) || 0));
  const effectiveEvade = base + b;
  const atk =
    attackTotal == null || !Number.isFinite(Number(attackTotal))
      ? null
      : Math.floor(Number(attackTotal));
  if (atk == null) {
    return { baseEvade: base, bonus: b, effectiveEvade, attackTotal: null, negates: false, unknown: true };
  }
  return {
    baseEvade: base,
    bonus: b,
    effectiveEvade,
    attackTotal: atk,
    negates: b > 0 && effectiveEvade > atk,
    unknown: false,
  };
}

function defenderActorForEconomy(defender: Actor): Actor {
  return (getActionEconomyActor(defender) ?? defender) as Actor;
}

/**
 * Reaction-type power items the defender can still use this round (equipped, not used).
 *
 * Includes:
 *   - regular `power` items with `system.powerType === 'reaction'`, and
 *   - synthetic items materialized from each equipped artifact's
 *     `system.levelProgression` rows of type `'Reaction'` (up to
 *     `system.currentLevel`). Synthetic items carry an `id` like
 *     `artifact-reaction:<artifactItemId>:<level>` so they participate
 *     in the same once-per-round bookkeeping.
 */
export function getEligibleReactionPowers(defender: Actor, combat: Combat | null): any[] {
  if (!defender || !combat) return [];
  const owner = defenderActorForEconomy(defender) as Actor;
  if ((owner as any).type === 'npc' || (owner as any).type === 'summon') {
    if (!actorParticipatesInReactions(owner)) return [];
    return materializeNpcReactionPowers(owner);
  }
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
    // Ghost Slip (phasing.reactionSingleHit) stays in the pool; the Reaction
    // Window eligibility layer hides it unless Passive Phasing + hit apply.
    out.push(item);
  }

  try {
    const artifactReactions = buildArtifactReactionOptions(owner);
    for (const opt of artifactReactions) {
      if (hasPowerBeenUsedThisRound(owner as Actor, combat, opt.id)) continue;
      out.push({
        id: opt.id,
        name: opt.name,
        type: 'artifact',
        system: { powerType: 'reaction', description: opt.description },
        artifactReactionMeta: {
          artifactItemId: (opt.item as any)?.id,
          artifactName: (opt.item as any)?.name,
          description: opt.description,
        },
      });
    }
  } catch (err) {
    console.warn('Mastery System | defender-reactions: artifact reaction collection failed', err);
  }

  try {
    for (const basic of buildBasicReactionItems(owner)) {
      out.push(basic);
    }
  } catch (err) {
    console.warn('Mastery System | defender-reactions: basic reaction injection failed', err);
  }

  return dedupeOverlappingBasicReactions(out);
}

/**
 * If the actor already has a real Evade/Guard reaction power, hide the matching
 * Basic Reaction so the window does not list "Reaction: Evade" and "Evade".
 */
export function dedupeOverlappingBasicReactions(powers: any[]): any[] {
  if (!powers?.length) return powers ?? [];
  const nonBasic = powers.filter((p) => !isBasicReactionItem(p));

  const hasPowerEvade = nonBasic.some((p) => {
    const mech = resolvePowerMechanics(p);
    if ((Number(mech?.evade) || 0) > 0) return true;
    const tid = String(p?.system?.templateId ?? '').toLowerCase();
    if (tid.includes('evade') && !tid.includes('ally')) return true;
    const name = String(p?.name ?? '').toLowerCase();
    return /\bevade\b/.test(name) && !/\bally\b/.test(name);
  });

  const hasPowerGuard = nonBasic.some((p) => {
    const tid = String(p?.system?.templateId ?? '').toLowerCase();
    const name = String(p?.name ?? '').toLowerCase();
    if (tid.includes('guard') || tid === 'reaction-armor' || tid.includes('pure-defense')) {
      return true;
    }
    return /\bguard\b/.test(name) || /^reaction:\s*armor\b/.test(name);
  });

  return powers.filter((p) => {
    if (p?.basicReaction === 'evade' && hasPowerEvade) return false;
    if (p?.basicReaction === 'guard' && hasPowerGuard) return false;
    return true;
  });
}

const INITIATIVE_GAIN_TEMPLATE = 'reaction-initiative-gain';
const ALLY_REACTION_RANGE_M = 4;

/** Ally-protection reactions (help another creature in range). */
export function isAllyReactionPower(item: any): boolean {
  const tid = String(item?.system?.templateId ?? '').toLowerCase();
  if (tid.startsWith('reaction-ally-')) return true;
  const sub = String(item?.system?.subfamily ?? '').toLowerCase();
  if (sub === 'ally') return true;
  const name = String(item?.name ?? '').toLowerCase();
  return /\bally\b/.test(name);
}

export interface ReactionWindowActorEntry {
  actor: Actor;
  name: string;
  remaining: number;
  total: number;
  powers: any[];
  role: 'defender' | 'ally' | 'opportunity';
  distanceM: number | null;
}

/** Synthetic Interpose button (ally ≤2 m takes half damage). */
export function buildInterposeReactionItem(): any {
  return {
    id: 'basic-reaction-interpose',
    name: 'Interpose',
    type: 'basic-reaction',
    system: {
      powerType: 'reaction',
      templateId: 'basic-interpose',
      description:
        'When an ally within 2 m takes damage, step in and take half of it (rounded up to you).',
    },
    basicReaction: 'interpose',
    mechanics: {},
  };
}

/**
 * @deprecated No universal Opportunity Attack (reactions.md). Kept only so old
 * chat cards / tests referencing the id do not crash on import.
 */
export function buildOpportunityAttackReactionItem(actor: any): any {
  const mr2 = Math.max(2, Math.floor(Number(actor?.system?.mastery?.rank) || 2) * 2);
  return {
    id: 'basic-reaction-opportunity-attack',
    name: 'Opportunity Attack',
    type: 'basic-reaction',
    system: {
      powerType: 'reaction',
      templateId: 'basic-opportunity-attack',
      description: `Spend 1 Reaction to make a Basic Attack (Weapon + ${mr2}d8) against the creature that provoked you.`,
    },
    basicReaction: 'counterattack',
    mechanics: {},
  };
}

/**
 * Threatened Ranged (PG 9719–9725): the window opens at DECLARATION of the
 * ranged attack — the reactor was not hit, targeted, or damaged. Reactions
 * whose trigger requires being hit / targeted / taking damage (Counterattack,
 * Counter Damage, Guard, Evade, Parry follow-ups, …) are therefore illegal in
 * this window. Only reactions without such a trigger remain usable.
 */
export function isThreatenedDeclarationLegalReaction(item: any): boolean {
  // All Basic Reactions trigger off being hit/targeted (Guard, Evade,
  // Counterattack, Interpose, Dive for Cover) or a Skill Check (Aid).
  if (String(item?.basicReaction || '')) return false;
  if (isThreatenedRangedOffensiveReaction(item)) return false;
  const trig = String(item?.system?.trigger ?? '').toLowerCase();
  if (
    /\bhit\b|\btargeted\b|take damage|would take|damage instance|fully parry|lose actual hp|ongoing effect/.test(
      trig,
    )
  ) {
    return false;
  }
  return true;
}

/**
 * Offensive reactions for Threatened Ranged (shooter in your melee reach).
 * Not the attack target — Guard/Evade/Ally mitigation do not apply here.
 */
export function isThreatenedRangedOffensiveReaction(item: any): boolean {
  if (String(item?.id || '') === 'basic-reaction-opportunity-attack') return false;
  if (String(item?.basicReaction || '') === 'counterattack') return true;
  const tid = String(item?.system?.templateId ?? '').toLowerCase();
  if (
    tid === 'reaction-counter-damage' ||
    tid === 'reaction-counter-damage-push' ||
    tid === 'reaction-counter-damage-pull'
  ) return true;
  if (tid === 'reaction-special-increase') return true;
  const sub = String(item?.system?.subfamily ?? '').toLowerCase();
  if (sub === 'counter') return true;
  const mech = resolvePowerMechanics(item);
  if (mech?.modifySpecial?.mode === 'increaseExisting' && mech?.modifySpecial?.type === 'chosen') {
    return true;
  }
  const flat = String(mech?.damageRider?.flat ?? '');
  if (/d8/i.test(flat) && sub !== 'parry' && !tid.includes('riposte') && !tid.includes('reflection')) {
    return true;
  }
  return false;
}

/** Duplicate Initiative Gain sources do not stack — keep only the highest version. */
function dedupeInitiativeGainReactions(powers: any[]): any[] {
  const gainers = powers.filter((item) => {
    const mech = resolvePowerMechanics(item);
    const tid = String(item?.system?.templateId ?? '');
    return (mech?.initiativeGain ?? 0) > 0 || tid === INITIATIVE_GAIN_TEMPLATE;
  });
  if (gainers.length <= 1) return powers;

  let best = gainers[0];
  let bestVal = Math.max(0, Math.floor(Number(resolvePowerMechanics(best)?.initiativeGain) || 0));
  for (let i = 1; i < gainers.length; i++) {
    const val = Math.max(0, Math.floor(Number(resolvePowerMechanics(gainers[i])?.initiativeGain) || 0));
    if (val > bestVal) {
      best = gainers[i];
      bestVal = val;
    }
  }
  const bestId = (best as any).id;
  return powers.filter((item) => {
    const mech = resolvePowerMechanics(item);
    const tid = String(item?.system?.templateId ?? '');
    const isGain = (mech?.initiativeGain ?? 0) > 0 || tid === INITIATIVE_GAIN_TEMPLATE;
    if (!isGain) return true;
    return (item as any).id === bestId;
  });
}

/**
 * Defender + nearby allies + Threatened Ranged reactors.
 * - defender: own reactions
 * - allies: Ally-* reactions only (within 4 m)
 * - opportunity: offensive reactions vs the shooter (token ids from Threatened Ranged)
 */
export function collectReactionWindowEntries(params: {
  defender: Actor;
  attacker: Actor | null;
  combat: Combat;
  /** Token ids of enemies in melee reach of the shooter (Threatened Ranged). */
  opportunityEnemyTokenIds?: string[] | null;
}): ReactionWindowActorEntry[] {
  const { defender, attacker, combat } = params;
  const out: ReactionWindowActorEntry[] = [];
  const economyDef = defenderActorForEconomy(defender);
  if (actorParticipatesInReactions(economyDef)) {
    const defSummary = getReactionActionsSummary(economyDef, combat);
    const defPowers = dedupeInitiativeGainReactions(getEligibleReactionPowers(economyDef, combat));
    out.push({
      actor: economyDef,
      name: String((defender as any).name ?? 'Defender'),
      remaining: defSummary.remaining,
      total: defSummary.total,
      powers: defPowers,
      role: 'defender',
      distanceM: 0,
    });
  }

  const seenActorIds = new Set<string>([
    String((economyDef as any).id ?? ''),
    String((defender as any).id ?? ''),
  ]);
  const attackerId = (attacker as any)?.id ?? null;
  if (attackerId) seenActorIds.add(String(attackerId));

  try {
    const defToken = getPrimaryTokenForActor(defender);
    if (defToken && typeof canvas !== 'undefined') {
      for (const token of canvas.tokens?.placeables ?? []) {
        if (!token?.actor || token.id === defToken.id) continue;
        const other = token.actor as Actor;
        const otherId = String((other as any).id ?? '');
        if (!otherId || seenActorIds.has(otherId)) continue;

        const dd = defToken.document?.disposition ?? defToken.disposition;
        const od = token.document?.disposition ?? token.disposition;
        const HOSTILE = (globalThis as any).CONST?.TOKEN_DISPOSITIONS?.HOSTILE ?? -1;
        if (od === HOSTILE) continue;
        if (dd !== od) continue;

        const dist = distanceBetweenTokensMeters(defToken, token);
        if (!Number.isFinite(dist) || dist > ALLY_REACTION_RANGE_M) continue;

        const economyAlly = defenderActorForEconomy(other);
        const allyId = String((economyAlly as any).id ?? otherId);
        if (seenActorIds.has(allyId)) continue;
        seenActorIds.add(allyId);
        seenActorIds.add(otherId);

        if (!actorParticipatesInReactions(economyAlly)) continue;
        const summary = getReactionActionsSummary(economyAlly, combat);
        if (summary.remaining <= 0) continue;
        const allyPowers = getEligibleReactionPowers(economyAlly, combat).filter((p) =>
          isAllyReactionPower(p),
        );
        const powersForAlly = allyPowers;
        if (!powersForAlly.length) continue;

        out.push({
          actor: economyAlly,
          name: String((other as any).name ?? 'Ally'),
          remaining: summary.remaining,
          total: summary.total,
          powers: powersForAlly,
          role: 'ally',
          distanceM: Math.round(dist * 10) / 10,
        });
      }
    }
  } catch (err) {
    console.warn('Mastery System | reaction window ally scan failed', err);
  }

  // Threatened Ranged / similar: named opportunity token ids.
  const oppIds = (params.opportunityEnemyTokenIds ?? [])
    .map((id) => String(id || '').trim())
    .filter(Boolean);
  const oppDebug: Array<Record<string, unknown>> = [];
  if (oppIds.length && typeof canvas !== 'undefined') {
    try {
      for (const tid of oppIds) {
        const token =
          (canvas as any).tokens?.placeables?.find((t: any) => t?.id === tid) ||
          (canvas as any).scene?.tokens?.get?.(tid)?.object ||
          null;
        const actor = (token?.actor || null) as Actor | null;
        if (!actor) {
          oppDebug.push({ tokenId: tid, skip: 'token-or-actor-not-found' });
          continue;
        }
        const economyOpp = defenderActorForEconomy(actor);
        const oppActorId = String((economyOpp as any).id ?? (actor as any).id ?? '');
        const name = String((actor as any).name ?? token?.name ?? 'Opportunity');
        if (!oppActorId) {
          oppDebug.push({ tokenId: tid, name, skip: 'no-actor-id' });
          continue;
        }
        if (seenActorIds.has(oppActorId)) {
          oppDebug.push({
            tokenId: tid,
            name,
            skip: 'already-listed-or-is-defender/attacker',
            actorId: oppActorId,
          });
          continue;
        }
        seenActorIds.add(oppActorId);

        if (!actorParticipatesInReactions(economyOpp)) {
          oppDebug.push({ tokenId: tid, name, skip: 'npc-reactions-not-configured', actorId: oppActorId });
          continue;
        }

        const summary = getReactionActionsSummary(economyOpp, combat);
        // Declaration window: only reactions whose trigger does not require
        // being hit / targeted / damaged are legal (PG Threatened Ranged).
        const offensivePowers =
          summary.remaining > 0
            ? getEligibleReactionPowers(economyOpp, combat).filter(isThreatenedDeclarationLegalReaction)
            : [];
        // Always list Threatened candidates (even at 0 Reactions / no powers)
        // so the post-attack card can explain why they cannot act.
        out.push({
          actor: economyOpp,
          name,
          remaining: summary.remaining,
          total: summary.total,
          powers: offensivePowers,
          role: 'opportunity',
          distanceM: null,
        });
        oppDebug.push({
          tokenId: tid,
          name,
          included: true,
          canAct: summary.remaining > 0 && offensivePowers.length > 0,
          powerIds: offensivePowers.map((p: any) => String(p?.id || p?.name || '')),
          reactions: summary,
          ...(summary.remaining <= 0 ? { note: 'no-reactions-left' } : {}),
          ...(summary.remaining > 0 && !offensivePowers.length
            ? { note: 'no-offensive-reactions' }
            : {}),
        });
      }
    } catch (err) {
      console.warn('Mastery System | reaction window opportunity scan failed', err);
    }
  } else if (!oppIds.length) {
    oppDebug.push({ skip: 'no-opportunity-token-ids-on-event' });
  }

  const includedOpp = out.filter((e) => e.role === 'opportunity').map((e) => e.name);
  console.log(
    `[MS Threatened Ranged] Phase-2/others threatened-reactors ids=[${oppIds.join(', ') || 'none'}] ` +
      `included=[${includedOpp.join(', ') || 'none'}]`,
  );
  for (const row of oppDebug) {
    console.log(`[MS Threatened Ranged]   reactor row: ${JSON.stringify(row)}`);
  }

  return out;
}

/**
 * @deprecated Prefer `runInteractiveReactionWindow` from `reaction-window-chat.ts`.
 */
export async function promptDefenderReactionsBeforeMitigation(params: {
  defender: Actor;
  attacker: Actor;
  combat: Combat | null;
  rawDamage: number;
  attackTotal?: number | null;
  evadeTn?: number | null;
}): Promise<DefenderReactionMitigation> {
  const { runInteractiveReactionWindow } = await import('./reaction-window-chat.js');
  const result = await runInteractiveReactionWindow({
    defender: params.defender,
    attacker: params.attacker,
    combat: params.combat,
    rawDamage: params.rawDamage,
    attackTotal: params.attackTotal ?? null,
    evadeTn: params.evadeTn ?? null,
    hit: true,
    phase: 'defender',
  });
  return result.mitigation;
}
