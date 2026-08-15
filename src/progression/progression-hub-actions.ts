/**
 * Shared XP progression helpers for the character sheet and Progression Hub.
 */

import { buildArtifactEvolutionCards } from '../artifacts/artifact-evolution-actions.js';
import {
  ARTIFACT_CAPACITY_DEFAULT,
  countBoundArtifacts,
} from '../utils/artifact-actor-rules.js';
import {
  actorHasProgressionArtifacts,
  listUnwiredEmbeddedArtifacts,
} from '../utils/artifact-tree-grant.js';
import { attributeBandCost, powerLevelCost } from '../utils/constants.js';
import { getPowerMinLevel as resolvePowerMinLevel } from '../utils/power-xp-refund.js';
import { calculateMaxPowerLevel, calculateMaxSkillRank } from '../utils/calculations.js';
import { SKILLS, SKILL_CATEGORIES } from '../utils/skills.js';
import * as stepRule from '../utils/xp-step-rule.js';
import {
  appendXpHistory,
  buildBandedStepEntries,
  currentXpUser,
} from '../utils/xp-history.js';

export const ATTRIBUTE_KEYS = [
  'might',
  'agility',
  'vitality',
  'intellect',
  'resolve',
  'influence',
  'wits',
] as const;

export interface XpState {
  available: number;
  regularAvailable: number;
  freeAvailable: number;
  freeEarned: number;
  freeSpent: number;
  totalEarned: number;
  totalSpent: number;
  history: any[];
}

export function getXpState(actor: any): XpState {
  const system = actor.system || {};
  const points = system.points || {};
  const xp = system.xp || {};
  const regularAvailable = points.xp ?? 0;
  const freeAvailable = points.xpFree ?? 0;
  return {
    available: regularAvailable + freeAvailable,
    regularAvailable,
    freeAvailable,
    freeEarned: xp.freeEarned ?? 0,
    freeSpent: xp.freeSpent ?? 0,
    totalEarned: xp.totalEarned ?? 0,
    totalSpent: xp.totalSpent ?? 0,
    history: xp.history ?? [],
  };
}

export function hasFreeXp(actor: any): boolean {
  return getXpState(actor).freeAvailable > 0;
}

export function applyXpCost(
  xpState: Pick<XpState, 'regularAvailable' | 'freeAvailable' | 'freeEarned' | 'freeSpent' | 'totalSpent'>,
  netCost: number,
): { pointsXp: number; pointsXpFree: number; totalSpent: number; freeSpent: number } {
  let regular = xpState.regularAvailable;
  let free = xpState.freeAvailable;
  let totalSpent = xpState.totalSpent;
  let freeSpent = xpState.freeSpent;

  if (netCost > 0) {
    const fromFree = Math.min(free, netCost);
    const fromReg = netCost - fromFree;
    free -= fromFree;
    regular -= fromReg;
    freeSpent += fromFree;
    totalSpent += fromReg;
  } else if (netCost < 0) {
    const refund = -netCost;
    const toFree = Math.max(0, Math.min(refund, xpState.freeEarned - free));
    const toReg = refund - toFree;
    free += toFree;
    regular += toReg;
    freeSpent = Math.max(0, freeSpent - toFree);
    totalSpent = Math.max(0, totalSpent - toReg);
  }

  return {
    pointsXp: regular,
    pointsXpFree: free,
    totalSpent: Math.max(0, totalSpent),
    freeSpent: Math.max(0, freeSpent),
  };
}

export function getAttributeXpBaseline(actor: any, attributeKey: string): number {
  const system = actor.system as any;
  const current = Number(system.attributes?.[attributeKey]?.value ?? 2) || 0;
  const b = system.xp?.attributeBaselines?.[attributeKey];
  if (typeof b === 'number' && !Number.isNaN(b)) return Math.min(b, current);
  return current;
}

