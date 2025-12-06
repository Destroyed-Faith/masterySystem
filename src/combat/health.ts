/**
 * Health Levels System for Mastery System
 * 
 * Rules:
 * - Each Health Level has Vitality × 2 boxes
 * - Characters have multiple Health Levels
 * - Taking damage fills boxes, which impose wound penalties
 * - Wound penalties: -1 die per damaged Health Level
 */

export interface HealthLevel {
  name: string;
  boxes: number;           // Total boxes (Vitality × 2)
  damageBoxes: number;     // Boxes currently filled with damage
  penalty: number;         // Penalty when this level is damaged (-1 die)
  scarred: boolean;        // Cannot be healed in combat/day
}

export interface HealthLevelsData {
  levels: HealthLevel[];
  totalBoxes: number;
  damagedBoxes: number;
  currentPenalty: number;  // Total wound penalty (accumulated)
}

/**
 * Initialize health levels for an actor based on Vitality
 * 
 * Standard Health Levels:
 * - Healthy (no penalty)
 * - Bruised (-1 die)
 * - Hurt (-2 dice)
 * - Injured (-3 dice)
 * - Wounded (-4 dice)
 * - Mauled (-5 dice)
 * - Crippled (-6 dice)
 * - Incapacitated (down)
 */
export function initializeHealthLevels(vitality: number): HealthLevel[] {
  const boxesPerLevel = vitality * 2;
  
  return [
    { name: 'Healthy', boxes: boxesPerLevel, damageBoxes: 0, penalty: 0, scarred: false },
    { name: 'Bruised', boxes: boxesPerLevel, damageBoxes: 0, penalty: 1, scarred: false },
    { name: 'Hurt', boxes: boxesPerLevel, damageBoxes: 0, penalty: 2, scarred: false },
    { name: 'Injured', boxes: boxesPerLevel, damageBoxes: 0, penalty: 3, scarred: false },
    { name: 'Wounded', boxes: boxesPerLevel, damageBoxes: 0, penalty: 4, scarred: false },
    { name: 'Mauled', boxes: boxesPerLevel, damageBoxes: 0, penalty: 5, scarred: false },
    { name: 'Crippled', boxes: boxesPerLevel, damageBoxes: 0, penalty: 6, scarred: false },
    { name: 'Incapacitated', boxes: boxesPerLevel, damageBoxes: 0, penalty: 999, scarred: false }
  ];
}

/**
 * Get current health status for an actor
 */
export function getHealthLevelsData(actor: any): HealthLevelsData {
  const vitality = actor.system.attributes?.vitality?.value || 2;
  
  // Initialize or get existing levels
  let levels = actor.system.health?.levels;
  if (!levels || levels.length === 0) {
    levels = initializeHealthLevels(vitality);
  }
  
  // Calculate totals
  const totalBoxes = levels.reduce((sum: number, level: HealthLevel) => sum + level.boxes, 0);
  const damagedBoxes = levels.reduce((sum: number, level: HealthLevel) => sum + level.damageBoxes, 0);
  
  // Calculate current penalty (highest damaged level)
  let currentPenalty = 0;
  for (const level of levels) {
    if (level.damageBoxes > 0) {
      currentPenalty = level.penalty;
    }
  }
  
  return {
    levels,
    totalBoxes,
    damagedBoxes,
    currentPenalty
  };
}

/**
 * Apply damage to health levels
 * Fills boxes from top to bottom
 * Marks level as scarred when completely filled
 * 
 * @param actor - The actor taking damage
 * @param damage - Amount of damage
 * @returns Updated health levels
 */
