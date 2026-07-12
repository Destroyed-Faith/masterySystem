/**
 * Damage Dialog for Mastery System
 * Appears after successful attack roll to calculate and apply damage
 */

import { getPowerDefinitionRank } from '../utils/power-definition-rank.js';
import { collectMechanicsContributions } from '../utils/power-mechanics.js';
import { getPassiveSlots } from '../powers/passives.js';
import { resolveEquippedWeaponForAttackType } from '../utils/equipment-modifiers.js';
import { applyMeleeUnarmedFallback } from '../utils/unarmed-fallback.js';
import {
  formatNpcSpecialLabel,
  getNpcAttackByIndex,
  npcDamageDiceFormula,
  npcSpecialEffectString
} from '../utils/npc-attack-model.js';
import { previewTempHPConsumption } from '../combat/passive-triggers.js';
import { applyDefensiveMitigation, countNaturalEights } from '../combat/damage-mitigation.js';
import { logDrDebug } from '../utils/dr-debug.js';
import { artifactSystemHasSpellFocus } from '../utils/artifact-rules.js';
import { deriveArtifactWeaponDamage } from '../utils/artifact-base-derive.js';
import { getActorSpellFocusBonusDice } from '../utils/artifact-base-values.js';
import {
  resolvePowerSnapshot,
  snapshotToDamageFormula,
  snapshotToSpecialStrings,
  formatSnapshotSummary,
  type PowerSnapshot,
  type RaiseCostAllocation,
  type RaiseOutcome,
} from '../combat/raise-resolution.js';

/**
 * Add `bonusDice` d8 to a damage formula. Empty / "0" → "Nd8"; pure "Xd8" →
 * "(X+N)d8"; anything else gets " + Nd8" appended.
 */
function addD8DiceToFormula(formula: string, bonusDice: number): string {
  if (!bonusDice || bonusDice <= 0) return formula;
  const f = String(formula ?? '').trim();
  if (!f || f === '0') return `${bonusDice}d8`;
  const m = f.match(/^(\d+)d8$/i);
  if (m) return `${parseInt(m[1], 10) + bonusDice}d8`;
  return `${f} + ${bonusDice}d8`;
}

/** True when a power item is a damaging Spell (carries the `spell` tag). */
function isSpellPowerItem(powerItem: any): boolean {
  const sys = powerItem?.system ?? {};
  if (sys.isSpell === true) return true;
  return Array.isArray(sys.tags) && sys.tags.includes('spell');
}

/** Embedded item by id (Foundry Collection.get, array, or Map values). */
function resolveEmbeddedItemOnActor(actor: any, itemId: string): any | undefined {
  if (!actor?.items || !itemId) return undefined;
  const coll = actor.items;
  if (typeof coll.get === 'function') {
    const got = coll.get(itemId);
    if (got) return got;
  }
  let list: any[] = [];
  if (Array.isArray(coll)) list = coll;
  else if (coll instanceof Map) list = Array.from(coll.values());
  else if (coll.size !== undefined && typeof coll.values === 'function') {
    list = Array.from(coll.values());
  }
  return list.find((item: any) => item?.id === itemId || item?._id === itemId);
}

/** Power item for damage card: embedded actor item or world item owned by actor. */
function resolvePowerItemForDamage(actor: any, powerId: string): any | undefined {
  const embedded = resolveEmbeddedItemOnActor(actor, powerId);
  if (embedded?.type === 'power') return embedded;
  try {
    const gi = (game as any).items?.get(powerId);
    if (gi?.type === 'power' && gi.actor?.id === actor?.id) return gi;
  } catch {
    /* ignore */
  }
  return undefined;
}

/** One roll-damage resolution per damage-card message (guards pop-up + chat double-click). */
const rollDamageMessageLocks = new Set<string>();

/** Pending Promise resolver for each open damage chat card (re-bind after chat re-render). */
const damageCardPendingResolves = new Map<string, (result: DamageResult | null) => void>();
const damageCardSettledMessageIds = new Set<string>();
let damageCardChatHooksRegistered = false;

function completeDamageCard(messageId: string, result: DamageResult | null): void {
  if (damageCardSettledMessageIds.has(messageId)) return;
  const fn = damageCardPendingResolves.get(messageId);
  if (!fn) return;
  damageCardSettledMessageIds.add(messageId);
  damageCardPendingResolves.delete(messageId);
  fn(result);
}

/**
 * Re-attach Roll / Cancel listeners when the log re-renders (Foundry v13
 * `renderChatMessageHTML`). Without this, handlers are lost while an in-memory
 * roll lock can remain — the button stays dead after reload/reroll flows.
 */
export function registerDamageCardChatHooks(): void {
  if (damageCardChatHooksRegistered) return;
  damageCardChatHooksRegistered = true;
  Hooks.on('renderChatMessageHTML', (message: ChatMessage, htmlRaw: HTMLElement | JQuery) => {
    try {
      const ms = (message.flags as any)?.['mastery-system'];
      if (ms?.damageType !== 'selection') return;
      const $root = htmlRaw instanceof HTMLElement ? $(htmlRaw) : htmlRaw;
      const inNode =
        $root.find('.mastery-damage-card').length > 0 ||
        $root.is('.mastery-damage-card') ||
        $root.closest('.message').find('.mastery-damage-card').length > 0;
      if (!inNode) return;
      attachDamageCardHandlers(message.id);
    } catch (e) {
      console.warn('Mastery System | damage card renderChatMessageHTML hook', e);
    }
  });
}

export interface DamageDialogData {
  attacker: Actor;
  target: Actor;
  weapon: any | null;
  baseDamage: string;
  powerDamage: string;
  passiveDamage: string;
  raises: number;
  availableSpecials: SpecialOption[];
  weaponSpecials: string[];
}

export interface SpecialOption {
  id: string;
  name: string;
  type: 'power' | 'passive' | 'weapon' | 'power-special' | 'npc-combat' | 'npc-raise';
  description: string;
  effect?: string;
  value?: number; // For power specials like "Lacerate(3)" where 3 is the value
}

export interface DamageResult {
  baseDamage: number;
  powerDamage: number;
  passiveDamage: number;
  raiseDamage: number;
  specialsUsed: string[];
  totalDamage: number;
  /** One line per rolled pool (base / power / passive / each raise d8) for chat */
  rollDetails?: string[];
  /**
   * Evaluated Foundry `Roll` instances (base, power, passive, raise d8s) for chat + 3D dice.
   * Ephemeral — not stored on documents.
   */
  damageChatRolls?: any[];
  /** Natural 8s rolled across all damage dice (drives the 8s-minimum rule). */
  count8s?: number;
  /**
   * Mitigation breakdown once damage has been applied to the target. The
   * attack-roll chat card appends this line so players can see exactly
   * why a hit went through (or got phased/mitigated).
   */
  mitigation?: AppliedDamageSummary;
}

/**
 * Show damage dialog after successful attack
 */
// Helper: Sanitize dice notation - extract full Foundry Roll formula from strings
// Supports full formulas like "1d8 + 1d8", "2d8 + 3d8 + 2", "Weapon DMG + 1d8 + 2"
function sanitizeDiceNotation(str: string): string {
  if (!str || typeof str !== 'string') return '0';
  
  let cleaned = str.trim();
  if (!cleaned) return '0';
  
  // Remove prefixes like "Weapon DMG +", "Weapon Damage +"
  cleaned = cleaned.replace(/^Weapon\s+(DMG|Damage)\s*\+\s*/i, '');
  
  // Remove trailing words like "damage", "dmg" (case-insensitive, whole word)
  cleaned = cleaned.replace(/\s+(damage|dmg)\s*$/i, '');
  
  // Keep only dice/math chars: digits, d/D, + - * / ( ) and whitespace
  // Replace other chars with space, then collapse whitespace
  cleaned = cleaned.replace(/[^\d\s+dD+\-*/()]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Strip leading "+" if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1).trim();
  }
  
  // If nothing remains, return "0"
  if (!cleaned) return '0';
  
  // Return the cleaned formula (can be full expression like "1d8 + 1d8 + 2")
  return cleaned;
}

const MAX_MASTERY_DAMAGE_DICE = 99;

/**
 * Mastery damage uses d8 only: a lone positive integer N (number or digit-only string)
 * means Nd8 (NOT exploding), never N flat. Players Guide ~5854: damage dice
 * do not explode unless a rule (Crit, Brutal, …) explicitly says so.
 * Formulas that already contain dice notation are returned unchanged.
 */
function masteryCoercePlainNumberToNd8(sanitizedFormula: string): string {
  const t = (sanitizedFormula || '').trim();
  if (!t || t === '0') return '0';
  if (/^\d+$/.test(t)) {
    const n = parseInt(t, 10);
    if (!Number.isFinite(n) || n <= 0) return '0';
    return `${Math.min(n, MAX_MASTERY_DAMAGE_DICE)}d8`;
  }
  return t;
}

/**
 * No-op kept for callers — Mastery damage never explodes by default. If a
 * specific power / special wants exploding damage it must build the formula
 * itself (e.g. `${n}d8x8`) via the appropriate template hook.
 */
function masteryApplyExplodingD8(formula: string): string {
  return formula;
}

function weaponOrPowerNumericToNd8(raw: unknown): string | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const n = Math.floor(raw);
    if (n <= 0) return '0';
    return `${Math.min(n, MAX_MASTERY_DAMAGE_DICE)}d8`;
  }
  if (typeof raw === 'string') {
    const tr = raw.trim();
    if (/^\d+$/.test(tr)) {
      const n = parseInt(tr, 10);
      if (n <= 0) return '0';
      return `${Math.min(n, MAX_MASTERY_DAMAGE_DICE)}d8`;
    }
  }
  return null;
}

// Helper: Resolve weapon base damage from weapon system
function resolveWeaponBaseDamage(weapon: any | null): string {
  if (!weapon || !weapon.system) {
    return '1d8';
  }
  
  const weaponSystem = weapon.system as any;
  // Spell Focus weapons route their value into Spell damage and deal NO normal
  // weapon damage — even though they keep their melee/ranged base profile.
  if (weapon.type === 'artifact' && artifactSystemHasSpellFocus(weaponSystem)) {
    return '0';
  }
  // Artifact weapons (e.g. Dragon Claws) keep their dice on
  // `system.artifactWeapon.damage` (e.g. "4d8"), NOT on `system.damage`.
  // Prefer it when present so artifacts don't fall back to the 1d8 default.
  // For standard one/two-handed profiles, derive the canonical base+level dice
  // live (2d8/4d8 base + 1d8/level) so existing artifacts always reflect the
  // current rule even when their baked damage string is stale.
  const artifactLevel = Math.max(1, Math.min(10, Number(weaponSystem.currentLevel) || Number(weaponSystem.level) || 1));
  const derivedArtifactDamage =
    weapon.type === 'artifact' ? deriveArtifactWeaponDamage(weaponSystem.baseProfile, artifactLevel) : null;
  const artifactWeaponDamage =
    derivedArtifactDamage ??
    (typeof weaponSystem.artifactWeapon?.damage === 'string'
      ? weaponSystem.artifactWeapon.damage.trim()
      : '');
  const baseDamageRaw: any =
    (artifactWeaponDamage.length > 0 ? artifactWeaponDamage : undefined) ??
    weaponSystem.damage ??
    weaponSystem.weaponDamage ??
    weaponSystem.roll?.damage ??
    weaponSystem.damage?.value ??
    weaponSystem.weaponDamage?.value ??
    null;

  const asNd8 = weaponOrPowerNumericToNd8(baseDamageRaw);
  if (asNd8 !== null) return asNd8;
  
  if (typeof baseDamageRaw === 'string' && baseDamageRaw.trim().length > 0) {
    return baseDamageRaw.trim();
  } else if (baseDamageRaw !== null && baseDamageRaw !== undefined) {
    const str = String(baseDamageRaw).trim();
    const fromStr = weaponOrPowerNumericToNd8(str);
    if (fromStr !== null) return fromStr;
    return str || '1d8';
  }
  
  return '1d8';
}

