/**
 * Reaction trigger eligibility — when a reaction button may appear / stay enabled.
 *
 * Predicates are based on templateId / subfamily / mechanics shape (not free-text
 * trigger strings). Used by the Reaction Window card filters.
 */

import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { buildActorMechanicsBreakdown } from '../utils/power-mechanics.js';
import { isBasicReactionItem } from './basic-combat.js';
import { isAllyReactionPower, isThreatenedDeclarationLegalReaction } from './defender-reactions.js';
import { getPrimaryTokenForActor } from '../utils/mechanics-adjacency.js';
import { distanceBetweenTokensMeters } from './threatened-ranged.js';

/** Shared with the Reaction Window chat card. */
export type ReactionWindowPhase = 'defender' | 'allies' | 'others' | 'opportunity';

export interface ReactionTriggerContext {
  phase: ReactionWindowPhase;
  hit: boolean;
  attackTotal?: number | null;
  evadeTn?: number | null;
  attackType?: 'melee' | 'ranged' | null;
  /** Distance defender ↔ attacker in meters (null if unknown). */
  rangeToAttackerM?: number | null;
  /** Ally's distance to defender (ally role only). */
  allyDistanceM?: number | null;
  hasPassiveDR?: boolean;
  hasPassivePhasing?: boolean;
  /** Full Parry resolved for this attack (Riposte / Reflection). */
  hasParryThisHit?: boolean;
  /** Actual HP was lost from this damage instance (Overload). */
  hpLost?: boolean;
  /** Ongoing/status application surface (Cleanse) — not the attack window. */
  statusSurface?: boolean;
  isAoE?: boolean;
  suppressCounterattack?: boolean;
}

export interface ReactionEligibility {
  shown: boolean;
  enabled: boolean;
  reason?: string;
}

function mechanicsOf(item: any): ReturnType<typeof resolvePowerMechanics> {
  if (item?.mechanics && typeof item.mechanics === 'object') {
    return item.mechanics as ReturnType<typeof resolvePowerMechanics>;
  }
  return resolvePowerMechanics(item);
}

function templateIdOf(item: any): string {
  return String(item?.system?.templateId ?? '').toLowerCase();
}

function subfamilyOf(item: any): string {
  return String(item?.system?.subfamily ?? '').toLowerCase();
}

/** True when the reaction's only / primary defensive effect is Armor (hit/damage). */
export function isArmorAxisReaction(item: any): boolean {
  if (item?.basicReaction === 'guard') return true;
  const tid = templateIdOf(item);
  if (tid === 'reaction-armor' || tid === 'reaction-armor-temp-hp') return true;
  if (tid === 'reaction-ally-armor') return true;
  const mech = mechanicsOf(item);
  const armor = Math.max(0, Math.floor(Number(mech?.armor) || 0));
  const evade = Math.max(0, Math.floor(Number(mech?.evade) || 0));
  const dr = Math.max(0, Math.floor(Number(mech?.damageReductionPct) || 0));
  const temp = String(mech?.tempHP ?? '').trim();
  if (armor > 0 && evade <= 0 && dr <= 0 && !temp) return true;
  return false;
}

/** Damage-buffer reactions that need a hit / incoming damage (Temp HP, Armor+Temp, DR). */
export function isDamageTriggerReaction(item: any): boolean {
  const tid = templateIdOf(item);
  if (
    tid === 'reaction-temp-hp' ||
    tid === 'reaction-armor-temp-hp' ||
    tid === 'reaction-ally-temp-hp' ||
    tid === 'reaction-damage-reduction'
  ) {
    return true;
  }
  const mech = mechanicsOf(item);
  const temp = String(mech?.tempHP ?? '').trim();
  const dr = Math.max(0, Math.floor(Number(mech?.damageReductionPct) || 0));
  const armor = Math.max(0, Math.floor(Number(mech?.armor) || 0));
  const evade = Math.max(0, Math.floor(Number(mech?.evade) || 0));
  if ((temp || dr > 0) && evade <= 0) return true;
  if (armor > 0 && temp) return true;
  return false;
}

