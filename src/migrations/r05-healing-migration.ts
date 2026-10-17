/**
 * R-05 actor migration: ordinary HP-heal powers → Scarred-Bar Restoration / Passive Regeneration.
 *
 *   active-melee-single-heal  → active-melee-health-level-heal   (same PL when legal)
 *   active-ranged-single-heal → active-ranged-health-level-heal
 *   active-melee-aoe-heal     → active-melee-aoe-restoration
 *   active-ranged-aoe-heal    → active-ranged-aoe-restoration
 *   passive-healing / "Passive: Healing" → passive-regeneration (same PL)
 *   ab-healing / ab-healing-aura / ab-temp-hp-healing → flagged retired (cannot activate)
 *   healing-themed retired passives (Blood Feast, Battle Trance, …) → flagged retired
 *
 * "Legal" = the Restoration template has a Scarred-bar pool at that PL (PL1 melee/ranged ST and
 * some low AoE levels have none). Illegal conversions are NOT forced: the item keeps its data and
 * is flagged `r05Retired` with `r05MigrationNote` so a GM/player can re-buy at a legal level.
 *
 * Idempotent: converted items carry the new template id, flagged items carry the flag, so a
 * second run writes nothing. Pure planning (`planR05HealingItem`) is separated from the
 * Foundry writes so it can be unit-tested.
 */

import {
  R05_HEAL_TO_RESTORATION_TEMPLATE,
  R05_RETIRED_HEALING_BUFF_IDS,
} from '../combat/r05-restoration.js';
import { findTemplateById } from '../utils/power-catalog.js';
import { resyncPowerItemFromTemplate } from './power-template-resync-migration.js';

export const R05_RETIRED_FLAG = 'r05Retired';
export const R05_MIGRATION_NOTE_FLAG = 'r05MigrationNote';
const FLAG_SCOPE = 'mastery-system';
const REGEN_TEMPLATE_ID = 'passive-regeneration';
const REGEN_NAME = 'Passive: Restoration';

/** Healing-themed passive templates retired by R-05 (ordinary HP / heal riders). */
export const R05_RETIRED_HEALING_PASSIVE_IDS = new Set([
  'passive-blood-feast',
  'passive-battle-trance',
  'passive-stillness-recovery',
  'passive-armor-healing',
  'passive-evade-healing',
  'passive-damage-healing',
]);

const OLD_ACTIVE_HEAL_NAME = /^(?:Active:\s*)?(?:Melee|Ranged)\b.*\bHeal(?:ing)?\b/i;
const OLD_PASSIVE_HEAL_NAME = /^(?:Passive:\s*)?Healing$/i;

export type R05ItemPlan =
  | { kind: 'none' }
  | {
      kind: 'restoration';
      fromTemplateId: string;
      templateId: string;
      templateName: string;
      rank: number;
      /** Set when the item still carries the old catalog name and should take the new one. */
      rename: string | null;
    }
  | {
      kind: 'regeneration';
      fromTemplateId: string;
      rank: number;
      rename: string | null;
    }
  | { kind: 'retire'; reason: string };

function itemTemplateId(item: any): string {
  const sys = item?.system ?? {};
  return String(sys.templateId ?? sys.powerTemplateId ?? '').trim();
}

function itemRank(item: any): number {
  const sys = item?.system ?? {};
  return Math.max(1, Math.min(16, Math.floor(Number(sys.rank ?? sys.level ?? 1) || 1)));
}

function readFlag(item: any, key: string): unknown {
  if (typeof item?.getFlag === 'function') {
    try {
      return item.getFlag(FLAG_SCOPE, key);
    } catch {
      /* fall through */
    }
  }
  return item?.flags?.[FLAG_SCOPE]?.[key];
}

/** True when a prior migration (or the GM) retired this item under R-05. */
export function isR05RetiredHealingPower(item: any): boolean {
  if (readFlag(item, R05_RETIRED_FLAG) === true) return true;
  return R05_RETIRED_HEALING_BUFF_IDS.has(itemTemplateId(item));
}

/** Restoration pool at this rank (0 = no legal version). */
export function restorationPoolAtRank(templateId: string, rank: number): number {
  const template: any = findTemplateById(templateId);
  const row = template?.levels?.[String(rank)] ?? template?.levels?.[rank];
  return Math.max(0, Math.floor(Number(row?.mechanics?.healthLevelRecovery) || 0));
}

