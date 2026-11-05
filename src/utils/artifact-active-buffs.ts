/**
 * Artifact Active Buffs
 *
 * Artifact level-progression rows of type "Active Buff" (e.g. Titan Scars'
 * Growth Form) have no backing `type: 'power'` item, so the normal
 * `activateActiveBuff` pipeline (which requires a power item) cannot drive
 * them. This module activates an artifact's Active-Buff row directly:
 *
 *   • Creates a Mastery-flagged ActiveEffect (`activeBuff: true`) so it counts
 *     as the actor's one maintained Active Buff and is cleaned up by the
 *     existing combat-end / deleteActiveEffect hooks.
 *   • For "Growth Form" rows it visibly enlarges every placed token of the
 *     actor (size scales with the Growth Power Level) and stores the original
 *     token size on the effect so it can be restored when the buff ends.
 */

import type { RadialCombatOption } from '../radial-menu/types.js';
import type { PowerMechanics } from '../types/item.js';
import { ALL_POWER_TEMPLATES } from './powers/index.js';
import { compareIdentityDecision } from './identity-shadow.js';

interface TokenSizeSnapshot {
  sceneId: string;
  tokenId: string;
  width: number;
  height: number;
}

import { getRulesMasteryRank } from './mastery-rank-sync.js';

function getMasteryRank(actor: any): number {
  return getRulesMasteryRank(actor);
}

function getCurrentRound(): number {
  return (game as any).combat?.round || 1;
}

/** Active artifact Active-Buff effects already on the actor (Mastery-flagged). */
export function getArtifactActiveBuffs(actor: any): any[] {
  const effects = (actor as any)?.effects;
  if (!effects) return [];
  return effects.filter((e: any) => e.flags?.['mastery-system']?.artifactActiveBuff === true);
}

/** True when this exact artifact row is already running as a buff. */
export function isArtifactBuffActive(actor: any, buffKey: string): boolean {
  return getArtifactActiveBuffs(actor).some(
    (e: any) => e.flags?.['mastery-system']?.artifactBuffKey === buffKey,
  );
}

/** Any Mastery active buff (power or artifact) currently maintained on the actor. */
function hasAnyMaintainedActiveBuff(actor: any): any | null {
  const effects = (actor as any)?.effects;
  if (!effects) return null;
  for (const e of effects) {
    const flags = e.flags?.['mastery-system'];
    if (flags?.activeBuff === true && flags?.isUtility !== true) return e;
  }
  return null;
}

/** Parse the Growth Form Power Level out of the row effect text (fallback by row level). */
function growthPowerLevelFor(option: RadialCombatOption): number {
  const text = `${option.description || ''}`;
  const m = text.match(/power level\s*(\d+)/i);
  let legacy: number;
  if (m) legacy = Math.max(1, Math.min(16, parseInt(m[1], 10)));
  else {
    const lvl = Number(option.artifactRowLevel) || 1;
    if (lvl >= 7) legacy = 16;
    else if (lvl >= 4) legacy = 10;
    else legacy = 4;
  }
  // K8.c: structured option.rank / stage mapping decides; text PL is missing-ID bridge.
  return compareIdentityDecision(
    'artifact.growthPowerLevel',
    legacy,
    () => {
      const ranked = Number((option as any).rank);
      if (Number.isFinite(ranked) && ranked >= 1 && ranked <= 16) return Math.floor(ranked);
      const lvl = Number(option.artifactRowLevel) || 1;
      if (lvl >= 1 && lvl <= 9) return ([4, 10, 16] as const)[Math.floor((lvl - 1) / 3)];
      return { kind: 'unresolved', reason: 'growth-rank-missing' };
    },
    {
      name: option.name,
      rank: (option as any).rank ?? null,
      artifactRowLevel: option.artifactRowLevel ?? null,
    },
    { prefer: 'identity' },
  );
}

/**
 * Resolve the `ab-growth-form` level mechanics for a Growth Power Level (4/10/16).
 * The Growth Power Level maps directly to the `ab-growth-form` level key (1..16).
 */
function growthFormMechForLevel(pl: number): PowerMechanics | null {
  const tpl = ALL_POWER_TEMPLATES.find((t: any) => t.templateId === 'ab-growth-form');
  if (!tpl) return null;
  const key = String(Math.max(1, Math.min(16, pl)));
  const row = (tpl as any).levels?.[key] ?? (tpl as any).levels?.['1'];
  const mech = row?.mechanics;
  return mech && typeof mech === 'object' ? (mech as PowerMechanics) : null;
}

/** Absolute square token size for a Size-Stage footprint (1 hex → 1, 3 → 2, 7 → 3). */
function growthTokenSizeForFootprint(footprintHexes: number): number {
  if (footprintHexes >= 7) return 3;
  if (footprintHexes >= 3) return 2;
  return 1;
}

