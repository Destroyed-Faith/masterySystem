/**
 * Threatened Ranged (Mastery System tactical rule)
 *
 * If you declare a ranged weapon attack while at least one hostile can reach you with their melee,
 * the attack is Threatened: disadvantage on the attack roll; after declaring, hostiles in YOUR
 * melee reach may spend a Reaction for an Opportunity Attack against you.
 *
 * Powers/spells only use this rule if flagged (tag `threatened-ranged` or system.threatenedRanged).
 */

import type { RadialCombatOption } from "../token-radial-menu";

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/** Distance between token centers in meters (grid-aware when possible). */
export function distanceBetweenTokensMeters(a: any, b: any): number {
  const ac = a?.center;
  const bc = b?.center;
  if (!ac || !bc) return Infinity;

  const grid = canvas.grid;
  if (grid && typeof grid.measurePath === "function") {
    try {
      const path = grid.measurePath([ac, bc], {});
      return path.distance ?? path.total ?? 0;
    } catch {
      // fall through
    }
  }

  const distPx = distance(ac, bc);
  const gridSize = grid?.size ?? 100;
  const gridUnits = distPx / gridSize;
  return gridUnits * (grid?.distance ?? 1);
}

function getEquippedWeapon(actor: any): any {
  if (!actor?.items) return null;
  const items = Array.isArray(actor.items)
    ? actor.items
    : actor.items instanceof Map
      ? Array.from(actor.items.values())
      : typeof actor.items.values === "function"
        ? Array.from(actor.items.values())
        : [];
  return (
    items.find((item: any) => item.type === "weapon" && (item.system as any)?.equipped === true) ||
    null
  );
}

function getReachBonusMeters(actor: any): number {
  const w = getEquippedWeapon(actor);
  if (!w) return 0;
  const innateAbilities = ((w.system as any)?.innateAbilities || []) as string[];
  const reachAbility = innateAbilities.find((a: string) => /reach/i.test(a));
  if (!reachAbility) return 0;
  const bonusMatch = reachAbility.match(/Reach\s*\(\+\s*(\d+)\s*m\)/i);
  if (bonusMatch) return parseInt(bonusMatch[1], 10);
  const legacyMatch = reachAbility.match(/Reach\s*\((\d+)\s*m\)/i);
  if (legacyMatch) {
    const totalReach = parseInt(legacyMatch[1], 10);
    return Math.max(0, totalReach - 2);
  }
  return 0;
}

/** Melee reach in meters for this actor (2m base + weapon reach bonus). */
export function getActorMeleeReachMeters(actor: any): number {
  return 2 + getReachBonusMeters(actor);
}

/** True when `other` is treated as hostile to `attackerToken` (disposition-based). */
export function tokenIsHostileTo(attackerToken: any, other: any): boolean {
  const ad = attackerToken?.document?.disposition ?? attackerToken?.disposition;
  const od = other?.document?.disposition ?? other?.disposition;
  if (od === CONST.TOKEN_DISPOSITIONS.HOSTILE) return true;
  if (ad === CONST.TOKEN_DISPOSITIONS.FRIENDLY && od === CONST.TOKEN_DISPOSITIONS.HOSTILE) return true;
  return false;
}

/**
 * True if this attack uses the Threatened Ranged rule set (bow/crossbow/thrown declaration).
 * Ranged *powers* only count if explicitly flagged (`threatened-ranged` tag or system.threatenedRanged),
 * so spell-like attacks do not automatically provoke the weapon rule.
 */
export function usesThreatenedRangedWeaponRules(actor: any, option: RadialCombatOption): boolean {
  if (option.source === "power" && option.item) {
    if (option.tags?.includes("threatened-ranged")) return true;
    const sys = (option.item.system as any) || {};
    if (sys.threatenedRanged === true) return true;
    return false;
  }

  const w = getEquippedWeapon(actor);
  if (w) {
    const ws = (w.system as any) || {};
    if (ws.weaponType === "ranged") return true;
    const innate = (ws.innateAbilities || []) as string[];
    if (innate.some((a: string) => /thrown/i.test(a))) return true;
  }
  return false;
}

/** Hostile is standing close enough that their melee could reach the shooter. */
export function enemyThreatensRangedShooter(shooterToken: any, enemyToken: any): boolean {
  if (!enemyToken?.actor) return false;
  const dist = distanceBetweenTokensMeters(shooterToken, enemyToken);
  const enemyReach = getActorMeleeReachMeters(enemyToken.actor);
  return dist <= enemyReach;
}

export function findThreateningEnemyTokenIds(shooterToken: any): string[] {
  const out: string[] = [];
  const tokens = canvas.tokens?.placeables ?? [];
  for (const t of tokens) {
    if (!t?.id || t.id === shooterToken.id || !t.actor) continue;
    if (!tokenIsHostileTo(shooterToken, t)) continue;
    if (enemyThreatensRangedShooter(shooterToken, t)) out.push(t.id);
  }
  return out;
}

/** Hostiles within the shooter's melee reach (may spend Reaction for OA vs shooter). */
export function findOpportunityEnemyTokenIds(shooterToken: any): string[] {
  const actor = shooterToken?.actor;
  if (!actor) return [];
  const myReach = getActorMeleeReachMeters(actor);
  const out: string[] = [];
  const tokens = canvas.tokens?.placeables ?? [];
  for (const t of tokens) {
    if (!t?.id || t.id === shooterToken.id || !t.actor) continue;
    if (!tokenIsHostileTo(shooterToken, t)) continue;
    const dist = distanceBetweenTokensMeters(shooterToken, t);
    if (dist <= myReach) out.push(t.id);
  }
  return out;
}

export interface ThreatenedRangedResult {
  appliesRule: boolean;
  threatened: boolean;
  threateningEnemyTokenIds: string[];
  opportunityEnemyTokenIds: string[];
  rollDisadvantage: boolean;
}

export function evaluateThreatenedRanged(
  shooterToken: any,
  option: RadialCombatOption
): ThreatenedRangedResult {
  const actor = shooterToken?.actor;
  const appliesRule = !!actor && usesThreatenedRangedWeaponRules(actor, option);
  const threateningEnemyTokenIds = appliesRule ? findThreateningEnemyTokenIds(shooterToken) : [];
  const threatened = appliesRule && threateningEnemyTokenIds.length > 0;
  const opportunityEnemyTokenIds = appliesRule ? findOpportunityEnemyTokenIds(shooterToken) : [];
  return {
    appliesRule,
    threatened,
    threateningEnemyTokenIds,
    opportunityEnemyTokenIds,
    rollDisadvantage: threatened
  };
}
