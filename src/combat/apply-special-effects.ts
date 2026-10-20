/**
 * Rules-based Special application shared by damage resolution, NPC reactions,
 * and the GM effect service (later: Region Behaviors).
 */

import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
import { getEffect, getEffectById } from '../utils/special-effects.js';
import { buildActorMechanicsBreakdown } from '../utils/power-mechanics.js';
import { isTargetedSpecialValidTarget } from '../utils/creature-type.js';
import { getRoundState } from './action-economy.js';
import {
  actorMasteryRank,
  clampSpecialApplication,
  formatApplicationLimitNote,
  specialRoundAppsUpdate,
  type SpecialRoundApps,
} from './special-application.js';

/**
 * Ward total on the defender: Passive `wardIncoming` plus the Stone
 * Special Negation. `tempWard` and `incomingSpecialReduction` store the
 * same grant, so the higher one counts once.
 */
export function getIncomingWardTotal(target: Actor | null | undefined): number {
  if (!target) return 0;
  let ward = 0;
  try {
    const combat = (globalThis as any).game?.combat ?? null;
    const sb = getRoundState(target as any, combat)?.stoneBonuses;
    const stoneWard = Math.max(
      Math.max(0, Math.floor(Number(sb?.tempWard ?? 0) || 0)),
      Math.max(0, Math.floor(Number(sb?.incomingSpecialReduction ?? 0) || 0)),
    );
    ward += stoneWard;
  } catch {
    /* no combat state — stones contribute 0 */
  }
  try {
    const bd = (target as any).system?.derived?.mechanicsBreakdown;
    ward += Math.max(0, Math.floor(Number(bd?.totals?.wardIncoming ?? 0) || 0));
  } catch {
    /* derived data unavailable */
  }
  if (ward <= 0) {
    try {
      const live = buildActorMechanicsBreakdown(target)?.totals?.wardIncoming;
      ward += Math.max(0, Math.floor(Number(live) || 0));
    } catch {
      /* optional */
    }
  }
  return ward;
}

/**
 * Ward — reduces every eligible hostile Special(X). `value: null` means fully
 * blocked. Positive effects (e.g. Regeneration) pass through unchanged.
 */
export function applyWardToIncomingSpecial(
  target: Actor,
  effectId: string | undefined,
  effectName: string,
  effectValue: number | null,
): { value: number | null; ward: number; before: number | null } {
  if (effectValue == null) return { value: effectValue, ward: 0, before: effectValue };
  const id = String(effectId || effectName || '').toLowerCase();
  if (id === 'regeneration' || id.includes('regeneration')) {
    return { value: effectValue, ward: 0, before: effectValue };
  }
  const effect = effectId ? getEffectById(effectId) : undefined;
  if (effect?.polarity === 'positive') {
    return { value: effectValue, ward: 0, before: effectValue };
  }
  const ward = getIncomingWardTotal(target);
  if (ward <= 0) return { value: effectValue, ward: 0, before: effectValue };
  const next = effectValue - ward;
  return { value: next > 0 ? next : null, ward, before: effectValue };
}

export interface ApplySpecialStringsOptions {
  /** Skip Reactive Cleanse chat (e.g. bulk GM apply). */
  skipReactiveCleanse?: boolean;
  /** Optional token hint for status reads on unlinked actors. */
  tokenHint?: unknown;
  /**
   * When true, require a source actor for Challenge; reject with a note if missing.
   * Combat damage always has an attacker; GM tools should set this.
   */
  requireChallengeSource?: boolean;
  /** Defer token icon sync / sheet render (region apply during movement). */
  deferVisuals?: boolean;
}

/**
 * Apply status effects from specials to a target actor.
 * Challenge uses challenger-bound merge rules (sourceUuid + stack/replace).
 * Instant Specials are skipped (they never persist as statuses).
 */
