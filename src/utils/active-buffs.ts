/**
 * Active Buff utilities for the Mastery System
 * Active Buffs are powers that create effects lasting for "Mastery Rank rounds"
 */

import { powerCostPaysAction } from '../radial-menu/options.js';
import { resolvePowerMechanics } from './power-mechanics.js';
import { ALL_POWER_TEMPLATES } from './powers/index.js';
import { getRoundState, setRoundState } from '../combat/action-economy.js';

/**
 * Consume a pending Vitality "Extend Active Buff" stone-power extension.
 * Returns the extra rounds for the buff being activated right now (0 if none)
 * and clears the pending marker so only ONE Active Buff per turn benefits.
 */
async function consumePendingBuffExtension(actor: Actor): Promise<number> {
  try {
    const combat = (game as any).combat ?? null;
    const roundState = getRoundState(actor, combat);
    const sb: any = roundState?.stoneBonuses;
    const pending = Math.max(0, Math.floor(Number(sb?.extendActiveBuffRounds ?? 0) || 0));
    if (pending <= 0) return 0;
    sb.extendActiveBuffRounds = 0;
    await setRoundState(actor, roundState);
    return pending;
  } catch (err) {
    console.warn('Mastery System | Extend Active Buff lookup failed', err);
    return 0;
  }
}

function paysActionCost(power: any): boolean {
  return powerCostPaysAction(power?.system?.cost);
}

function resolvedActiveBuffMechanics(power: any): boolean {
  try {
    const mech = resolvePowerMechanics(power);
    return mech?.applyWhen === 'activeBuff-active';
  } catch {
    return false;
  }
}

/**
 * Check if a power is a utility (not a true active buff)
 */
export function isUtility(power: any): boolean {
  if (!power || power.type !== 'power') return false;
  const powerType = power.system?.powerType;
  return powerType === 'utility';
}

/**
 * Check if a power is a true active buff (not a utility)
 */
