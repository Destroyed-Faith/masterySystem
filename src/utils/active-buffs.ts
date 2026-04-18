/**
 * Active Buff utilities for the Mastery System
 * Active Buffs are powers that create effects lasting for "Mastery Rank rounds"
 */

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
  const cost = power.system?.cost;
  
  // Utilities are NOT true active buffs (they can stack)
  if (powerType === 'utility') {
    return false;
  }
  
  // Check if it's explicitly an active-buff or buff power that requires an action
  if ((powerType === 'active-buff' || powerType === 'buff') && cost?.action === true) {
    return true;
  }
  
  // Check tags for active-buff indicators
  const tags = power.system?.tags || [];
  if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
    if (cost?.action === true) {
      return true;
    }
  }
  
  // Check if power type is 'active' but has buff-like characteristics
  if (powerType === 'active' && cost?.action === true) {
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
  const cost = power.system?.cost;
  const range = power.system?.range;
  
  // Check if it's explicitly an active-buff or buff power that requires an action
  if ((powerType === 'active-buff' || powerType === 'buff') && cost?.action === true) {
    return true;
  }
  
  // Check tags for active-buff indicators
  const tags = power.system?.tags || [];
  if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
    if (cost?.action === true) {
      return true;
    }
  }
  
  // Check if power type is 'active' but has buff-like characteristics
  if (powerType === 'active' && cost?.action === true) {
    const nameLower = power.name?.toLowerCase() || '';
    const descLower = (power.system?.description || '').toLowerCase();
    if (nameLower.includes('buff') || descLower.includes('buff') || 
        nameLower.includes('stance') || descLower.includes('stance')) {
      return true;
    }
  }
  
  // Check if it's a utility that is Self-targeting (these are also active buffs)
  if (powerType === 'utility' && cost?.action === true) {
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
  const rankMechanics =
    powerSys.levels?.[String(powerRank)]?.mechanics ?? powerSys.mechanics ?? null;

  // Create ActiveEffect data - simplified structure for Foundry VTT
  const effectData: any = {
    name: power.name,
    icon: power.img || power.system?.img || 'icons/svg/aura.svg',
    // Store original power data in flags
    flags: {
      'mastery-system': {
        activeBuff: true,
        powerId: power.id,
        powerName: power.name,
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