export async function applySpecialStringsToTarget(
  target: Actor,
  specialsUsed: string[],
  attacker?: Actor | null,
  options?: ApplySpecialStringsOptions,
): Promise<string[]> {
  const limitNotes: string[] = [];
  if (!target || !specialsUsed?.length) return limitNotes;
  try {
    const { readActorStatusEffects, hasActiveSpecial } = await import('../system/active-specials.js');
    let list: any[] = readActorStatusEffects(target, options?.tokenHint).map((e) => ({ ...e }));
    const { mergeChallengeEntry } = await import('../system/pool-reduction.js');
    const sourceName = String((attacker as any)?.name ?? 'combat');
    const sourceUuid = attacker
      ? String((attacker as any).uuid ?? (attacker as any).id ?? '') || null
      : null;
    const combat = (globalThis as any).game?.combat ?? null;
    let workingApps: SpecialRoundApps | null = null;
    let appsUpdate: Record<string, unknown> = {};

    for (const specialName of specialsUsed) {
      const parseName = String(specialName || '')
        .replace(/\s*\[Passive:[^\]]*\]\s*$/i, '')
        .trim();
      const match = parseName.match(/^([^(]+)(?:\((\d+)\))?$/);
      if (!match) continue;

      const effectName = match[1].trim();
      const effectValue = match[2] ? parseInt(match[2], 10) : null;
      const effectDef = getEffect(effectName);
      const effectId = effectDef?.id;

      if (effectDef?.category === 'instant') continue;

      if (effectId === 'prone') {
        if (hasActiveSpecial(target, 'immovable')) {
          limitNotes.push(`${(target as any).name} is Immovable — Prone has no effect.`);
          continue;
        }
        const { growthFormBlocksProne } = await import('./growth-form.js');
        if (growthFormBlocksProne(target, attacker)) {
          limitNotes.push(`${(target as any).name} Growth Form — Prone has no effect.`);
          continue;
        }
      }

      if (effectId === 'cleanse') {
        const x = Math.max(0, Math.floor(Number(effectValue) || 0));
        const passiveTag = /\[Passive:\s*([^\]]+)\]/i.exec(specialName);
        const passiveLabel = passiveTag?.[1]?.trim() || '';
        const cleansePrefix = passiveLabel ? `Passive Cleanse (${passiveLabel})` : 'Cleanse';
        if (x > 0) {
          const { distributeCleanseAcrossList, formatCleanseDistribution } =
            await import('../system/pool-reduction.js');
          const cleansed = distributeCleanseAcrossList(list, x);
          if (cleansed.applied) {
            list = cleansed.statusEffects;
            limitNotes.push(`${cleansePrefix}(${x}) → ${formatCleanseDistribution(cleansed)}`);
          } else {
            limitNotes.push(`${cleansePrefix}(${x}) — no eligible Special to reduce`);
          }
        }
        continue;
      }

      const isChallenge = effectId === 'challenge' || effectName.toLowerCase() === 'challenge';
      if (isChallenge && options?.requireChallengeSource && !sourceUuid) {
        limitNotes.push(`Challenge requires a source challenger — not applied to ${(target as any).name}.`);
        continue;
      }

      let wardedValue = effectValue;
      if (effectValue != null) {
        const wardResult = applyWardToIncomingSpecial(target, effectId, effectName, effectValue);
        if (wardResult.ward > 0 && wardResult.before != null) {
          if (wardResult.value === null) {
            limitNotes.push(
              `Ward −${wardResult.ward}: ${effectName}(${wardResult.before}) fully blocked`,
            );
            continue;
          }
          if (wardResult.value < wardResult.before) {
            limitNotes.push(
              `Ward −${wardResult.ward}: ${effectName}(${wardResult.before}) → ${effectName}(${wardResult.value})`,
            );
          }
        }
        if (wardResult.value === null) continue;
        wardedValue = wardResult.value;
      }

      if (effectId === 'root' && wardedValue !== null && wardedValue > 0 && wardedValue < 2) {
        limitNotes.push('Root(1) is below the minimum applied value of Root(2) — not applied.');
        continue;
      }

      if (
        (effectId === 'exorcism' || effectId === 'requiem') &&
        !isTargetedSpecialValidTarget(effectId, target)
      ) {
        continue;
      }

      if (wardedValue !== null && wardedValue > 0 && effectId) {
        const clamp = clampSpecialApplication(target, effectId, wardedValue, combat, workingApps);
        if (clamp.nextApps) {
          workingApps = clamp.nextApps;
          appsUpdate = specialRoundAppsUpdate(clamp.nextApps);
        }
        if (clamp.ignored > 0) {
          limitNotes.push(
            formatApplicationLimitNote(effectId, clamp.ignored, clamp.limit, actorMasteryRank(target)),
          );
        }
        wardedValue = clamp.applied;
        if (wardedValue <= 0) continue;
      }

      if (isChallenge && wardedValue !== null && wardedValue > 0) {
        list = mergeChallengeEntry(list, wardedValue, sourceName, sourceUuid);
        continue;
      }

      const existingEffect = list.find(
        (e: any) => (effectId && e.id === effectId) || e.name === effectName,
      );
      if (existingEffect) {
        if (wardedValue !== null) {
          existingEffect.value = (existingEffect.value || 0) + wardedValue;
        }
        if (effectId && !existingEffect.id) existingEffect.id = effectId;
      } else {
        const srcRank = attacker ? getRulesMasteryRank(attacker) : null;
        list.push({
          id: effectId,
          name: effectName,
          value: wardedValue,
          source: sourceName,
          ...(sourceUuid ? { sourceUuid } : {}),
          ...(srcRank ? { sourceMasteryRank: srcRank } : {}),
          timestamp: Date.now(),
        });
      }
    }

    const { writeActorStatusList } = await import('../system/assign-status.js');
    await writeActorStatusList(target, list, appsUpdate, { deferVisuals: !!options?.deferVisuals });

    if (!options?.skipReactiveCleanse) {
      try {
        const { maybeOfferReactiveCleanseChat } = await import('./reaction-followups.js');
        await maybeOfferReactiveCleanseChat(
          target,
          specialsUsed,
          (globalThis as any).game?.combat ?? null,
        );
      } catch (cleanseErr) {
        console.debug?.('Mastery System | Reactive Cleanse prompt skipped', cleanseErr);
      }
    }
  } catch (error) {
    console.error('Mastery System | [APPLY SPECIAL EFFECTS] Error applying status effects', error);
  }
  return limitNotes;
}

/** Alias kept for damage-dialog call sites. */
export const applyStatusEffectsToTarget = applySpecialStringsToTarget;