export function isTrueActiveBuff(power: any): boolean {
  if (!power || power.type !== 'power') return false;
  
  const powerType = power.system?.powerType;
  const pays = paysActionCost(power);
  
  // Utilities are NOT true active buffs (they can stack)
  if (powerType === 'utility') {
    return false;
  }
  
  // Check if it's explicitly an active-buff or buff power that requires an action
  if ((powerType === 'active-buff' || powerType === 'activeBuff' || powerType === 'buff') && pays) {
    return true;
  }
  if (resolvedActiveBuffMechanics(power) && pays) {
    return true;
  }
  
  // Check tags for active-buff indicators
  const tags = power.system?.tags || [];
  if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
    if (pays) {
      return true;
    }
  }
  
  // Check if power type is 'active' but has buff-like characteristics
  if (powerType === 'active' && pays) {
    const nameLower = power.name?.toLowerCase() || '';
    const descLower = (power.system?.description || '').toLowerCase();
    if (nameLower.includes('buff') || descLower.includes('buff') || 
        nameLower.includes('stance') || descLower.includes('stance')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a power is an active buff (includes utilities)
 */
export function isActiveBuff(power: any): boolean {
  if (!power || power.type !== 'power') return false;
  
  const powerType = power.system?.powerType;
  const range = power.system?.range;
  const tags = power.system?.tags || [];
  const pays = paysActionCost(power);
  
  // Check if it's explicitly an active-buff or buff power that requires an action
  if ((powerType === 'active-buff' || powerType === 'activeBuff' || powerType === 'buff') && pays) {
    return true;
  }
  if (resolvedActiveBuffMechanics(power) && pays) {
    return true;
  }
  
  // Check tags for active-buff indicators
  if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
    if (pays) {
      return true;
    }
  }
  
  // Check if power type is 'active' but has buff-like characteristics
  if (powerType === 'active' && pays) {
    const nameLower = power.name?.toLowerCase() || '';
    const descLower = (power.system?.description || '').toLowerCase();
    if (nameLower.includes('buff') || descLower.includes('buff') || 
        nameLower.includes('stance') || descLower.includes('stance')) {
      return true;
    }
  }
  
  // Check if it's a utility that is Self-targeting (these are also active buffs)
  if (powerType === 'utility' && pays) {
    const rangeStr = range?.toString().toLowerCase() || '';
    // If range is "Self" or 0, it's a self-buff utility
    if (rangeStr === 'self' || rangeStr === '0' || range === 0) {
      return true;
    }
    // Also check if it has buff-like tags or characteristics
    if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
      return true;
    }
    // Check name/description for buff indicators
    const nameLower = power.name?.toLowerCase() || '';
    const descLower = (power.system?.description || '').toLowerCase();
    if (nameLower.includes('buff') || descLower.includes('buff') || 
        nameLower.includes('stance') || descLower.includes('stance')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get mastery rank from actor
 */
function getMasteryRank(actor: Actor): number {
  return (actor.system as any)?.mastery?.rank || 2;
}

/**
 * Get current combat round
 */
function getCurrentRound(): number {
  return game.combat?.round || 1;
}

/**
 * Get all true active buffs (excluding utilities) on an actor
 */
export function getTrueActiveBuffs(actor: Actor): any[] {
  const effects = (actor as any).effects;
  if (!effects) return [];
  
  return effects.filter((effect: any) => {
    const flags = effect.flags?.['mastery-system'];
    if (flags?.activeBuff !== true) return false;
    
    // Check if the original power was a utility
    const powerId = flags.powerId;
    if (powerId) {
      const power = (actor as any).items?.get(powerId);
      if (power && isUtility(power)) {
        return false; // Exclude utilities
      }
    }
    
    return true;
  });
}

/**
 * Activate an active buff power
 * Creates an ActiveEffect that lasts for Mastery Rank rounds
 * Only one true active buff can be active at a time (utilities can stack)
 */
export async function activateActiveBuff(actor: Actor, power: any): Promise<boolean> {
  if (!isActiveBuff(power)) {
    console.warn('Mastery System | activateActiveBuff called with non-buff power', power.name);
    return false;
  }
  
  // Check if this is a true active buff (not a utility)
  const isTrueBuff = isTrueActiveBuff(power);
  
  // PG "Active Buffs": activating a new Active Buff ENDS the previous one —
  // the new buff replaces it (swap), it is not blocked.
  if (isTrueBuff) {
    const existingTrueBuffs = getTrueActiveBuffs(actor);
    for (const existingBuff of existingTrueBuffs) {
      const existingName = existingBuff.name || 'Unknown';
      try {
        await existingBuff.delete();
        ui.notifications?.info(
          `${existingName} ends — ${power.name} replaces it (only one Active Buff at a time).`,
        );
      } catch (err) {
        console.warn('Mastery System | failed to end previous Active Buff', err);
      }
    }
  }
  
  const masteryRank = getMasteryRank(actor);
  const currentRound = getCurrentRound();

  // Vitality Stone Power "Extend Active Buff": +1..+4 rounds on ONE Active
  // Buff activated this turn. Consumed here so a second activation this turn
  // doesn't benefit again.
  const extendRounds = await consumePendingBuffExtension(actor);
  const durationRounds = masteryRank + extendRounds;

  // Calculate duration in rounds
  // Duration is "Mastery Rank rounds" (+ Extend Active Buff, if pending)
  // Foundry's ActiveEffect duration uses rounds/turns/seconds
  const duration = {
    startRound: currentRound,
    startTurn: game.combat?.turn || 0,
    rounds: durationRounds,
    turns: 0,
    seconds: null,
    combat: game.combat?.id || null
  };
  
  // Snapshot level-specific mechanics (powers use levels["1"]..["16"]; `rank` is 1–16).
  const powerSys: any = power.system || {};
  const rawRank = Number(powerSys.rank);
  const levelFromRank =
    Number.isFinite(rawRank) && rawRank >= 1 ? Math.floor(rawRank) : masteryRank;
  const powerLevelKey = Math.max(1, Math.min(16, levelFromRank));

  let rankMechanicsRaw: Record<string, unknown> | null = null;
  const fromLevel = powerSys.levels?.[String(powerLevelKey)]?.mechanics;
  if (fromLevel && typeof fromLevel === 'object') {
    rankMechanicsRaw = { ...(fromLevel as Record<string, unknown>) };
  } else if (powerSys.mechanics && typeof powerSys.mechanics === 'object') {
    rankMechanicsRaw = { ...(powerSys.mechanics as Record<string, unknown>) };
  } else {
    const resolved = resolvePowerMechanics(power);
    if (resolved && typeof resolved === 'object') {
      rankMechanicsRaw = { ...(resolved as unknown as Record<string, unknown>) };
    }
  }

  // Aggregator requires `applyWhen: 'activeBuff-active'` on the snapshot (item
  // JSON may omit it when only partial mechanics are stored on the level).
  let rankMechanics: Record<string, unknown> & { applyWhen: 'activeBuff-active' } =
    rankMechanicsRaw && typeof rankMechanicsRaw === 'object'
      ? { ...rankMechanicsRaw, applyWhen: 'activeBuff-active' as const }
      : { applyWhen: 'activeBuff-active' as const };

  // Item JSON sometimes omits `damageReductionPct` on DR rows; merge from catalog so DR always snapshots.
  if (String(powerSys?.templateId || '') === 'ab-damage-reduction') {
    const drNow = (rankMechanics as { damageReductionPct?: unknown }).damageReductionPct;
    if (typeof drNow !== 'number' || !Number.isFinite(drNow) || drNow <= 0) {
      const tpl = ALL_POWER_TEMPLATES.find((t: any) => t?.templateId === 'ab-damage-reduction');
      const lvlKey = String(powerLevelKey);
      const row = tpl?.levels?.[lvlKey as keyof typeof tpl.levels] ?? tpl?.levels?.['1'];
      const m = row?.mechanics;
      if (m && typeof m === 'object') {
        rankMechanics = {
          ...(m as unknown as Record<string, unknown>),
          ...rankMechanics,
          applyWhen: 'activeBuff-active',
        };
      } else {
      }
    }
  }

  const drSnap = (rankMechanics as { damageReductionPct?: unknown }).damageReductionPct;
  if (
    String(powerSys?.templateId || '') === 'ab-damage-reduction' &&
    (typeof drSnap !== 'number' || !Number.isFinite(drSnap) || drSnap <= 0)
  ) {
    ui.notifications?.warn(
      'Active Buff: Damage Reduction — snapshot has no valid DR%; check power item `levels` / `rank`.',
    );
  }

  // Create ActiveEffect data - simplified structure for Foundry VTT
  const effectData: any = {
    name: power.name,
    // Generic icon — avoids a misleading power-art token on the map for buffs.
    icon: 'icons/svg/book.svg',
    // Store original power data in flags
    flags: {
      'mastery-system': {
        activeBuff: true,
        powerId: power.id,
        powerName: power.name,
        /** Closed-subsystem DR whitelist (see `power-mechanics.ts` / `isSanctionedDR`). */
        powerTemplateId: powerSys?.templateId ? String(powerSys.templateId) : null,
        masteryRank: masteryRank,
        durationRounds: durationRounds,
        extendedRounds: extendRounds,
        activatedRound: currentRound,
        isUtility: isUtility(power), // Store whether this is a utility
        mechanics: rankMechanics
      }
    },
    // Add description directly (not in system.description.value)
    description: power.system?.description || power.system?.effect || ''
  };
  
  // Add duration if in combat
  if (game.combat) {
    effectData.duration = duration;
  } else {
    // If not in combat, set a long duration so it doesn't expire immediately
    effectData.duration = {
      startRound: null,
      startTurn: null,
      rounds: durationRounds,
      turns: null,
      seconds: null,
      combat: null
    };
  }
  
  try {
    // Create the effect on the actor
    const created = await (actor as any).createEmbeddedDocuments('ActiveEffect', [effectData]);
    ui.notifications?.info(
      `Activated ${power.name} (Duration: ${durationRounds} rounds${extendRounds > 0 ? `, incl. +${extendRounds} from Extend Active Buff` : ''})`,
    );

    try {
      const ChatCls = (globalThis as any).ChatMessage;
      const esc =
        (globalThis as any).foundry?.utils?.escapeHTML?.bind((globalThis as any).foundry.utils) ??
        ((s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      const lines: string[] = [
        `<p><strong>${esc(String(power.name))}</strong> — active <strong>${durationRounds}</strong> round${durationRounds === 1 ? '' : 's'}.</p>`,
      ];
      if (extendRounds > 0) {
        lines.push(`<p>Extend Active Buff (Vitality Stone): <strong>+${extendRounds}</strong> round${extendRounds === 1 ? '' : 's'}.</p>`);
      }
      const rm: any = rankMechanics ?? {};
      if (typeof rm.damageReductionPct === 'number' && rm.damageReductionPct > 0) {
        lines.push(
          `<p>Buff: <strong>+${rm.damageReductionPct}%</strong> Damage Reduction (stacks with passive DR in combat totals).</p>`,
        );
      }
      if (typeof rm.armor === 'number' && rm.armor !== 0) {
        lines.push(`<p>Buff: <strong>+${rm.armor}</strong> Armor.</p>`);
      }
      if (typeof rm.evade === 'number' && rm.evade !== 0) {
        lines.push(`<p>Buff: <strong>+${rm.evade}</strong> Evade.</p>`);
      }
      await ChatCls.create({
        user: (game as any).user?.id,
        speaker: ChatCls.getSpeaker({ actor: actor as any }),
        content: lines.join(''),
      });
    } catch (chatErr) {
      console.warn('Mastery System | Active buff chat message failed', chatErr);
    }
    
    return true;
  } catch (error) {
    console.error('Mastery System | Failed to activate active buff', error);
    ui.notifications?.error(`Failed to activate ${power.name}`);
    return false;
  }
}

/**
 * Get all active buffs on an actor
 */
export function getActiveBuffs(actor: Actor): any[] {
  const effects = (actor as any).effects;
  if (!effects) return [];
  
  return effects.filter((effect: any) => {
    const flags = effect.flags?.['mastery-system'];
    return flags?.activeBuff === true;
  });
}

/**
 * Highest Active Buff Critical(X) currently maintained (0 if none).
 * X = Critical-capable attacks per Round (not explode strength).
 * Resolution lives in `src/combat/critical-resolution.ts`.
 */
export function getActiveBuffCriticalTier(actor: Actor): number {
  let best = 0;
  for (const effect of getActiveBuffs(actor)) {
    const flags = effect.flags?.['mastery-system'] ?? {};
    const mech = flags.mechanics ?? {};
    const crit = Math.max(0, Math.floor(Number(mech.critical) || 0));
    if (crit > best) best = crit;
  }
  return best;
}

/**
 * Check if a specific power is currently active as a buff
 */
export function isPowerActiveAsBuff(actor: Actor, powerId: string): boolean {
  const activeBuffs = getActiveBuffs(actor);
  return activeBuffs.some((effect: any) => {
    const flags = effect.flags?.['mastery-system'];
    return flags?.powerId === powerId;
  });
}

/**
 * Remove all Mastery-flagged active-buff ActiveEffects from an actor (e.g. combat end).
 */
export async function deleteAllMasteryActiveBuffEffects(actor: Actor): Promise<void> {
  const effects = getActiveBuffs(actor);
  if (!effects.length) return;
  const ids = effects.map((e: any) => e.id).filter(Boolean);
  if (!ids.length) return;
  try {
    await (actor as any).deleteEmbeddedDocuments('ActiveEffect', ids);
  } catch (err) {
    console.warn('Mastery System | deleteAllMasteryActiveBuffEffects failed', err);
  }
}