export function isCounterDamageReaction(item: any): boolean {
  const tid = templateIdOf(item);
  if (tid.includes('riposte') || tid.includes('reflection') || subfamilyOf(item) === 'parry') {
    return false;
  }
  if (tid === 'reaction-counter-damage' || tid === 'reaction-counter-damage-push') return true;
  if (subfamilyOf(item) === 'counter') return true;
  const flat = String(mechanicsOf(item)?.damageRider?.flat ?? '');
  return /d8/i.test(flat);
}

export function isSpecialIncreaseReaction(item: any): boolean {
  const tid = templateIdOf(item);
  if (tid === 'reaction-special-increase') return true;
  const mod = mechanicsOf(item)?.modifySpecial as any;
  return mod?.mode === 'increaseExisting' && mod?.type === 'chosen';
}

export function isRepositionReaction(item: any): boolean {
  const tid = templateIdOf(item);
  if (tid === 'reaction-reposition') return true;
  if (tid === 'reaction-repositioning-intercept') return true;
  return (Number(mechanicsOf(item)?.movementBonus) || 0) > 0 && subfamilyOf(item).includes('reposition');
}

export function isGhostSlipReaction(item: any): boolean {
  const tid = templateIdOf(item);
  if (tid === 'reaction-phasing') return true;
  return !!mechanicsOf(item)?.phasing?.reactionSingleHit;
}

export function isCleanseReaction(item: any): boolean {
  const tid = templateIdOf(item);
  if (tid === 'reaction-reactive-cleanse') return true;
  return subfamilyOf(item) === 'cleanse';
}

export function isOverloadReaction(item: any): boolean {
  const tid = templateIdOf(item);
  if (tid === 'reaction-reactive-overload') return true;
  return subfamilyOf(item) === 'absorption';
}

export function isParryFollowUpReaction(item: any): boolean {
  const tid = templateIdOf(item);
  if (tid === 'reaction-riposte' || tid === 'reaction-parry-reflection') return true;
  return subfamilyOf(item) === 'parry';
}

export function isInterposeReaction(item: any): boolean {
  return item?.basicReaction === 'interpose' || String(item?.id || '') === 'basic-reaction-interpose';
}

export function actorHasPassiveDR(actor: any): boolean {
  if (!actor) return false;
  try {
    if (typeof actor.prepareDerivedData === 'function') {
      try {
        actor.prepareDerivedData();
      } catch {
        /* ignore */
      }
    }
    const bd = buildActorMechanicsBreakdown(actor);
    const passiveBase = bd.damageReductionPct.passive.reduce(
      (s: number, r: any) => s + (r.value || 0),
      0,
    );
    const sheetDr = Math.max(0, Math.floor(Number(actor.system?.combat?.damageReductionPct) || 0));
    const total = Math.max(0, Math.floor(Number(bd.totals?.damageReductionPct) || 0));
    return passiveBase > 0 || sheetDr > 0 || total > 0;
  } catch {
    return false;
  }
}