/**
 * Set every placed token of the actor to an absolute square size; returns
 * snapshots of the original sizes so the change can be reverted on buff end.
 */
async function applyGrowthToTokens(actor: any, targetSize: number): Promise<TokenSizeSnapshot[]> {
  const snapshots: TokenSizeSnapshot[] = [];
  if (targetSize <= 1) return snapshots;

  let tokenObjects: any[] = [];
  try {
    // No args → all active tokens (linked or unlinked) as placeables; we read
    // `.document` below. Passing `linked: true` would drop unlinked tokens.
    tokenObjects = (actor as any).getActiveTokens?.() || [];
  } catch {
    tokenObjects = [];
  }

  // Group updates per scene so we can batch updateEmbeddedDocuments.
  const perScene = new Map<string, { scene: any; updates: any[] }>();
  for (const tok of tokenObjects) {
    const doc = tok?.document || tok;
    const scene = doc?.parent;
    if (!doc || !scene?.id) continue;
    const width = Number(doc.width) || 1;
    const height = Number(doc.height) || 1;
    // Already at or above the target size? Don't shrink and don't snapshot.
    if (width >= targetSize && height >= targetSize) continue;
    snapshots.push({ sceneId: scene.id, tokenId: doc.id, width, height });
    if (!perScene.has(scene.id)) perScene.set(scene.id, { scene, updates: [] });
    perScene.get(scene.id)!.updates.push({
      _id: doc.id,
      width: targetSize,
      height: targetSize,
    });
  }

  for (const { scene, updates } of perScene.values()) {
    if (!updates.length) continue;
    try {
      await scene.updateEmbeddedDocuments('Token', updates);
    } catch (err) {
      console.warn('Mastery System | Growth Form: token resize failed', err);
    }
  }
  return snapshots;
}

/** Restore token sizes stored on a Growth Form effect (called from deleteActiveEffect). */
export async function restoreGrowthFromEffect(effect: any): Promise<void> {
  const flags = effect?.flags?.['mastery-system'];
  const snapshots: TokenSizeSnapshot[] = Array.isArray(flags?.growthTokenSizes)
    ? flags.growthTokenSizes
    : [];
  if (!snapshots.length) return;

  const perScene = new Map<string, { scene: any; updates: any[] }>();
  for (const snap of snapshots) {
    const scene = (game as any).scenes?.get(snap.sceneId);
    if (!scene) continue;
    if (!perScene.has(snap.sceneId)) perScene.set(snap.sceneId, { scene, updates: [] });
    perScene.get(snap.sceneId)!.updates.push({
      _id: snap.tokenId,
      width: snap.width,
      height: snap.height,
    });
  }

  for (const { scene, updates } of perScene.values()) {
    if (!updates.length) continue;
    try {
      await scene.updateEmbeddedDocuments('Token', updates);
    } catch (err) {
      console.warn('Mastery System | Growth Form: token restore failed', err);
    }
  }
}

/**
 * Activate an artifact Active-Buff row (e.g. Titan Growth → Growth Form).
 * Returns true on success.
 */
