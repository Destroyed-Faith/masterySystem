/**
 * R-05 Passive: Restoration — daily Scarred-Bar self-restoration pool.
 * Resets once per Tyhran calendar day (`currentDayIndex`).
 */

import { getCurrentDayIndex } from '../calendar/tyhra-calendar-settings.js';
import { getTemplate } from '../utils/powers/templates/index.js';
import { getActionEconomyActor } from './action-economy.js';
import { isIncapacitated } from './death-check.js';
import { restoreScarredHealthBars } from './r05-restoration.js';
import { regenerationPoolMaxForLevel, regenerationCatalogText } from './r05-pools.js';

export const REGEN_DAILY_FLAG = 'passiveRegenerationDaily';
export const PASSIVE_REGENERATION_TEMPLATE_ID = 'passive-regeneration';
/** Legacy id kept as alias for migration. */
export const PASSIVE_HEALING_LEGACY_ID = 'passive-healing';

export interface RegenDailyState {
  /** Tyhran day index this spent counter belongs to. */
  dayIndex: number;
  /** Bars restored today. */
  spent: number;
  /** Power level that sized the pool when first spent/refreshed today. */
  poolMax: number;
}

function economyOwner(actor: any): any {
  try {
    return getActionEconomyActor(actor) ?? actor;
  } catch {
    return actor;
  }
}

function readFlag(actor: any): RegenDailyState | null {
  const owner = economyOwner(actor);
  const raw =
    typeof owner?.getFlag === 'function'
      ? owner.getFlag('mastery-system', REGEN_DAILY_FLAG)
      : owner?.flags?.['mastery-system']?.[REGEN_DAILY_FLAG];
  if (!raw || typeof raw !== 'object') return null;
  return {
    dayIndex: Math.floor(Number((raw as any).dayIndex) || 0),
    spent: Math.max(0, Math.floor(Number((raw as any).spent) || 0)),
    poolMax: Math.max(0, Math.floor(Number((raw as any).poolMax) || 0)),
  };
}

async function writeFlag(actor: any, state: RegenDailyState): Promise<void> {
  const owner = economyOwner(actor);
  await owner?.setFlag?.('mastery-system', REGEN_DAILY_FLAG, state);
}

export function getTyhranDayIndex(): number {
  try {
    return Math.max(0, Math.floor(Number(getCurrentDayIndex()) || 0));
  } catch {
    return Math.max(
      0,
      Math.floor(Number((globalThis as any).game?.settings?.get?.('mastery-system', 'currentDayIndex')) || 0),
    );
  }
}

function restorationPowerLevel(raw: unknown): number {
  const n = Math.floor(Number(raw) || 0);
  if (n <= 0) return 0;
  return Math.max(1, Math.min(16, n));
}

/** True for the Passive itself. Active Scarred Bar Restoration powers do not match. */
export function isPassiveRestorationIdentity(args: {
  templateId?: unknown;
  name?: unknown;
  type?: unknown;
}): boolean {
  const tid = String(args.templateId || '').trim().toLowerCase();
  const name = String(args.name || '').trim();
  const type = String(args.type || '').trim().toLowerCase();
  if (tid === PASSIVE_REGENERATION_TEMPLATE_ID || tid === PASSIVE_HEALING_LEGACY_ID) return true;
  const passiveNamed = type === 'passive' || /^passive\b/i.test(name);
  return passiveNamed && /restoration|regeneration/i.test(name);
}

/** Slotted / owned Passive: Restoration power level (0 if none). */
export function getPassiveRegenerationLevel(actor: any): number {
  let best = 0;
  const consider = (templateId: unknown, name: unknown, type: unknown, level: unknown) => {
    if (!isPassiveRestorationIdentity({ templateId, name, type })) return;
    const lvl = restorationPowerLevel(level) || 1;
    if (lvl > best) best = lvl;
  };
  const items = actor?.items;
  if (items) {
    const list = Array.isArray(items)
      ? items
      : typeof items[Symbol.iterator] === 'function'
        ? Array.from(items as Iterable<any>)
        : Array.isArray(items.contents)
          ? items.contents
          : [];
    for (const item of list as any[]) {
      const sys = item?.system ?? {};
      consider(
        sys.templateId || sys.powerTemplateId,
        item?.name,
        item?.type,
        sys.rank ?? sys.level,
      );
    }
  }
  const passives = actor?.system?.passives ?? {};
  for (let i = 0; i < 6; i += 1) {
    const raw = passives[`slot${i}`]?.passive ?? passives?.slots?.[i]?.passive;
    if (!raw) continue;
    consider(raw.templateId || raw.id, raw.name, 'passive', raw.rank ?? raw.level);
  }
  return best;
}

