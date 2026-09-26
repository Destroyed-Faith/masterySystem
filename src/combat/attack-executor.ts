/**
 * Attack Executor
 * Creates melee/ranged attack chat cards with proper flags for the roll handler
 */

import type { RadialCombatOption } from "../token-radial-menu";
import { getAttackAttributeForPowerTreeOrSchool } from "../utils/power-roll-attribute.js";
import { normalizeArtifactAttackAttribute } from "../utils/artifact-node-options.js";
import { resolveEquippedWeaponForAttackType } from "../utils/equipment-modifiers.js";
import { artifactToVirtualWeapon, createVirtualUnarmedWeapon, isVirtualUnarmedWeapon } from "../utils/unarmed-fallback.js";
import { evaluateThreatenedRanged } from "./threatened-ranged.js";
import { npcMaxRangeM, rangeTextFromMax } from "../utils/range-bands.js";
import {
  formatNpcAttackSpecialsLine,
  getNpcAttackByIndex,
  npcAttackDiceCount,
  npcAttackExplodesOn7,
  npcAttackKeepDice,
  npcDamageDiceFormula
} from "../utils/npc-attack-model.js";
import { resolvePowerMechanics } from "../utils/power-mechanics.js";
import { parseD8Count } from "../utils/dice-formula.js";
import { basicAttackMrDamageFormula } from "./basic-combat.js";
import {
  mergeWeaponSpecialsIntoSnapshot,
  parkWeaponSpecialsForRaises,
  weaponSpecialEntries,
} from "../utils/weapon-specials.js";
import { RAISE_INCREMENT } from "../utils/constants.js";
import { getRulesMasteryRank } from "../utils/mastery-rank-sync.js";
import { castingBaseTnForMasteryRank } from "./spell-roll-handler.js";
import { artifactLevelToTemplateRank } from "../utils/artifact-spell-pick.js";
import {
  getTargetEvade,
  getTargetSpellResistance,
  spellResistanceAfterPenetration,
} from "./target-defenses.js";
import { actorHasSurprise } from "./surprise.js";
import { ENCOUNTER_SOCKET } from "./combat-permissions.js";

export {
  getTargetEvade,
  getTargetSpellResistance,
  spellResistanceAfterPenetration,
} from "./target-defenses.js";
import {
  buildAvailableRaiseOptions,
  computeRaiseTns,
  countRaiseSlots,
  declaredRaiseFromOptionId,
  dedupeDeclaredRaises,
  describeDeclaredRaise,
  formatHitBreakdown,
  loadPowerSnapshotForArtifactOption,
  loadPowerSnapshotForItem,
  paidRaiseSlots,
  resolvePowerSnapshot,
  snapshotToDamageFormula,
  snapshotToSpecialStrings,
  type DeclaredRaise,
  type PowerSnapshot,
  type RaiseCostAllocation,
  type RaiseOption,
} from "./raise-resolution.js";

/** Bookkeeping for a single strike of a split-attack pair. */
interface SplitContext {
  splitPairId: string;
  splitIndex: 1 | 2;
  /** Halved attack pool for this strike (Math.floor(original / 2)). */
  attributePool: number;
}

/** One melee AoE declaration → multiple attack cards; only volleyIndex === 1 spends the attack action on roll. */
export interface MeleeBurstVolleyContext {
  volleyId: string;
  volleyIndex: number;
  volleyTotal: number;
}

/**
 * Weapon / martial AoE context. One Attack Roll is compared separately against
 * each creature's Evade (or Final Spell TN for spell AoEs). Every hit receives
 * the full printed payload; Dive for Cover may be used before payload.
 */
export interface AoeMeleeWeaponContext {
  /** Other tokens in the area besides the card's display/primary target. */
  secondaryTokenIds: string[];
  /**
   * Power bonus d8 (damageRider). Kept for UI/debug; secondaries now resolve
   * full payload via the damage dialog, not splash-only dice.
   */
  powerBonusDice: number;
}