export async function showDamageDialog(
  attacker: Actor,
  target: Actor,
  weaponId: string | null,
  selectedPowerId: string | null,
  raises: number,
  flags?: any
): Promise<DamageResult | null> {
  // Debug log at entry
  console.log('Mastery System | [WEAPON-ID DEBUG]', {
    messageType: 'damage-dialog:entry',
    weaponIdArg: weaponId,
    selectedPowerIdArg: selectedPowerId,
    raisesArg: raises,
    attackerId: (attacker as any).id,
    targetId: (target as any).id
  });
  
  console.log('Mastery System | [DAMAGE DIALOG] showDamageDialog - starting', {
    attackerId: (attacker as any).id,
    attackerName: (attacker as any).name,
    targetId: (target as any).id,
    targetName: (target as any).name,
    weaponId: weaponId,
    weaponIdType: typeof weaponId,
    weaponIdLength: weaponId ? weaponId.length : 0,
    selectedPowerId: selectedPowerId,
    selectedPowerIdType: typeof selectedPowerId,
    selectedPowerIdLength: selectedPowerId ? selectedPowerId.length : 0,
    raises: raises,
    raisesType: typeof raises,
    raisesIsNumber: typeof raises === 'number',
    raisesValue: raises,
    raisesIsZero: raises === 0,
    hasFlags: !!flags,
    flagsKeys: flags ? Object.keys(flags) : [],
    flagsWeaponId: flags?.weaponId,
    flagsSelectedPowerId: flags?.selectedPowerId,
    flagsRaises: flags?.raises
  });
  
  // CRITICAL: Always get fresh actor from game to ensure we have latest items.
  // The attacker parameter might be a stale reference — BUT for an UNLINKED
  // token the synthetic token actor shares the base actor's id, so
  // `game.actors.get(id)` would return the world/prototype actor (default
  // attributes, possibly missing the equipped weapon + the token's delta).
  // Keep the token actor as-is in that case; only re-fetch for world actors.
  const freshAttacker = (attacker as any)?.isToken
    ? attacker
    : ((attacker as any)?.id ? (game as any).actors?.get((attacker as any).id) : attacker);
  const actorToUse = freshAttacker || attacker;

  let stoneDamageBonusDice = 0;
  try {
    const { getRoundState } = await import('../combat/action-economy.js');
    const combat = (game as any).combat;
    if (actorToUse && combat) {
      const rs = getRoundState(actorToUse as Actor, combat);
      stoneDamageBonusDice = Math.max(0, Number(rs?.stoneBonuses?.damageBonus) || 0);
    }
  } catch (e) {
    console.warn('Mastery System | [DAMAGE DIALOG] Could not read Might stone damage bonus', e);
  }
  
  // Load items from fresh actor - use multiple methods to ensure we get all items
  let items: any[] = [];
  
  if (actorToUse && actorToUse.items) {
    if (Array.isArray(actorToUse.items)) {
      items = actorToUse.items;
    } else if (actorToUse.items instanceof Map) {
      items = Array.from(actorToUse.items.values());
    } else if (actorToUse.items.size !== undefined && actorToUse.items.values) {
      items = Array.from(actorToUse.items.values());
    }
  }
  
  // Debug: Log all items to see what we have
  console.log('Mastery System | [DAMAGE DIALOG] Items collection', {
    attackerId: (attacker as any).id,
    freshActorId: actorToUse?.id,
    itemsCount: items.length,
    itemsTypes: items.map((i: any) => ({ id: i.id, name: i.name, type: i.type })),
    actorItemsType: typeof actorToUse?.items,
    actorItemsIsArray: Array.isArray(actorToUse?.items),
    actorItemsIsMap: actorToUse?.items instanceof Map,
    actorItemsSize: actorToUse?.items?.size
  });
  
  const isNpcAttackFlow = !!(flags?.npcAttackSource === true && (actorToUse as any).type === 'npc');

  // Resolve weapon with priority: equipped melee weapon > equipped weapon > weaponId match > any weapon
  let weaponForDamage: any = null;
  
  // Method 1: If weaponId is provided, try to find it first (but verify it's still valid)
  if (!isNpcAttackFlow && weaponId && actorToUse) {
    if (actorToUse.items?.get) {
      weaponForDamage = actorToUse.items.get(weaponId);
    } else if (Array.isArray(actorToUse.items)) {
      weaponForDamage = actorToUse.items.find((item: any) => item.id === weaponId);
    } else if (actorToUse.items instanceof Map) {
      weaponForDamage = actorToUse.items.get(weaponId);
    }
    
    // If found by ID but unequipped, use strict equipped weapon for this attack type only
    if (weaponForDamage && (weaponForDamage.system as any)?.equipped !== true) {
      const atk: 'melee' | 'ranged' = flags?.attackType === 'ranged' ? 'ranged' : 'melee';
      const strict = resolveEquippedWeaponForAttackType(items, atk);
      if (strict) {
        console.log('Mastery System | [DAMAGE DIALOG] weaponId not equipped; using equipped weapon for attack type', {
          weaponId,
          attackType: atk,
          strictWeaponId: strict.id,
          strictWeaponName: strict.name
        });
        weaponForDamage = strict;
      } else {
        weaponForDamage = null;
      }
    } else if (weaponForDamage) {
      console.log('Mastery System | [DAMAGE DIALOG] Found equipped weapon via direct actor lookup by ID', {
        weaponId: weaponId,
        weaponName: weaponForDamage.name,
        weaponType: weaponForDamage.type
      });
    }
  }
  
  // Method 1.5: If not found in actor items, try to get it directly from game.items
  if (!isNpcAttackFlow && !weaponForDamage && weaponId) {
    try {
      const weaponItem = (game as any).items?.get(weaponId);
      if (weaponItem && weaponItem.actor?.id === actorToUse?.id) {
        weaponForDamage = weaponItem;
        console.log('Mastery System | [DAMAGE DIALOG] Found weapon via game.items lookup', {
          weaponId: weaponId,
          weaponName: weaponForDamage.name,
          weaponType: weaponForDamage.type,
          actorId: weaponItem.actor?.id
        });
      }
    } catch (e) {
      console.warn('Mastery System | [DAMAGE DIALOG] Error looking up weapon from game.items', e);
    }
  }
  
  // Method 2: Find in items array by ID (if not already found)
  if (!isNpcAttackFlow && !weaponForDamage && weaponId) {
    weaponForDamage = items.find((item: any) => item.id === weaponId);
  }
  
  // Method 3: Equipped weapon matching attack type (from attack card flags)
  if (!isNpcAttackFlow && !weaponForDamage && flags && (flags.attackType === 'melee' || flags.attackType === 'ranged')) {
    weaponForDamage = resolveEquippedWeaponForAttackType(items, flags.attackType);
    if (weaponForDamage) {
      console.log('Mastery System | [DAMAGE DIALOG] Resolved weapon by attackType', {
        attackType: flags.attackType,
        weaponId: weaponForDamage.id,
        weaponName: weaponForDamage.name
      });
    }
  }

  // Method 4: Virtual unarmed when no equipped weapon (melee only)
  if (!isNpcAttackFlow && !weaponForDamage) {
    const atk =
      flags?.attackType === 'ranged' || flags?.attackType === 'melee'
        ? flags.attackType
        : 'melee';
    weaponForDamage = applyMeleeUnarmedFallback(weaponForDamage, atk);
  }
  
  console.log('Mastery System | [DAMAGE DIALOG] Weapon loading', {
    isNpcAttackFlow,
    weaponId: weaponId,
    totalItems: items.length,
    weaponItems: items.filter((item: any) => item.type === 'weapon').length,
    weaponFound: !!weaponForDamage,
    weaponName: weaponForDamage?.name || 'none',
    weaponIdMatch: weaponForDamage ? weaponForDamage.id === weaponId : false,
    allWeaponIds: items.filter((item: any) => item.type === 'weapon').map((item: any) => item.id),
    usedFreshActor: !!freshAttacker
  });
  
  // Resolve base damage using helper (returns string directly)
  const baseDamage = isNpcAttackFlow ? '0' : resolveWeaponBaseDamage(weaponForDamage);
  
  // Sanitize base damage before use
  const sanitizedBaseDamage = sanitizeDiceNotation(baseDamage);

  // Weapon specials should come from the same resolved weapon (only once)
  const weaponSpecials: string[] = isNpcAttackFlow
    ? []
    : (weaponForDamage?.system?.specials ?? []);
  
  // Debug log after weapon resolve
  console.log('Mastery System | [WEAPON-ID DEBUG]', {
    messageType: 'damage-dialog:weapon-resolve',
    weaponResolved: !!weaponForDamage,
    weaponName: weaponForDamage?.name || null,
    weaponIdResolved: weaponForDamage?.id || null,
    weaponSystemKeys: weaponForDamage ? Object.keys(weaponForDamage.system || {}) : [],
    baseDamageRaw: baseDamage,
    baseDamageSanitized: sanitizedBaseDamage
  });
  
  console.log("Mastery System | [DAMAGE DIALOG] Base damage resolved", {
    weaponId,
    weaponFound: !!weaponForDamage,
    weaponName: weaponForDamage?.name,
    baseDamage: baseDamage,
    baseDamageSanitized: sanitizedBaseDamage
  });
  
  
  // Load selected power from actor by ID and get its data
  let powerDamage = '0';
  let powerSpecials: string[] = [];
  let selectedPowerData: any = null;
  
  console.log('Mastery System | [DAMAGE DIALOG] Power loading', {
    selectedPowerId: selectedPowerId,
    hasSelectedPowerId: !!selectedPowerId,
    totalItems: items.length,
    specialItems: items.filter((item: any) => item.type === 'power').length,
    allSpecialIds: items.filter((item: any) => item.type === 'power').map((item: any) => ({
      id: item.id,
      name: item.name,
      powerType: (item.system as any)?.powerType
    }))
  });
  
  // Helper function to clean power damage string (remove "Weapon DMG +" prefix)
  const cleanPowerDamage = (damageStr: string | number): string => {
    if (damageStr === null || damageStr === undefined || damageStr === '') return '0';
    const raw = typeof damageStr === 'number' ? String(damageStr) : damageStr;
    // Remove "Weapon DMG +" or "Weapon Damage +" prefixes
    const stripped = raw.replace(/^Weapon\s+(DMG|Damage)\s*\+\s*/i, '').trim() || '0';
    const asNd8 = weaponOrPowerNumericToNd8(stripped);
    return asNd8 !== null ? asNd8 : stripped;
  };
  
  if (selectedPowerId) {
    const selectedPower = resolvePowerItemForDamage(actorToUse, selectedPowerId);
    console.log('Mastery System | [DAMAGE DIALOG] Power search result', {
      selectedPowerId: selectedPowerId,
      powerFound: !!selectedPower,
      powerName: selectedPower ? selectedPower.name : 'not found',
      powerIdMatch: selectedPower ? selectedPower.id === selectedPowerId : false
    });
    
    if (selectedPower) {
      const powerSystem = selectedPower.system as any;
      const rawLevel = powerSystem.level || 1;
      
      let levelData: any = null;
      try {
        const powersModule = await import('../utils/powers/index.js' as any);
        const templates = powersModule.ALL_POWER_TEMPLATES || [];
        const templateId: string | undefined = powerSystem.templateId;
        let powerDef: any = null;

        if (templateId) {
          powerDef = templates.find((t: any) => t?.templateId === templateId);
        }
        if (!powerDef) {
          powerDef = templates.find(
            (t: any) => t?.templateName === selectedPower.name || t?.name === selectedPower.name,
          );
        }

        if (powerDef && powerDef.levels) {
          const definitionRank = getPowerDefinitionRank(
            rawLevel,
            powerSystem.levels || powerDef.levels
          );
          if (Array.isArray(powerDef.levels)) {
            levelData = powerDef.levels.find((l: any) => l.level === definitionRank);
          } else {
            levelData = powerDef.levels[String(definitionRank)];
          }
        }
      } catch (e) {
        console.warn('Mastery System | Could not load power definitions for level data', e);
      }
      
      if (levelData) {
        // New structure: effect.dice holds the bonus dice (e.g. "2d8")
        if (levelData.effect?.dice) {
          powerDamage = cleanPowerDamage(levelData.effect.dice);
        } else if (levelData.roll?.damage) {
          powerDamage = cleanPowerDamage(levelData.roll.damage);
        } else {
          powerDamage = cleanPowerDamage(powerSystem.roll?.damage || '0');
        }

        // New structure: specials is array of { key, rank?, value? }
        if (levelData.specials && Array.isArray(levelData.specials)) {
          powerSpecials = levelData.specials.map((s: any) =>
            typeof s === 'string' ? s :
            s.value !== undefined ? `${s.key}(${s.value})` :
            s.rank !== undefined ? `${s.key}(${s.rank})` : s.key
          );
        } else if (levelData.special) {
          powerSpecials = levelData.special.split(',').map((s: string) => s.trim());
        } else {
          powerSpecials = powerSystem.specials || [];
        }
      } else {
        // Fallback: try effect.dice from item system (set during creation for new powers)
        const effectText = powerSystem.effect || '';
        const diceMatch = effectText.match(/(\d+d\d+)/);
        if (diceMatch) {
          powerDamage = diceMatch[1];
        } else {
          const rawPowerDamage = powerSystem.roll?.damage || '0';
          powerDamage = cleanPowerDamage(rawPowerDamage);
        }
        powerSpecials = powerSystem.specials || [];
      }
      
      selectedPowerData = {
        id: selectedPower.id,
        name: selectedPower.name,
        level: rawLevel,
        specials: powerSpecials,
        damage: powerDamage
      };
      
      console.log('Mastery System | [DAMAGE DIALOG] Power loaded from actor', {
        powerId: selectedPowerId,
        powerName: selectedPower.name,
        powerLevel: rawLevel,
        powerDamage: powerDamage,
        powerSpecials: powerSpecials,
        hasLevelData: !!levelData,
        levelDataSpecial: levelData?.special,
        levelDataDamage: levelData?.roll?.damage,
        systemSpecials: powerSystem.specials,
        systemDamage: powerSystem.roll?.damage
      });
    } else {
      console.error('Mastery System | [DAMAGE DIALOG] ERROR: Selected power not found in actor items', {
        selectedPowerId: selectedPowerId,
        totalItems: items.length,
        specialItems: items.filter((item: any) => item.type === 'power').length,
        allSpecialIds: items.filter((item: any) => item.type === 'power').map((item: any) => item.id)
      });
      const fbDmg = flags?.selectedPowerDamage;
      const fbSpecs = flags?.selectedPowerSpecials;
      const hasFbDamage = fbDmg != null && String(fbDmg).trim() !== '';
      const hasFbSpecs = Array.isArray(fbSpecs) && fbSpecs.length > 0;
      if (hasFbDamage || hasFbSpecs) {
        powerDamage = hasFbDamage ? cleanPowerDamage(fbDmg as string) : '0';
        powerSpecials = hasFbSpecs ? [...fbSpecs] : [];
        selectedPowerData = {
          id: selectedPowerId,
          name: 'Power',
          level: Math.max(1, Number(flags?.selectedPowerLevel) || 1),
          specials: powerSpecials,
          damage: powerDamage
        };
        console.warn('Mastery System | [DAMAGE DIALOG] Using attack-card flag fallback for power data', {
          selectedPowerId,
          powerDamage,
          powerSpecialsCount: powerSpecials.length
        });
      }
    }
  } else {
    console.log('Mastery System | [DAMAGE DIALOG] No power selected (selectedPowerId is null/undefined)', {
      selectedPowerId: selectedPowerId,
      selectedPowerIdType: typeof selectedPowerId
    });
  }
  // Spell Focus: weapon-slot artifacts that route their value into Spell
  // damage add their bonus dice whenever a damaging Spell is being resolved.
  let spellFocusBonusDice = 0;
  if (selectedPowerId) {
    try {
      const spellPower = resolvePowerItemForDamage(actorToUse, selectedPowerId);
      if (spellPower && isSpellPowerItem(spellPower)) {
        spellFocusBonusDice = getActorSpellFocusBonusDice(actorToUse as Actor);
        if (spellFocusBonusDice > 0) {
          powerDamage = addD8DiceToFormula(powerDamage, spellFocusBonusDice);
          if (selectedPowerData) selectedPowerData.damage = powerDamage;
        }
      }
    } catch (err) {
      console.warn('Mastery System | spell focus bonus failed', err);
    }
  }

  console.log('Mastery System | [DAMAGE DIALOG] Final power damage', {
    powerDamage: powerDamage,
    spellFocusBonusDice,
    hasSelectedPower: !!selectedPowerData,
    selectedPowerName: selectedPowerData?.name
  });

  let raiseOutcomeLine = '';
  let resolvedPowerSnapshot: PowerSnapshot | null = null;
  if (flags?.basePowerSnapshot && flags?.raiseOutcome) {
    const masteryRank = Math.max(
      1,
      Math.floor(Number((actorToUse as any).system?.mastery?.rank) || flags.masteryRank || 2),
    );
    const isSpell = !!flags.powerIsSpell;
    const declaredRaises = Array.isArray(flags.declaredRaises) ? flags.declaredRaises : [];
    const outcome = flags.raiseOutcome as RaiseOutcome;
    resolvedPowerSnapshot = resolvePowerSnapshot({
      base: flags.basePowerSnapshot as PowerSnapshot,
      declaredRaises,
      outcome,
      masteryRank,
      isSpell,
      stoneBonusRaises: Math.max(0, Number(flags.stoneBonusRaises) || 0),
      spellCostOverride: flags.spellCostOverride as RaiseCostAllocation | undefined,
    });
    powerDamage = snapshotToDamageFormula(resolvedPowerSnapshot);
    const resolvedSpecials = snapshotToSpecialStrings(resolvedPowerSnapshot);
    if (selectedPowerData) {
      selectedPowerData.damage = powerDamage;
      selectedPowerData.specials = resolvedSpecials;
    }
    powerSpecials.length = 0;
    powerSpecials.push(...resolvedSpecials);
    raiseOutcomeLine =
      outcome === 'partial'
        ? `Raise failed — applying ${formatSnapshotSummary(resolvedPowerSnapshot)} (cost lost)`
        : outcome === 'full'
          ? `Raise succeeded — ${formatSnapshotSummary(resolvedPowerSnapshot)}`
          : '';
  }

  let npcAutoDamageDice = 0;
  const npcAutoSpecialStrings: string[] = [];
  const npcLists = buildNpcSpecialOptionsFromActor(actorToUse as Actor);
  npcAutoSpecialStrings.push(...npcLists.autoEffectStrings);

  if (isNpcAttackFlow) {
    const atk = getNpcAttackByIndex((actorToUse as any).system, flags?.npcAttackIndex, flags?.npcPhaseIndex);
    powerDamage = npcDamageDiceFormula(atk);
    npcAutoDamageDice += 0; // legacy npc autoRaises removed with new Raise rules
    const atkName = String(flags?.npcAttackName || atk?.name || 'NSC-Angriff');
    const inlineSpecials: string[] = [];
    if (atk?.special) {
      const eff = npcSpecialEffectString(atk.special, atk.specialValue);
      if (atk.autoApplySpecial) {
        if (eff) npcAutoSpecialStrings.push(eff);
      } else if (eff) {
        inlineSpecials.push(eff);
      }
    }
    selectedPowerData = {
      id: 'npc-attack-inline',
      name: atkName,
      level: 1,
      specials: inlineSpecials,
      damage: powerDamage
    };
  }

  const npcAutoNoteLines: string[] = [];
  if (npcAutoDamageDice > 0) {
    npcAutoNoteLines.push(`+${npcAutoDamageDice}d8 automatisch`);
  }
  if (npcAutoSpecialStrings.length > 0) {
    npcAutoNoteLines.push(`Speziale: ${npcAutoSpecialStrings.join(', ')}`);
  }
  
  // Calculate passive damage (from equipped passives)
  const passiveDamage = await calculatePassiveDamage(attacker);
  console.log('Mastery System | DEBUG: showDamageDialog - passiveDamage', passiveDamage);
  
  // Collect available specials (include power specials from selected power)
  // Use weaponForDamage (found weapon or fallback) to ensure weapon specials are included
  const baseSpecials = await collectAvailableSpecials(actorToUse as Actor, weaponForDamage, selectedPowerData);
  const availableSpecials = [...baseSpecials, ...npcLists.options];
  console.log('Mastery System | DEBUG: showDamageDialog - availableSpecials', {
    count: availableSpecials.length,
    specials: availableSpecials.map(s => ({ id: s.id, name: s.name, type: s.type }))
  });

  const weaponInnateLines: string[] = weaponForDamage
    ? ([] as unknown[])
        .concat((weaponForDamage.system as any)?.innateAbilities || [])
        .map((x) => String(x))
    : [];

  // Create damage card as chat message instead of dialog
  return new Promise((resolve) => {
    const damageCardContent = createDamageCardContent(
      attacker,
      target,
      baseDamage,
      powerDamage,
      passiveDamage,
      availableSpecials,
      weaponSpecials,
      resolve,
      selectedPowerData,
      weaponInnateLines,
      npcAutoNoteLines,
      raiseOutcomeLine,
    );
    
    // Get targetTokenId if target is a token actor (for unlinked tokens)
    let targetTokenId: string | null = null;
    if ((target as any).isToken) {
      // Target is already a token actor, find the token document
      const tokenDoc = canvas?.scene?.tokens?.find((t: any) => t.actor?.id === (target as any).id);
      if (tokenDoc) {
        targetTokenId = tokenDoc.id;
      }
    } else {
      // Target is base actor, try to find token on canvas
      const tokenDoc = canvas?.scene?.tokens?.find((t: any) => t.actor?.id === (target as any).id);
      if (tokenDoc) {
        targetTokenId = tokenDoc.id;
      }
    }
    
    const chatData: any = {
      user: (game as any).user?.id,
      speaker: ChatMessage.getSpeaker({ actor: attacker }),
      content: damageCardContent,
      style: CONST.CHAT_MESSAGE_STYLES.OTHER,
      flags: {
        'mastery-system': {
          damageType: 'selection',
          attackerId: (attacker as any).id,
          targetId: (target as any).id,
          targetTokenId: targetTokenId, // Store token ID for proper target resolution
          weaponId: weaponId,
          selectedPowerId: selectedPowerId,
          baseDamage,
          powerDamage,
          passiveDamage,
          raises: 0,
          raiseOutcome: flags?.raiseOutcome ?? null,
          raiseOutcomeLine,
          resolvedPowerSnapshot,
          stoneDamageBonusDice,
          availableSpecials,
          weaponSpecials,
          npcAutoDamageDice,
          npcAutoSpecialStrings,
          npcAttackSource: !!flags?.npcAttackSource,
          splitAttack: !!flags?.splitAttack,
          splitIndex: flags?.splitIndex ?? null,
          splitPairId: flags?.splitPairId ?? null
        }
      }
    };
    
    ChatMessage.create(chatData).then((message: any) => {
      console.log('Mastery System | DEBUG: Damage card created in chat', message.id);
      console.log('Mastery System | [DAMAGE CARD CREATED] Message flags check', {
        messageId: message.id,
        messageFlags: message.flags,
        masterySystemFlags: message.flags?.['mastery-system'],
        selectedPowerId: message.flags?.['mastery-system']?.selectedPowerId,
        weaponId: message.flags?.['mastery-system']?.weaponId,
        raises: message.flags?.['mastery-system']?.raises
      });
      damageCardPendingResolves.set(message.id, resolve);
      registerDamageCardChatHooks();
      setTimeout(() => attachDamageCardHandlers(message.id), 100);
    });
  });
}