export function calculateAttributePendingNetCost(
  actor: any,
  pendingMap: Record<string, number>,
): number {
  let net = 0;
  for (const attr of ATTRIBUTE_KEYS) {
    const pending = pendingMap[attr] || 0;
    if (!pending) continue;
    const current = actor.system.attributes[attr]?.value || 0;
    if (pending > 0) {
      for (let i = 0; i < pending; i++) {
        net += attributeBandCost(current + i + 1);
      }
    } else {
      const baseline = getAttributeXpBaseline(actor, attr);
      const steps = Math.abs(pending);
      for (let i = 0; i < steps; i++) {
        const dropFrom = current - i;
        if (dropFrom <= baseline) break;
        net -= attributeBandCost(dropFrom);
      }
    }
  }
  return net;
}

export function calculateSingleSkillPendingXpNet(
  actor: any,
  skillKey: string,
  pending: number,
): number {
  if (!pending) return 0;
  const current = Number(actor.system.skills?.[skillKey] ?? 0) || 0;
  let net = 0;
  if (pending > 0) {
    for (let i = 1; i <= pending; i++) {
      net += attributeBandCost(current + i);
    }
  } else {
    const steps = Math.abs(pending);
    for (let i = 0; i < steps; i++) {
      const refundRank = current - i;
      if (refundRank <= 0) break;
      net -= attributeBandCost(refundRank);
    }
  }
  return net;
}

export function calculateSkillPendingNetCost(
  actor: any,
  pendingMap: Record<string, number>,
): number {
  let net = 0;
  for (const [skillKey, pending] of Object.entries(pendingMap)) {
    net += calculateSingleSkillPendingXpNet(actor, skillKey, pending);
  }
  return net;
}

export function getPowerMinLevel(item: any): number {
  // Delegate to the shared baseline (floored at the category creation rank) so
  // downgrade limits and refunds stay consistent even with corrupt minLevel.
  return resolvePowerMinLevel(item);
}

export function getMaxPurchasablePowerLevel(actor: any): number {
  const mr = Math.max(1, Math.floor(Number((actor.system as any)?.mastery?.rank) || 1));
  return calculateMaxPowerLevel(mr);
}

export function calculatePowerPendingNetCost(
  actor: any,
  pendingMap: Record<string, number>,
): number {
  let net = 0;
  for (const [powerId, pending] of Object.entries(pendingMap)) {
    if (!pending) continue;
    const powerItem = (actor as any).items.get(powerId);
    if (!powerItem) continue;
    const currentLevel = (powerItem.system as any).level ?? 1;
    if (pending > 0) {
      for (let i = 1; i <= pending; i++) {
        net += powerLevelCost(currentLevel + i);
      }
    } else {
      const steps = Math.abs(pending);
      for (let i = 0; i < steps; i++) {
        const refundLevel = currentLevel - i;
        net -= powerLevelCost(refundLevel);
      }
    }
  }
  return net;
}

export interface ProgressionHubContext {
  xp: XpState;
  masteryRank: number;
  hasFreeXpPhase: boolean;
  artifactCapacity: { bound: number; max: number; full: boolean };
  attributes: Array<{ key: string; label: string; value: number; baseline: number }>;
  skillGroups: Array<{
    category: string;
    skills: Array<{ key: string; name: string; value: number }>;
  }>;
  powers: Array<{ id: string; name: string; level: number; minLevel: number; maxLevel: number }>;
  artifactCards: ReturnType<typeof buildArtifactEvolutionCards>;
  unwiredArtifacts: Array<{ id: string; name: string }>;
  hasArtifacts: boolean;
}

const ATTR_LABELS: Record<string, string> = {
  might: 'Might',
  agility: 'Agility',
  vitality: 'Vitality',
  intellect: 'Intellect',
  resolve: 'Resolve',
  influence: 'Influence',
  wits: 'Wits',
};

