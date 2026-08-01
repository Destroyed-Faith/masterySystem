/**
 * Option Collection and Parsing for Radial Menu
 */

import type { CombatSlot, CombatManeuver } from '../system/combat-maneuvers';
import { getAvailableManeuvers } from '../system/combat-maneuvers';
import { isManeuverHiddenFromActorRadial } from '../utils/radial-maneuver-prefs.js';
import type { RadialCombatOption, TargetGroup, AoEShape, InnerSegment } from './types';
import type { AoeSpec } from '../types/item.js';
import { getPowerDefinitionRank } from '../utils/power-definition-rank.js';
import { getMovementRangeBonusMeters, hasPowerBeenUsedThisRound } from '../combat/action-economy.js';
import {
  formatNpcAttackSpecialsLine,
  npcAttackDiceCount,
  npcDamageDiceFormula,
  resolveNpcAttackList
} from '../utils/npc-attack-model.js';
import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { formatRadialPowerDisplayName } from './power-radial-label.js';
import { buildArtifactRadialOptions } from './artifact-options.js';
import { artifactPowersUnlocked } from '../utils/artifact-actor-rules.js';
import { resolveEquippedWeaponForAttackType } from '../utils/unarmed-fallback.js';

/**
 * True when activating spends an action: legacy `cost.action === true` or
 * string `attack` / `full` / `utility` (e.g. catalog active buffs).
 */
export function powerCostPaysAction(
  cost: { action?: unknown; actions?: unknown } | undefined,
): boolean {
  if (!cost) return false;
  if (cost.actions === true) return true;
  const a = cost.action;
  if (a === true) return true;
  if (typeof a === 'string' && ['attack', 'full', 'utility'].includes(a)) return true;
  return false;
}

function buildNpcAttackDescription(atk: any): string {
  const pool = npcAttackDiceCount(atk);
  const dmg = npcDamageDiceFormula(atk);
  const parts: string[] = [];
  parts.push(pool > 0 ? `Angriff: ${pool}d8` : `Angriff: ${String(atk?.attackDice || '—').trim() || '—'}`);
  parts.push(`Schaden: ${dmg}`);
  const stress = Math.max(0, Math.floor(Number(atk?.npcStressD8) || 0));
  if (stress > 0) parts.push(`Stress: ${stress}d8`);
  if (atk?.armor) parts.push(`Rüstung: ${atk.armor}`);
  const sp = formatNpcAttackSpecialsLine(atk);
  if (sp) parts.push(`Spezial: ${sp}`);
  return parts.join(' · ');
}

/**
 * One radial entry per NSC attack row (active phase when using phases).
 */
function buildNpcAttackRadialOptions(actor: any): RadialCombatOption[] {
  if (!actor || actor.type !== 'npc') return [];
  const { attacks, phaseIndex } = resolveNpcAttackList(actor.system || {});
  if (!attacks.length) return [];
  const phaseKey = phaseIndex == null ? 'root' : String(phaseIndex);
  return attacks.map((atk: any, index: number) => {
    const kind = String(atk?.npcRangeKind || '').toLowerCase() === 'ranged' ? 'ranged' : 'melee';
    const rangeM =
      kind === 'ranged'
        ? Math.max(6, Math.floor(Number(atk?.npcRangeMeters) || 12))
        : 2;
    const shapeRaw = String(atk?.npcAoeShape || 'none').toLowerCase();
    const shape =
      shapeRaw === 'radius' || shapeRaw === 'cone' || shapeRaw === 'line' ? shapeRaw : 'none';
    const rad = Math.max(0, Math.floor(Number(atk?.npcAoeRadiusM) || 0));
    const burstMelee = kind === 'melee' && shape === 'radius' && rad > 0;
    const splash = Math.max(0, Math.floor(Number(atk?.npcMeleeAoeBonusD8) || 0));
    return {
      id: `npc-attack-${phaseKey}-${index}`,
      name: (atk?.name && String(atk.name).trim()) || `Angriff ${index + 1}`,
      description: buildNpcAttackDescription(atk),
      slot: 'attack' as CombatSlot,
      source: 'npc-attack' as const,
      range: rangeM,
      aoeShape: shape as any,
      aoeRadiusMeters: rad > 0 ? rad : undefined,
      burstMeleeAoE: burstMelee,
      burstMeleeRadiusMeters: burstMelee ? rad : undefined,
      npcAttackIndex: index,
      npcPhaseIndex: phaseIndex,
      costsAction: true,
      costsMovement: false,
      npcSplitAttack: !!atk?.npcSplitAttack,
      npcMeleeAoeBonusD8: splash,
      tags: ['attack', 'npc-attack']
    };
  });
}