export { regenerationPoolMaxForLevel, regenerationCatalogText };

export function getRegenerationState(actor: any): {
  level: number;
  poolMax: number;
  spent: number;
  remaining: number;
  dayIndex: number;
} {
  const level = getPassiveRegenerationLevel(actor);
  const catalogMax = regenerationPoolMaxForLevel(level);
  const day = getTyhranDayIndex();
  const stored = readFlag(actor);
  if (!stored || stored.dayIndex !== day) {
    return { level, poolMax: catalogMax, spent: 0, remaining: catalogMax, dayIndex: day };
  }
  // PL increase mid-day raises max without refilling spent.
  const poolMax = Math.max(catalogMax, stored.poolMax);
  const spent = Math.min(poolMax, stored.spent);
  return { level, poolMax, spent, remaining: Math.max(0, poolMax - spent), dayIndex: day };
}

/** Ensure day boundary rolled — call on sheet/combat open. Idempotent. */
export async function syncRegenerationDayBoundary(actor: any): Promise<boolean> {
  const level = getPassiveRegenerationLevel(actor);
  if (level <= 0) return false;
  const day = getTyhranDayIndex();
  const stored = readFlag(actor);
  if (stored && stored.dayIndex === day) return false;
  const poolMax = regenerationPoolMaxForLevel(level);
  await writeFlag(actor, { dayIndex: day, spent: 0, poolMax });
  return true;
}

export async function activatePassiveRegeneration(
  actor: any,
  bars: number,
): Promise<{ ok: boolean; restored: number; remaining: number; reason?: string }> {
  if (!actor) return { ok: false, restored: 0, remaining: 0, reason: 'no-actor' };
  if (isIncapacitated(actor)) {
    return { ok: false, restored: 0, remaining: 0, reason: 'incapacitated' };
  }
  await syncRegenerationDayBoundary(actor);
  const state = getRegenerationState(actor);
  if (state.level <= 0 || state.poolMax <= 0) {
    return { ok: false, restored: 0, remaining: 0, reason: 'no-passive' };
  }
  const want = Math.max(0, Math.floor(Number(bars) || 0));
  if (want <= 0) return { ok: false, restored: 0, remaining: state.remaining, reason: 'zero' };
  const spend = Math.min(want, state.remaining);
  if (spend <= 0) return { ok: false, restored: 0, remaining: 0, reason: 'exhausted' };

  const { restored } = await restoreScarredHealthBars(actor, spend);
  if (restored <= 0) {
    return { ok: false, restored: 0, remaining: state.remaining, reason: 'no-scarred' };
  }
  const nextSpent = state.spent + restored;
  await writeFlag(actor, {
    dayIndex: state.dayIndex,
    spent: nextSpent,
    poolMax: state.poolMax,
  });
  return {
    ok: true,
    restored,
    remaining: Math.max(0, state.poolMax - nextSpent),
  };
}

/** Catalog row helper for pickers — implemented in `r05-pools.ts` (re-exported above). */

export function isPassiveRegenerationTemplate(templateId: string | null | undefined): boolean {
  const tid = String(templateId || '');
  return (
    tid === PASSIVE_REGENERATION_TEMPLATE_ID ||
    tid === PASSIVE_HEALING_LEGACY_ID ||
    tid === 'passive-regeneration'
  );
}

/** Ensure template still resolves after rename. */
export function resolveRegenerationTemplate() {
  return (
    getTemplate(PASSIVE_REGENERATION_TEMPLATE_ID) ||
    getTemplate('passive-regeneration') ||
    getTemplate(PASSIVE_HEALING_LEGACY_ID)
  );
}