export function buildProgressionHubContext(actor: Actor): ProgressionHubContext {
  const xp = getXpState(actor);
  const masteryRank = (actor.system as any)?.mastery?.rank ?? 2;
  const maxSkill = calculateMaxSkillRank(masteryRank);
  const maxPower = getMaxPurchasablePowerLevel(actor);

  const attributes = ATTRIBUTE_KEYS.map((key) => ({
    key,
    label: ATTR_LABELS[key] || key,
    value: Number((actor.system as any).attributes?.[key]?.value ?? 2) || 2,
    baseline: getAttributeXpBaseline(actor, key),
  }));

  const skillsByCategory: Record<string, Array<{ key: string; name: string; value: number }>> = {};
  for (const [key, def] of Object.entries(SKILLS)) {
    const category = def.category;
    if (!skillsByCategory[category]) skillsByCategory[category] = [];
    skillsByCategory[category].push({
      key,
      name: def.name,
      value: Number((actor.system as any).skills?.[key] ?? 0) || 0,
    });
  }
  const categoryOrder = [
    SKILL_CATEGORIES.AWARENESS,
    SKILL_CATEGORIES.PHYSICAL,
    SKILL_CATEGORIES.KNOWLEDGE_CRAFT,
    SKILL_CATEGORIES.SOCIAL,
    SKILL_CATEGORIES.SURVIVAL,
    SKILL_CATEGORIES.MARTIAL,
  ];
  const skillGroups = categoryOrder
    .filter((c) => skillsByCategory[c]?.length)
    .map((category) => ({
      category,
      skills: skillsByCategory[category].sort((a, b) => a.name.localeCompare(b.name)),
    }));

  const powers = Array.from((actor as any).items.filter((i: any) => i.type === 'power')).map((p: any) => ({
    id: p.id,
    name: p.name,
    level: (p.system as any).level ?? 1,
    minLevel: getPowerMinLevel(p),
    maxLevel: maxPower,
  }));

  const boundCount = countBoundArtifacts(actor);
  const unwired = listUnwiredEmbeddedArtifacts(actor);

  return {
    xp,
    masteryRank,
    hasFreeXpPhase: hasFreeXp(actor),
    artifactCapacity: {
      bound: boundCount,
      max: ARTIFACT_CAPACITY_DEFAULT,
      full: boundCount >= ARTIFACT_CAPACITY_DEFAULT,
    },
    attributes,
    skillGroups,
    powers: powers.sort((a, b) => a.name.localeCompare(b.name)),
    artifactCards: buildArtifactEvolutionCards(actor),
    unwiredArtifacts: unwired.map((e: any) => ({ id: e.id, name: e.name })),
    hasArtifacts: actorHasProgressionArtifacts(actor),
  };
}