/**
 * Parse range string (e.g., "8m", "12m", "Self") to numeric meters
 */
function parseRange(rangeStr: string | undefined): number | undefined {
  if (!rangeStr) return undefined;
  
  // Handle "Self" or "0m" as 0
  if (rangeStr.toLowerCase() === 'self' || rangeStr === '0m') {
    return 0;
  }
  
  // Extract numeric value from strings like "8m", "12m", "24m"
  const match = rangeStr.match(/(\d+(?:\.\d+)?)\s*m/i);
  if (match) {
    return parseFloat(match[1]);
  }
  
  return undefined;
}

/**
 * Get equipped weapon from actor
 * @param actor - The actor to check for equipped weapon
 * @returns The equipped weapon item or null
 */
function getEquippedWeapon(actor: any): any {
  if (!actor) return null;
  
  const items = actor.items || [];
  return items.find((item: any) => 
    item.type === 'weapon' && (item.system as any)?.equipped === true
  ) || null;
}

/**
 * Get reach bonus from equipped weapon (real weapon item or equipped artifact
 * weapon, e.g. an artifact with the Reach free trait).
 * @param actor - The actor to check for equipped weapon
 * @returns Reach bonus in meters (0, 1, or 2)
 */
function getReachBonus(actor: any): number {
  const equippedWeapon =
    getEquippedWeapon(actor) ||
    resolveEquippedWeaponForAttackType(actor?.items || [], 'melee');
  if (!equippedWeapon) return 0;

  const weaponSystem = equippedWeapon.system as any;
  const innateAbilities = weaponSystem.innateAbilities || [];
  const reachAbility = innateAbilities.find((a: string) => a.includes('Reach'));
  
  if (!reachAbility) return 0;
  
  // Match new format: "Reach (+1 m)" or "Reach (+2 m)"
  const bonusMatch = reachAbility.match(/Reach\s*\(\+\s*(\d+)\s*m\)/i);
  if (bonusMatch) {
    return parseInt(bonusMatch[1], 10);
  }
  
  // Legacy support: Match old format: "Reach (2 m)" or "Reach (3 m)"
  const legacyMatch = reachAbility.match(/Reach\s*\((\d+)\s*m\)/i);
  if (legacyMatch) {
    const totalReach = parseInt(legacyMatch[1], 10);
    return Math.max(0, totalReach - 2); // Subtract base 2m
  }
  
  return 0;
}

/**
 * Get weapon range from equipped weapon
 * @param actor - The actor to check for equipped weapon
 * @returns Weapon range in meters or undefined
 */
function getWeaponRange(actor: any): number | undefined {
  const equippedWeapon = getEquippedWeapon(actor);
  if (!equippedWeapon) return undefined;
  
  const weaponSystem = equippedWeapon.system as any;
  const weaponRangeStr = weaponSystem.range;
  
  if (!weaponRangeStr) return undefined;
  
  // Parse weapon range (e.g., "30m", "0m")
  return parseRange(weaponRangeStr);
}

/**
 * Calculate range for a combat option
 * @param actor - The actor
 * @param optionId - Option ID (for special cases like disengage)
 * @param slot - Combat slot
 * @param rangeStr - Range string from power/maneuver
 * @param levelData - Level data from power definition (optional)
 * @returns Range in meters
 */