/** Decide what (if anything) to do to one owned power/passive item. Pure. */
export function planR05HealingItem(item: any): R05ItemPlan {
  if (!item) return { kind: 'none' };
  const tid = itemTemplateId(item);
  const name = String(item.name ?? '').trim();
  const rank = itemRank(item);

  if (readFlag(item, R05_RETIRED_FLAG) === true) return { kind: 'none' };

  const mapped = R05_HEAL_TO_RESTORATION_TEMPLATE[tid];
  if (mapped) {
    const template: any = findTemplateById(mapped);
    if (!template) return { kind: 'retire', reason: `Restoration template ${mapped} is missing.` };
    if (restorationPoolAtRank(mapped, rank) <= 0) {
      return {
        kind: 'retire',
        reason: `R-05: ${name || tid} has no legal Restoration version at Power Level ${rank}. Re-buy it at a higher level.`,
      };
    }
    return {
      kind: 'restoration',
      fromTemplateId: tid,
      templateId: mapped,
      templateName: String(template.templateName ?? template.name ?? mapped),
      rank,
      rename: OLD_ACTIVE_HEAL_NAME.test(name) ? String(template.name ?? '') || null : null,
    };
  }

  // Unstamped legacy items are recognised by their exact old display name only.
  if (tid === 'passive-healing' || (!tid && OLD_PASSIVE_HEAL_NAME.test(name))) {
    return {
      kind: 'regeneration',
      fromTemplateId: tid || 'passive-healing',
      rank,
      rename: OLD_PASSIVE_HEAL_NAME.test(name) ? REGEN_NAME : null,
    };
  }

  if (R05_RETIRED_HEALING_BUFF_IDS.has(tid)) {
    return { kind: 'retire', reason: 'R-05: ordinary HP healing Active Buffs were retired.' };
  }
  if (R05_RETIRED_HEALING_PASSIVE_IDS.has(tid)) {
    return { kind: 'retire', reason: 'R-05: ordinary HP healing Passives were retired. Use Passive: Restoration.' };
  }

  // Rename catalog display: Passive: Regeneration / double-prefix → Passive: Restoration.
  if (
    tid === REGEN_TEMPLATE_ID &&
    name &&
    name !== REGEN_NAME &&
    /(?:Passive:\s*)*Regeneration$/i.test(name)
  ) {
    return {
      kind: 'regeneration',
      fromTemplateId: tid,
      rank,
      rename: REGEN_NAME,
    };
  }
  return { kind: 'none' };
}

async function applyPlan(item: any, plan: R05ItemPlan): Promise<boolean> {
  if (plan.kind === 'none') return false;

  if (plan.kind === 'retire') {
    await item.update({
      [`flags.${FLAG_SCOPE}.${R05_RETIRED_FLAG}`]: true,
      [`flags.${FLAG_SCOPE}.${R05_MIGRATION_NOTE_FLAG}`]: plan.reason,
    });
    return true;
  }

  if (plan.kind === 'restoration') {
    const patch: Record<string, unknown> = {
      'system.templateId': plan.templateId,
      'system.templateName': plan.templateName,
    };
    if (plan.rename) patch.name = plan.rename;
    await item.update(patch);
    await resyncPowerItemFromTemplate(item, { force: true });
    return true;
  }

  // regeneration
  const regen: any = findTemplateById(REGEN_TEMPLATE_ID);
  const patch: Record<string, unknown> = {
    'system.templateId': REGEN_TEMPLATE_ID,
    'system.templateName': String(regen?.templateName ?? regen?.name ?? REGEN_NAME),
  };
  if (plan.rename) patch.name = plan.rename;
  await item.update(patch);
  await resyncPowerItemFromTemplate(item, { force: true });
  return true;
}

export interface R05HealingMigrationSummary {
  restoration: number;
  regeneration: number;
  retired: number;
}

/** Migrate every power / passive item on the given actors. GM only. */
export async function runR05HealingMigration(actors: any[]): Promise<R05HealingMigrationSummary> {
  const summary: R05HealingMigrationSummary = { restoration: 0, regeneration: 0, retired: 0 };
  const isGM = (globalThis as any).game?.user?.isGM;
  if (!isGM) return summary;

  for (const actor of actors || []) {
    const items = Array.from(actor?.items ?? []).filter(
      (i: any) => i?.type === 'power' || i?.type === 'passive',
    ) as any[];
    for (const item of items) {
      try {
        const plan = planR05HealingItem(item);
        if (plan.kind === 'none') continue;
        if (!(await applyPlan(item, plan))) continue;
        if (plan.kind === 'restoration') summary.restoration += 1;
        else if (plan.kind === 'regeneration') summary.regeneration += 1;
        else summary.retired += 1;
      } catch (err) {
        console.warn(`Mastery System | R-05 healing migration failed for "${item?.name}" on ${actor?.name}`, err);
      }
    }
  }

  const total = summary.restoration + summary.regeneration + summary.retired;
  if (total > 0) {
    console.log(
      `Mastery System | R-05 healing migration: ${summary.restoration} → Restoration, ${summary.regeneration} → Regeneration, ${summary.retired} retired.`,
    );
    try {
      (globalThis as any).ui?.notifications?.info?.(
        `R-05: migrated ${summary.restoration + summary.regeneration} healing power(s); ${summary.retired} retired/flagged.`,
      );
    } catch {
      /* ignore */
    }
  }
  return summary;
}