export async function applyAttributePendingChanges(
  actor: Actor,
  pendingMap: Record<string, number>,
): Promise<{ ok: boolean; error?: string }> {
  const xpState = getXpState(actor);
  const netCost = calculateAttributePendingNetCost(actor, pendingMap);
  if (netCost > xpState.available) {
    return { ok: false, error: `Not enough XP (need ${netCost}, have ${xpState.available}).` };
  }

  const updates: Record<string, unknown> = {};
  let stepAfter = stepRule.readStep(actor);
  const unrestricted = hasFreeXp(actor);

  for (const attrKey of ATTRIBUTE_KEYS) {
    const pending = pendingMap[attrKey] || 0;
    if (!pending) continue;
    const currentValue = actor.system.attributes[attrKey]?.value || 0;
    const newValue = currentValue + pending;
    const baseline = getAttributeXpBaseline(actor, attrKey);
    if (newValue < baseline || newValue > 80) {
      return { ok: false, error: `Invalid attribute change for ${attrKey}.` };
    }
    if (!unrestricted && pending > 0) {
      if (stepRule.isBumped(stepAfter, 'attribute', attrKey)) {
        return { ok: false, error: `${attrKey} was already increased this Upgrade Step.` };
      }
      stepAfter = stepRule.recordBump(stepAfter, 'attribute', attrKey);
    } else if (!unrestricted && pending < 0) {
      stepAfter = stepRule.undoBump(stepAfter, 'attribute', attrKey);
    }
    updates[`system.attributes.${attrKey}.value`] = newValue;
  }

  const acct = applyXpCost(xpState, netCost);
  updates['system.points.xp'] = acct.pointsXp;
  updates['system.points.xpFree'] = acct.pointsXpFree;
  updates['system.xp.totalSpent'] = acct.totalSpent;
  updates['system.xp.freeSpent'] = acct.freeSpent;
  updates['system.xp.currentStep.attributes'] = [...stepAfter.attributes];
  updates['system.xp.currentStep.skills'] = [...stepAfter.skills];
  updates['system.xp.currentStep.powers'] = [...stepAfter.powers];
  updates['system.xp.currentStep.artifacts'] = [...stepAfter.artifacts];

  const historyEntries = buildBandedStepEntries({
    category: 'attribute',
    pendingMap,
    getCurrent: key => Number((actor.system as any).attributes?.[key]?.value ?? 0) || 0,
    getLabel: key => ATTR_LABELS[key] || key,
    costForTarget: attributeBandCost,
    before: {
      available: xpState.available,
      totalEarned: xpState.totalEarned,
      totalSpent: xpState.totalSpent,
    },
    after: {
      available: acct.pointsXp + acct.pointsXpFree,
      totalEarned: xpState.totalEarned,
      totalSpent: acct.totalSpent,
    },
    user: currentXpUser(),
  });
  if (historyEntries.length) {
    updates['system.xp.history'] = appendXpHistory(actor, historyEntries);
  }

  await actor.update(updates);
  return { ok: true };
}

export async function applySkillPendingChanges(
  actor: Actor,
  pendingMap: Record<string, number>,
): Promise<{ ok: boolean; error?: string }> {
  const xpState = getXpState(actor);
  const netCost = calculateSkillPendingNetCost(actor, pendingMap);
  if (netCost > xpState.available) {
    return { ok: false, error: `Not enough XP (need ${netCost}, have ${xpState.available}).` };
  }

  const masteryRank = actor.system.mastery?.rank || 2;
  const maxSkill = calculateMaxSkillRank(masteryRank);
  const updates: Record<string, unknown> = {};
  let stepAfter = stepRule.readStep(actor);
  const unrestricted = hasFreeXp(actor);

  for (const [skillKey, pending] of Object.entries(pendingMap)) {
    if (!pending) continue;
    const current = Number(actor.system.skills?.[skillKey] ?? 0) || 0;
    const desired = current + pending;
    if (pending > 0 && desired > maxSkill) {
      return {
        ok: false,
        error: `${skillKey} cannot exceed ${maxSkill} at Mastery Rank ${masteryRank} (MR × 4).`,
      };
    }
    const target = Math.max(0, Math.min(maxSkill, desired));
    if (target === current) continue;
    if (!unrestricted && pending > 0) {
      if (stepRule.isBumped(stepAfter, 'skill', skillKey)) {
        return { ok: false, error: `${skillKey} was already increased this Upgrade Step.` };
      }
      stepAfter = stepRule.recordBump(stepAfter, 'skill', skillKey);
    } else if (!unrestricted && pending < 0) {
      stepAfter = stepRule.undoBump(stepAfter, 'skill', skillKey);
    }
    updates[`system.skills.${skillKey}`] = target;
  }

  const acct = applyXpCost(xpState, netCost);
  updates['system.points.xp'] = acct.pointsXp;
  updates['system.points.xpFree'] = acct.pointsXpFree;
  updates['system.xp.totalSpent'] = acct.totalSpent;
  updates['system.xp.freeSpent'] = acct.freeSpent;
  updates['system.xp.currentStep.attributes'] = [...stepAfter.attributes];
  updates['system.xp.currentStep.skills'] = [...stepAfter.skills];
  updates['system.xp.currentStep.powers'] = [...stepAfter.powers];
  updates['system.xp.currentStep.artifacts'] = [...stepAfter.artifacts];

  const historyEntries = buildBandedStepEntries({
    category: 'skill',
    pendingMap,
    getCurrent: key => Number((actor.system as any).skills?.[key] ?? 0) || 0,
    getLabel: key => SKILLS[key]?.name || key,
    costForTarget: attributeBandCost,
    before: {
      available: xpState.available,
      totalEarned: xpState.totalEarned,
      totalSpent: xpState.totalSpent,
    },
    after: {
      available: acct.pointsXp + acct.pointsXpFree,
      totalEarned: xpState.totalEarned,
      totalSpent: acct.totalSpent,
    },
    user: currentXpUser(),
  });
  if (historyEntries.length) {
    updates['system.xp.history'] = appendXpHistory(actor, historyEntries);
  }

  await actor.update(updates);
  return { ok: true };
}