function calculateRange(
  actor: any,
  optionId: string,
  slot: CombatSlot,
  rangeStr: string | undefined,
  levelData?: any
): number | undefined {
  const moveBonus = getMovementRangeBonusMeters(actor, game.combat ?? null);

  // Special case: Disengage uses actor's movement
  if (optionId === 'disengage') {
    const actorSpeed = (actor.system as any)?.combat?.speed || 8;
    return actorSpeed + moveBonus;
  }
  
  // Special case: Move uses actor's speed
  if (optionId === 'move') {
    const actorSpeed = (actor.system as any)?.combat?.speed || 8;
    return actorSpeed + moveBonus;
  }
  
  // Special case: Dash uses 2x actor's speed
  if (optionId === 'dash') {
    const actorSpeed = (actor.system as any)?.combat?.speed || 8;
    return actorSpeed * 2 + moveBonus;
  }
  
  // Check if it's a melee power/attack
  const isMelee = !rangeStr || 
                  rangeStr.toLowerCase() === 'self' || 
                  rangeStr === '0m' ||
                  rangeStr === '0' ||
                  rangeStr.toLowerCase() === 'melee' ||
                  rangeStr.toLowerCase() === 'touch' ||
                  (levelData && levelData.type && levelData.type.toLowerCase() === 'melee');
  
  // For melee attacks/powers: use weapon range if available, otherwise 2m base + reach bonus
  if (slot === 'attack' && isMelee) {
    // First try to get weapon range
    const weaponRange = getWeaponRange(actor);
    if (weaponRange !== undefined) {
      // If weapon is melee (0m), calculate with reach
      if (weaponRange === 0) {
        const reachBonus = getReachBonus(actor);
        return 2 + reachBonus; // Base 2m + reach bonus
      }
      // If weapon is ranged, use weapon range
      return weaponRange;
    }
    // No weapon equipped, use default melee range
    const reachBonus = getReachBonus(actor);
    return 2 + reachBonus; // Base 2m + reach bonus
  }
  
  // For powers with no range specified: use weapon range if available
  if (!rangeStr || rangeStr.trim() === '') {
    const weaponRange = getWeaponRange(actor);
    if (weaponRange !== undefined) {
      return weaponRange;
    }
  }
  
  // For other cases: parse from range string
  let range = parseRange(rangeStr);
  
  // If range is missing and we have levelData, try to get it from there
  if ((!rangeStr || !range) && levelData && levelData.range) {
    range = parseRange(levelData.range);
    
    // If parsed range is still missing and it's a melee power, try weapon range
    if (!range && (levelData.type?.toLowerCase() === 'melee' || levelData.range?.toLowerCase() === 'melee')) {
      const weaponRange = getWeaponRange(actor);
      if (weaponRange !== undefined) {
        return weaponRange;
      }
    }
  }
  
  // If still no range and it's a melee power, use weapon range
  if (!range && isMelee) {
    const weaponRange = getWeaponRange(actor);
    if (weaponRange !== undefined) {
      return weaponRange;
    }
  }
  
  return range;
}

/**
 * True when the actor has an equipped/bound AND activated weapon-kind artifact
 * (e.g. Dragon Claws). Such artifacts ARE the weapon and provide their own
 * attack option, so the generic "Weapon Attack" maneuver is suppressed to
 * avoid a duplicate. An inactive artifact surfaces no own attack entry, so
 * the generic "Weapon Attack" must stay (it still rolls the artifact's dice).
 */
function actorHasEquippedWeaponArtifact(actor: any): boolean {
  const items: any[] = actor?.items ? Array.from(actor.items) : [];
  return items.some((item: any) => {
    if (item?.type !== 'artifact') return false;
    const sys = (item.system as any) || {};
    if (sys.artifactKind !== 'weapon' || !sys.artifactWeapon) return false;
    if (!artifactPowersUnlocked(actor, item)) return false;
    const binding = String(sys.binding || '').toLowerCase();
    if (binding === 'bound' || binding === 'echo') return true;
    if (sys.equipped === true) return true;
    try {
      const flagSlot = item.getFlag?.('mastery-system', 'equipment')?.slot;
      if (typeof flagSlot === 'string' && flagSlot.length > 0) return true;
    } catch {
      /* ignore */
    }
    return false;
  });
}

/**
 * Map power type to combat slot
 */
function mapPowerTypeToSlot(powerType: string): CombatSlot {
  switch (powerType) {
    case 'movement':
      return 'movement';
    case 'reaction':
      return 'reaction';
    case 'utility':
      return 'utility';
    case 'active':
    case 'active-buff':
    case 'buff':
    default:
      return 'attack';
  }
}

function isAoeSpecObject(aoe: unknown): aoe is AoeSpec {
  return typeof aoe === 'object' && aoe !== null && 'shape' in aoe;
}

/**
 * Parse AoE radius from string (e.g. "Radius 2m") or from AoeSpec (`radiusM` or legacy `m`).
 */
function parseAoERadius(aoeInput: string | AoeSpec | undefined): number | undefined {
  if (aoeInput === undefined || aoeInput === null || aoeInput === '') {
    return undefined;
  }
  if (isAoeSpecObject(aoeInput)) {
    const o = aoeInput;
    if (o.shape === 'radius' || o.shape === 'burst' || o.shape === 'aura') {
      const r = o.radiusM ?? o.m;
      return r !== undefined ? r : undefined;
    }
    return undefined;
  }
  const match = String(aoeInput).match(/radius\s*(\d+(?:\.\d+)?)\s*m/i);
  if (match) {
    return parseFloat(match[1]);
  }
  return undefined;
}

/**
 * Parse AoE shape from string or AoeSpec (object definitions use `m` instead of `radiusM`).
 */