function damageCardHtmlEsc(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Create HTML content for damage card in chat
 */
function createDamageCardContent(
  attacker: Actor,
  target: Actor,
  baseDamage: string,
  powerDamage: string,
  passiveDamage: string,
  availableSpecials: SpecialOption[],
  _weaponSpecials: string[],
  _resolve: (result: DamageResult | null) => void,
  selectedPower?: any,
  weaponInnateLines: string[] = [],
  npcAutoNoteLines: string[] = [],
  raiseOutcomeLine: string = '',
): string {
  const raisesSection = raiseOutcomeLine
    ? `<div class="raises-section raise-outcome-line"><p>${damageCardHtmlEsc(raiseOutcomeLine)}</p></div>`
    : '';
  
  console.log('Mastery System | [DAMAGE CARD HTML] createDamageCardContent - values', {
    baseDamage: baseDamage,
    powerDamage: powerDamage,
    passiveDamage: passiveDamage,
    raiseOutcomeLine,
    selectedPower: selectedPower ? {
      id: selectedPower.id,
      name: selectedPower.name,
      level: selectedPower.level,
      specials: selectedPower.specials,
      damage: selectedPower.damage,
      specialsCount: selectedPower.specials?.length || 0
    } : null,
    availableSpecialsCount: availableSpecials.length,
    weaponSpecialsCount: _weaponSpecials.length
  });
  
  const html = `
    <div class="mastery-damage-card">
      <div class="damage-header">
        <h3><i class="fas fa-sword"></i> Damage Calculation</h3>
        <div class="damage-participants">
          <strong>${(attacker as any).name}</strong> → <strong>${(target as any).name}</strong>
        </div>
      </div>
      <div class="damage-details">
        ${
          npcAutoNoteLines.length > 0
            ? `<div class="damage-row mastery-damage-npc-auto">
          <span class="damage-label">Automatisch:</span>
          <span class="damage-value">${npcAutoNoteLines.map(damageCardHtmlEsc).join(' · ')}</span>
        </div>`
            : ''
        }
        <div class="damage-row">
          <span class="damage-label">Base Weapon Damage:</span>
          <span class="damage-value">${baseDamage || '0'}</span>
        </div>
        ${
          weaponInnateLines.length > 0
            ? `<div class="damage-row">
          <span class="damage-label">Weapon innates (reference):</span>
          <span class="damage-value">${weaponInnateLines.map(damageCardHtmlEsc).join(', ')}</span>
        </div>`
            : ''
        }
        ${selectedPower ? `
          <div class="damage-row">
            <span class="damage-label">Power:</span>
            <span class="damage-value">${selectedPower.name} (Level ${selectedPower.level})</span>
          </div>
          ${selectedPower.specials && selectedPower.specials.length > 0 ? `
            <div class="damage-row">
              <span class="damage-label">Power Special Effects:</span>
              <span class="damage-value">${selectedPower.specials.join(', ')}</span>
            </div>
          ` : ''}
        ` : ''}
        <div class="damage-row">
          <span class="damage-label">Power Damage:</span>
          <span class="damage-value">${powerDamage || '0'}</span>
        </div>
        <div class="damage-row">
          <span class="damage-label">Passive Damage:</span>
          <span class="damage-value">${passiveDamage || '0'}</span>
        </div>
      </div>
      ${raisesSection}
      <div class="damage-actions">
        <button class="roll-damage-btn" data-attacker-id="${(attacker as any).id}" data-target-id="${(target as any).id}">
          <i class="fas fa-dice"></i> Roll
        </button>
        <button class="cancel-damage-btn">
          <i class="fas fa-times"></i> Cancel
        </button>
      </div>
    </div>
  `;
  
  console.log('Mastery System | [DAMAGE CARD HTML] Generated HTML', {
    htmlLength: html.length,
    htmlPreview: html.substring(0, 500),
    containsBaseDamage: html.includes(baseDamage),
    containsPowerDamage: html.includes(powerDamage),
    containsRaiseOutcome: !!raiseOutcomeLine && html.includes(raiseOutcomeLine),
    containsSelectedPower: selectedPower ? html.includes(selectedPower.name) : false,
    containsPowerSpecials: selectedPower && selectedPower.specials.length > 0 ? 
      selectedPower.specials.some((s: string) => html.includes(s)) : false
  });
  
  return html;
}

/**
 * Bind damage-card UI (roll, cancel). Safe to call again after chat HTML refresh.
 */
export function attachDamageCardHandlers(messageId: string): void {
  if (damageCardSettledMessageIds.has(messageId)) return;
  if (!damageCardPendingResolves.has(messageId)) return;

  const messageElement = $(`.message[data-message-id="${messageId}"]`);
  if (!messageElement.length) {
    console.warn('Mastery System | Could not find damage card message element', messageId);
    return;
  }

  messageElement.find('.roll-damage-btn').off('click.msRollDamage').on('click.msRollDamage', async function () {
    const $btn = $(this);
    const lockKey = `roll-dmg:${messageId}`;
    if (rollDamageMessageLocks.has(lockKey)) {
      return;
    }
    rollDamageMessageLocks.add(lockKey);
    $btn.prop('disabled', true);
    let rollDamageCompleted = false;

    console.log('Mastery System | [ROLL DAMAGE BUTTON] Button clicked', {
      messageId: messageId,
      buttonData: {
        attackerId: $btn.data('attacker-id'),
        targetId: $btn.data('target-id'),
      },
    });

    try {
    const message = (game as any).messages?.get(messageId);
    if (!message) {
      console.error('Mastery System | [ROLL DAMAGE BUTTON] Could not find damage card message', {
        messageId,
        allMessageIds: Array.from((game as any).messages?.keys() || []).slice(0, 10)
      });
      ui.notifications?.error('Could not find damage card message');
      return;
    }

    // Get flags early so we can use targetTokenId for target resolution
    const flags = message.getFlag('mastery-system') || message.flags?.['mastery-system'];

    const attackerId = $btn.data('attacker-id');
    const targetId = $btn.data('target-id');
    const attacker = (game as any).actors?.get(attackerId);
    
    // Resolve target: prefer token actor if targetTokenId exists in flags (for unlinked tokens)
    let target: any = null;
    if (flags?.targetTokenId) {
      // Try to get token document from current scene
      const tokenDoc = canvas?.scene?.tokens?.get(flags.targetTokenId);
      if (tokenDoc?.actor) {
        target = tokenDoc.actor;
        console.log('Mastery System | [ROLL DAMAGE BUTTON] Resolved target from token', {
          targetTokenId: flags.targetTokenId,
          targetId: (target as any).id,
          targetName: (target as any).name,
          isTokenActor: true
        });
      }
    }
    
    // Fallback to base actor if token not found
    if (!target) {
      target = (game as any).actors?.get(targetId);
      console.log('Mastery System | [ROLL DAMAGE BUTTON] Resolved target from base actor', {
        targetId: targetId,
        targetName: target ? (target as any).name : null,
        isTokenActor: false
      });
    }
    
    if (!attacker || !target) {
      console.error('Mastery System | [ROLL DAMAGE BUTTON] Could not find attacker or target', {
        attackerId,
        targetId,
        attackerFound: !!attacker,
        targetFound: !!target,
        targetTokenId: flags?.targetTokenId
      });
      ui.notifications?.error('Could not find attacker or target');
      return;
    }
    console.log('Mastery System | [ROLL DAMAGE BUTTON] Flags retrieved', {
      messageId,
      hasFlags: !!flags,
      flagsKeys: flags ? Object.keys(flags) : [],
      baseDamage: flags?.baseDamage,
      powerDamage: flags?.powerDamage,
      passiveDamage: flags?.passiveDamage,
      raises: flags?.raises,
      raisesType: typeof flags?.raises,
      availableSpecials: flags?.availableSpecials?.length || 0
    });
    
    if (!flags) {
      console.error('Mastery System | [ROLL DAMAGE BUTTON] Could not find damage card data', {
        messageId,
        messageFlags: message.flags,
        messageFlagsKeys: Object.keys(message.flags || {})
      });
      ui.notifications?.error('Could not find damage card data');
      return;
    }
    
    // Raise effects are pre-declared on the attack card — no post-roll picker.
    const raiseSelections: Map<number, { type: 'special' | 'damage'; value: string }> = new Map();
    
    const result = await calculateDamageResult(
      flags.baseDamage,
      flags.powerDamage,
      flags.passiveDamage,
      0,
      raiseSelections,
      flags.availableSpecials,
      attacker,
      target,
      Math.max(0, Number(flags.stoneDamageBonusDice) || 0),
      Math.max(0, Number(flags.npcAutoDamageDice) || 0),
      Array.isArray(flags.npcAutoSpecialStrings) ? flags.npcAutoSpecialStrings : [],
      flags.selectedPowerId || null,
      !!flags.splitAttack,
      flags.attackType === 'ranged' ? 'ranged' : 'melee'
    );
    
    console.log('Mastery System | [ROLL DAMAGE BUTTON] calculateDamageResult returned', {
      messageId,
      hasResult: !!result,
      resultKeys: result ? Object.keys(result) : [],
      totalDamage: result?.totalDamage,
      baseDamage: result?.baseDamage,
      powerDamage: result?.powerDamage,
      passiveDamage: result?.passiveDamage
    });

    completeDamageCard(messageId, result);
    rollDamageCompleted = true;
    } finally {
      rollDamageMessageLocks.delete(lockKey);
      if (!rollDamageCompleted) {
        $btn.prop('disabled', false);
      }
    }
  });

  messageElement.find('.cancel-damage-btn').off('click.msDmgCancel').on('click.msDmgCancel', function () {
    if (damageCardSettledMessageIds.has(messageId)) return;
    rollDamageMessageLocks.delete(`roll-dmg:${messageId}`);
    const $btn = messageElement.find('.roll-damage-btn');
    $btn.prop('disabled', false);
    completeDamageCard(messageId, null);
  });
}

/**
 * Calculate passive damage bonuses
 */
function buildNpcSpecialOptionsFromActor(actor: Actor): {
  options: SpecialOption[];
  autoEffectStrings: string[];
} {
  const options: SpecialOption[] = [];
  const autoEffectStrings: string[] = [];
  if ((actor as any).type !== 'npc') return { options, autoEffectStrings };
  const sys = (actor as any).system || {};
  const combatSpec = Array.isArray(sys.npcCombatSpecials) ? sys.npcCombatSpecials : [];
  combatSpec.forEach((row: any, i: number) => {
    const name = String(row?.name || '').trim() || `Spezial ${i + 1}`;
    const effect = npcSpecialEffectString(name, row?.value);
    const display = formatNpcSpecialLabel(name, row?.value);
    if (row?.auto === true) {
      if (effect) autoEffectStrings.push(effect);
    } else if (effect) {
      options.push({
        id: `npc-c-${i}`,
        name: `[NSC] ${display}`,
        type: 'npc-combat',
        description: 'NSC-Spezial',
        effect
      });
    }
  });
  const raiseSpec = Array.isArray(sys.npcRaiseSpecials) ? sys.npcRaiseSpecials : [];
  raiseSpec.forEach((row: any, i: number) => {
    const name = String(row?.name || '').trim() || `Raise-Spezial ${i + 1}`;
    const effect = npcSpecialEffectString(name, row?.value);
    const display = formatNpcSpecialLabel(name, row?.value);
    if (row?.auto === true) {
      if (effect) autoEffectStrings.push(effect);
    } else if (effect) {
      options.push({
        id: `npc-r-${i}`,
        name: `[Raise] ${display}`,
        type: 'npc-raise',
        description: 'Für Raises gedacht',
        effect
      });
    }
  });
  return { options, autoEffectStrings };
}

/**
 * Sums `rollDice.damage` (d8 count) from only **slotted passive** mechanics
 * contributions — same source as the character attack breakdown.
 */
async function calculatePassiveDamage(actor: Actor): Promise<string> {
  try {
    const contributions = collectMechanicsContributions(actor as any);
    let d8 = 0;
    for (const c of contributions) {
      if (c.sourceKind !== 'passive') continue;
      const n = c.mechanics?.rollDice?.damage;
      if (typeof n === 'number' && n > 0) d8 += Math.floor(n);
    }
    return d8 > 0 ? `${d8}d8` : '0';
  } catch (e) {
    console.warn('Mastery System | [DAMAGE DIALOG] calculatePassiveDamage failed', e);
    return '0';
  }
}

/**
 * Collect all available specials (powers, passives, weapon specials)
 * Now includes power specials (e.g., "Lacerate(3)") as individual options
 */
async function collectAvailableSpecials(actor: Actor, weapon: any | null, selectedPower?: any): Promise<SpecialOption[]> {
  const specials: SpecialOption[] = [];
  const items = (actor as any).items || [];
  
  // Get power specials from selected power (e.g., "Lacerate(3)")
  if (selectedPower && selectedPower.specials && selectedPower.specials.length > 0) {
    for (const specialName of selectedPower.specials) {
      // Defense-in-depth: Split-Attack and Autofire are attack *modes*, not
      // Raise-Specials. Legacy power items may still carry these strings in
      // their `specials` array — filter them out so they never appear in the
      // raise-special picker.
      const normalized = String(specialName || '').trim().toLowerCase();
      if (
        normalized.startsWith('split-attack') ||
        normalized.startsWith('split attack') ||
        normalized.startsWith('autofire')
      ) {
        continue;
      }
      // Parse special name like "Lacerate(3)" to extract name and value
      const match = specialName.match(/^([^(]+)(?:\((\d+)\))?$/);
      if (match) {
        const specialNameOnly = match[1].trim();
        const specialValue = match[2] ? parseInt(match[2]) : null;
        specials.push({
          id: `power-special-${specialNameOnly.toLowerCase().replace(/\s+/g, '-')}`,
          name: specialName, // Keep full name like "Lacerate(3)"
          type: 'power-special',
          description: `Power special: ${specialName}`,
          effect: specialName,
          value: specialValue ?? undefined
        });
      } else {
        // Fallback if no match
        specials.push({
          id: `power-special-${specialName.toLowerCase().replace(/\s+/g, '-')}`,
          name: specialName,
          type: 'power-special',
          description: `Power special: ${specialName}`,
          effect: specialName
        });
      }
    }
  }
  
  // Get attack powers (powers are stored as type 'power')
  const attackPowers = items.filter((item: any) => 
    item.type === 'power' && 
    (item.system as any)?.powerType === 'active' &&
    (item.system as any)?.canUseOnAttack === true
  );
  
  for (const power of attackPowers) {
    const system = power.system as any;
    specials.push({
      id: power.id,
      name: power.name,
      type: 'power',
      description: system.description || '',
      effect: system.effect || ''
    });
  }

  const byId = (id: string) =>
    items.find(
      (item: any) => item.id === id || item._id === id || (item.name != null && String(item.name) === id)
    );

  for (const slot of getPassiveSlots(actor)) {
    if (!slot.passive?.id) continue;
    const power = byId(String(slot.passive.id));
    if (!power || power.type !== 'power') continue;
    const ps = (power.system as any) || {};
    if (ps.powerType !== 'passive' || !ps.canUseOnAttack) continue;
    if (specials.some((s) => s.id === power.id)) continue;
    specials.push({
      id: power.id,
      name: power.name,
      type: 'passive',
      description: ps.description || ps.effect || '',
      effect: ps.effect || ps.description || ''
    });
  }

  // Get weapon specials (use the weaponSpecials already resolved above, not duplicate)
  // Note: weaponSpecials is already set from weaponForDamage earlier in the function
  if (weapon && (weapon.system as any)?.specials) {
    const weaponSpecialsFromWeapon = (weapon.system as any).specials as string[];
    for (const special of weaponSpecialsFromWeapon) {
      specials.push({
        id: `weapon-${special}`,
        name: special,
        type: 'weapon',
        description: `Weapon special: ${special}`,
        effect: special
      });
    }
  }
  
  return specials;
}

/**
 * Reduce a target's Mark by the spent amount (removing it at 0). Mark is a
 * global counter on the target; spending it applies the Damage Floor.
 */
async function consumeTargetMark(target: Actor, spend: number): Promise<void> {
  if (!spend || spend <= 0) return;
  try {
    const system = (target as any).system;
    const list: any[] = Array.isArray(system?.statusEffects) ? system.statusEffects : [];
    let changed = false;
    const next = list
      .map((e) => {
        const id = e?.id ?? '';
        const name = String(e?.name ?? '').toLowerCase();
        if (id === 'mark' || name === 'mark') {
          const remaining = Math.max(0, Math.floor(Number(e.value ?? 0)) - spend);
          changed = true;
          return { ...e, value: remaining };
        }
        return e;
      })
      .filter((e) => !((e?.id === 'mark' || String(e?.name ?? '').toLowerCase() === 'mark') && Math.floor(Number(e.value ?? 0)) <= 0));
    if (changed) {
      await (target as any).update({ 'system.statusEffects': next });
    }
  } catch (err) {
    console.warn('Mastery System | consumeTargetMark failed', err);
  }
}

/**
 * Apply status effects from specials to target actor
 */
async function applyStatusEffectsToTarget(target: Actor, specialsUsed: string[]): Promise<void> {
  try {
    console.log('Mastery System | [APPLY STATUS EFFECTS] Applying to target', {
      targetId: (target as any).id,
      targetName: (target as any).name,
      specialsUsed
    });
    
    // Get current status effects from target
    const system = (target as any).system;
    if (!system.statusEffects) {
      system.statusEffects = [];
    }
    
    // Add new status effects from specials
    for (const specialName of specialsUsed) {
      // Parse special name like "Lacerate(3)" to extract name and value
      const match = specialName.match(/^([^(]+)(?:\((\d+)\))?$/);
      if (match) {
        const effectName = match[1].trim();
        const effectValue = match[2] ? parseInt(match[2]) : null;
        const { getEffect } = await import('../utils/special-effects.js');
        const effectId = getEffect(effectName)?.id;

        // Check if effect already exists (match by canonical id when known).
        const existingEffect = system.statusEffects.find((e: any) =>
          (effectId && e.id === effectId) || e.name === effectName,
        );
        if (existingEffect) {
          // Update existing effect (e.g., increase stack)
          if (effectValue !== null) {
            existingEffect.value = (existingEffect.value || 0) + effectValue;
          }
          if (effectId && !existingEffect.id) existingEffect.id = effectId;
        } else {
          // Add new effect
          system.statusEffects.push({
            id: effectId,
            name: effectName,
            value: effectValue,
            source: 'combat',
            timestamp: Date.now()
          });
        }
      }
    }
    
    // Update target actor
    await (target as any).update({ 'system.statusEffects': system.statusEffects });
    
    console.log('Mastery System | [APPLY STATUS EFFECTS] Status effects applied', {
      targetId: (target as any).id,
      statusEffects: system.statusEffects
    });
  } catch (error) {
    console.error('Mastery System | [APPLY STATUS EFFECTS] Error applying status effects', error);
  }
}

/**
 * Result of the full defensive pipeline for one strike. Exposed so that the
 * chat card assembly (and split-attack logging) can render a single-line
 * "Raw 14 → Armor 4 → DR 20% → TempHP 3 → 5" summary.
 */
export interface AppliedDamageSummary {
  rawDamage: number;
  armorApplied: number;
  drPercent: number;
  mitigatedDamage: number;
  tempHPAbsorbed: number;
  barDamage: number;
  min8sUsed: boolean;
  /** "Raw X → Armor Y → DR Z% → TempHP A → B". */
  breakdownLine: string;
  /** `true` if the target phased out of the hit entirely. */
  phased: boolean;
}

/**
 * Apply damage to target actor — full defensive pipeline:
 *   Phasing check (Phase 3) → Armor → DR% → 8s-minimum → Temp-HP → Health bars.
 *
 * `count8s` is the number of natural 8s rolled across all damage dice for
 * this strike; `applyDamageToTarget` uses it to enforce the floor rule
 * ("never below count8s if any 8 was rolled").
 */
/** Exported for AoE secondary hits (power dice only, same mitigation pipeline). */
export async function applyDamageToTargetFromAoe(
  target: Actor,
  damage: number,
  attacker: Actor,
  count8s: number = 0,
): Promise<AppliedDamageSummary> {
  return applyDamageToTarget(target, damage, attacker, count8s);
}

async function applyDamageToTarget(
  target: Actor,
  damage: number,
  attacker: Actor,
  count8s: number = 0,
): Promise<AppliedDamageSummary> {
  const empty: AppliedDamageSummary = {
    rawDamage: Math.max(0, Math.floor(damage)),
    armorApplied: 0,
    drPercent: 0,
    mitigatedDamage: 0,
    tempHPAbsorbed: 0,
    barDamage: 0,
    min8sUsed: false,
    breakdownLine: '',
    phased: false,
  };
  try {
    console.log('Mastery System | [APPLY DAMAGE] Applying damage to target', {
      targetId: (target as any).id,
      targetName: (target as any).name,
      attackerId: (attacker as any).id,
      attackerName: (attacker as any).name,
      damage,
      count8s,
    });

    // Step 0: Phasing — opt-in prompt for the target owner. If consumed, the
    // strike inflicts no damage and skips all riders (the caller in the attack
    // pipeline is responsible for skipping on-hit specials when phased).
    try {
      const { promptPhasingConsume, consumePhasingCharge } =
        await import('../combat/phasing.js');
      const phased = await promptPhasingConsume(target, { attacker, rawDamage: damage });
      if (phased) {
        await consumePhasingCharge(target);
        const sheet = (target as any).sheet;
        if (sheet && sheet.rendered) sheet.render(false);
        return {
          ...empty,
          phased: true,
          breakdownLine: `Raw ${empty.rawDamage} → Phased (ignored)`,
        };
      }
    } catch (err) {
      // Phasing module not yet loaded or target has no charges — treat as pass.
      console.debug?.('Mastery System | [APPLY DAMAGE] phasing skipped', err);
    }

    // Recompute combat totals before defender reactions so DR gating and the
    // reaction dialog see the same `system.combat` as mitigation (token vs
    // prototype mismatch otherwise strips reaction DR%).
    if (typeof (target as any).prepareDerivedData === 'function') {
      try {
        (target as any).prepareDerivedData();
      } catch (prepErr) {
        console.warn('Mastery System | [APPLY DAMAGE] prepareDerivedData before reactions failed', prepErr);
      }
    }

    let reactionArmorFlat = 0;
    let reactionDrPct = 0;
    let reactionInitiativeGain = 0;
    try {
      const combat = (globalThis as any).game?.combat ?? null;
      const { promptDefenderReactionsBeforeMitigation } = await import('../combat/defender-reactions.js');
      const reactMit = await promptDefenderReactionsBeforeMitigation({
        defender: target as any,
        attacker: attacker as any,
        combat,
        rawDamage: damage,
      });
      reactionArmorFlat = reactMit.reactionArmorFlat;
      reactionDrPct = reactMit.reactionDrPct;
      reactionInitiativeGain = Math.max(0, Math.floor(Number(reactMit.initiativeGain) || 0));
    } catch (err) {
      console.debug?.('Mastery System | [APPLY DAMAGE] defender reactions skipped', err);
    }

    if (typeof (target as any).prepareDerivedData === 'function') {
      try {
        (target as any).prepareDerivedData();
      } catch (prepErr) {
        console.warn('Mastery System | [APPLY DAMAGE] prepareDerivedData before mitigation failed', prepErr);
      }
    }

    // Create blood pool at target token position (if token exists on canvas)
    if (damage > 0 && canvas?.ready) {
      const targetToken = (target as any).getActiveTokens?.()?.[0] || 
                         (game as any).scenes?.active?.tokens?.find((t: any) => t.actor?.id === (target as any).id);
      
      if (targetToken) {
        try {
          const { createBloodPool } = await import('../utils/blood-pool.js');
          const actorSystem = (target as any).system;
          const bloodColor = actorSystem?.bloodColor;
          await createBloodPool(targetToken, damage, true, bloodColor);
        } catch (error) {
          console.warn('Mastery System | Could not create blood pool', error);
        }
      }
    }
    
    // Get current health data
    const system = (target as any).system;
    if (!system.health || !system.health.bars || system.health.bars.length === 0) {
      console.error('Mastery System | [APPLY DAMAGE] Target has no health bars', {
        targetId: (target as any).id,
        hasHealth: !!system.health,
        hasBars: !!(system.health && system.health.bars),
        barsLength: system.health?.bars?.length || 0
      });
      return empty;
    }

    // Step 1: Flat Armor + percentage DR + 8s-min floor.
    logDrDebug('apply-damage-target', {
      targetId: (target as any).id,
      targetName: (target as any).name,
      damageRollInput: damage,
      armorTotalRead: Number(system.combat?.armorTotal ?? 0),
      damageReductionPctRead: Number(system.combat?.damageReductionPct ?? 0),
      count8s,
    });
    const baseArmorTotal =
      Number(system.combat?.armorTotal ?? 0) + Number(system.combat?.armorFromActiveBuffs ?? 0);
    const mitigation = applyDefensiveMitigation({
      rawDamage: damage,
      count8s,
      armorTotal: baseArmorTotal + reactionArmorFlat,
      damageReductionPct: Number(system.combat?.damageReductionPct ?? 0),
      reactionDrPct,
    });
    const mitigated = mitigation.mitigatedDamage;

    // Step 2: Route tempHP reduction through the passive-trigger pool so that
    //         per-source book-keeping (Lean Ward one-shot, Dragon Scales
    //         refresh, …) stays consistent with the scalar mirror. The helper
    //         returns a partial actor-update patch so we can still commit
    //         tempHP + health-bar changes in a single atomic update below.
    const tempHPConsumption = previewTempHPConsumption(target, mitigated);
    const remaining = tempHPConsumption.remainingDamage;

    if (tempHPConsumption.reducedBy > 0) {
      console.log('Mastery System | [APPLY DAMAGE] TempHP absorbed', {
        tempHPBefore: system.health.tempHP,
        tempHPAfter: Math.max(0, (system.health.tempHP || 0) - tempHPConsumption.reducedBy),
        absorbed: tempHPConsumption.reducedBy,
        remaining
      });
    }

    // Step 3: Apply remaining damage to health bars with overflow
    let barDamage = 0;
    if (remaining > 0) {
      barDamage = remaining;
      // Import applyDamage helper from calculations.ts
      const { applyDamage: applyDamageToBars } = await import('../utils/calculations.js');

      // Copy bars array to mutate. Always deplete from bar 0 (left / Healthy) first
      // so the segmented HP strip matches the wound track; do not use currentBar
      // as the starting index.
      const bars = [...system.health.bars];
      let barIndex = applyDamageToBars(bars, 0, remaining);

      // Clamp barIndex to valid range
      if (barIndex >= bars.length) {
        barIndex = bars.length - 1;
      }

      // Merge tempHP pool updates with bar updates for a single write.
      try {
        await (target as any).update({
          ...tempHPConsumption.patch,
          'system.health.currentBar': barIndex,
          'system.health.bars': bars
        });
      } catch (e) {
        if (mitigated > 0) {
          console.warn('Mastery System | [APPLY DAMAGE] actor.update (bars) failed with mitigation > 0', {
            err: e,
            targetId: (target as any).id,
            targetName: (target as any).name,
            mitigated,
            remaining,
            barDamage,
          });
        }
        throw e;
      }

      console.log('Mastery System | [APPLY DAMAGE] Damage applied to bars', {
        targetId: (target as any).id,
        targetName: (target as any).name,
        damageInput: damage,
        mitigatedDamage: mitigated,
        remainingAfterTempHP: remaining,
        barDamageApplied: barDamage,
        tempHPAbsorbed: tempHPConsumption.reducedBy,
        oldBarIndex: system.health.currentBar || 0,
        newBarIndex: barIndex,
        barsAfter: bars.map((b, i) => ({ index: i, current: b.current, max: b.max }))
      });
    } else if (Object.keys(tempHPConsumption.patch).length > 0) {
      // Only tempHP was reduced, no bar damage
      try {
        await (target as any).update(tempHPConsumption.patch);
      } catch (e) {
        if (mitigated > 0) {
          console.warn('Mastery System | [APPLY DAMAGE] actor.update (tempHP) failed with mitigation > 0', {
            err: e,
            targetId: (target as any).id,
            targetName: (target as any).name,
            mitigated,
            patch: tempHPConsumption.patch,
          });
        }
        throw e;
      }

      console.log('Mastery System | [APPLY DAMAGE] Only tempHP reduced', {
        targetId: (target as any).id,
        tempHPBefore: system.health.tempHP,
        tempHPAfter: Math.max(0, (system.health.tempHP || 0) - tempHPConsumption.reducedBy),
        damage
      });
    }
    
    // Refresh the actor sheet if it's open
    const sheet = (target as any).sheet;
    if (sheet && sheet.rendered) {
      sheet.render(false);
    }

    if (reactionInitiativeGain > 0) {
      try {
        const combat = (globalThis as any).game?.combat ?? null;
        if (combat) {
          const { applyMidCombatInitiativeGain } = await import('../combat/initiative-gain.js');
          const iniResult = await applyMidCombatInitiativeGain(combat, target as any, reactionInitiativeGain);
          if (iniResult.applied) {
            const defName = String((target as any).name ?? 'Defender');
            await (globalThis as any).ChatMessage?.create?.({
              user: (globalThis as any).game?.user?.id,
              speaker: (globalThis as any).ChatMessage?.getSpeaker?.({ actor: target }),
              content: `<p class="mastery-reaction-msg"><strong>${defName}</strong> gains <strong>+${reactionInitiativeGain} Initiative</strong> after the attack resolves. ${iniResult.note}</p>`,
            });
          }
        }
      } catch (iniErr) {
        console.warn('Mastery System | [APPLY DAMAGE] initiative gain after attack failed', iniErr);
      }
    }

    const tail: string[] = [];
    if (tempHPConsumption.reducedBy > 0) {
      tail.push(`TempHP ${tempHPConsumption.reducedBy}`);
    }
    if (barDamage > 0) {
      tail.push(`Bars ${barDamage}`);
    } else if (mitigated > 0 && tempHPConsumption.reducedBy > 0) {
      tail.push('HP bars 0 (all from Temp-HP this hit)');
    } else {
      tail.push('Bars 0');
    }
    return {
      rawDamage: mitigation.rawDamage,
      armorApplied: mitigation.armorApplied,
      drPercent: mitigation.drPercent,
      mitigatedDamage: mitigation.mitigatedDamage,
      tempHPAbsorbed: tempHPConsumption.reducedBy,
      barDamage,
      min8sUsed: mitigation.min8sUsed,
      breakdownLine: `${mitigation.breakdownLine} → ${tail.join(' → ')}`,
      phased: false,
    };
  } catch (error) {
    console.error('Mastery System | [APPLY DAMAGE] Error applying damage', error);
    return empty;
  }
}

/**
 * Calculate damage result from selections
 */
async function calculateDamageResult(
  baseDamage: string,
  powerDamage: string,
  passiveDamage: string,
  raises: number,
  raiseSelections: Map<number, { type: 'special' | 'damage'; value: string }>,
  availableSpecials: SpecialOption[],
  attacker: Actor,
  target: Actor,
  stoneDamageBonusDice: number = 0,
  npcAutoDamageDice: number = 0,
  npcAutoSpecialStrings: string[] = [],
  selectedPowerId: string | null = null,
  splitAttack: boolean = false,
  attackType: 'melee' | 'ranged' = 'melee'
): Promise<DamageResult> {
  // Roll base damage
  // Sanitize dice notations before rolling
  const sanitizedBaseDamage = sanitizeDiceNotation(baseDamage || '0');
  const sanitizedPowerDamage = sanitizeDiceNotation(powerDamage || '0');
  const sanitizedPassiveDamage = sanitizeDiceNotation(passiveDamage || '0');
  
  const rollDetails: string[] = [];
  const damageChatRolls: any[] = [];

  const baseRoll = await rollDiceWithDetail(sanitizedBaseDamage, 'Base weapon');
  const baseDamageRolled = baseRoll.total;
  if (baseRoll.line) rollDetails.push(baseRoll.line);
  if (baseRoll.roll) damageChatRolls.push(baseRoll.roll);

  let stoneMightDamageRolled = 0;
  if (stoneDamageBonusDice > 0) {
    const stoneRoll = await rollDiceWithDetail(`${stoneDamageBonusDice}d8`, 'Might stones');
    stoneMightDamageRolled = stoneRoll.total;
    if (stoneRoll.line) rollDetails.push(stoneRoll.line);
    if (stoneRoll.roll) damageChatRolls.push(stoneRoll.roll);
  }

  const powerRoll = await rollDiceWithDetail(sanitizedPowerDamage, 'Power');
  const powerDamageRolled = powerRoll.total;
  if (powerRoll.line) rollDetails.push(powerRoll.line);
  if (powerRoll.roll) damageChatRolls.push(powerRoll.roll);

  const passiveRoll = await rollDiceWithDetail(sanitizedPassiveDamage, 'Passive');
  const passiveDamageRolled = passiveRoll.total;
  if (passiveRoll.line) rollDetails.push(passiveRoll.line);
  if (passiveRoll.roll) damageChatRolls.push(passiveRoll.roll);
  
  // Calculate raise damage and collect specials
  let raiseDamage = 0;
  const specialsUsed: string[] = [];
  let raiseDiceCount = 0;

  // Base power specials from the resolved snapshot apply on every successful hit.
  for (const special of availableSpecials) {
    if (special.type === 'power-special' && special.effect) {
      specialsUsed.push(special.effect);
    }
  }
  
  for (let i = 0; i < raises; i++) {
    const selection = raiseSelections.get(i);
    if (selection) {
      if (selection.type === 'damage') {
        raiseDiceCount += 1;
        const r = await rollDiceWithDetail('1d8', `Raise ${raiseDiceCount} (+1d8)`);
        raiseDamage += r.total;
        if (r.line) rollDetails.push(r.line);
        if (r.roll) damageChatRolls.push(r.roll);
      } else if (selection.type === 'special') {
        const special = availableSpecials.find(s => s.id === selection.value);
        if (special) {
          specialsUsed.push(special.effect || special.name);
        }
      }
    }
  }

  for (const line of npcAutoSpecialStrings) {
    if (line) specialsUsed.push(line);
  }
  let npcAutoDiceIdx = 0;
  for (let j = 0; j < npcAutoDamageDice; j++) {
    npcAutoDiceIdx += 1;
    const r = await rollDiceWithDetail('1d8', `NSC auto (+1d8) #${npcAutoDiceIdx}`);
    raiseDamage += r.total;
    if (r.line) rollDetails.push(r.line);
    if (r.roll) damageChatRolls.push(r.roll);
  }
  
  // Conditional damage riders (fires only when the target carries the gated condition).
  let conditionalDamageRolled = 0;
  const conditionalSpecialsUsed: string[] = [];
  try {
    const { collectConditionalDamageRiders } = await import('../utils/power-mechanics.js');
    const items = (attacker as any)?.items;
    let selectedPower: any = null;
    if (selectedPowerId && items) {
      selectedPower = items.get?.(selectedPowerId)
        ?? (Array.isArray(items) ? items.find((i: any) => i.id === selectedPowerId) : null);
    }
    const riders = collectConditionalDamageRiders(attacker, target, selectedPower);
    for (const rider of riders) {
      const r = await rollDiceWithDetail(rider.dice, `${rider.source} vs ${rider.condition}`);
      conditionalDamageRolled += r.total;
      if (r.line) rollDetails.push(r.line);
      if (r.roll) damageChatRolls.push(r.roll);
      conditionalSpecialsUsed.push(`${rider.source} (+${rider.dice} vs ${rider.condition})`);
    }
  } catch (e) {
    console.warn('Mastery System | [CALCULATE DAMAGE] conditional rider eval failed', e);
  }

  // Manual damage bonus from the attacker's character sheet
  // (`system.manual.rolls.damage` + `system.manual.rolls.any`).
  // Extra d8 are rolled into the existing `damageChatRolls` array so 3D dice /
  // chat output include them; the flat portion is added straight into the
  // subtotal.
  let manualDamageRolled = 0;
  let manualDamageFlat = 0;
  try {
    if (attacker) {
      const { readManualAdjustments, manualRollBonusForKind } = await import(
        '../utils/manual-adjustments.js'
      );
      const adj = readManualAdjustments(attacker);
      const bonus = manualRollBonusForKind(adj, 'damage');
      if (bonus.dice > 0) {
        const r = await rollDiceWithDetail(`${bonus.dice}d8`, 'Manual Bonus (damage)');
        manualDamageRolled = r.total;
        if (r.line) rollDetails.push(r.line);
        if (r.roll) damageChatRolls.push(r.roll);
      }
      if (bonus.flat !== 0) {
        manualDamageFlat = bonus.flat;
        const sign = bonus.flat > 0 ? '+' : '';
        rollDetails.push(`Manual Bonus (damage): ${sign}${bonus.flat} flat`);
      }
    }
  } catch (e) {
    console.warn('Mastery System | [CALCULATE DAMAGE] manual damage bonus failed', e);
  }

  // Diminishing vulnerability riders on the defender:
  //   Hex(X)      → +1d8 per 2 Hex (rounded up) when hit by a Spell.
  //   Sundered(X) → +1d8 per 2 Sundered (rounded up) when hit by a non-Spell.
  // Mark(X) sets a Damage Floor: each damage die below the spent Mark value is
  // treated as that value; Mark is then reduced by the amount spent.
  let vulnerabilityBonusRolled = 0;
  let markFloorBonus = 0;
  try {
    if (target) {
      const { getActiveSpecialValue } = await import('../system/active-specials.js');
      const selectedPower = selectedPowerId
        ? resolvePowerItemForDamage(attacker as any, selectedPowerId)
        : null;
      const isSpell = selectedPower ? isSpellPowerItem(selectedPower) : false;

      const hex = getActiveSpecialValue(target, 'hex');
      const sundered = getActiveSpecialValue(target, 'sundered');
      const vulnValue = isSpell ? hex : sundered;
      if (vulnValue > 0) {
        const bonusDice = Math.ceil(vulnValue / 2);
        const label = isSpell ? `Hex(${hex})` : `Sundered(${sundered})`;
        const r = await rollDiceWithDetail(`${bonusDice}d8`, `${label} vulnerability`);
        vulnerabilityBonusRolled += r.total;
        if (r.line) rollDetails.push(r.line);
        if (r.roll) damageChatRolls.push(r.roll);
        specialsUsed.push(`${label} → +${bonusDice}d8`);
      }

      const mark = getActiveSpecialValue(target, 'mark');
      if (mark > 0) {
        const spend = Math.min(mark, 8);
        for (const roll of damageChatRolls) {
          for (const term of (roll?.terms || [])) {
            const results = term?.results;
            if (!Array.isArray(results)) continue;
            for (const res of results) {
              if (res?.active === false) continue;
              const face = Number(res?.result);
              if (Number.isFinite(face) && face < spend) {
                markFloorBonus += spend - face;
              }
            }
          }
        }
        if (markFloorBonus > 0 || spend > 0) {
          rollDetails.push(`Mark(${mark}) floor → dice raised to ${spend} (+${markFloorBonus})`);
          specialsUsed.push(`Mark spent ${spend} (floor ${spend})`);
        }
        await consumeTargetMark(target, spend);
      }
    }
  } catch (e) {
    console.warn('Mastery System | [CALCULATE DAMAGE] vulnerability/mark riders failed', e);
  }

  // Players Guide attribute scaling (~5957–5965): Might/8 = +2 melee damage
  // per successful melee/unarmed strike. Applies as a flat bonus, never on
  // ranged/spell strikes. Read directly from the actor's pre-derived
  // `system.scaling.mightDamageBonus` so any rank-up / mid-session bump is
  // reflected immediately.
  let mightMeleeBonus = 0;
  if (attackType === 'melee' && attacker) {
    try {
      const mb = Number((attacker as any)?.system?.scaling?.mightDamageBonus ?? 0) || 0;
      if (mb > 0) {
        mightMeleeBonus = mb;
        rollDetails.push(`Might melee bonus: +${mb}`);
      }
    } catch {
      mightMeleeBonus = 0;
    }
  }

  // Total damage = Base Weapon + Might stone bonus + Might/8 melee bonus + Power Damage + Raises + Conditional + Manual (Passives separate)
  const totalDamage =
    baseDamageRolled
    + stoneMightDamageRolled
    + mightMeleeBonus
    + powerDamageRolled
    + raiseDamage
    + conditionalDamageRolled
    + manualDamageRolled
    + manualDamageFlat
    + vulnerabilityBonusRolled
    + markFloorBonus;
  
  console.log('Mastery System | [CALCULATE DAMAGE] Final calculation', {
    baseDamageRolled,
    stoneMightDamageRolled,
    stoneDamageBonusDice,
    powerDamageRolled,
    passiveDamageRolled,
    raiseDamage,
    totalDamage,
    specialsUsed,
    rollDetails,
    calculation: `Base (${baseDamageRolled}) + Might stones (${stoneMightDamageRolled}) + Power (${powerDamageRolled}) + Raises (${raiseDamage}) = ${totalDamage}`
  });
  
  // Apply status effects from specials to target
  if (specialsUsed.length > 0 && target) {
    await applyStatusEffectsToTarget(target, specialsUsed);
  }

  for (const note of conditionalSpecialsUsed) specialsUsed.push(note);

  // Count natural 8s across every damage roll we fired above — drives the
  // "never below count8s if any 8 was rolled" floor in the defensive pipeline.
  const count8s = countNaturalEights(damageChatRolls);

  // Split-Attack damage rule:
  //   Raises go 1:1 into the strike they were declared on (the player
  //   buys raises per strike during the attack roll, so they already
  //   reflect the halved attack pool). Every other damage source (base
  //   weapon, Might stones, power damage, conditional riders, manual
  //   bonuses, NPC auto-dice) represents the *full* output of the
  //   attacker and is split evenly between the two strikes → halved.
  //   Implementation: subtract raises, floor-divide the remainder, then
  //   add raises back in full so each strike's damage equals
  //     floor((base+weapon+stones+power+riders+manual+npc)/2) + raises.
  const nonRaiseDamage = Math.max(0, totalDamage - raiseDamage);
  const appliedDamage = splitAttack
    ? Math.max(0, Math.floor(nonRaiseDamage / 2)) + raiseDamage
    : totalDamage;
  // count8s feeds the "never below count8s" floor in the defensive
  // pipeline. Halving it would under-report 8s that came from the raise
  // dice of *this* strike; we keep the full count (it is per-strike).
  const appliedCount8s = count8s;
  if (splitAttack) {
    console.log('Mastery System | [CALCULATE DAMAGE] Split-Attack damage split', {
      rawTotalDamage: totalDamage,
      raiseDamage,
      nonRaiseDamage,
      halvedNonRaise: Math.floor(nonRaiseDamage / 2),
      appliedDamage,
      rawCount8s: count8s,
      appliedCount8s,
    });
  }

  // Apply damage to target
  let mitigation: AppliedDamageSummary | undefined;
  if (target) {
    mitigation = await applyDamageToTarget(target, appliedDamage, attacker, appliedCount8s);
  }

  const result: DamageResult = {
    baseDamage: baseDamageRolled,
    powerDamage: powerDamageRolled,
    passiveDamage: passiveDamageRolled,
    raiseDamage,
    specialsUsed,
    totalDamage: appliedDamage,
    rollDetails: rollDetails.length ? rollDetails : undefined,
    damageChatRolls: damageChatRolls.length ? damageChatRolls : undefined,
    count8s: appliedCount8s,
    mitigation,
  };
  
  console.log('Mastery System | [CALCULATE DAMAGE] Returning result', result);
  
  return result;
}

/** Short text of individual dice results for chat (Foundry Roll v13). */
function summarizeRollDiceFaces(roll: any): string {
  const formula = roll?.formula ?? '';
  try {
    const chunks: string[] = [];
    for (const term of roll.terms || []) {
      const results = term?.results;
      if (Array.isArray(results) && results.length > 0) {
        const faces = term.faces ?? "?";
        const vals = results
          .filter((r: any) => r && r.active !== false)
          .map((r: any) => r.result);
        if (vals.length) chunks.push(`${vals.length}d${faces}: [${vals.join(", ")}]`);
      }
    }
    if (chunks.length) return `${formula} → ${chunks.join(" + ")}`;
  } catch {
    /* ignore */
  }
  return formula || "—";
}

/**
 * Roll one damage pool (Foundry v13+: must evaluate asynchronously — sync mode throws for standard dice).
 */
async function rollDiceWithDetail(
  diceNotation: string,
  label: string
): Promise<{ total: number; line: string; roll: any | null }> {
  if (!diceNotation || diceNotation === "0") {
    return { total: 0, line: "", roll: null };
  }
  let formula = sanitizeDiceNotation(diceNotation);
  if (formula === "0") {
    return { total: 0, line: "", roll: null };
  }
  formula = masteryCoercePlainNumberToNd8(formula);
  if (formula === "0") {
    return { total: 0, line: "", roll: null };
  }
  formula = masteryApplyExplodingD8(formula);
  try {
    const RollCtor = (globalThis as any).Roll;
    const roll = new RollCtor(formula);
    await roll.evaluate();
    const total = roll.total ?? 0;
    const detail = summarizeRollDiceFaces(roll);
    const line = `${label}: ${detail} → ${total}`;
    return { total, line, roll };
  } catch (error) {
    console.warn("Mastery System | Error rolling dice formula:", formula, error);
    return { total: 0, line: "", roll: null };
  }
}

/**
 * Roll dice from notation string using Foundry Roll
 * Supports full Foundry Roll formulas like "1d8 + 1d8", "2d8 + 3d8 + 2"
 */
async function rollDice(diceNotation: string): Promise<number> {
  return (await rollDiceWithDetail(diceNotation, "Roll")).total;
}

// DamageDialog class removed - now using chat messages instead
// The following code is kept for reference but not used:
/* eslint-disable @typescript-eslint/no-unused-vars */
/*
class DamageDialog extends Application {
  private data: DamageDialogData;
  private resolve: (result: DamageResult | null) => void;
  private raiseSelections: Map<number, { type: 'special' | 'damage'; value: string }> = new Map();
  
  constructor(data: DamageDialogData, resolve: (result: DamageResult | null) => void) {
    super({});
    this.data = data;
    this.resolve = resolve;
    console.log('Mastery System | DEBUG: DamageDialog constructor', {
      hasData: !!data,
      raises: data.raises,
      baseDamage: data.baseDamage,
      availableSpecials: data.availableSpecials?.length || 0
    });
  }
  
  static override get defaultOptions(): any {
    const opts = super.defaultOptions || {};
    console.log('Mastery System | DEBUG: DamageDialog defaultOptions - super.defaultOptions', super.defaultOptions);
    opts.id = 'mastery-damage-dialog';
    opts.title = 'Calculate Damage';
    opts.template = 'systems/mastery-system/templates/dice/damage-dialog.hbs';
    opts.width = 600;
    opts.height = 'auto';
    opts.resizable = true;
    opts.classes = ['mastery-damage-dialog'];
    opts.popOut = true;
    console.log('Mastery System | DEBUG: DamageDialog defaultOptions - final opts', opts);
    return opts;
  }
  
  // Implement required methods for Handlebars templates (Foundry VTT v13)
  async _renderHTML(data: any): Promise<JQuery> {
    const template = (this.constructor as any).defaultOptions.template || this.options.template;
    if (!template) {
      throw new Error('Template path is required');
    }
    console.log('Mastery System | DEBUG: DamageDialog _renderHTML - rendering template', { 
      template, 
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      dataValue: data
    });
    // Always call getData() to ensure we have the correct data structure
    const templateData = await this.getData();
    console.log('Mastery System | DEBUG: DamageDialog _renderHTML - templateData from getData()', {
      hasData: !!templateData,
      keys: templateData ? Object.keys(templateData) : [],
      baseDamage: templateData?.baseDamage,
      powerDamage: templateData?.powerDamage,
      passiveDamage: templateData?.passiveDamage,
      raises: templateData?.raises,
      availableSpecials: templateData?.availableSpecials?.length || 0,
      weaponSpecials: templateData?.weaponSpecials?.length || 0,
      attacker: templateData?.attacker ? (templateData.attacker as any).name : 'none',
      target: templateData?.target ? (templateData.target as any).name : 'none',
      fullData: JSON.stringify(templateData, null, 2).substring(0, 1000)
    });
    const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
    console.log('Mastery System | DEBUG: DamageDialog _renderHTML - template rendered', { 
      htmlLength: html.length,
      htmlType: typeof html,
      htmlPreview: html.substring ? html.substring(0, 500) : String(html).substring(0, 500)
    });
    const $html = $(html);
    console.log('Mastery System | DEBUG: DamageDialog _renderHTML - jQuery object created', {
      length: $html.length,
      htmlContent: $html.html()?.substring(0, 500)
    });
    return $html;
  }
  
  async _replaceHTML(element: JQuery, html: JQuery): Promise<void> {
    console.log('Mastery System | DEBUG: DamageDialog _replaceHTML - replacing element', {
      elementLength: element.length,
      elementHtml: element.html()?.substring(0, 200),
      htmlLength: html.length,
      htmlContent: html.html()?.substring(0, 500)
    });
    element.replaceWith(html);
    console.log('Mastery System | DEBUG: DamageDialog _replaceHTML - element replaced');
  }
  
  override async getData(): Promise<any> {
    console.log('Mastery System | DEBUG: DamageDialog getData() - called', {
      hasData: !!this.data,
      raises: this.data?.raises,
      baseDamage: this.data?.baseDamage,
      powerDamage: this.data?.powerDamage,
      passiveDamage: this.data?.passiveDamage,
      availableSpecials: this.data?.availableSpecials?.length || 0,
      weaponSpecials: this.data?.weaponSpecials?.length || 0,
      attacker: (this.data?.attacker as any)?.name,
      target: (this.data?.target as any)?.name
    });
    const data = {
      attacker: this.data?.attacker || null,
      target: this.data?.target || null,
      weapon: this.data?.weapon || null,
      baseDamage: this.data?.baseDamage || '0',
      powerDamage: this.data?.powerDamage || '0',
      passiveDamage: this.data?.passiveDamage || '0',
      raises: this.data?.raises || 0,
      availableSpecials: this.data?.availableSpecials || [],
      weaponSpecials: this.data?.weaponSpecials || [],
      raiseSelections: Array.from(this.raiseSelections.entries()).map(([index, selection]) => ({
        index,
        ...selection
      }))
    };
    console.log('Mastery System | DEBUG: DamageDialog getData() - returning', {
      hasData: !!data,
      raises: data.raises,
      baseDamage: data.baseDamage,
      powerDamage: data.powerDamage,
      passiveDamage: data.passiveDamage,
      availableSpecials: data.availableSpecials?.length || 0,
      weaponSpecials: data.weaponSpecials?.length || 0,
      raiseSelectionsCount: data.raiseSelections?.length || 0,
      attackerName: data.attacker ? (data.attacker as any).name : 'none',
      targetName: data.target ? (data.target as any).name : 'none'
    });
    return data;
  }
  
  override activateListeners(html: JQuery): void {
    super.activateListeners(html);
    
    // Handle raise selection changes
    html.find('.raise-selection').on('change', (ev) => {
      const raiseIndex = parseInt($(ev.currentTarget).data('raise-index'));
      const selectionType = $(ev.currentTarget).val() as string;
      
      if (selectionType === 'damage') {
        this.raiseSelections.set(raiseIndex, { type: 'damage', value: '1d8' });
      } else if (selectionType === 'special') {
        // Show special selection dropdown
        const specialSelect = html.find(`.special-select[data-raise-index="${raiseIndex}"]`);
        specialSelect.show();
      } else {
        this.raiseSelections.delete(raiseIndex);
        html.find(`.special-select[data-raise-index="${raiseIndex}"]`).hide();
      }
      
      this.render();
    });
    
    // Handle special selection
    html.find('.special-select').on('change', (ev) => {
      const raiseIndex = parseInt($(ev.currentTarget).data('raise-index'));
      const specialId = $(ev.currentTarget).val() as string;
      this.raiseSelections.set(raiseIndex, { type: 'special', value: specialId });
    });
    
    // Handle roll damage button
    html.find('.roll-damage-btn').on('click', async () => {
      const result = await this.calculateDamage();
      this.resolve(result);
      this.close();
    });
    
    // Handle cancel button
    html.find('.cancel-btn').on('click', () => {
      this.resolve(null);
      this.close();
    });
  }
  
  private async calculateDamage(): Promise<DamageResult> {
    // Sanitize dice notations before rolling
    const sanitizedBaseDamage = sanitizeDiceNotation(this.data.baseDamage);
    const sanitizedPowerDamage = sanitizeDiceNotation(this.data.powerDamage || '0');
    const sanitizedPassiveDamage = sanitizeDiceNotation(this.data.passiveDamage || '0');
    
    // Roll base damage
    const baseDamage = await this.rollDice(sanitizedBaseDamage);
    
    // Roll power damage
    const powerDamage = await this.rollDice(sanitizedPowerDamage);
    
    // Roll passive damage
    const passiveDamage = await this.rollDice(sanitizedPassiveDamage);
    
    // Calculate raise damage and collect specials
    let raiseDamage = 0;
    const specialsUsed: string[] = [];
    
    for (let i = 0; i < this.data.raises; i++) {
      const selection = this.raiseSelections.get(i);
      if (selection) {
        if (selection.type === 'damage') {
          raiseDamage += await this.rollDice('1d8');
        } else if (selection.type === 'special') {
          const special = this.data.availableSpecials.find(s => s.id === selection.value);
          if (special) {
            specialsUsed.push(special.name);
          }
        }
      }
    }
    
    const totalDamage = baseDamage + powerDamage + passiveDamage + raiseDamage;
    
    return {
      baseDamage,
      powerDamage,
      passiveDamage,
      raiseDamage,
      specialsUsed,
      totalDamage
    };
  }
  
  private async rollDice(diceNotation: string): Promise<number> {
    if (!diceNotation || diceNotation === '0') return 0;
    
    // Parse dice notation (e.g., "2d8+3" or "1d8")
    const match = diceNotation.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) {
      // Try to parse as flat number
      const num = parseInt(diceNotation);
      return isNaN(num) ? 0 : num;
    }
    
    const numDice = parseInt(match[1]);
    const dieSize = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;
    
    let total = 0;
    for (let i = 0; i < numDice; i++) {
      total += Math.floor(Math.random() * dieSize) + 1;
    }
    
    return total + modifier;
  }
}
*/