export async function applyPowerPendingChanges(
  actor: Actor,
  pendingMap: Record<string, number>,
): Promise<{ ok: boolean; error?: string }> {
  const xpState = getXpState(actor);
  const netCost = calculatePowerPendingNetCost(actor, pendingMap);
  if (netCost > xpState.available) {
    return { ok: false, error: `Not enough XP (need ${netCost}, have ${xpState.available}).` };
  }

  let stepAfter = stepRule.readStep(actor);
  const unrestricted = hasFreeXp(actor);
  const itemUpdates: Array<{ id: string; level: number }> = [];

  for (const [powerId, pending] of Object.entries(pendingMap)) {
    if (!pending) continue;
    const item = (actor as any).items.get(powerId);
    if (!item || item.type !== 'power') continue;
    const current = (item.system as any).level ?? 1;
    const minLevel = getPowerMinLevel(item);
    const maxLevel = getMaxPurchasablePowerLevel(actor);
    const target = Math.max(minLevel, Math.min(maxLevel, current + pending));
    if (target === current) continue;
    if (!unrestricted && pending > 0) {
      if (stepRule.isBumped(stepAfter, 'power', powerId)) {
        return { ok: false, error: `${item.name} was already increased this Upgrade Step.` };
      }
      stepAfter = stepRule.recordBump(stepAfter, 'power', powerId);
    } else if (!unrestricted && pending < 0) {
      stepAfter = stepRule.undoBump(stepAfter, 'power', powerId);
    }
    itemUpdates.push({ id: powerId, level: target });
  }

  const acct = applyXpCost(xpState, netCost);
  const historyEntries = buildBandedStepEntries({
    category: 'power',
    pendingMap,
    getCurrent: key => {
      const item = (actor as any).items.get(key);
      return Number((item?.system as any)?.level ?? 1) || 1;
    },
    getLabel: key => {
      const item = (actor as any).items.get(key);
      return String(item?.name || key);
    },
    costForTarget: powerLevelCost,
    before: {
      available: xpState.available,
      totalEarned: xpState.totalEarned,
      totalSpent: xpState.totalSpent,
    },
    after: {
      available: acct.pointsXp + acct.pointsXpFree,
      totalEarned: xpState.totalEarned,
      totalSpent: acct.totalSpent,
    },
    user: currentXpUser(),
  });
  const actorUpdates: Record<string, unknown> = {
    'system.points.xp': acct.pointsXp,
    'system.points.xpFree': acct.pointsXpFree,
    'system.xp.totalSpent': acct.totalSpent,
    'system.xp.freeSpent': acct.freeSpent,
    'system.xp.currentStep.attributes': [...stepAfter.attributes],
    'system.xp.currentStep.skills': [...stepAfter.skills],
    'system.xp.currentStep.powers': [...stepAfter.powers],
    'system.xp.currentStep.artifacts': [...stepAfter.artifacts],
  };
  if (historyEntries.length) {
    actorUpdates['system.xp.history'] = appendXpHistory(actor, historyEntries);
  }
  await actor.update(actorUpdates);

  for (const u of itemUpdates) {
    const item = (actor as any).items.get(u.id);
    if (item) await item.update({ 'system.level': u.level });
  }

  return { ok: true };
}