export async function activateArtifactActiveBuff(
  actor: any,
  artifactItem: any,
  option: RadialCombatOption,
): Promise<boolean> {
  if (!actor || !artifactItem || !option) return false;

  const buffKey = String(option.id || `${artifactItem.id}:${option.name}`);
  const optionName = String(option.name || '');

  // Titan Growth is Transformation Growth — not Active Buff: Growth Form (own rules).
  // K8.c / W1 holdout: prefer artifactFunctionId; keep name/special bridges until W1
  // (Lor-Keth stores ab-armor-temp-hp on a row named Titan Growth I).
  const isTitanGrowth =
    (option as any).artifactFunctionId === 'titan-growth' ||
    /titan\s*growth/i.test(optionName) ||
    String(option.artifactRowSpecial || '').toLowerCase().includes('transformation (growth');
  if (isTitanGrowth) {
    try {
      const { activateTitanGrowth } = await import('../combat/transformation-growth.js');
      const artifactLevel = Math.max(
        1,
        Math.floor(
          Number(option.artifactRowLevel || artifactItem?.system?.currentLevel || 1) || 1,
        ),
      );
      const result = await activateTitanGrowth(actor, artifactLevel);
      if (!result.ok) {
        ui.notifications?.warn(result.reason || `${optionName} failed.`);
        return false;
      }
      ui.notifications?.info(
        result.rank === 0
          ? `${optionName}: returned to normal size (Growth Bars hidden, state kept).`
          : `${optionName}: Growth ${result.rank} active.`,
      );
      return true;
    } catch (err) {
      console.error('Mastery System | Titan Growth activation failed', err);
      ui.notifications?.error(`Failed to activate ${optionName}`);
      return false;
    }
  }

  const combat = (game as any).combat ?? null;
  try {
    const { isActiveBuffPreparationWindow } = await import('../combat/active-buff-lifecycle.js');
    if (combat && !isActiveBuffPreparationWindow(actor, combat)) {
      ui.notifications?.warn(
        `${option.name}: Active Buffs activate only during Preparation (not during your Turn).`,
      );
      return false;
    }
    if (!combat) {
      ui.notifications?.warn(
        `${option.name} can only be activated during the Preparation Phase of combat.`,
      );
      return false;
    }
  } catch (err) {
    console.warn('Mastery System | Artifact Active Buff Preparation gate failed', err);
    return false;
  }

  // Already running this exact buff?
  if (isArtifactBuffActive(actor, buffKey)) {
    ui.notifications?.warn(`${option.name} is already active!`);
    return false;
  }

  // Only one maintained Active Buff — end prior Buff fully before creating the new one (Z01).
  const existing = hasAnyMaintainedActiveBuff(actor);
  if (existing) {
    const existingName = existing.name || 'Active Buff';
    try {
      if (combat) {
        const { snapshotActiveBuffPrepResourcesBeforeEnd } = await import(
          '../combat/active-buff-lifecycle.js'
        );
        await snapshotActiveBuffPrepResourcesBeforeEnd(actor, combat, existing);
      }
      await existing.delete?.();
      ui.notifications?.info(
        `${existingName} ends — ${option.name} replaces it (only one Active Buff at a time).`,
      );
    } catch (err) {
      console.warn('Mastery System | failed to end previous Active Buff before artifact buff', err);
      return false;
    }
  }

  // K8.c: structured templateId first; name bridge only when tid absent.
  const isMoonlightShadow =
    option.artifactPowerTemplateId === 'ab-sundered-aura' ||
    (!option.artifactPowerTemplateId && /moonlight\s*shadow/i.test(optionName));
  // Moonlight Shadow uses official Active Buff: Sundered Aura — no separate
  // Safe Haven Rest use limit (Batch 9I / Artifacts_FULL_Moonlight_Sundered).

  const isGrowth =
    option.artifactPowerTemplateId === 'ab-growth-form' ||
    String(option.artifactRowSpecial || '').toLowerCase().includes('growth');
  const masteryRank = getMasteryRank(actor);
  const {
    preparationTargetRound,
    computeLastActiveRound,
  } = await import('../combat/active-buff-lifecycle.js');
  const activationRound = combat ? preparationTargetRound(combat) : Math.max(1, getCurrentRound());
  const lastActiveRound = computeLastActiveRound(activationRound, masteryRank);

  let growthTokenSizes: TokenSizeSnapshot[] = [];
  let growthPowerLevel = 0;
  let growthMech: PowerMechanics | null = null;
  let growthStageLabel = '';
  let growthTargetSize = 0;
  if (isGrowth) {
    growthPowerLevel = growthPowerLevelFor(option);
    growthMech = growthFormMechForLevel(growthPowerLevel);
    const footprint = Number((growthMech as any)?.growthForm?.footprintHexes) || 1;
    growthStageLabel = String((growthMech as any)?.growthForm?.sizeStage || 'Growth Form');
    growthTargetSize = growthTokenSizeForFootprint(footprint);
    growthTokenSizes = await applyGrowthToTokens(actor, growthTargetSize);
  }

  // Catalog-backed artifact Active Buffs (Red Hunt / Red Potion = ab-damage,
  // Moonlight Shadow = ab-sundered-aura, etc.): snapshot live template mechanics
  // at the staged Power Level (4 / 10 / 16) so reprices apply automatically.
  const catalogTemplateId = isGrowth
    ? 'ab-growth-form'
    : isMoonlightShadow
      ? 'ab-sundered-aura'
      : String(option.artifactPowerTemplateId || '').trim() || null;
  const catalogPowerLevel =
    isGrowth && growthPowerLevel
      ? growthPowerLevel
      : catalogTemplateId
        ? growthPowerLevelFor(option)
        : 0;

  let catalogMech: PowerMechanics | null = null;
  if (!isGrowth && catalogTemplateId) {
    try {
      const { getTemplate } = await import('./powers/templates/index.js');
      const tpl = getTemplate(catalogTemplateId);
      const levels = (tpl?.levels || {}) as Record<string, any>;
      const levelData = levels[String(catalogPowerLevel)] ?? levels[catalogPowerLevel];
      if (levelData?.mechanics) {
        catalogMech = levelData.mechanics as PowerMechanics;
      }
    } catch (err) {
      console.warn(
        `Mastery System | Artifact Active Buff mechanics load failed (${catalogTemplateId})`,
        err,
      );
    }
  }

  // Attach level mechanics so the aggregator applies the buff package
  // (e.g. ab-damage damageRider, Growth Form stats, Damage Aura pulse).
  const mechanicsSnapshot: (PowerMechanics & { applyWhen: 'activeBuff-active' }) | undefined =
    isGrowth && growthMech
      ? ({ ...(growthMech as any), applyWhen: 'activeBuff-active' as const })
      : catalogMech
        ? ({ ...(catalogMech as any), applyWhen: 'activeBuff-active' as const })
        : undefined;

  const effectText =
    String(option.description || '').trim() ||
    (catalogTemplateId
      ? String(
          ((ALL_POWER_TEMPLATES.find((t: any) => t.templateId === catalogTemplateId) as any)
            ?.levels?.[String(catalogPowerLevel)]?.effect?.text || ''),
        )
      : '');

  const effectData: any = {
    name: option.name,
    icon: isGrowth ? 'icons/magic/control/buff-strength-muscle-damage-orange.webp' : 'icons/svg/upgrade.svg',
    flags: {
      'mastery-system': {
        activeBuff: true,
        artifactActiveBuff: true,
        artifactBuffKey: buffKey,
        artifactItemId: artifactItem.id,
        powerName: option.name,
        powerTemplateId: catalogTemplateId,
        /** Numeric catalog PL for identity resolution (Batch B). */
        rank: catalogPowerLevel || undefined,
        artifactFunctionId: option.artifactFunctionId
          ? String(option.artifactFunctionId)
          : undefined,
        masteryRank,
        durationRounds: masteryRank,
        effectiveDuration: masteryRank,
        activationRound,
        activatedRound: activationRound,
        lastActiveRound,
        durationMode: 'round-end',
        combatId: combat?.id ? String(combat.id) : null,
        effectiveLevel: catalogPowerLevel || undefined,
        level: catalogPowerLevel || undefined,
        effectText: effectText || undefined,
        isUtility: false,
        growthForm: isGrowth,
        growthPowerLevel: growthPowerLevel || undefined,
        growthStageLabel: growthStageLabel || undefined,
        growthTokenSizes,
        ...(mechanicsSnapshot ? { mechanics: mechanicsSnapshot } : {}),
      },
    },
    description: effectText || option.description || '',
  };

  if (combat) {
    effectData.duration = {
      startRound: activationRound,
      startTurn: 0,
      rounds: masteryRank + 1,
      turns: 0,
      seconds: null,
      combat: combat.id || null,
    };
  } else {
    effectData.duration = {
      startRound: null,
      startTurn: null,
      rounds: masteryRank,
      turns: null,
      seconds: null,
      combat: null,
    };
  }

  try {
    await (actor as any).createEmbeddedDocuments('ActiveEffect', [effectData]);
  } catch (err) {
    console.error('Mastery System | Failed to activate artifact active buff', err);
    ui.notifications?.error(`Failed to activate ${option.name}`);
    // Roll back any token growth we already applied.
    if (growthTokenSizes.length) {
      await restoreGrowthFromEffect({ flags: { 'mastery-system': { growthTokenSizes } } });
    }
    return false;
  }

  try {
    const { processActiveBuffPreparation } = await import('../combat/active-buff-lifecycle.js');
    await processActiveBuffPreparation(actor, combat);
  } catch (prepErr) {
    console.warn('Mastery System | Artifact Active Buff Preparation resource grant failed', prepErr);
  }

  const sizeLabel = growthTargetSize > 1 ? `${growthTargetSize}x${growthTargetSize}` : '1x1';
  const stagePart = isGrowth && growthStageLabel ? ` (${growthStageLabel}, ${sizeLabel})` : '';
  ui.notifications?.info(
    `Activated ${option.name}${stagePart} (Rounds ${activationRound}–${lastActiveRound}).`,
  );

  try {
    const ChatCls = (globalThis as any).ChatMessage;
    const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const lines = [
      `<p><strong>${esc(String(option.name))}</strong> — active through <strong>Round ${lastActiveRound}</strong> (expires at Round End; Prep activation).</p>`,
    ];
    if (isGrowth) {
      lines.push(
        `<p>Growth Form: <strong>${esc(growthStageLabel)}</strong> — the token grows to <strong>${esc(sizeLabel)}</strong>.</p>`,
      );
    }
    await ChatCls.create({
      user: (game as any).user?.id,
      speaker: ChatCls.getSpeaker({ actor }),
      content: lines.join(''),
    });
  } catch (chatErr) {
    console.warn('Mastery System | Artifact active buff chat message failed', chatErr);
  }

  return true;
}
