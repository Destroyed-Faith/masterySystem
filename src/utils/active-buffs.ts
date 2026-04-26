/**
 * Active Buff utilities for the Mastery System
 * Active Buffs are powers that create effects lasting for "Mastery Rank rounds"
 */

import { powerCostPaysAction } from '../radial-menu/options.js';
import { resolvePowerMechanics } from './power-mechanics.js';

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
  
  // If it's a true active buff, check if another one is already active
  if (isTrueBuff) {
    const existingTrueBuffs = getTrueActiveBuffs(actor);
    if (existingTrueBuffs.length > 0) {
      const existingBuff = existingTrueBuffs[0];
      const existingName = existingBuff.name || 'Unknown';
      ui.notifications?.warn(`Cannot activate ${power.name}: Another active buff (${existingName}) is already active. Only one active buff can be active at a time.`);
      return false;
    }
  }
  
  const masteryRank = getMasteryRank(actor);
  const currentRound = getCurrentRound();
  
  // Calculate duration in rounds
  // Duration is "Mastery Rank rounds"
  // Foundry's ActiveEffect duration uses rounds/turns/seconds
  const duration = {
    startRound: currentRound,
    startTurn: game.combat?.turn || 0,
    rounds: masteryRank,
    turns: 0,
    seconds: null,
    combat: game.combat?.id || null
  };
  
  // Snapshot the rank-specific mechanics block onto the effect flag so the
  // Power Mechanics aggregator has self-contained data even if the source
  // power item is later removed. Falls back to the power-level default.
  const powerSys: any = power.system || {};
  const powerRank = Math.max(1, Math.min(4, Number(powerSys.rank ?? 1)));
  const rankMechanicsRaw =
    powerSys.levels?.[String(powerRank)]?.mechanics ?? powerSys.mechanics ?? null;
  // Aggregator requires `applyWhen: 'activeBuff-active'` on the snapshot (item
  // JSON may omit it when only partial mechanics are stored on the level).
  const rankMechanics =
    rankMechanicsRaw && typeof rankMechanicsRaw === 'object'
      ? { ...rankMechanicsRaw, applyWhen: 'activeBuff-active' as const }
      : { applyWhen: 'activeBuff-active' as const };

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
      rounds: masteryRank,
      turns: null,
      seconds: null,
      combat: null
    };
  }
  
  try {
    console.log('Mastery System | Creating ActiveEffect:', effectData);
    // Create the effect on the actor
    const created = await (actor as any).createEmbeddedDocuments('ActiveEffect', [effectData]);
    console.log('Mastery System | ActiveEffect created:', created);
    
    ui.notifications?.info(`Activated ${power.name} (Duration: ${masteryRank} rounds)`);

    try {
      const ChatCls = (globalThis as any).ChatMessage;
      const esc =
        (globalThis as any).foundry?.utils?.escapeHTML?.bind((globalThis as any).foundry.utils) ??
        ((s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      const lines: string[] = [
        `<p><strong>${esc(String(power.name))}</strong> — active <strong>${masteryRank}</strong> round${masteryRank === 1 ? '' : 's'}.</p>`,
      ];
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

/** Strip buff effects from every combatant when an encounter ends. */
export async function clearMasteryActiveBuffsForCombatants(combat: Combat): Promise<void> {
  for (const c of combat.combatants) {
    const a = c.actor as Actor | undefined;
    if (!a) continue;
    await deleteAllMasteryActiveBuffEffects(a);
  }
}

