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
import { buildBasicReactionItems } from './basic-combat.js';

export interface DefenderReactionMitigation {
  /** Extra flat armor for this damage instance only. */
  reactionArmorFlat: number;
  /** Extra DR% for this hit (stacked in mitigation with base DR). */
  reactionDrPct: number;
  /** Initiative gained after the attack fully resolves (Reaction: Initiative Gain). */
  initiativeGain?: number;
  /** Power display name if one was used. */
  powerName?: string;
  /** Reaction Evade raised the TN above the attack total — no damage. */
  negatedByEvade?: boolean;
  /** Evade bonus from the chosen reaction (0 if none). */
  reactionEvadeBonus?: number;
  /** Evade TN used for the comparison (base + bonus when negated/applied). */
  effectiveEvade?: number;
  /** Basic Counterattack: spawn a Basic Attack after this hit resolves. */
  counterattack?: boolean;
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

  return out;
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
  role: 'defender' | 'ally';
  distanceM: number | null;
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
 * Defender + nearby allies who still have a Reaction and at least one eligible power
 * for this damage window (defender: own reactions; allies: Ally-* reactions only).
 */
export function collectReactionWindowEntries(params: {
  defender: Actor;
  attacker: Actor | null;
  combat: Combat;
}): ReactionWindowActorEntry[] {
  const { defender, attacker, combat } = params;
  const out: ReactionWindowActorEntry[] = [];
  const economyDef = defenderActorForEconomy(defender);
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

  try {
    const defToken = getPrimaryTokenForActor(defender);
    if (!defToken || typeof canvas === 'undefined') return out;

    const attackerId = (attacker as any)?.id ?? null;
    const seenActorIds = new Set<string>([
      String((economyDef as any).id ?? ''),
      String((defender as any).id ?? ''),
    ]);

    for (const token of canvas.tokens?.placeables ?? []) {
      if (!token?.actor || token.id === defToken.id) continue;
      const other = token.actor as Actor;
      const otherId = String((other as any).id ?? '');
      if (!otherId || seenActorIds.has(otherId)) continue;
      if (attackerId && otherId === String(attackerId)) continue;

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

      const summary = getReactionActionsSummary(economyAlly, combat);
      if (summary.remaining <= 0) continue;
      const allyPowers = getEligibleReactionPowers(economyAlly, combat).filter(isAllyReactionPower);
      if (!allyPowers.length) continue;

      out.push({
        actor: economyAlly,
        name: String((other as any).name ?? 'Ally'),
        remaining: summary.remaining,
        total: summary.total,
        powers: allyPowers,
        role: 'ally',
        distanceM: Math.round(dist * 10) / 10,
      });
    }
  } catch (err) {
    console.warn('Mastery System | reaction window ally scan failed', err);
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
  return runInteractiveReactionWindow({
    defender: params.defender,
    attacker: params.attacker,
    combat: params.combat,
    rawDamage: params.rawDamage,
    attackTotal: params.attackTotal ?? null,
    evadeTn: params.evadeTn ?? null,
    hit: true,
  });
}