function newSplitPairId(): string {
  try {
    if (typeof foundry !== 'undefined' && (foundry as any).utils?.randomID) {
      return (foundry as any).utils.randomID(16);
    }
  } catch {
    /* fall through */
  }
  return `split-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

/**
 * Detect whether the selected power declares a Split-Attack. The attack pool
 * and damage pool are split evenly (Math.floor) between two independent
 * strikes sharing one attack-action. See [agent.md] rules for scope.
 */
function detectSplitAttack(option: RadialCombatOption): boolean {
  try {
    if (option.source === 'npc-attack') {
      return !!(option as any).npcSplitAttack;
    }
    if (option.source !== 'power' || !option.item) return false;
    const tid = String((option.item.system as any)?.templateId || '');
    if (tid === 'active-melee-weapon-split' || tid === 'active-ranged-weapon-split') {
      return true;
    }
    const mech = resolvePowerMechanics(option.item);
    return mech?.splitAttack === true;
  } catch {
    return false;
  }
}

/**
 * Safely collect items from actor (handles Collection, Array, Map)
 */
function collectActorItems(actor: any): any[] {
  if (!actor || !actor.items) return [];
  
  if (Array.isArray(actor.items)) {
    return actor.items;
  } else if (actor.items instanceof Map) {
    return Array.from(actor.items.values());
  } else if (actor.items.size !== undefined && actor.items.values) {
    // Foundry Collection-like object
    return Array.from(actor.items.values());
  }
  
  return [];
}

function attackCardEsc(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveWeaponForAttack(items: any[], attackType: "melee" | "ranged"): any | null {
  return resolveEquippedWeaponForAttackType(items, attackType);
}

/**
 * On-hit preview for the raise panel: weapon dice + power dice as a total
 * (e.g. "9d8 total (5d8 weapon + 4d8 power), Sundered(2)"). With no weapon
 * dice (spells, unarmed flat damage) this is the plain power snapshot summary.
 */
function formatOnHitSummary(snapshot: PowerSnapshot, weaponDice: number | undefined): string {
  return formatHitBreakdown(weaponDice, snapshot.damageDice, { specials: snapshot.specials });
}

/**
 * Get attribute value from actor
 */
export function getAttributeValue(actor: any, attributeName: string): number {
  if (!actor || !actor.system) {
    console.warn('Mastery System | [ATTACK EXECUTOR] getAttributeValue: No actor or system', {
      hasActor: !!actor,
      hasSystem: !!actor?.system,
      attributeName
    });
    return 0;
  }
  const system = actor.system as any;
  const attributes = system.attributes || {};
  const attrKey = attributeName.toLowerCase();
  const attr = attributes[attrKey] || {};
  const value = attr.value ?? attr.stones ?? 0;
  
  // Debug logging
  if (value === 0 || value < 2) {
    console.warn('Mastery System | [ATTACK EXECUTOR] getAttributeValue: Low or zero value detected', {
      attributeName,
      attrKey,
      attr,
      value,
      allAttributes: Object.keys(attributes),
      attributesData: attributes
    });
  }
  
  return value;
}

/**
 * Get mastery rank from actor
 */
export function getMasteryRank(actor: any): number {
  return getRulesMasteryRank(actor);
}

/** True when the wielded weapon (real or artifact-virtual) has the Finesse innate. */
export function weaponHasFinesse(weapon: any | null): boolean {
  if (!weapon) return false;
  const sys = (weapon.system as any) || {};
  const lines: unknown[] = [];
  if (Array.isArray(sys.innateAbilities)) lines.push(...sys.innateAbilities);
  if (Array.isArray(sys.artifactWeapon?.innateAbilities)) {
    lines.push(...sys.artifactWeapon.innateAbilities);
  }
  if (sys.freeTrait) lines.push(sys.freeTrait);
  if (sys.artifactWeapon?.freeTrait) lines.push(sys.artifactWeapon.freeTrait);
  if (lines.some((a) => String(a).toLowerCase().includes("finesse"))) return true;
  const specials: unknown[] = [];
  if (Array.isArray(sys.specials)) specials.push(...sys.specials);
  if (Array.isArray(sys.artifactWeapon?.specials)) specials.push(...sys.artifactWeapon.specials);
  return specials.some((s) => {
    const id = s && typeof s === "object" ? (s as { specialId?: string }).specialId : s;
    return String(id ?? "").toLowerCase().includes("finesse");
  });
}

/**
 * Determine which attribute to use for attack rolls.
 * - Spells: casting attribute on the item / option.
 * - Weapons with Finesse (incl. artifact Free Trait): Agility for To-Hit —
 *   also for weapon-carried attack powers (Melee Single Attack, Targeted Special, …),
 *   where it beats the mastery-tree default (rules: "Attack Roll uses Agility").
 * - Powers: attribute from mastery tree / spell school (`system.tree`) via fixed list; if unknown tree, fall back to `roll.attribute`.
 * - Otherwise: Might for melee, Agility for ranged (weapon or maneuver).
 */
function attackAttributeOverrideFromWeapon(weapon: any | null): string | null {
  if (!weapon) return null;
  const sys = (weapon.system as any) || {};
  return (
    normalizeArtifactAttackAttribute(sys.attackAttribute) ||
    normalizeArtifactAttackAttribute(sys.artifactWeapon?.attackAttribute)
  );
}

function resolveWeaponForAttribute(
  actor: any,
  weapon: any | null,
  option: RadialCombatOption,
  attackType: "melee" | "ranged",
): any | null {
  if (weapon) return weapon;
  if (!actor || option.source === "npc-attack") return null;
  const items = collectActorItems(actor);
  const forcedWeaponItemId = (option as any).forcedWeaponItemId;
  if (forcedWeaponItemId) {
    const forcedItem = items.find((i: any) => i.id === forcedWeaponItemId);
    if (forcedItem?.type === "artifact") return artifactToVirtualWeapon(forcedItem);
    if (forcedItem?.type === "weapon") return forcedItem;
  }
  return resolveWeaponForAttack(items, attackType);
}

export function getAttackAttribute(
  actor: any,
  weapon: any | null,
  option: RadialCombatOption,
  attackType: "melee" | "ranged"
): string {
  const resolvedWeapon = resolveWeaponForAttribute(actor, weapon, option, attackType);
  const attributeOverride = attackAttributeOverrideFromWeapon(resolvedWeapon);
  if (option.storedAttackPool?.attribute) {
    return String(option.storedAttackPool.attribute).toLowerCase();
  }
  if (option.source === "power" && option.item) {
    const powerSystem = (option.item.system as any) || {};
    const artifactIsSpell = option.artifactIsSpell === true;
    // Active-as-Spell: casting attribute on the item beats every other signal.
    if (artifactIsSpell && option.artifactCastingAttribute) {
      return String(option.artifactCastingAttribute).toLowerCase();
    }
    if (powerSystem.isSpell && powerSystem.castingAttribute) {
      return String(powerSystem.castingAttribute).toLowerCase();
    }
    if (attributeOverride) {
      return attributeOverride;
    }
    // Non-spell attack powers are weapon-carried (they roll the equipped
    // weapon's dice), so a Finesse weapon swaps the To-Hit to Agility even
    // when the mastery tree would default to Might.
    if (!artifactIsSpell && powerSystem.isSpell !== true && weaponHasFinesse(resolvedWeapon)) {
      return "agility";
    }
    const fromTreeOrSchool = getAttackAttributeForPowerTreeOrSchool(powerSystem.tree);
    if (fromTreeOrSchool) {
      return fromTreeOrSchool;
    }
    const attr = powerSystem.roll?.attribute || powerSystem.attribute;
    if (attr) {
      return String(attr).toLowerCase();
    }
  }

  if (option.source === "npc-attack") {
    return attackType === "ranged" ? "agility" : "might";
  }

  if (attributeOverride) {
    return attributeOverride;
  }

  if (weaponHasFinesse(resolvedWeapon)) {
    return "agility";
  }

  return attackType === "ranged" ? "agility" : "might";
}

/**
 * Create a melee or ranged attack chat card with roll button (Threatened Ranged for qualifying ranged attacks).
 */
export async function createAttackCard(
  attackerToken: any,
  targetToken: any,
  option: RadialCombatOption,
  attackType: "melee" | "ranged",
  split: SplitContext | null = null,
  burstVolley: MeleeBurstVolleyContext | null = null,
  aoeMelee: AoeMeleeWeaponContext | null = null,
): Promise<string | null> {
  // Autofire is handled before createAttackCard (chain targeting → one card
  // with autofireChainTokenIds). Do not treat it as Split-Attack.

  // Split-Attack dispatcher: when a power declares `mechanics.splitAttack`,
  // we recurse into two strikes sharing one attack action. Pool + damage are
  // halved per strike (floor — odd remainder falls off symmetrically).
  if (!split && !burstVolley && !aoeMelee && detectSplitAttack(option)) {
    const pairId = newSplitPairId();
    // Strike 1 resolves first; Strike 2 is scheduled immediately after so
    // both cards appear in chat for the target owner to resolve.
    await createAttackCard(attackerToken, targetToken, option, attackType, {
      splitPairId: pairId,
      splitIndex: 1,
      attributePool: 0, // recomputed below with the real base pool.
    }, null, null);
    await createAttackCard(attackerToken, targetToken, option, attackType, {
      splitPairId: pairId,
      splitIndex: 2,
      attributePool: 0,
    }, null, null);
    return null;
  }

  // Use token actor (for unlinked tokens) or base actor
  // For unlinked tokens, token.actor is a synthetic actor with delta data
  // For linked tokens, token.actor is the base actor
  const attacker = attackerToken.actor;
  const target = targetToken.actor;
  
  // For unlinked tokens, we might need to merge token delta with base actor data
  // But for now, use the token actor as-is and let the debug logs show what's happening
  const isUnlinked = attackerToken.actorLink === false;
  const baseActorId = attackerToken.actorLink ? null : (attackerToken as any).actorId;
  const baseActor = baseActorId ? (game as any).actors?.get(baseActorId) : null;
  
  // Debug: Log actor information
  if (!attacker || !target) {
    console.error('Mastery System | [ATTACK EXECUTOR] Missing actor data', {
      hasAttacker: !!attacker,
      hasTarget: !!target
    });
    return null;
  }
  
  // Log actor item summary for diagnostics
  const items = collectActorItems(attacker);
  let weapon = resolveWeaponForAttack(items, attackType);
  // Forced weapon (e.g. an artifact natural weapon like the Dragon Head Bite):
  // build a weapon-shaped object from the artifact's `artifactWeapon` profile so
  // this attack always uses it regardless of any conventional weapon equipped.
  const forcedWeaponItemId = (option as any).forcedWeaponItemId;
  if (forcedWeaponItemId) {
    const forcedItem = items.find((i: any) => i.id === forcedWeaponItemId);
    if (forcedItem) {
      if (forcedItem.type === 'artifact') {
        // Handles both baked `artifactWeapon` blobs and damage derived live
        // from the base profile (e.g. bound general artifact weapons).
        const vw = artifactToVirtualWeapon(forcedItem);
        if (vw) weapon = vw;
      } else if (forcedItem.type === 'weapon') {
        weapon = forcedItem;
      }
    }
  }
  const isNpcAttack = (option as any).source === "npc-attack";
  const npcAttackRow = isNpcAttack
    ? getNpcAttackByIndex(
        attacker.system,
        (option as any).npcAttackIndex ?? 0,
        (option as any).npcPhaseIndex
      )
    : null;
  const isNpcActor = attacker?.type === 'npc' || attacker?.type === 'summon';
  // Basic Attack on an NPC still hits with the sheet row (index 0), not Might.
  // isNpcAttack stays false so weapon damage is not stripped.
  const sheetAttackRow =
    npcAttackRow ??
    (isNpcActor ? getNpcAttackByIndex(attacker.system, 0, null) : null);
  const poolFromNpc = sheetAttackRow
    ? npcAttackDiceCount(sheetAttackRow)
    : attacker?.type === 'npc'
      ? 6
      : 0;
  const useSheetPool = isNpcActor && (sheetAttackRow != null || attacker?.type === 'npc');

  if (isNpcAttack || option.ignoreWeaponDamage) {
    weapon = null;
  }

  if (!weapon && !isNpcAttack && !option.ignoreWeaponDamage && attackType === 'melee') {
    weapon = createVirtualUnarmedWeapon();
  }

  // Virtual unarmed has no embedded item id — omit weaponId so damage dialog uses fallback.
  let weaponId = weapon && !isVirtualUnarmedWeapon(weapon) ? weapon.id ?? null : null;
  // Determine attack attribute
  const attribute = getAttackAttribute(attacker, weapon, option, attackType);
  let attributeValue =
    option.storedAttackPool && Number(option.storedAttackPool.numDice) > 0
      ? Math.max(0, Math.floor(Number(option.storedAttackPool.numDice)))
      : useSheetPool
        ? poolFromNpc
        : getAttributeValue(attacker, attribute);
  const masteryRank = getMasteryRank(attacker);

  // Split-Attack: halve the attack pool (floor) on every strike.
  if (split) {
    attributeValue = Math.max(0, Math.floor(attributeValue / 2));
  }
  
  // Debug: Log attribute reading
  // Base TN: Evade (weapon / martial) or Casting TN from Power Level (Active-as-Spell attack)
  let targetEvadeFromActor = getTargetEvade(target);

  const {
    resolveEvadeVsInvisibleAttacker,
  } = await import('./perception-gate.js');
  const { applyAttackCloakDisruption } = await import('./perception-combat-hooks.js');
  const evadeVsInvisible = await resolveEvadeVsInvisibleAttacker(target, attacker, {
    defenderToken: targetToken,
    attackerToken: attackerToken,
  });
  if (evadeVsInvisible.evadeMultiplier < 1) {
    targetEvadeFromActor = Math.max(0, Math.floor(targetEvadeFromActor * evadeVsInvisible.evadeMultiplier));
  }
  await applyAttackCloakDisruption(attacker);

  // Get power info if applicable
  let selectedPowerId: string | null = null;
  let selectedPowerLevel: number | null = null;
  let selectedPowerSpecials: string[] = [];
  let selectedPowerDamage: string | null = null;

  let tnKind: 'evade' | 'casting' = 'evade';
  let castingBaseTn: number | null = null;
  /** Spell or Mental Power Base TN, before Spell Resistance. */
  let spellBaseTnValue: number | null = null;

  // AoE: one roll compared separately against each creature's Evade (martial)
  // or Final Spell TN (spell). The card's display TN is the primary/anchor
  // target; secondaries are checked independently after the roll.

  if (option.source === 'power' && option.item) {
    selectedPowerId = option.item.id;
    const powerSystem = (option.item.system as any) || {};
    const artifactIsSpell = option.artifactIsSpell === true;
    selectedPowerLevel = option.artifactPowerTemplateId
      ? Number(artifactLevelToTemplateRank(option.artifactRowLevel || 1))
      : (powerSystem.level || null);

    // Extract specials and damage from option.powerData or embedded item system (damage-card fallback).
    if (option.item.name) {
      const powerData = (option as any).powerData;
      if (powerData) {
        selectedPowerSpecials = powerData.specials || [];
        selectedPowerDamage = powerData.damage || null;
      }
    }
    if (selectedPowerSpecials.length === 0 && Array.isArray(powerSystem.specials)) {
      selectedPowerSpecials = [...powerSystem.specials];
    }
    if (!selectedPowerDamage && powerSystem.roll?.damage != null) {
      selectedPowerDamage = String(powerSystem.roll.damage);
    }

    if (powerSystem.isSpell === true || artifactIsSpell) {
      tnKind = 'casting';
      // Spell Base TN = (8 × caster Mastery Rank) − 2 (Players Guide "Casting
      // Roll"); Mental Powers add +4. The Power Level does NOT set the TN.
      const powerTags: string[] = Array.isArray(powerSystem.tags)
        ? powerSystem.tags.map((t: unknown) => String(t))
        : [];
      const isMentalPower =
        powerTags.includes('mental') ||
        /mental/i.test(String(powerSystem.templateId ?? '')) ||
        /mind-illusion|mind-probe|mental-control/i.test(String(powerSystem.templateId ?? ''));
      spellBaseTnValue = castingBaseTnForMasteryRank(masteryRank, { mental: isMentalPower });
      castingBaseTn = spellBaseTnValue + spellResistanceAfterPenetration(target, attacker);
    }
  }

  // NPC Spell attacks use Spell Base TN (8 × Mastery Rank − 2),
  // not Evade and not PC power-level Casting TN.
  const npcIsSpell =
    isNpcAttack && (!!(option as any).npcIsSpell || !!npcAttackRow?.npcIsSpell);
  const npcCrit =
    isNpcAttack &&
    (npcAttackExplodesOn7(option as any) || npcAttackExplodesOn7(npcAttackRow));
  if (npcIsSpell) {
    tnKind = 'casting';
    spellBaseTnValue = castingBaseTnForMasteryRank(Math.max(1, masteryRank));
    castingBaseTn = spellBaseTnValue + spellResistanceAfterPenetration(target, attacker);
  }

  /** Normal TN for the card's anchor target — unchanged by declared raises. */
  const normalTn =
    tnKind === 'casting' && castingBaseTn != null
      ? castingBaseTn
      : targetEvadeFromActor;
  const baseEvade = normalTn;

  let raiseContext: {
    masteryRank: number;
    isSpell: boolean;
    baseSnapshot: PowerSnapshot;
    raiseOptions: RaiseOption[];
    /** Wielded weapon's d8 count — shown as part of the on-hit total preview. */
    weaponDamageDice?: number;
    /** NPC raises do not start free. The GM marks single Raises. */
    waiveRaiseCost?: boolean;
  } | null = null;

  const powerOnHitKeys = new Set<string>();
  if (option.source === 'power' && option.item && !isNpcAttack) {
    try {
      let loaded: { snapshot: PowerSnapshot; isSpell: boolean; levelData: any | null } | null = null;
      if (option.artifactPowerTemplateId) {
        loaded = await loadPowerSnapshotForArtifactOption(option);
      } else if (option.item.type === 'power') {
        loaded = await loadPowerSnapshotForItem(option.item);
      }
      if (loaded) {
        for (const sp of loaded.snapshot.specials) {
          if (sp.key) powerOnHitKeys.add(sp.key);
        }
        selectedPowerSpecials = snapshotToSpecialStrings(loaded.snapshot);
        if (!selectedPowerDamage) {
          selectedPowerDamage = snapshotToDamageFormula(loaded.snapshot);
        }
        const opts = buildAvailableRaiseOptions(loaded.snapshot, loaded.isSpell);
        if (opts.length > 0) {
          raiseContext = {
            masteryRank,
            isSpell: loaded.isSpell,
            baseSnapshot: loaded.snapshot,
            raiseOptions: opts,
          };
        } else if (loaded.isSpell) {
          raiseContext = {
            masteryRank,
            isSpell: true,
            baseSnapshot: loaded.snapshot,
            raiseOptions: [],
          };
        }
      } else if (option.artifactRowSpecial) {
        selectedPowerSpecials = String(option.artifactRowSpecial)
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s && s !== '—' && s !== '-');
      }
    } catch (err) {
      console.warn('Mastery System | raise context load failed', err);
    }
  }

  if (!raiseContext && isNpcAttack && npcAttackRow) {
    const rows = Array.isArray(npcAttackRow.specials) ? npcAttackRow.specials : [];
    const specials = rows
      .map((s: any) => ({
        key: String(s?.special || '').trim().toLowerCase(),
        rank: Math.max(0, Math.floor(Number(s?.specialValue) || 0)),
      }))
      .filter((s) => s.key);
    const snap: PowerSnapshot = {
      damageDice: Math.max(0, Math.floor(Number(npcAttackRow.damageDiceCount) || 0)),
      specials,
      rangeM: null,
      aoeRadiusM: null,
      durationSteps: 0,
      hasRange: false,
      hasAoe: false,
      hasDuration: false,
    };
    raiseContext = {
      masteryRank,
      isSpell: npcIsSpell,
      baseSnapshot: snap,
      raiseOptions: buildAvailableRaiseOptions(snap, npcIsSpell),
    };
  }

  if (raiseContext && !raiseContext.isSpell && !option.ignoreWeaponDamage && weapon) {
    raiseContext.baseSnapshot = mergeWeaponSpecialsIntoSnapshot(
      raiseContext.baseSnapshot,
      weaponSpecialEntries(weapon),
    );
    raiseContext.raiseOptions = buildAvailableRaiseOptions(raiseContext.baseSnapshot, false);
  }

  if (!raiseContext && !isNpcAttack && !option.ignoreWeaponDamage && option.id === 'weapon-attack') {
    const snap: PowerSnapshot = {
      damageDice: parseD8Count(basicAttackMrDamageFormula(attacker)),
      specials: weapon && !isVirtualUnarmedWeapon(weapon) ? weaponSpecialEntries(weapon) : [],
      rangeM: null,
      aoeRadiusM: null,
      durationSteps: 0,
      hasRange: false,
      hasAoe: false,
      hasDuration: false,
    };
    raiseContext = {
      masteryRank,
      isSpell: false,
      baseSnapshot: snap,
      raiseOptions: buildAvailableRaiseOptions(snap, false),
    };
  }

  if (!raiseContext && !isNpcAttack && !option.ignoreWeaponDamage && weapon && !isVirtualUnarmedWeapon(weapon)) {
    const entries = weaponSpecialEntries(weapon);
    if (entries.length > 0) {
      const snap: PowerSnapshot = {
        damageDice: 0,
        specials: entries,
        rangeM: null,
        aoeRadiusM: null,
        durationSteps: 0,
        hasRange: false,
        hasAoe: false,
        hasDuration: false,
      };
      raiseContext = {
        masteryRank,
        isSpell: false,
        baseSnapshot: snap,
        raiseOptions: buildAvailableRaiseOptions(snap, false),
      };
    }
  }

  if (raiseContext && !raiseContext.isSpell && !isNpcAttack) {
    const parked = parkWeaponSpecialsForRaises(raiseContext.baseSnapshot, powerOnHitKeys);
    raiseContext.baseSnapshot = parked.onHit;
    raiseContext.raiseOptions = buildAvailableRaiseOptions(parked.raiseSource, false);
  }

  // Non-spell attack powers are weapon-carried: the wielded weapon's dice roll
  // on top of the power's bonus dice, so the preview can show the real total.
  if (raiseContext && !raiseContext.isSpell) {
    raiseContext.weaponDamageDice = option.ignoreWeaponDamage
      ? 0
      : parseD8Count((weapon?.system as any)?.damage);
  }

  const tr =
    attackType === "ranged"
      ? evaluateThreatenedRanged(attackerToken, option)
      : {
          appliesRule: false,
          threatened: false,
          threateningEnemyTokenIds: [] as string[],
          opportunityEnemyTokenIds: [] as string[],
          rollDisadvantage: false
        };

  const optionPaysAction = option.costsAction !== false;
  let costsThisCard = optionPaysAction;
  if (burstVolley) {
    costsThisCard = optionPaysAction && burstVolley.volleyIndex === 1;
  } else if (split) {
    costsThisCard = optionPaysAction && split.splitIndex === 1;
  }

  // Reaction Counterattack: pause the original attack until this card resolves.
  const fromReactionCounterattack =
    !!option.tags?.includes('counterattack') ||
    /^counterattack\b/i.test(String(option.name || ''));

  const flagsObj: any = {
    attackType,
    // Split second strike / melee burst follow-up cards do not consume another action on roll.
    costsAction: costsThisCard,
    ...(fromReactionCounterattack
      ? { fromReactionCounterattack: true, awaitAttackResolution: true }
      : {}),
    attackerId: attacker.id,
    targetId: target.id,
    targetTokenId: targetToken.id,
    attribute: attribute,
    attributeValue: attributeValue,
    masteryRank: masteryRank,
    targetEvade: normalTn,
    baseEvade: normalTn,
    normalTn,
    weaponId: weaponId,
    // Artifact / natural-weapon attacks always roll this weapon's dice —
    // the damage dialog must not swap it for another equipped weapon.
    forcedWeaponItemId: forcedWeaponItemId ?? null,
    selectedPowerId: selectedPowerId,
    selectedPowerLevel: selectedPowerLevel,
    selectedPowerName: option.source === 'power' ? String(option.name || '') : '',
    selectedPowerSpecials: selectedPowerSpecials,
    selectedPowerDamage: selectedPowerDamage || "",
    consumableItemId: option.consumableItemId || null,
    ignoreWeaponDamage: option.ignoreWeaponDamage === true || tnKind === 'casting',
    // Split-attack bookkeeping (both strikes carry the same pairId so the
    // damage dialog and chat handlers can render "Strike 1 of 2" markers and
    // halve the damage pool per strike).
    splitAttack: !!split,
    splitIndex: split?.splitIndex ?? null,
    splitPairId: split?.splitPairId ?? null,
    meleeBurstVolleyId: burstVolley?.volleyId ?? null,
    meleeBurstVolleyIndex: burstVolley?.volleyIndex ?? null,
    meleeBurstVolleyTotal: burstVolley?.volleyTotal ?? null,
    aoeMeleeWeapon: !!aoeMelee,
    aoeMeleeSecondaryTokenIds:
      aoeMelee && aoeMelee.secondaryTokenIds?.length ? aoeMelee.secondaryTokenIds.join(",") : "",
    aoeMeleePowerBonusDice:
      aoeMelee && aoeMelee.powerBonusDice > 0 ? Math.floor(aoeMelee.powerBonusDice) : 0,
    // Autofire ordered chain (includes the card's primary as index 0).
    autofire: Array.isArray((option as any).autofireChainTokenIds)
      && (option as any).autofireChainTokenIds.length > 0,
    autofireChainTokenIds: Array.isArray((option as any).autofireChainTokenIds)
      ? (option as any).autofireChainTokenIds.map((id: any) => String(id)).join(',')
      : '',
    threatenedRanged: tr.threatened,
    /** Rule can apply even when nobody is currently in reach (Phase 2 re-scan). */
    threatenedRangedAppliesRule: tr.appliesRule,
    rollDisadvantage: tr.rollDisadvantage,
    threateningEnemyTokenIds: tr.threateningEnemyTokenIds,
    opportunityEnemyTokenIds: tr.opportunityEnemyTokenIds,
    threatenedRangedDebugReason: tr.debugReason ?? null,
    // NPC ranged: the sheet's Max field is the flat maximum range.
    weaponRange:
      isNpcAttack && attackType === "ranged"
        ? rangeTextFromMax(
            npcMaxRangeM(Math.floor(Number((option as any).rangeMeters ?? option.range) || 0)),
          )
        : undefined,
    useNpcAttackDicePool: useSheetPool,
    npcAttackDicePool: useSheetPool ? attributeValue : undefined,
    // PG statblocks print the Keep per attack ("6d8, Keep 1"); unset ⇒ MR.
    npcAttackKeepDice: useSheetPool ? npcAttackKeepDice(sheetAttackRow, masteryRank) : undefined,
    npcAttackSource: isNpcAttack,
    npcAttackIndex: isNpcAttack ? ((option as any).npcAttackIndex ?? 0) : undefined,
    npcPhaseIndex: isNpcAttack ? ((option as any).npcPhaseIndex ?? null) : undefined,
    npcAttackName: useSheetPool
      ? (sheetAttackRow?.name?.trim() || (isNpcAttack ? option.name : '') || "Waffenangriff")
      : undefined,
    npcAttackOptionId: isNpcAttack
      ? String((option as any).npcAttackUsageKey || option.id || '')
      : undefined,
    npcIsSpell: npcIsSpell || undefined,
    npcCrit: npcCrit || undefined,
    ...(raiseContext
      ? {
          powerIsSpell: raiseContext.isSpell,
          basePowerSnapshot: raiseContext.baseSnapshot,
          raiseOptions: raiseContext.raiseOptions,
          weaponDamageDice: raiseContext.weaponDamageDice ?? 0,
        }
      : npcIsSpell
        ? { powerIsSpell: true }
        : {}),
    tnKind,
    ...(castingBaseTn != null ? { castingBaseTn } : {}),
    /** Spell Base TN without this target's SR — used for per-creature Spell AoE checks. */
    ...(tnKind === 'casting' && castingBaseTn != null
      ? {
          spellBaseTn:
            spellBaseTnValue ??
            castingBaseTn - getTargetSpellResistance(target),
          persistentSpellZone: !!(option as any).zoneDurationNote && !/instant/i.test(String((option as any).zoneDurationNote)),
          spellZoneCenterX: (option as any).spellZoneCenterX ?? null,
          spellZoneCenterY: (option as any).spellZoneCenterY ?? null,
          spellZoneRadius: (option as any).aoeRadiusMeters ?? null,
          spellZoneDuration: (option as any).zoneDurationNote ?? null,
          spellZonePowerId: (option as any).powerId ?? (option as any).item?.id ?? null,
          spellZoneTemplateId: (option as any).templateId ?? (option as any).item?.system?.templateId ?? null,
          sourceMasteryRank: masteryRank,
        }
      : {}),
    targetEvadeFromActor: tnKind !== 'evade' ? targetEvadeFromActor : undefined,
    halfEvadeVsInvisible: evadeVsInvisible.evadeMultiplier < 1,
  };
  
  // Debug log before creating message
  const weaponCandidateFromEquipped = weapon;
  const attackerName = attacker.name || "Unknown";
  const targetName = target.name || "Unknown";
  const baseOptionName = option.name || "Attack";
  const optionName = burstVolley
    ? `${baseOptionName} — Target ${burstVolley.volleyIndex} of ${burstVolley.volleyTotal}`
    : split
      ? `${baseOptionName} — Strike ${split.splitIndex} of 2`
      : aoeMelee && aoeMelee.secondaryTokenIds?.length
        ? `${baseOptionName} (AoE)`
        : baseOptionName;
  const headerIcon = attackType === "ranged" ? "fa-bullseye" : "fa-sword";

  const npcSpecialsLine =
    isNpcAttack && npcAttackRow ? formatNpcAttackSpecialsLine(npcAttackRow) : "";
  const npcAttackDetailHtml =
    isNpcAttack && npcAttackRow
      ? `<div class="detail-row"><span class="detail-label">NSC-Pool:</span><span class="detail-value">${attributeValue}d8</span></div>
        <div class="detail-row"><span class="detail-label">Schaden:</span><span class="detail-value">${attackCardEsc(npcDamageDiceFormula(npcAttackRow))}</span></div>
        ${
          npcAttackRow.armor
            ? `<div class="detail-row"><span class="detail-label">Rüstung:</span><span class="detail-value">${attackCardEsc(String(npcAttackRow.armor))}</span></div>`
            : ""
        }
        ${
          npcCrit
            ? `<div class="detail-row"><span class="detail-label">Crit:</span><span class="detail-value">Attack dice explode on 7–8</span></div>`
            : ""
        }
        ${
          npcSpecialsLine
            ? `<div class="detail-row"><span class="detail-label">Spezial:</span><span class="detail-value">${attackCardEsc(npcSpecialsLine)}</span></div>`
            : ""
        }`
      : "";

  const oppNames = tr.opportunityEnemyTokenIds
    .map((id: string) => (canvas as any).tokens?.get(id)?.name)
    .filter(Boolean) as string[];
  const threatenedHtml =
    tr.threatened
      ? `<div class="mastery-threatened-ranged" style="border-left:4px solid #c0392b;padding:8px;margin:8px 0;background:rgba(192,57,43,0.08);">
          <p><strong>Threatened Ranged</strong></p>
          <p><strong>Disadvantage:</strong> only <strong>one</strong> die showing 8 may explode; other 8s stay flat. Pool size and Keep are unchanged.</p>
          <p>On <strong>declaration</strong> of this attack, enemies who have you in <em>their</em> melee reach may immediately spend a <strong>legal Reaction</strong> (hit/target-triggered reactions do not qualify): <strong>${oppNames.length ? oppNames.join(", ") : "(none in reach)"}</strong></p>
        </div>`
      : "";

  const aoeIdsAttr =
    aoeMelee && aoeMelee.secondaryTokenIds?.length
      ? attackCardEsc(aoeMelee.secondaryTokenIds.join("|"))
      : "";
  const aoeDiceAttr =
    aoeMelee && aoeMelee.powerBonusDice > 0 ? String(Math.floor(aoeMelee.powerBonusDice)) : "0";
  const aoeMeleeAttr = aoeMelee ? "1" : "0";

  const skipAwaitedHtml = fromReactionCounterattack
    ? `<button type="button" class="ms-skip-awaited-attack-btn" title="Skip this Counterattack and continue the original attack's damage">
        <i class="fas fa-forward"></i> Skip — continue original damage
      </button>
      <p class="ms-awaited-attack-hint" style="opacity:0.9;font-size:0.9em;margin:0.35em 0 0;">
        Original damage is <strong>paused</strong> until you Roll this Counterattack (or Skip).
      </p>`
    : '';

  const buttonHtml = `
    <button class="roll-attack-btn" 
            data-attacker-id="${attacker.id}"
            data-target-id="${target.id}"
            data-target-token-id="${targetToken.id}"
            data-attribute="${attribute}"
            data-attribute-value="${attributeValue}"
            data-mastery-rank="${masteryRank}"
            data-normal-tn="${normalTn}"
            data-target-evade="${normalTn}"
            data-base-evade="${normalTn}"
            data-raise-tn="${normalTn}"
            data-raise-slots="0"
            data-raise-plan="[]"
            data-aoe-melee="${aoeMeleeAttr}"
            data-aoe-secondary-ids="${aoeIdsAttr}"
            data-aoe-power-dice="${aoeDiceAttr}">
      <i class="fas fa-dice-d20"></i> Roll
    </button>
    ${skipAwaitedHtml}
  `;

  const raisePlanHtml = raiseContext
    ? `
    <div class="raise-plan-panel">
      ${
        raiseContext.isSpell
          ? `<div class="spell-cost-split-row md-sublabel">
          <p class="spell-cost-hint">Declare a Raise first.</p>
          <label class="spell-cost-label">Pay Raise cost with
          <select class="spell-cost-select" disabled>
            <option value="">— declare a Raise first —</option>
          </select>
          </label>
        </div>`
          : ''
      }
      <div class="raise-plan-rows"></div>
      <button type="button" class="add-raise-btn"><i class="fas fa-plus"></i> Add Raise</button>
    </div>`
    : '';
  
  const raisesTitle =
    tnKind === 'casting'
      ? `Ein Raise vor dem Wurf. Jeder macht die Raise TN um +${RAISE_INCREMENT} schwerer. Die Kosten gehen vorher von der Power weg und kommen nur zurück, wenn die Raise TN fällt.${
          aoeMelee ? ' AoE: derselbe Wurf gilt einzeln gegen jede Final Spell TN.' : ''
        }`
      : `Ein Raise vor dem Wurf. Jeder macht die Raise TN um +${RAISE_INCREMENT} schwerer. Die normale TN bleibt ${normalTn}. Kosten vorher weg, Bonus nur wenn die Raise TN fällt.${
          aoeMelee ? ' AoE: derselbe Wurf gilt einzeln gegen jedes Evade.' : ''
        }`;

  const evadeNoteParts: string[] = [];
  if (actorHasSurprise(target)) evadeNoteParts.push('half — Surprise');
  if (evadeVsInvisible.evadeMultiplier < 1) {
    evadeNoteParts.push('half — failed Perception vs invisible attacker');
  }
  const evadeNote = evadeNoteParts.length ? ` (${evadeNoteParts.join('; ')})` : '';
  
  const keepShown = useSheetPool ? npcAttackKeepDice(sheetAttackRow, masteryRank) : masteryRank;
  const attrLabel = attribute.charAt(0).toUpperCase() + attribute.slice(1);
  const poolLabel = useSheetPool
    ? (sheetAttackRow?.name?.trim() || 'Angriff')
    : attrLabel;
  const wurfLine = `${attributeValue}k${keepShown} (${poolLabel})`;
  const tnLabel =
    tnKind === 'casting'
      ? aoeMelee
        ? 'Anchor TN'
        : 'Casting TN'
      : aoeMelee
        ? 'Anchor Evade'
        : 'Target Evade';
  const tnValue = tnKind === 'casting' && castingBaseTn != null ? castingBaseTn : normalTn;
  const hitLine = raiseContext
    ? formatOnHitSummary(raiseContext.baseSnapshot, raiseContext.weaponDamageDice)
    : '';

  const content = `
    <div class="mastery-attack-card">
      <div class="attack-header">
        <h3><i class="fas ${headerIcon}"></i> ${optionName}</h3>
        <p class="attack-participants"><strong>${attackerName}</strong> → <strong>${targetName}</strong></p>
      </div>
      ${threatenedHtml}
      <div class="attack-details">
        <div class="detail-row">
          <span class="detail-label">Wurf:</span>
          <span class="detail-value">${wurfLine}</span>
        </div>
        ${
          tr.rollDisadvantage
            ? `<div class="detail-row"><span class="detail-label">Nachteil:</span><span class="detail-value">nur eine 8 explodiert</span></div>`
            : ""
        }
        ${
          tnKind === 'casting'
            ? `<label class="detail-row willing-spell-target-label"><input type="checkbox" class="willing-spell-target" /> Willing target — Spell Resistance 0 (chosen before the Casting Roll)</label>`
            : ''
        }
        <div class="detail-row">
          <span class="detail-label">${tnLabel}:</span>
          <span class="detail-value">${tnValue}${evadeNote}${
            aoeMelee ? ' — jede Kreatur extra' : ''
          }${
            raiseContext
              ? ` · Raise TN <strong class="raise-tn-display">${normalTn}</strong>`
              : ''
          }</span>
        </div>
        ${weapon ? `<div class="detail-row"><span class="detail-label">Weapon:</span><span class="detail-value">${attackCardEsc(weapon.name)}</span></div>` : ""}
        ${npcAttackDetailHtml}
        ${
          hitLine
            ? `<div class="detail-row"><span class="detail-label">Wenn du triffst:</span><span class="detail-value raise-cost-display">${attackCardEsc(hitLine)}</span></div>`
            : ''
        }
      </div>
      <div class="attack-controls">
        ${raisePlanHtml ? `<div class="raises-input-group" title="${attackCardEsc(raisesTitle)}">${raisePlanHtml}</div>` : ''}
        ${buttonHtml}
      </div>
    </div>
  `;
  
  // Create chat message
  const speaker = ChatMessage.getSpeaker({
    actor: attacker,
    token: attackerToken.document
  });
  
  try {
    const message = await ChatMessage.create({
      speaker,
      content,
      style: CONST.CHAT_MESSAGE_STYLES.OTHER,
      flags: {
        'mastery-system': flagsObj
      }
    });
    if (tr.threatened) {
      Hooks.call("masterySystem.threatenedRangedDeclared", {
        attackerTokenId: attackerToken.id,
        attackerActorId: attacker.id,
        threateningEnemyTokenIds: tr.threateningEnemyTokenIds,
        opportunityEnemyTokenIds: tr.opportunityEnemyTokenIds,
        targetTokenId: targetToken.id,
        optionId: option.id
      });
      ui.notifications?.info?.(
        `Threatened Ranged: Nachteil auf den Fernangriff. Bedrohende Gegner dürfen sofort eine legale Reaktion nutzen: ${oppNames.join(", ") || "—"}`
      );
      // PG 9725: the Reaction window opens immediately AFTER DECLARATION —
      // before the attack roll, not after the attack resolves.
      try {
        const { runInteractiveReactionWindow } = await import('./reaction-window-chat.js');
        await runInteractiveReactionWindow({
          defender: target as any,
          attacker: attacker as any,
          combat: (game as any).combat ?? null,
          rawDamage: 0,
          attackTotal: null,
          evadeTn: normalTn,
          hit: false,
          phase: 'others',
          opportunityEnemyTokenIds: tr.opportunityEnemyTokenIds,
          silentIfEmpty: true,
        });
      } catch (trErr) {
        console.warn('Mastery System | Threatened Ranged declaration window failed', trErr);
      }
    }

    if (message) {
      const messageId = message.id;
      // Wait a bit for the DOM to be ready
      setTimeout(() => {
        const messageElement = $(`.message[data-message-id="${messageId}"]`);
        if (messageElement.length === 0) {
          // Try alternative selector
          const altElement = $(`[data-message-id="${messageId}"]`);
          if (altElement.length) {
            setupRaisesHandler(altElement, messageId, normalTn, raiseContext);
          }
        } else {
          setupRaisesHandler(messageElement, messageId, normalTn, raiseContext);
        }
      }, 100);
      return String(messageId);
    }
  } catch (error) {
    console.error("Mastery System | [ATTACK EXECUTOR] Failed to create attack card", error);
    ui.notifications?.error("Failed to create attack card");
  }
  return null;
}

export async function createMeleeAttackCard(
  attackerToken: any,
  targetToken: any,
  option: RadialCombatOption,
  burstVolley: MeleeBurstVolleyContext | null = null,
  aoeMelee: AoeMeleeWeaponContext | null = null,
): Promise<string | null> {
  return createAttackCard(attackerToken, targetToken, option, "melee", null, burstVolley, aoeMelee);
}

export async function createRangedAttackCard(
  attackerToken: any,
  targetToken: any,
  option: RadialCombatOption,
  aoeZone: AoeMeleeWeaponContext | null = null,
): Promise<string | null> {
  return createAttackCard(attackerToken, targetToken, option, "ranged", null, null, aoeZone);
}

/**
 * Setup raise-plan editor on attack cards (new Raise rules).
 * The chosen Raises are broadcast so the GM sees them without a chat re-render.
 */
type RaiseDraftRow = { optionId: string; free: boolean };

const raisePlanAppliers = new Map<string, (draft: RaiseDraftRow[], summary: string) => void>();

export function applyRemoteRaisePlan(payload: {
  messageId?: string;
  draft?: RaiseDraftRow[];
  summary?: string;
}): void {
  const id = String(payload?.messageId || '');
  const apply = raisePlanAppliers.get(id);
  if (apply) {
    apply(Array.isArray(payload.draft) ? payload.draft : [], String(payload.summary || ''));
    return;
  }
  const live = (globalThis as any).document?.querySelector?.(
    `.message[data-message-id="${CSS.escape(id)}"] .raise-plan-live`,
  );
  if (live) live.textContent = String(payload.summary || '');
}

function broadcastRaisePlan(messageId: string, draft: RaiseDraftRow[], summary: string): void {
  const gameAny = (globalThis as any).game;
  gameAny?.socket?.emit?.(ENCOUNTER_SOCKET, {
    type: 'raisePlanLive',
    messageId,
    fromUserId: gameAny.user?.id ?? null,
    draft,
    summary,
  });
}

let raisePlanHooksRegistered = false;

export function registerRaisePlanChatHooks(): void {
  if (raisePlanHooksRegistered) return;
  raisePlanHooksRegistered = true;
  const HooksAny = (globalThis as any).Hooks;
  if (!HooksAny?.on) return;
  HooksAny.on('renderChatMessageHTML', (message: any, htmlRaw: HTMLElement | any) => {
    try {
      const flags = message?.flags?.['mastery-system'];
      if (!flags?.raiseOptions || !Array.isArray(flags.raiseOptions) || !flags.basePowerSnapshot) return;
      const jq = (globalThis as any).$;
      if (!jq) return;
      const $root = htmlRaw instanceof HTMLElement ? jq(htmlRaw) : htmlRaw;
      if (!$root?.find) return;
      const panel = $root.find('.raise-plan-panel');
      if (!panel.length) return;
      const host = panel.closest('.message');
      setupRaisesHandler(host.length ? host : $root, String(message.id), Number(flags.normalTn) || 0, {
        masteryRank: Math.max(1, Math.floor(Number(flags.masteryRank) || 1)),
        isSpell: !!flags.powerIsSpell,
        baseSnapshot: flags.basePowerSnapshot,
        raiseOptions: flags.raiseOptions,
        weaponDamageDice: Number(flags.weaponDamageDice) || 0,
      });
    } catch (err) {
      console.warn('Mastery System | raise plan chat hook failed', err);
    }
  });
}

function setupRaisesHandler(
  messageElement: JQuery,
  messageId: string,
  normalTn: number,
  raiseContext: {
    masteryRank: number;
    isSpell: boolean;
    baseSnapshot: PowerSnapshot;
    raiseOptions: RaiseOption[];
    weaponDamageDice?: number;
  } | null,
): void {
  const panel = messageElement.find('.raise-plan-panel');
  if (panel.attr('data-raise-bound') === '1') return;
  const button = messageElement.find('.roll-attack-btn');
  button.attr('data-normal-tn', String(normalTn));
  button.attr('data-target-evade', String(normalTn));
  button.attr('data-base-evade', String(normalTn));
  button.attr('data-raise-tn', String(normalTn));
  button.attr('data-raise-slots', '0');
  button.attr('data-raise-plan', '[]');

  if (!raiseContext || !panel.length) return;
  panel.attr('data-raise-bound', '1');

  const maxSlots = 8;

  const buildOptionHtml = (currentId: string, takenSpecialIds: Set<string>): string => {
    const opts = raiseContext!.raiseOptions
      .filter((o) => {
        if (o.id === currentId) return true;
        if (o.effect === 'damage' || o.effect === 'specialPlus') return !takenSpecialIds.has(o.id);
        return true;
      })
      .map(
        (o) =>
          `<option value="${o.id}">${o.label} (${o.slots} slot${o.slots > 1 ? 's' : ''})</option>`,
      )
      .join('');
    return `<option value="">— Raise effect —</option>${opts}`;
  };

  const specialName = (optionId: string): string => {
    const opt = raiseContext!.raiseOptions.find((o) => o.id === optionId);
    if (!opt) return 'Dieses Special';
    if (opt.targetSpecialKey) {
      return opt.targetSpecialKey.charAt(0).toUpperCase() + opt.targetSpecialKey.slice(1);
    }
    return opt.label;
  };

  const isGM = !!(globalThis as any).game?.user?.isGM;
  let applyingRemote = false;

  const readDraft = (): RaiseDraftRow[] => {
    const draft: RaiseDraftRow[] = [];
    panel.find('.raise-plan-row').each((_i, row) => {
      const optionId = String($(row).find('.raise-effect-select').val() || '');
      const free = $(row).find('.raise-free').is(':checked') || $(row).attr('data-free') === '1';
      draft.push({ optionId, free });
    });
    return draft;
  };

  const collectPlan = (): DeclaredRaise[] => {
    const plan: DeclaredRaise[] = [];
    for (const row of readDraft()) {
      if (!row.optionId) continue;
      const dr = declaredRaiseFromOptionId(row.optionId, raiseContext!.raiseOptions);
      if (!dr) continue;
      if (row.free) dr.free = true;
      plan.push(dr);
    }
    return dedupeDeclaredRaises(plan);
  };

  const summaryFor = (draft: RaiseDraftRow[]): string => {
    if (!draft.length) return 'Noch kein Raise gewählt.';
    const parts = draft.map((row, index) => {
      const dr = row.optionId
        ? declaredRaiseFromOptionId(row.optionId, raiseContext!.raiseOptions)
        : null;
      if (dr && row.free) dr.free = true;
      const name = dr ? describeDeclaredRaise(dr) : 'noch offen';
      return `${index + 1}. ${name}${row.free ? ' — kostenlos' : ''}`;
    });
    return `Raises: ${parts.join(' · ')}`;
  };

  const totalSpecialRank = raiseContext.baseSnapshot.specials.reduce(
    (sum, sp) => sum + Math.max(0, sp.rank),
    0,
  );

  /** Distribute a special-value payment over the power's specials (largest rank first). */
  const spellAllocFromParts = (d8Paid: number, spPaid: number): RaiseCostAllocation => {
    const alloc: RaiseCostAllocation = { damageDice: d8Paid, specialByKey: {} };
    if (spPaid > 0) {
      const sorted = [...raiseContext!.baseSnapshot.specials].sort((a, b) => b.rank - a.rank);
      let rem = spPaid;
      for (const sp of sorted) {
        if (rem <= 0) break;
        const take = Math.min(sp.rank, rem);
        if (take > 0) {
          alloc.specialByKey[sp.key] = take;
          rem -= take;
        }
      }
    }
    return alloc;
  };

  /**
   * Rebuild the spell-cost dropdown: every option is a complete, valid split
   * (d8 + special value = total cost), so nothing has to be typed and the
   * numbers can never disagree with the cost.
   */
  const rebuildSpellCostSelect = (costTotal: number): void => {
    const sel = panel.find('.spell-cost-select');
    if (!sel.length) return;
    const hint = panel.find('.spell-cost-hint');
    if (costTotal <= 0) {
      hint.show();
      sel.prop('disabled', true).html('<option value="">— declare a Raise first —</option>');
      return;
    }
    hint.hide();
    const prev = String(sel.val() || '');
    const maxD8 = Math.min(costTotal, raiseContext!.baseSnapshot.damageDice);
    const minD8 = Math.max(0, costTotal - totalSpecialRank);
    const optionHtml: string[] = [];
    for (let d8 = maxD8; d8 >= minD8; d8--) {
      const sp = costTotal - d8;
      const parts: string[] = [];
      if (d8 > 0) parts.push(`${d8}d8 damage`);
      if (sp > 0) parts.push(`cost ${sp} from Special rank`);
      optionHtml.push(`<option value="${d8}|${sp}">${parts.join(' + ')}</option>`);
    }
    if (!optionHtml.length) {
      sel.prop('disabled', true).html(`<option value="">Not enough damage/Special to pay ${costTotal}</option>`);
      return;
    }
    sel.prop('disabled', false).html(optionHtml.join(''));
    if (prev && sel.find(`option[value="${prev}"]`).length) {
      sel.val(prev);
    }
  };

  const readSpellCostSelection = (costTotal: number): RaiseCostAllocation | undefined => {
    const raw = String(panel.find('.spell-cost-select').val() || '');
    const m = raw.match(/^(\d+)\|(\d+)$/);
    if (!m) return undefined;
    const d8Paid = parseInt(m[1], 10);
    const spPaid = parseInt(m[2], 10);
    if (d8Paid + spPaid !== costTotal) return undefined;
    return spellAllocFromParts(d8Paid, spPaid);
  };

  const lockSpecialRaises = (): string | null => {
    const rows = panel.find('.raise-plan-row').toArray() as HTMLElement[];
    const owner = new Map<string, HTMLElement>();
    let cleared: string | null = null;
    for (const rowEl of rows) {
      const select = $(rowEl).find('.raise-effect-select');
      const id = String(select.val() || '');
      const opt = raiseContext!.raiseOptions.find((o) => o.id === id);
      if (!opt || (opt.effect !== 'specialPlus' && opt.effect !== 'damage')) continue;
      const prev = owner.get(opt.id);
      if (prev && prev !== rowEl) {
        select.val('');
        cleared = specialName(opt.id);
      } else {
        owner.set(opt.id, rowEl);
      }
    }
    const taken = new Set(owner.keys());
    for (const rowEl of rows) {
      const select = $(rowEl).find('.raise-effect-select');
      const current = String(select.val() || '');
      select.html(buildOptionHtml(current, taken));
      if (current) select.val(current);
    }
    return cleared;
  };

  const updatePreview = (broadcast = false, announceDuplicate = false): void => {
    const cleared = lockSpecialRaises();
    if (announceDuplicate && cleared && !applyingRemote) {
      ui.notifications?.warn?.(
        `${cleared} nur einmal pro Angriff.`,
      );
    }
    const draft = readDraft();
    const plan = collectPlan();
    const slots = countRaiseSlots(plan);
    const paid = paidRaiseSlots(plan);
    const { raiseTn } = computeRaiseTns(normalTn, slots);
    let spellCostOverride: RaiseCostAllocation | undefined;
    if (raiseContext!.isSpell) {
      const costTotal = paid > 0 ? raiseContext!.masteryRank * paid : 0;
      rebuildSpellCostSelect(costTotal);
      if (paid > 0) {
        spellCostOverride = readSpellCostSelection(costTotal);
      }
      if (spellCostOverride) {
        button.attr('data-spell-cost', JSON.stringify(spellCostOverride));
      } else {
        button.removeAttr('data-spell-cost');
      }
    }
    const summary = summaryFor(draft);
    panel.find('.raise-plan-live').text(summary);
    messageElement.find('.raise-tn-display').text(String(raiseTn));
    const full = plan.length
      ? resolvePowerSnapshot({
          base: raiseContext!.baseSnapshot,
          declaredRaises: plan,
          outcome: 'full',
          masteryRank: raiseContext!.masteryRank,
          isSpell: raiseContext!.isSpell,
          spellCostOverride,
        })
      : raiseContext!.baseSnapshot;
    const raiseDice = Math.max(0, full.damageDice - raiseContext!.baseSnapshot.damageDice);
    messageElement.find('.raise-cost-display').text(
      formatHitBreakdown(raiseContext!.weaponDamageDice, raiseContext!.baseSnapshot.damageDice, {
        raiseDice,
        specials: full.specials,
      }),
    );
    button.attr('data-raise-tn', String(raiseTn));
    button.attr('data-raise-slots', String(slots));
    button.attr('data-raise-plan', JSON.stringify(plan));
    button.attr('data-raises', String(slots));
    button.attr('data-blood-raises', '0');
    button.removeAttr('data-raise-cost-waived');
    if (broadcast && !applyingRemote) broadcastRaisePlan(messageId, draft, summary);
  };

  const bindRow = (row: JQuery, initial?: RaiseDraftRow): void => {
    if (initial?.optionId) row.find('.raise-effect-select').val(initial.optionId);
    row.find('.raise-effect-select').on('change', () => {
      const slots = countRaiseSlots(collectPlan());
      if (slots > maxSlots) {
        ui.notifications?.warn?.(`Maximum ${maxSlots} Raise slots.`);
        row.find('.raise-effect-select').val('');
      }
      updatePreview(true, true);
    });
    row.find('.raise-free').on('change', () => {
      row.attr('data-free', row.find('.raise-free').is(':checked') ? '1' : '0');
      updatePreview(true);
    });
    row.find('.remove-raise-btn').on('click', (ev) => {
      ev.preventDefault();
      row.remove();
      updatePreview(true);
    });
  };

  const addRow = (initial?: RaiseDraftRow, broadcast = true): void => {
    const currentSlots = countRaiseSlots(collectPlan());
    if (!initial && currentSlots >= maxSlots) {
      ui.notifications?.warn?.(`Maximum ${maxSlots} Raise slots.`);
      return;
    }
    const freeBox = isGM
      ? `<label class="raise-free-label" title="Nur dieser Raise ist kostenlos"><input type="checkbox" class="raise-free"${initial?.free ? ' checked' : ''}/> Kostenlos</label>`
      : '';
    const row = $(`
      <div class="raise-plan-row" data-free="${initial?.free ? '1' : '0'}">
        <select class="raise-effect-select">${buildOptionHtml('', new Set())}</select>
        ${freeBox}
        <button type="button" class="remove-raise-btn" title="Remove"><i class="fas fa-times"></i></button>
      </div>
    `);
    panel.find('.raise-plan-rows').append(row);
    bindRow(row, initial);
    updatePreview(broadcast);
  };

  raisePlanAppliers.set(messageId, (draft, summary) => {
    applyingRemote = true;
    try {
      panel.find('.raise-plan-rows').empty();
      for (const row of draft) addRow(row, false);
      if (!draft.length) panel.find('.raise-plan-live').text(summary || 'Noch kein Raise gewählt.');
    } finally {
      applyingRemote = false;
    }
  });

  panel.find('.add-raise-btn').off('click.masteryRaisePlan').on('click.masteryRaisePlan', (ev) => {
    ev.preventDefault();
    addRow();
  });

  panel.find('.spell-cost-select')
    .off('input.masteryRaisePlan change.masteryRaisePlan')
    .on('input.masteryRaisePlan change.masteryRaisePlan', () => updatePreview(true));

  updatePreview(false);
}