export async function applyDamageToHealthLevels(
  actor: any,
  damage: number
): Promise<HealthLevelsData> {
  
  const healthData = getHealthLevelsData(actor);
  const levels = [...healthData.levels];
  
  let remainingDamage = damage;
  
  // Fill boxes from top to bottom
  for (const level of levels) {
    if (remainingDamage <= 0) break;
    
    const availableBoxes = level.boxes - level.damageBoxes;
    const boxesToFill = Math.min(remainingDamage, availableBoxes);
    
    level.damageBoxes += boxesToFill;
    remainingDamage -= boxesToFill;
    
    // Mark as scarred if level is completely filled
    if (level.damageBoxes >= level.boxes && !level.scarred) {
      level.scarred = true;
      console.log(`Mastery System | Health level ${level.name} is now scarred`);
    }
  }
  
  // Save updated levels
  await actor.update({
    'system.health.levels': levels
  });
  
  // Check if incapacitated
  const lastLevel = levels[levels.length - 1];
  if (lastLevel.damageBoxes > 0) {
    ui.notifications?.error(`${actor.name} is INCAPACITATED!`);
    
    await ChatMessage.create({
      user: (game as any).user?.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `
        <div class="mastery-incapacitated">
          <h3>${actor.name} is Incapacitated!</h3>
          <p>They have fallen and cannot continue fighting.</p>
        </div>
      `,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
  }
  
  // Calculate new wound penalty
  const newHealthData = getHealthLevelsData(actor);
  const oldPenalty = healthData.currentPenalty;
  const newPenalty = newHealthData.currentPenalty;
  
  if (newPenalty > oldPenalty) {
    ui.notifications?.warn(`${actor.name} now has -${newPenalty} dice from wounds!`);
  }
  
  console.log(`Mastery System | ${actor.name} took ${damage} damage, now at -${newPenalty} dice penalty`);
  
  return newHealthData;
}

/**
 * Heal damage from health levels
 * Clears boxes from the CURRENT active level only (per rules)
 * Cannot heal scarred levels
 * 
 * @param actor - The actor being healed
 * @param healing - Amount of healing
 * @returns Updated health levels
 */
export async function healHealthLevels(
  actor: any,
  healing: number
): Promise<HealthLevelsData> {
  
  const healthData = getHealthLevelsData(actor);
  const levels = [...healthData.levels];
  
  let remainingHealing = healing;
  
  // Find the current active level (highest damaged, non-scarred level)
  let currentLevelIndex = -1;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (levels[i].damageBoxes > 0 && !levels[i].scarred) {
      currentLevelIndex = i;
      break;
    }
  }
  
  if (currentLevelIndex === -1) {
    ui.notifications?.info(`${actor.name} has no healable damage (all scarred or undamaged)`);
    return healthData;
  }
  
  // Heal only the current level
  const currentLevel = levels[currentLevelIndex];
  const boxesToClear = Math.min(remainingHealing, currentLevel.damageBoxes);
  currentLevel.damageBoxes -= boxesToClear;
  
  // Save updated levels
  await actor.update({
    'system.health.levels': levels
  });
  
  const newHealthData = getHealthLevelsData(actor);
  
  ui.notifications?.info(`${actor.name} healed ${boxesToClear} damage (penalty now: -${newHealthData.currentPenalty} dice)`);
  
  console.log(`Mastery System | ${actor.name} healed ${boxesToClear} in ${currentLevel.name}, penalty: -${newHealthData.currentPenalty} dice`);
  
  return newHealthData;
}

/**
 * Long rest healing - removes scarring and heals all levels
 */
export async function longRestHeal(actor: any): Promise<void> {
  const healthData = getHealthLevelsData(actor);
  const levels = healthData.levels.map(level => ({
    ...level,
    damageBoxes: 0,
    scarred: false
  }));
  
  await actor.update({
    'system.health.levels': levels
  });
  
  await ChatMessage.create({
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="mastery-long-rest">
        <h3>${actor.name} completes a Long Rest</h3>
        <p>All Health Levels restored and scarring removed.</p>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER
  });
  
  ui.notifications?.info(`${actor.name} fully healed from Long Rest!`);
  console.log(`Mastery System | ${actor.name} long rest - all levels healed and unscarred`);
}

/**
 * Get wound penalty for rolls
 * Used when rolling dice - subtract this many dice from the pool
 * 
 * @param actor - The actor
 * @returns Number of dice to subtract
 */
export function getWoundPenalty(actor: any): number {
  const healthData = getHealthLevelsData(actor);
  return healthData.currentPenalty;
}

/**
 * Check if actor is incapacitated
 */
export function isIncapacitated(actor: any): boolean {
  const healthData = getHealthLevelsData(actor);
  const lastLevel = healthData.levels[healthData.levels.length - 1];
  return lastLevel.damageBoxes > 0;
}

/**
 * Get current health level name
 * Returns the name of the highest damaged level
 */
export function getCurrentHealthLevelName(actor: any): string {
  const healthData = getHealthLevelsData(actor);
  
  for (let i = healthData.levels.length - 1; i >= 0; i--) {
    if (healthData.levels[i].damageBoxes > 0) {
      return healthData.levels[i].name;
    }
  }
  
  return 'Healthy';
}

/**
 * Fully heal an actor (clear all damage)
 */
export async function fullHeal(actor: any): Promise<void> {
  const healthData = getHealthLevelsData(actor);
  const levels = healthData.levels.map(level => ({
    ...level,
    damageBoxes: 0
  }));
  
  await actor.update({
    'system.health.levels': levels
  });
  
  ui.notifications?.info(`${actor.name} is fully healed!`);
}

