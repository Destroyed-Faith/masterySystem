/**
 * Rules for linking / upgrading artifact evolution items on actors (Mastery Rank gates, costs).
 *
 * Source: Players Guide 9773–9913.
 */

export const ARTIFACT_LINK_STONE_COST = 1;
export const ARTIFACT_UPGRADE_STONE_COST = 1;
export const ARTIFACT_UPGRADE_XP_COST = 8;
export const ARTIFACT_ULTIMATE_XP_COST = 40;
export const ARTIFACT_MAX_SYSTEM_LEVEL = 8;

/**
 * Bind-Stone schedule per Players Guide 9939: 1 Stone at Lv 1, +1 at Lv 4,
 * +1 at Lv 8 → 1 / 2 / 3 stones depending on the artifact's awakened tier.
 */
export function getArtifactBindStonesForLevel(level: number): number {
  const lvl = Math.max(0, Math.floor(Number(level) || 0));
  if (lvl <= 0) return 0;
  if (lvl >= 8) return 3;
  if (lvl >= 4) return 2;
  return 1;
}

/**
 * Players Guide 9819–9830: total simultaneous Artifact bonds an actor may
 * sustain.  `Artifact Capacity = Mastery Rank × 2`.
 */
export function getArtifactCapacityForMasteryRank(masteryRank: number): number {
  const mr = Math.max(1, Math.floor(Number(masteryRank) || 1));
  return mr * 2;
}

/** Max artifact system.level the actor may reach: (MR - 1) * 2, capped at 8. MR 1 => 0 (no link / no upgrades). */
export function getMaxArtifactSystemLevelForMasteryRank(masteryRank: number): number {
  const mr = Math.max(1, Math.floor(Number(masteryRank) || 1));
  if (mr <= 1) return 0;
  return Math.min(ARTIFACT_MAX_SYSTEM_LEVEL, (mr - 1) * 2);
}

/**
 * Taint escalation stages (Players Guide 9876–9912).
 *
 *   • Stage 0 — Harmony   (in tune; powers continue to unlock)
 *   • Stage 1 — Irritation (sustained neglect; the artifact "goes silent")
 *   • Stage 2 — Fracture   (active disobedience; one ability blocked)
 *   • Stage 3 — Wrath      (mockery / cleansing; psychic damage, nightmares,
 *                           disadvantage on checks)
 *   • Stage 4 — Collapse   (permanent disobedience; artifact breaks for
 *                           this bearer)
 */
export type TaintStage = 0 | 1 | 2 | 3 | 4;

export interface TaintStageDefinition {
  stage: TaintStage;
  name: string;
  trigger: string;
  effect: string;
}

export const TAINT_STAGES: readonly TaintStageDefinition[] = [
  {
    stage: 0,
    name: 'Harmony',
    trigger: 'The bearer lives in alignment with the Taint.',
    effect: 'The item grows as intended. New powers unlock normally.',
  },
  {
    stage: 1,
    name: 'Irritation',
    trigger: 'The Taint is ignored for an extended period.',
    effect: 'No new powers. The item "goes silent."',
  },
  {
    stage: 2,
    name: 'Fracture',
    trigger: 'Repeated, active disobedience or contradictory behavior.',
    effect: 'One ability of the item is blocked or shut down.',
  },
  {
    stage: 3,
    name: 'Wrath',
    trigger: 'Mockery, cleansing, or rejection of the Taint.',
    effect:
      'The item harms the bearer (e.g. 1d10 psychic), inflicts nightmares, or imposes disadvantage on checks.',
  },
  {
    stage: 4,
    name: 'Collapse / Corruption',
    trigger: 'Permanent disobedience.',
    effect: 'The item breaks and becomes unusable for this bearer.',
  },
];

export function getTaintStage(stage: number): TaintStageDefinition {
  const idx = Math.min(4, Math.max(0, Math.floor(Number(stage) || 0))) as TaintStage;
  return TAINT_STAGES[idx];
}

export function canArtifactLink(masteryRank: number): boolean {
  return getMaxArtifactSystemLevelForMasteryRank(masteryRank) >= 2;
}

export function canUnlockArtifactUltimate(masteryRank: number): boolean {
  return Math.max(1, Math.floor(Number(masteryRank) || 1)) >= 6;
}

export interface ArtifactActorProgress {
  nodeId: string;
  linked: boolean;
  ultimateUnlocked?: boolean;
}

/** Read progress from root item flag (supports legacy number = old “level” only). */
export function readActorArtifactProgress(flagVal: unknown, rootNodeId: string): ArtifactActorProgress {
  if (flagVal && typeof flagVal === 'object' && !Array.isArray(flagVal) && typeof (flagVal as any).nodeId === 'string') {
    const o = flagVal as any;
    return {
      nodeId: String(o.nodeId || rootNodeId),
      linked: Boolean(o.linked),
      ultimateUnlocked: Boolean(o.ultimateUnlocked)
    };
  }
  if (typeof flagVal === 'number' && flagVal >= 1) {
    return { nodeId: rootNodeId, linked: false, ultimateUnlocked: false };
  }
  return { nodeId: rootNodeId, linked: false, ultimateUnlocked: false };
}

export function serializeActorArtifactProgress(p: ArtifactActorProgress): Record<string, unknown> {
  const o: Record<string, unknown> = {
    nodeId: p.nodeId,
    linked: p.linked
  };
  if (p.ultimateUnlocked) o.ultimateUnlocked = true;
  return o;
}