function parseAoEShape(aoeInput: string | AoeSpec | undefined): AoEShape {
  if (aoeInput === undefined || aoeInput === null || aoeInput === '') {
    return 'none';
  }
  if (isAoeSpecObject(aoeInput)) {
    const s = aoeInput.shape;
    if (s === 'none' || s === 'single' || s === 'weapon') return 'none';
    if (s === 'radius' || s === 'burst' || s === 'aura') return 'radius';
    if (s === 'cone') return 'cone';
    if (s === 'line') return 'line';
    return 'none';
  }
  const lower = String(aoeInput).toLowerCase();
  if (lower.includes('radius') || lower.includes('burst') || lower.includes('aura')) {
    return 'radius';
  }
  if (lower.includes('cone')) {
    return 'cone';
  }
  if (lower.includes('line')) {
    return 'line';
  }
  return 'none';
}

/**
 * Determine default target group from power description and type
 */
function determineTargetGroup(option: RadialCombatOption): TargetGroup {
  // Check if explicitly set
  if (option.defaultTargetGroup) {
    return option.defaultTargetGroup;
  }
  
  // Check description for keywords
  const desc = (option.description || '').toLowerCase();
  const name = (option.name || '').toLowerCase();
  
  // Check for "allies" keywords
  if (desc.includes('allies') || desc.includes('ally') || 
      name.includes('bless') || name.includes('beacon') || name.includes('healing')) {
    return 'ally';
  }
  
  // Check for "enemies" keywords
  if (desc.includes('enemies') || desc.includes('enemy') || desc.includes('hostile')) {
    return 'enemy';
  }
  
  // Check for "creatures" or "all creatures"
  if (desc.includes('creatures') || desc.includes('all creatures') || 
      name.includes('feather fall')) {
    return 'creature';
  }
  
  // Default for utilities: ally
  if (option.slot === 'utility') {
    return 'ally';
  }
  
  return 'any';
}


/**
 * Map an option to one of the 4 inner segment IDs
 * This determines which inner quadrant (Buff/Move/Util/Atk) an option belongs to
 */
export function getSegmentIdForOption(option: RadialCombatOption): InnerSegment['id'] {
  // Maneuvers: route the combat stances (Parry/Dodge) into the MAN. segment
  // even though their slot is 'attack'. Keeps the Atk quadrant focused on
  // actual attacks (Weapon Attack + offensive powers).
  if (option.source === 'maneuver' && option.maneuver) {
    const mid = option.maneuver.id;
    if (mid === 'parry-stance' || mid === 'dodge-stance') {
      return 'utility';
    }
  }

  // Active Buff powers get their own segment
  // Check if it's a power with buff/active-buff type that requires an action
  if (option.source === 'power' && option.item) {
    const powerType = option.powerType || (option.item.system as any)?.powerType;
    const cost = (option.item.system as any)?.cost;
    const range = option.range || (option.item.system as any)?.range;

    // Artifact Active Buffs (e.g. Titan Scars' Growth Form) carry no
    // `system.cost` on the artifact item; route them by option metadata.
    if (
      (option.tags || []).includes('artifact') &&
      (powerType === 'active-buff' || powerType === 'activeBuff')
    ) {
      return 'active-buff';
    }

    // Canonical active-buff templates use category `activeBuff` and mechanics
    // `applyWhen: 'activeBuff-active'`. Those must never be routed through the
    // enemy-targeting attack pipeline.
    if (
      (powerType === 'active-buff' || powerType === 'activeBuff' || powerType === 'buff') &&
      powerCostPaysAction(cost)
    ) {
      return 'active-buff';
    }

    try {
      const mech = resolvePowerMechanics(option.item);
      if (mech?.applyWhen === 'activeBuff-active' && powerCostPaysAction(cost)) {
        return 'active-buff';
      }
    } catch {
      /* ignore */
    }
    
    // Check tags for active-buff indicators
    const tags = option.tags || [];
    if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
      if (powerCostPaysAction(cost)) {
        return 'active-buff';
      }
    }
    
    // Also check if power type is 'active' but has buff-like characteristics
    if (powerType === 'active' && option.slot === 'attack') {
      // Check if description or name suggests it's a buff
      const nameLower = option.name.toLowerCase();
      const descLower = (option.description || '').toLowerCase();
      if (nameLower.includes('buff') || descLower.includes('buff') || 
          nameLower.includes('stance') || descLower.includes('stance')) {
        return 'active-buff';
      }
    }
    
    // Check if it's a utility that is Self-targeting (these are also active buffs)
    if (powerType === 'utility' && powerCostPaysAction(cost)) {
      const rangeStr = range?.toString().toLowerCase() || '';
      // If range is "Self" or 0, it's a self-buff utility
      if (rangeStr === 'self' || rangeStr === '0' || range === 0) {
        return 'active-buff';
      }
      // Also check if it has buff-like tags or characteristics
      if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
        return 'active-buff';
      }
      // Check name/description for buff indicators
      const nameLower = option.name.toLowerCase();
      const descLower = (option.description || '').toLowerCase();
      if (nameLower.includes('buff') || descLower.includes('buff') || 
          nameLower.includes('stance') || descLower.includes('stance')) {
        return 'active-buff';
      }
    }
  }
  
  // Map by slot
  switch (option.slot) {
    case 'movement':
      return 'movement';
    case 'attack':
      return 'attack';
    case 'utility':
      return 'utility';
    case 'reaction':
      // Reactions go to utility segment
      return 'utility';
    default:
      // Default to attack for offensive actions
      return 'attack';
  }
}

