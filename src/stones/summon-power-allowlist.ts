/**
 * Canonical Summon Power purchases (PG "Purchasing Canonical Powers").
 *
 * Summons buy complete Powers from the canonical catalogues — the catalog is
 * open, not a curated allowlist. A small blocklist covers Powers whose written
 * requirements a Summon can never meet (wielded weapon / worn armor) per
 * PG: "A Power that requires an Attribute, resource, item, or subsystem the
 * Summon does not possess cannot be purchased or used."
 *
 * Movement Powers are legal purchases: they replace the using Body's normal
 * Movement for that Turn and do not add a second permanent Movement Mode.
 */

import { ALL_POWER_TEMPLATES, getTemplate } from '../utils/powers/templates/index.js';
import { ppBudgetForLevel } from '../utils/powers/pp-budget.js';
import {
  maxSummonPowerLevel,
  powerTokenCostFromPp,
  standardPowerTokenCost,
} from './summon-bond-rules.js';

/** Powers whose requirements a Summon cannot satisfy (no weapons / worn armor). */
export const SUMMON_POWER_BLOCKLIST: readonly string[] = [
  'ab-damage',
  'ab-armor',
] as const;

export type SummonPowerEval = {
  templateId: string;
  name: string;
  category: string;
  level: number;
  ppCost: number;
  tokenCost: number;
  legal: boolean;
  reason: string;
};

export function isSummonPowerAllowed(templateId: string): boolean {
  if (SUMMON_POWER_BLOCKLIST.includes(templateId)) return false;
  return getTemplate(templateId) != null;
}

/**
 * Written PP for a summon purchase. Active/Movement use the 30 PP/level curve;
 * Passive/Reaction 20/level; Active Buff 30/level + 10.
 */
export function summonPowerPpCost(
  category: string,
  level: number,
  explicitPp?: number,
): number {
  if (explicitPp != null && Number.isFinite(explicitPp) && explicitPp > 0) {
    return Math.floor(explicitPp);
  }
  const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 1)));
  switch (category) {
    case 'active':
    case 'movement':
      return ppBudgetForLevel(lvl);
    case 'passive':
    case 'reaction':
      return 20 * lvl;
    case 'activeBuff':
      return 30 * lvl + 10;
    default:
      return 0;
  }
}

export function summonPowerTokenCost(
  category: string,
  level: number,
  explicitPp?: number,
): number {
  const pp = summonPowerPpCost(category, level, explicitPp);
  const fromPp = powerTokenCostFromPp(pp);
  if (fromPp > 0) return fromPp;
  const fallback = standardPowerTokenCost(category as any, level, explicitPp);
  return Math.max(1, fallback);
}

export function evaluateSummonPower(
  templateId: string,
  level: number,
  ownerMasteryRank: number,
): SummonPowerEval {
  const tpl = getTemplate(templateId);
  const name = tpl?.name ?? templateId;
  const category = String(tpl?.category ?? 'active');
  const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 1)));
  const maxLvl = maxSummonPowerLevel(ownerMasteryRank);
  const ppCost = summonPowerPpCost(category, lvl);
  const tokenCost = summonPowerTokenCost(category, lvl);

  if (!tpl) {
    return {
      templateId,
      name,
      category,
      level: lvl,
      ppCost,
      tokenCost,
      legal: false,
      reason: 'Unknown power template.',
    };
  }
  if (SUMMON_POWER_BLOCKLIST.includes(templateId)) {
    return {
      templateId,
      name,
      category,
      level: lvl,
      ppCost,
      tokenCost,
      legal: false,
      reason: 'Requires a wielded weapon or worn armor the Summon does not possess.',
    };
  }
  if (lvl > maxLvl) {
    return {
      templateId,
      name,
      category,
      level: lvl,
      ppCost,
      tokenCost,
      legal: false,
      reason: `Power Level ${lvl} exceeds owner MR cap (max L${maxLvl}).`,
    };
  }
  return {
    templateId,
    name,
    category,
    level: lvl,
    ppCost,
    tokenCost,
    legal: true,
    reason:
      category === 'movement'
        ? 'Legal — replaces the Body\u2019s normal Movement for that Turn (no second permanent Mode).'
        : 'Legal for this Bond.',
  };
}

export function listSummonPowerCatalog(ownerMasteryRank: number, level = 1): SummonPowerEval[] {
  return ALL_POWER_TEMPLATES
    .map((t) => evaluateSummonPower(t.templateId, level, ownerMasteryRank))
    .sort((a, b) => a.name.localeCompare(b.name));
}