export function actorHasPassivePhasing(actor: any): boolean {
  if (!actor) return false;
  try {
    const items = actor.items;
    if (!items) return false;
    for (const item of items) {
      if (item?.type !== 'power') continue;
      const sys = item.system as any;
      if (sys?.powerType !== 'passive' && sys?.equipped === false) continue;
      const mech = resolvePowerMechanics(item);
      if (mech?.phasing) return true;
      const tid = String(sys?.templateId ?? '').toLowerCase();
      if (tid.includes('phasing') || tid.includes('ghost-slip')) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** Meters between two actors' primary tokens, or null. */
export function distanceBetweenActorsMeters(a: Actor | null | undefined, b: Actor | null | undefined): number | null {
  if (!a || !b) return null;
  try {
    const ta = getPrimaryTokenForActor(a);
    const tb = getPrimaryTokenForActor(b);
    if (!ta || !tb) return null;
    const d = distanceBetweenTokensMeters(ta, tb);
    return Number.isFinite(d) ? d : null;
  } catch {
    return null;
  }
}

/**
 * Evaluate whether a reaction should appear (and be clickable) for this context.
 */
export function evaluateReactionEligibility(power: any, ctx: ReactionTriggerContext): ReactionEligibility {
  const phase = ctx.phase ?? 'defender';
  const tid = templateIdOf(power);
  const basic = String(power?.basicReaction || '');

  // Wrong surface: Cleanse / Overload never belong on the attack reaction card.
  if (isCleanseReaction(power) && !ctx.statusSurface) {
    return { shown: false, enabled: false, reason: 'Cleanse uses the status / effect surface' };
  }
  if (isOverloadReaction(power) && !ctx.hpLost) {
    return { shown: false, enabled: false, reason: 'Overload triggers after actual HP loss' };
  }

  // Parry follow-ups need a Full Parry this hit.
  if (isParryFollowUpReaction(power)) {
    if (!ctx.hasParryThisHit) {
      return { shown: false, enabled: false, reason: 'Requires a Full Parry on this attack' };
    }
    // Riposte: melee Full Parry only.
    if (tid === 'reaction-riposte' && ctx.attackType === 'ranged') {
      return { shown: false, enabled: false, reason: 'Riposte requires a melee Full Parry' };
    }
    // Reflection: single-target only.
    if (
      (tid === 'reaction-parry-reflection' || tid.includes('reflection')) &&
      ctx.isAoE
    ) {
      return { shown: false, enabled: false, reason: 'Reflection requires a single-target attack' };
    }
    if (phase !== 'defender') {
      return { shown: false, enabled: false, reason: 'Parry follow-ups are defender reactions' };
    }
  }

  // Repositioning Intercept — out of scope for auto-retarget; hide from window.
  if (tid === 'reaction-repositioning-intercept') {
    return { shown: false, enabled: false, reason: 'Intercept retarget is resolved at the table' };
  }

  // Retired synthetic OA — Rules: no universal Opportunity Attack.
  if (String(power?.id || '') === 'basic-reaction-opportunity-attack') {
    return { shown: false, enabled: false, reason: 'No universal Opportunity Attack' };
  }

  // Phase role filters (coarse).
  if (phase === 'defender') {
    if (isAllyReactionPower(power) || isInterposeReaction(power)) {
      return { shown: false, enabled: false, reason: 'Ally reaction — wait for allies phase' };
    }
  }
  if (phase === 'allies') {
    if (!isAllyReactionPower(power) && !isInterposeReaction(power)) {
      return { shown: false, enabled: false, reason: 'Not an ally reaction' };
    }
  }
  const threatenedWindow = phase === 'others' || phase === 'opportunity';
  if (threatenedWindow) {
    // Threatened Ranged opens at DECLARATION — the reactor was not hit,
    // targeted, or damaged, so hit-trigger reactions are illegal here.
    if (!isThreatenedDeclarationLegalReaction(power)) {
      return {
        shown: false,
        enabled: false,
        reason: 'Threatened Ranged (declaration) — hit/target-triggered reactions are not legal here',
      };
    }
  }

  // Miss: no Armor / damage-buffer / counterattack / counter-damage.
  // Threatened Ranged reactors were not the attack target — miss/hit of the
  // original strike does not gate their offensive reactions vs the shooter.
  if (!ctx.hit && !threatenedWindow) {
    if (basic === 'guard' || isArmorAxisReaction(power) || isDamageTriggerReaction(power)) {
      return { shown: false, enabled: false, reason: 'Attack missed — nothing to absorb' };
    }
    if (basic === 'counterattack') {
      return { shown: false, enabled: false, reason: 'Counterattack requires a hit' };
    }
    if (isCounterDamageReaction(power) || isSpecialIncreaseReaction(power)) {
      return { shown: false, enabled: false, reason: 'Requires a hit within 2 m' };
    }
    if (isGhostSlipReaction(power)) {
      return { shown: false, enabled: false, reason: 'Ghost Slip requires a hit' };
    }
  }

  // Nested counterattack windows.
  if (ctx.suppressCounterattack && basic === 'counterattack') {
    return { shown: false, enabled: false, reason: 'Counterattack already in progress' };
  }

  // DR reaction needs Passive / sheet DR.
  if (tid === 'reaction-damage-reduction' || (Number(mechanicsOf(power)?.damageReductionPct) || 0) > 0) {
    if (ctx.hasPassiveDR === false) {
      return { shown: false, enabled: false, reason: 'Needs Passive / sheet Damage Reduction' };
    }
  }

  // Ghost Slip needs Passive Phasing + hit.
  if (isGhostSlipReaction(power)) {
    if (!ctx.hasPassivePhasing) {
      return { shown: false, enabled: false, reason: 'Needs Passive Phasing' };
    }
    if (phase !== 'defender') {
      return { shown: false, enabled: false, reason: 'Ghost Slip is a defender reaction' };
    }
  }

  // Counter damage / special increase: hit + ≤2 m.
  if (isCounterDamageReaction(power) || isSpecialIncreaseReaction(power)) {
    const range = ctx.rangeToAttackerM;
    if (range != null && range > 2.05) {
      return { shown: false, enabled: false, reason: 'Triggering creature must be within 2 m' };
    }
  }

  // Interpose: ally within 2 m.
  if (isInterposeReaction(power)) {
    const d = ctx.allyDistanceM;
    if (d != null && d > 2.05) {
      return { shown: false, enabled: false, reason: 'Interpose requires ally within 2 m' };
    }
    if (phase !== 'allies') {
      return { shown: false, enabled: false, reason: 'Interpose is an ally reaction' };
    }
  }

  // Empty level shells (L1–3 DR/Phasing/etc. with no mechanics).
  const mech = mechanicsOf(power);
  const tidEmpty =
    (tid === 'reaction-damage-reduction' || tid === 'reaction-phasing' || tid === 'reaction-special-increase') &&
    !mech?.armor &&
    !mech?.evade &&
    !mech?.tempHP &&
    !mech?.damageReductionPct &&
    !mech?.damageRider &&
    !mech?.phasing &&
    !mech?.modifySpecial &&
    !mech?.initiativeGain &&
    !mech?.movementBonus;
  if (tidEmpty && !isBasicReactionItem(power)) {
    return { shown: false, enabled: false, reason: 'No effect at this power level' };
  }

  return { shown: true, enabled: true };
}

/** Build a context snapshot for filtering a reaction window card. */
export function buildReactionTriggerContext(params: {
  phase: ReactionWindowPhase;
  hit: boolean;
  attackTotal?: number | null;
  evadeTn?: number | null;
  defender?: Actor | null;
  attacker?: Actor | null;
  allyDistanceM?: number | null;
  suppressCounterattack?: boolean;
  hasParryThisHit?: boolean;
  hpLost?: boolean;
  statusSurface?: boolean;
  isAoE?: boolean;
  attackType?: 'melee' | 'ranged' | null;
}): ReactionTriggerContext {
  const defender = params.defender ?? null;
  const attacker = params.attacker ?? null;
  return {
    phase: params.phase,
    hit: !!params.hit,
    attackTotal: params.attackTotal ?? null,
    evadeTn: params.evadeTn ?? null,
    attackType: params.attackType ?? null,
    rangeToAttackerM: distanceBetweenActorsMeters(defender as any, attacker as any),
    allyDistanceM: params.allyDistanceM ?? null,
    hasPassiveDR: defender ? actorHasPassiveDR(defender) : undefined,
    hasPassivePhasing: defender ? actorHasPassivePhasing(defender) : undefined,
    hasParryThisHit: !!params.hasParryThisHit,
    hpLost: !!params.hpLost,
    statusSurface: !!params.statusSurface,
    isAoE: !!params.isAoE,
    suppressCounterattack: !!params.suppressCounterattack,
  };
}
