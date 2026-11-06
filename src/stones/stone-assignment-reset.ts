/**
 * GM "Reset Stone Assignments" must refund stones AND reverse applied effects
 * (Temp HP, once-per-combat gates, round stone bonuses, enemy Movement Reduction /
 * Reaction Denial). Otherwise the stone returns while the buff remains.
 */

import {
  getRoundState,
  setRoundState,
  type RoundState,
} from '../combat/action-economy.js';
import { getPhasingCharges } from '../combat/phasing.js';
import {
  ONCE_PER_COMBAT_STONE_FLAGS,
  clearOncePerCombatStoneFlags,
} from './colorless-stones.js';
import {
  DAMAGE_MAX_FLAG,
  MOVEMENT_REDUCTION_FLAG,
  REACTION_DENIAL_FLAG,
  sameCombatRound,
} from './stone-combat-effects.js';
import {
  highestCompleteStoneTierFromPlaced,
  scaleStoneTier,
} from './stone-powers.js';

export type StoneReceiptRow = { accKey: string; value: unknown };

function lanePlacedCount(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function parsePowerId(accKey: string): string | null {
  const j = String(accKey || '').lastIndexOf(':');
  if (j <= 0) return null;
  const rest = accKey.slice(0, j);
  const i = rest.lastIndexOf(':');
  if (i <= 0) return null;
  return rest.slice(0, i) || null;
}

/** Highest paid Rank per powerId from a payment receipt. */
export function receiptPowerTiers(receipt: StoneReceiptRow[] | undefined | null): Map<string, number> {
  const placedByPower = new Map<string, number>();
  for (const row of receipt || []) {
    const powerId = parsePowerId(row.accKey);
    if (!powerId) continue;
    placedByPower.set(powerId, (placedByPower.get(powerId) || 0) + lanePlacedCount(row.value));
  }
  const tiers = new Map<string, number>();
  for (const [powerId, placed] of placedByPower) {
    const tier = highestCompleteStoneTierFromPlaced(powerId, placed);
    if (tier > 0) tiers.set(powerId, tier);
  }
  return tiers;
}

/** Temp HP granted by vitality.tempHp for a paid receipt (0 if absent). */
export function tempHpFromStoneReceipt(receipt: StoneReceiptRow[] | undefined | null): number {
  const tier = receiptPowerTiers(receipt).get('vitality.tempHp') || 0;
  return scaleStoneTier([20, 40, 80, 160], tier);
}

function emptyStoneBonuses(): NonNullable<RoundState['stoneBonuses']> {
  return {
    extraAttacks: 0,
    extraReactions: 0,
    extraMoveMeters: 0,
    damageBonus: 0,
    meleeDamageBonusDice: 0,
    armorPenetration: 0,
    meleeIgnoreArmor: 0,
    invisibilityBonus: 0,
    rangeBonusM: 0,
    meleeReachBonusM: 0,
    aoeRadiusBonusM: 0,
    activeBuffPlBonus: 0,
    enemyEvadeReduction: 0,
    evadeBonus: 0,
    critRaises: 0,
    tempArmor: 0,
    freeRaises: 0,
    spellPoolDice: 0,
    spellKeepDice: 0,
    extraPassives: 0,
    tempHpGrantedThisTurn: 0,
    ignoreWoundPenalties: 0,
    secondChanceFreeBoxes: 0,
    extendActiveBuffRounds: 0,
    spellRaiseTnBonus: 0,
    spellPenetration: 0,
    specialBoost: 0,
    spellAutoRaises: 0,
    spellResistanceBonus: 0,
    extraSpellActions: 0,
    shopExtraAttack: 0,
    bonusAttackActions: 0,
    spellSpecialBoost: 0,
    damageReductionBoostPct: 0,
    incomingSpecialReduction: 0,
    tempWard: 0,
    tempParryPool: 0,
    defensiveExpiry: null,
    tempDamageNegation: 0,
    phasingChargesFromStones: 0,
    initiativeBonus: 0,
    reactionRangeBonus: 0,
  };
}

async function clearCombatantOncePerCombatFlags(combatant: any): Promise<void> {
  if (!combatant?.unsetFlag) return;
  for (const flag of ONCE_PER_COMBAT_STONE_FLAGS) {
    try {
      await combatant.unsetFlag('mastery-system', flag);
    } catch {
      /* best-effort */
    }
  }
}

async function removeStonePhasingSource(actor: any): Promise<void> {
  if (!actor?.update) return;
  const state = getPhasingCharges(actor);
  const key = 'reaction:wits.phasing';
  const src = state.sources[key];
  if (!src) return;
  delete state.sources[key];
  const remaining = Math.min(src.charges, state.current);
  state.max = Math.max(0, state.max - src.charges);
  state.current = Math.max(0, state.current - remaining);
  try {
    await actor.update({
      'flags.mastery-system.phasingCharges': {
        max: state.max,
        current: state.current,
        combatId: state.combatId,
        sources: state.sources,
      },
    });
  } catch {
    /* best-effort */
  }
}

async function clearRoundEnemyStoneFlags(
  combat: any,
  opts: { clearReactionDenial: boolean; clearMovementReduction: boolean },
): Promise<void> {
  if (!opts.clearReactionDenial && !opts.clearMovementReduction) return;
  const bag = combat?.combatants;
  const rows: any[] = bag
    ? typeof bag.values === 'function'
      ? Array.from(bag.values())
      : Array.isArray(bag)
        ? bag
        : []
    : [];
  for (const c of rows) {
    const actor = c?.actor;
    if (!actor?.unsetFlag && !actor?.getFlag) continue;
    if (opts.clearReactionDenial) {
      const raw = actor.getFlag?.('mastery-system', REACTION_DENIAL_FLAG);
      if (sameCombatRound(raw, combat.id, combat.round)) {
        try {
          await actor.unsetFlag('mastery-system', REACTION_DENIAL_FLAG);
        } catch {
          /* best-effort */
        }
      }
    }
    if (opts.clearMovementReduction) {
      const raw = actor.getFlag?.('mastery-system', MOVEMENT_REDUCTION_FLAG);
      if (sameCombatRound(raw, combat.id, combat.round)) {
        try {
          await actor.unsetFlag('mastery-system', MOVEMENT_REDUCTION_FLAG);
        } catch {
          /* best-effort */
        }
      }
    }
  }
}

/**
 * Reverse effects from a paid Stone Assignment receipt before stones are refunded.
 */
export async function revertStoneAssignmentEffects(opts: {
  actor: any;
  combat: any;
  combatant?: any;
  receipt?: StoneReceiptRow[] | null;
}): Promise<{ tempHpRemoved: number; powers: string[] }> {
  const actor = opts.actor;
  const combat = opts.combat;
  const receipt = opts.receipt || [];
  const tiers = receiptPowerTiers(receipt);
  const powers = [...tiers.keys()];

  const tempHpRemoved = tempHpFromStoneReceipt(receipt);
  if (tempHpRemoved > 0 && actor?.update) {
    const current = Math.max(0, Math.floor(Number(actor.system?.health?.tempHP) || 0));
    const next = Math.max(0, current - tempHpRemoved);
    if (next !== current) {
      try {
        await actor.update({ 'system.health.tempHP': next });
      } catch {
        /* best-effort */
      }
    }
  }

  try {
    await clearOncePerCombatStoneFlags(actor);
  } catch {
    /* best-effort */
  }
  try {
    await clearCombatantOncePerCombatFlags(opts.combatant);
  } catch {
    /* best-effort */
  }

  try {
    const roundState = getRoundState(actor, combat);
    roundState.stoneBonuses = emptyStoneBonuses();
    await setRoundState(actor, roundState);
  } catch {
    /* best-effort */
  }

  if (tiers.has('wits.phasing')) {
    await removeStonePhasingSource(actor);
  }

  for (const flag of [
    DAMAGE_MAX_FLAG,
    'pendingReactionDenial',
    'pendingMovementReduction',
    'pendingNotATarget',
  ]) {
    try {
      await actor?.unsetFlag?.('mastery-system', flag);
    } catch {
      /* best-effort */
    }
  }

  await clearRoundEnemyStoneFlags(combat, {
    clearReactionDenial: tiers.has('wits.reactionDenial'),
    clearMovementReduction: tiers.has('wits.movementReduction'),
  });

  return { tempHpRemoved, powers };
}