/**
 * Get all combat options for an actor (all categories)
 * Collects all Powers and Maneuvers available to the actor
 * Builds movement segment with proper ordering: core maneuvers first, then powers, then other maneuvers
 */
export async function getAllCombatOptionsForActor(actor: any): Promise<RadialCombatOption[]> {
  const options: RadialCombatOption[] = [];
  
  if (!actor) {
    console.warn('Mastery System | getAllCombatOptionsForActor: No actor provided');
    return options;
  }
  
  // Import isActorProne helper
  let isActorProne: ((actor: any, token?: any) => boolean) | null = null;
  try {
    const actorHelpers = await import('../utils/actor-helpers.js' as any);
    isActorProne = actorHelpers.isActorProne;
  } catch (error) {
    console.warn('Mastery System | Could not load actor helpers:', error);
  }
  
  // Get token for prone check
  const token = canvas.tokens?.placeables?.find((t: any) => t.actor?.id === actor.id);
  const isProne = isActorProne ? isActorProne(actor, token) : false;
  
  // Pre-load template registry for range/aoe lookup
  let allTemplates: any[] = [];
  try {
    const powerModule = await import('../utils/powers/index.js' as any);
    allTemplates = powerModule.ALL_POWER_TEMPLATES ?? [];
  } catch (error) {
    console.warn('Mastery System | Could not load power template registry:', error);
  }
  const lookupTemplate = (templateId?: string, powerName?: string): any | null => {
    if (templateId) {
      const hit = allTemplates.find((t: any) => t?.templateId === templateId);
      if (hit) return hit;
    }
    if (powerName) {
      return (
        allTemplates.find(
          (t: any) => t?.templateName === powerName || t?.name === powerName,
        ) ?? null
      );
    }
    return null;
  };
  
  // --- COLLECT ALL OPTIONS (separate by source) ---
  const movementPowers: RadialCombatOption[] = [];
  const allManeuvers: RadialCombatOption[] = [];
  const nonMovementOptions: RadialCombatOption[] = [];
  const npcAttackOptions = buildNpcAttackRadialOptions(actor);
  
  // --- POWERS (from Actor items) ---
  const items = actor.items || [];
  
  for (const item of items) {
    // Powers are stored as items with type "power"
    if (item.type !== 'power') continue;

    if ((item.system as any)?.showInRadialMenu === false) {
      continue;
    }

    const powerType = (item.system as any)?.powerType;
    if (!powerType) continue;
    
    // Only include combat-usable powers (`activeBuff` is the template category
    // from the catalog — must be accepted alongside kebab-case `active-buff`).
    if (
      !['movement', 'active', 'active-buff', 'activeBuff', 'buff', 'utility', 'reaction'].includes(powerType)
    ) {
      continue;
    }

    const combat = game.combat;
    if (combat && hasPowerBeenUsedThisRound(actor as Actor, combat, item.id)) {
      continue;
    }
    
    // Map power type to slot
    const slot = mapPowerTypeToSlot(powerType);
    
    // Parse range from system.range (e.g., "8m", "12m", "Self")
    let rangeStr = (item.system as any)?.range;
    let levelData: any = undefined;
    
    const powerName = item.name;
    const sys = item.system as any;
    const templateId: string | undefined = sys?.templateId;
    const rawLevel = sys?.level || 1;
    const explicitRank = sys?.rank;
    const rankInput =
      explicitRank != null &&
      explicitRank !== '' &&
      Number.isFinite(Number(explicitRank))
        ? Number(explicitRank)
        : rawLevel;
    // Look up in the template registry so utilities/actives can fall back to
    // canonical range/AoE data when the item's system.range is stale.
    const needsDefinitionLookup =
      allTemplates.length > 0 &&
      (templateId || powerName) &&
      (!rangeStr || powerType === 'utility' || slot === 'utility' || powerType === 'active');

    if (needsDefinitionLookup) {
      try {
        const powerDef = lookupTemplate(templateId, powerName);

        if (powerDef && powerDef.levels) {
          const definitionRank = getPowerDefinitionRank(rankInput, sys.levels || powerDef.levels);
          if (Array.isArray(powerDef.levels)) {
            levelData = powerDef.levels.find((l: any) => l.level === definitionRank);
          } else {
            levelData = powerDef.levels[String(definitionRank)];
          }
          // Utilities: always take range/AoE from definition for this rank — system.range on the
          // item is often stale (e.g. still "8 m" after the spell tier was raised to 4 / 16 m).
          if (
            levelData &&
            levelData.range &&
            (powerType === 'utility' || slot === 'utility' || !rangeStr || powerType === 'active')
          ) {
            if (typeof levelData.range === 'string') {
              rangeStr = levelData.range;
            } else if (levelData.range.kind) {
              const r = levelData.range;
              if (r.kind === 'distance' && r.m) rangeStr = `${r.m}m`;
              else if (r.kind === 'melee' || r.kind === 'touch') rangeStr = 'Touch';
              else if (r.kind === 'self') rangeStr = 'Self';
            }
          }
        }
      } catch (error) {
        console.warn('Mastery System | Could not lookup power definition:', error);
      }
    }
    
    // Calculate range using the new function
    let range = calculateRange(actor, item.id, slot, rangeStr, levelData);
    
    // Get tags and cost information
    const tags = (item.system as any)?.tags || [];
    const cost = (item.system as any)?.cost || {};
    
    // Check if this is an active buff - active buffs are always Self (range 0)
    const isActiveBuff =
      ((powerType === 'active-buff' || powerType === 'activeBuff' || powerType === 'buff') &&
        powerCostPaysAction(cost)) ||
      ((tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) &&
        powerCostPaysAction(cost));
    
    if (isActiveBuff) {
      range = 0; // Active buffs are always Self
    }
    
    // Parse AoE for utilities; for actives: any Ranged or Zone spell with radius AoE (hex center + burst)
    let aoeShape: AoEShape = 'none';
    let aoeRadiusMeters: number | undefined = undefined;
    let rangeMeters: number | undefined = range;
    let hostileZonePlacement = false;
    let zoneDurationNote: string | undefined = undefined;
    let burstMeleeAoE = false;
    let burstMeleeRadiusMeters: number | undefined = undefined;

    if (slot === 'utility' || powerType === 'utility') {
      let aoeStr = (item.system as any)?.aoe;
      if (levelData && levelData.aoe) {
        aoeStr = levelData.aoe;
      }

      aoeShape = parseAoEShape(aoeStr);
      aoeRadiusMeters = parseAoERadius(aoeStr);
      rangeMeters = range;

      if ((!rangeStr || rangeStr.toLowerCase() === 'self' || range === 0) && aoeShape !== 'none') {
        rangeMeters = 0;
      }
    } else if (slot === 'attack' && powerType === 'active' && levelData) {
      const typeStr = typeof levelData.type === 'string' ? levelData.type : '';
      const looksRangedOrZone = /ranged/i.test(typeStr) || /zone/i.test(typeStr);
      if (looksRangedOrZone) {
        let aoeStr = (item.system as any)?.aoe;
        if (levelData.aoe) {
          aoeStr = levelData.aoe;
        }
        const shape = parseAoEShape(aoeStr);
        const rad = parseAoERadius(aoeStr);
        if (shape === 'radius' && rad !== undefined && rad > 0) {
          aoeShape = 'radius';
          aoeRadiusMeters = rad;
          rangeMeters = range;
          if (!rangeStr || rangeStr.toLowerCase() === 'self' || range === 0) {
            rangeMeters = 0;
          }
          hostileZonePlacement = true;
          zoneDurationNote =
            typeof levelData.duration === 'string' ? levelData.duration : undefined;
        }
      } else if (/melee/i.test(typeStr)) {
        let aoeStrMelee = (item.system as any)?.aoe;
        if (levelData?.aoe) aoeStrMelee = levelData.aoe;
        const shapeM = parseAoEShape(aoeStrMelee || '');
        const radM = parseAoERadius(aoeStrMelee || '');
        if (shapeM === 'radius' && radM !== undefined && radM > 0) {
          burstMeleeAoE = true;
          burstMeleeRadiusMeters = radM;
        }
      }
    }
    
    // Determine costs (new structure: cost.action is a string like 'attack'|'full'|'utility'; old: boolean)
    const actionCost = cost.action;
    const costsMovement = powerType === 'movement' && cost.movement !== false ||
                          actionCost === 'movement';
    const costsAction = actionCost === true || cost.actions === true ||
                        (typeof actionCost === 'string' && ['attack', 'full', 'utility'].includes(actionCost));
    
    // Strip tier suffixes, mark spells, and label split-attack powers (× 2).
    let splitAttack = false;
    try {
      const mech = resolvePowerMechanics(item);
      splitAttack = mech?.splitAttack === true;
    } catch {
      /* ignore */
    }
    const displayName = formatRadialPowerDisplayName(item, { splitAttack });

    const option: RadialCombatOption = {
      id: item.id,
      name: displayName,
      description: (item.system as any)?.description || (item.system as any)?.effect || '',
      slot: slot,
      source: 'power',
      range: range,
      item: item,
      powerType: powerType,
      tags: Array.isArray(tags) ? tags : [],
      costsMovement: costsMovement,
      costsAction: costsAction,
      ...(burstMeleeAoE ? { burstMeleeAoE: true, burstMeleeRadiusMeters } : {}),
    };
    
    // Add utility targeting fields if this is a utility
    if (slot === 'utility' || powerType === 'utility') {
      option.rangeMeters = rangeMeters;
      option.aoeShape = aoeShape;
      option.aoeRadiusMeters = aoeRadiusMeters;
      option.defaultTargetGroup = determineTargetGroup(option);
      option.allowManualTargetSelection = true;
      option.aoePlacementProfile = 'utility';
    } else if (hostileZonePlacement) {
      option.rangeMeters = rangeMeters;
      option.aoeShape = aoeShape;
      option.aoeRadiusMeters = aoeRadiusMeters;
      option.defaultTargetGroup = 'enemy';
      option.allowManualTargetSelection = true;
      option.aoePlacementProfile = 'hostile-zone';
      option.zoneDurationNote = zoneDurationNote;
    }
    
    // Separate movement powers from others
    if (slot === 'movement' || powerType === 'movement') {
      movementPowers.push(option);
    } else {
      nonMovementOptions.push(option);
    }
  }
  
  // --- MANEUVERS (generic combat maneuvers) ---
  const availableManeuvers = getAvailableManeuvers(actor);
  
  // Core movement maneuver IDs (must appear first in movement segment)
  const CORE_MOVEMENT_MANEUVER_IDS = ['move', 'dash', 'disengage', 'stand-up'];
  
  for (const maneuver of availableManeuvers) {
    // Filter out Multiattacks
    if (maneuver.tags?.includes('multiattack') || maneuver.id?.includes('multiattack')) {
      continue;
    }
    
    // Filter out specific movement maneuvers that should not appear in radial menu
    if (maneuver.id === 'charge' || maneuver.id === 'flee-you-fools' || maneuver.id === 'tactical-retreat') {
      continue;
    }
    
    // Filter out specific reaction maneuvers that should not appear in radial menu
    if (maneuver.id === 'readied-action' || 
        maneuver.id === 'counter-attack' || 
        maneuver.id === 'opportunity-attack' || 
        maneuver.id === 'defensive-roll' || 
        maneuver.id === 'cover-fire') {
      continue;
    }
    
    // For attack slot: only allow Weapon Attack and the two main stances
    if (maneuver.slot === 'attack') {
      if (maneuver.id !== 'parry-stance' && maneuver.id !== 'dodge-stance') {
        continue;
      }
    }
    
    // Calculate maneuver range using the new function
    const maneuverRange = calculateRange(actor, maneuver.id, maneuver.slot, undefined, undefined);
    
    // Determine costs
    const costsMovement = maneuver.slot === 'movement' && maneuver.id !== 'stand-up';
    const costsAction = maneuver.id === 'stand-up' || maneuver.slot === 'attack';
    
    // Filter stand-up: only show if prone
    if (maneuver.id === 'stand-up' && !isProne) {
      continue;
    }
    
    if (isManeuverHiddenFromActorRadial(actor, maneuver.id)) {
      continue;
    }

    const maneuverOption: RadialCombatOption = {
      id: maneuver.id,
      name: maneuver.name,
      description: maneuver.description || (maneuver.effect || ''),
      slot: maneuver.slot,
      source: 'maneuver',
      range: maneuverRange,
      maneuver: maneuver,
      tags: maneuver.tags || [],
      costsMovement: costsMovement,
      costsAction: costsAction
    };

    allManeuvers.push(maneuverOption);
  }

  // Add "Weapon Attack" if not present
  const hasWeaponAttack = allManeuvers.some(opt => 
    opt.slot === 'attack' && (opt.id === 'weapon-attack' || opt.name.toLowerCase() === 'weapon attack')
  );
  const skipWeaponForNpc = actor.type === 'npc' && npcAttackOptions.length > 0;

  // A weapon-kind artifact (e.g. Dragon Claws) IS the actor's weapon and
  // surfaces its own attack via buildArtifactRadialOptions, so it replaces the
  // generic "Weapon Attack" instead of duplicating it.
  const hasEquippedWeaponArtifact = actorHasEquippedWeaponArtifact(actor);

  if (
    !hasWeaponAttack &&
    !skipWeaponForNpc &&
    !hasEquippedWeaponArtifact &&
    !isManeuverHiddenFromActorRadial(actor, 'weapon-attack')
  ) {
    allManeuvers.push({
      id: 'weapon-attack',
      name: 'Weapon Attack',
      description: 'Make a standard attack with your equipped weapon.',
      slot: 'attack',
      source: 'maneuver',
      range: calculateRange(actor, 'weapon-attack', 'attack', undefined, undefined),
      maneuver: {
        id: 'weapon-attack',
        name: 'Weapon Attack',
        description: 'Make a standard attack with your equipped weapon.',
        slot: 'attack',
        category: 'combat-action',
        tags: ['attack', 'weapon'],
        effect: 'Make a standard attack with your equipped weapon. Roll attack dice against the target\'s Evade.'
      } as CombatManeuver,
      tags: ['attack', 'weapon'],
      costsAction: true
    });
  }
  
  // --- BUILD MOVEMENT SEGMENT WITH PROPER ORDERING ---
  const movementOptions: RadialCombatOption[] = [];

  let normalMoveReplaced = false;
  try {
    const { isNormalMovementReplaced } = await import('../combat/action-economy.js');
    normalMoveReplaced = isNormalMovementReplaced(actor, (globalThis as any).game?.combat ?? null);
  } catch {
    normalMoveReplaced = false;
  }
  
  // 1. Core movement maneuvers (in order: move, dash, disengage, stand-up if prone)
  // Move/Dash are blocked when a Movement Power already replaced normal Movement.
  for (const coreId of CORE_MOVEMENT_MANEUVER_IDS) {
    if (normalMoveReplaced && (coreId === 'move' || coreId === 'dash')) continue;
    const coreManeuver = allManeuvers.find(m => m.id === coreId && m.slot === 'movement');
    if (coreManeuver) {
      movementOptions.push(coreManeuver);
    }
  }
  
  // 2. Movement powers (sorted by name or actor sheet order)
  const sortedMovementPowers = [...movementPowers].sort((a, b) => {
    // Try to preserve actor sheet order if available (by item sort)
    const aSort = a.item?.sort || 0;
    const bSort = b.item?.sort || 0;
    if (aSort !== bSort) return aSort - bSort;
    // Otherwise sort by name
    return a.name.localeCompare(b.name);
  });
  movementOptions.push(...sortedMovementPowers);
  
  // 3. Other movement maneuvers (excluding core ones)
  const otherMovementManeuvers = allManeuvers.filter(m => 
    m.slot === 'movement' && !CORE_MOVEMENT_MANEUVER_IDS.includes(m.id)
  );
  movementOptions.push(...otherMovementManeuvers);
  
  // Add all movement options to main options array
  options.push(...movementOptions);
  
  // Add all non-movement options
  options.push(...nonMovementOptions);

  // NSC-defined attacks (same segment as other attacks)
  options.push(...npcAttackOptions);
  
  // Add non-movement maneuvers
  const nonMovementManeuvers = allManeuvers.filter(m => m.slot !== 'movement');
  options.push(...nonMovementManeuvers);

  // --- ARTIFACT POWERS (Level Progression → Active / Active Buff / Movement / Support) ---
  // Surfaces unlocked artifact actives from every equipped artifact's
  // `system.levelProgression` rows (level ≤ currentLevel). Reactions
  // are handled by the defender-reactions pipeline, not the radial menu.
  try {
    const artifactOptions = buildArtifactRadialOptions(actor);
    if (artifactOptions.length > 0) {
      options.push(...artifactOptions);
    }
  } catch (err) {
    console.warn('Mastery System | Could not build artifact radial options:', err);
  }

  // Logging
  console.log(`Mastery System | Collected movement powers: ${movementPowers.length}`);
  console.log(`Mastery System | Movement segment final options: [${movementOptions.map(o => o.id).join(', ')}]`);
  console.log(`Mastery System | Collected ${options.length} combat options for actor:`, {
    powers: options.filter(o => o.source === 'power').length,
    maneuvers: options.filter(o => o.source === 'maneuver').length,
    bySegment: {
      movement: options.filter(o => getSegmentIdForOption(o) === 'movement').length,
      attack: options.filter(o => getSegmentIdForOption(o) === 'attack').length,
      utility: options.filter(o => getSegmentIdForOption(o) === 'utility').length,
      'active-buff': options.filter(o => getSegmentIdForOption(o) === 'active-buff').length
    }
  });
  
  return options;
}

