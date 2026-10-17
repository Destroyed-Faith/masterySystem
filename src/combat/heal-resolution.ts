/**
 * Combat Heal Actives — ally targeting, no attack roll, no Reactions.
 *
 * Always interactive in chat (never silent auto-roll):
 *   1) If the Power has an HLR pool and the target is Scarred: buttons 0…N
 *      (N > remaining are shown but disabled/gray until Safe Haven Rest)
 *   2) On click: recover Scarred (if chosen), then roll heal dice visibly,
 *      then apply HP into open (non-Scarred) Health Levels
 */

import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { getActiveSpecialValue } from '../system/active-specials.js';
import { escapeStoneChat } from '../stones/stone-resolution.js';
import { remainingMaximizations } from '../stones/stone-combat-effects.js';
import { countScarredHealthBars } from '../stones/remove-scar.js';
import {
  isScarredRestorationTemplateId,
  restoreScarredHealthBars,
  poolAt,
  R05_MELEE_AOE_POOL,
  R05_RANGED_AOE_POOL,
} from './r05-restoration.js';
import { isHealthBarScarred } from '../utils/calculations.js';
import { getActionEconomyActor } from './action-economy.js';
import { artifactLevelToTemplateRank } from '../utils/artifact-spell-pick.js';
import { getTemplate } from '../utils/powers/templates/index.js';
import {
  HL_HEAL_MELEE_POOL,
  HL_HEAL_RANGED_POOL,
} from '../utils/powers/templates/actives.js';
import type { RadialCombatOption } from '../radial-menu/types.js';

export const HEAL_CHAT_FLAG = 'healResolution';
/** Caster flag: `{ [powerKey]: spentLevels }` since last Safe Haven Rest. */
export const HLR_SPENT_FLAG = 'healthLevelRecoverySpent';

/** Catalog Health Level Recovery band for HP-heal Actives (0 below L4, max 4 at L15–16). */
export function healHealthLevelRecoveryForRank(rank: number): number {
  const lvl = Math.max(1, Math.min(16, Math.floor(Number(rank) || 1)));
  if (lvl >= 15) return 4;
  if (lvl >= 12) return 3;
  if (lvl >= 8) return 2;
  if (lvl >= 4) return 1;
  return 0;
}

/**
 * True for dedicated Scarred Bar Restoration (ST + AoE; no HP dice — pool is the
 * whole Power, restored bars return at full HP).
 */
export function isScarredRestorationPower(item: any): boolean {
  const tid = String(item?.system?.templateId || '');
  return isScarredRestorationTemplateId(tid);
}

/**
 * Safe Haven Rest pool size for this Power:
 * - Scarred Bar Restoration → catalog pool at Power Level (up to 12)
 * - else authored `mechanics.healthLevelRecovery` when present
 * - else the small HP-heal HLR band
 */
export function getPowerHlrPoolMax(powerItem: any): number {
  const rank = powerItemRank(powerItem);
  try {
    const fromMech = Number(resolvePowerMechanics(powerItem)?.healthLevelRecovery);
    if (Number.isFinite(fromMech) && fromMech >= 0) {
      return Math.floor(fromMech);
    }
  } catch {
    /* fall through */
  }
  const tid = String(powerItem?.system?.templateId || '');
  if (/health-level-heal/i.test(tid)) {
    const table = /ranged/i.test(tid) ? HL_HEAL_RANGED_POOL : HL_HEAL_MELEE_POOL;
    return poolAt(table, rank);
  }
  if (/aoe-restoration/i.test(tid)) {
    const table = /ranged/i.test(tid) ? R05_RANGED_AOE_POOL : R05_MELEE_AOE_POOL;
    return poolAt(table, rank);
  }
  // R-05: Heal + Cleanse mixed is cleanse-only now — no Health Level Recovery pool.
  if (/heal-cleanse/i.test(tid)) return 0;
  return healHealthLevelRecoveryForRank(rank);
}

export function powerItemRank(item: any): number {
  const sys = item?.system ?? {};
  const raw = Number(sys.rank ?? sys.level ?? 1);
  return Math.max(1, Math.min(16, Number.isFinite(raw) ? Math.floor(raw) : 1));
}

/** Stable key for this Power's HLR pool on the caster. */
export function healPowerHlrKey(powerItem: any): string {
  const id = String(powerItem?.id || '').trim();
  if (id) return id;
  const tid = String(powerItem?.system?.templateId || 'heal').trim() || 'heal';
  return `tpl:${tid}:r${powerItemRank(powerItem)}`;
}

export function getHlrSpentOnCaster(caster: any, powerKey: string): number {
  const owner = getActionEconomyActor(caster) ?? caster;
  try {
    const map = owner?.getFlag?.('mastery-system', HLR_SPENT_FLAG);
    if (map && typeof map === 'object') {
      return Math.max(0, Math.floor(Number((map as Record<string, unknown>)[powerKey]) || 0));
    }
  } catch {
    /* ignore */
  }
  return 0;
}

export function getHlrRemainingOnCaster(caster: any, powerItem: any): number {
  const poolMax = getPowerHlrPoolMax(powerItem);
  if (poolMax <= 0) return 0;
  const spent = getHlrSpentOnCaster(caster, healPowerHlrKey(powerItem));
  return Math.max(0, poolMax - spent);
}

export async function spendHlrOnCaster(caster: any, powerKey: string, amount: number): Promise<number> {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  const owner = getActionEconomyActor(caster) ?? caster;
  if (n <= 0 || !owner?.setFlag) return 0;
  const cur = getHlrSpentOnCaster(owner, powerKey);
  let map: Record<string, number> = {};
  try {
    const raw = owner.getFlag?.('mastery-system', HLR_SPENT_FLAG);
    if (raw && typeof raw === 'object') {
      for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        map[k] = Math.max(0, Math.floor(Number(v) || 0));
      }
    }
  } catch {
    map = {};
  }
  map[powerKey] = cur + n;
  await owner.setFlag('mastery-system', HLR_SPENT_FLAG, map);
  return n;
}

export async function clearHlrSpentOnCaster(caster: any): Promise<void> {
  const owner = getActionEconomyActor(caster) ?? caster;
  if (!owner) return;
  try {
    if (owner.getFlag?.('mastery-system', HLR_SPENT_FLAG) == null) return;
    await owner.unsetFlag?.('mastery-system', HLR_SPENT_FLAG);
  } catch {
    /* ignore */
  }
}

/** Catalog / artifact template ids that deliver heal (incl. heal+cleanse mixed). */
export function isHealTemplateId(templateId: string | null | undefined): boolean {
  const tid = String(templateId || '');
  if (!tid) return false;
  if (/health-level-heal/i.test(tid)) return true;
  if (/aoe-restoration/i.test(tid)) return true;
  if (/heal-cleanse/i.test(tid)) return true;
  if (/\bheal\b/i.test(tid) && !/cleanse|dispel/i.test(tid)) return true;
  return false;
}

function artifactRowLooksLikeHeal(option: {
  name?: string;
  description?: string;
  artifactRowSpecial?: string;
}): boolean {
  const blob = `${option.name || ''} ${option.description || ''} ${option.artifactRowSpecial || ''}`;
  if (!/\bheal\b/i.test(blob)) return false;
  // Offensive artifact actives that mention heal incidentally stay out.
  if (/\b(requiem|exorcism|damage|sundered|lacerate)\b/i.test(blob) && !/\bheal\b.*\bd\d+/i.test(blob)) {
    return false;
  }
  return true;
}

/** True for catalog heal Actives / Health Level Heal (not Cleanse/Dispel-only). */
export function isHealPowerItem(item: any): boolean {
  if (!item || item.type !== 'power') return false;
  const sys = item.system ?? {};
  const tid = String(sys.templateId || '');
  const sub = String(sys.subfamily || '');
  if (/health-level-heal/i.test(tid)) return true;
  if (/aoe-restoration/i.test(tid)) return true;
  if (/support-heal/i.test(sub)) return true;
  if (/heal-cleanse/i.test(tid)) return true;
  if (/\bheal\b/i.test(tid) && !/cleanse|dispel/i.test(tid)) return true;
  try {
    const mech = resolvePowerMechanics(item);
    if (mech?.healing?.flat) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * True for radial options that should use green ally heal targeting.
 * Covers real power items and artifact rows (Moonlight Mending, …) where
 * `option.item` is the artifact document, not a power.
 */
export function isHealRadialOption(
  option: {
    item?: any;
    source?: string;
    aoePlacementProfile?: string;
    artifactPowerTemplateId?: string;
    name?: string;
    description?: string;
    artifactRowSpecial?: string;
  } | null | undefined,
): boolean {
  if (!option || option.source !== 'power') return false;
  if (option.aoePlacementProfile === 'heal') return true;
  if (isHealTemplateId(option.artifactPowerTemplateId)) return true;
  if (option.item?.type === 'artifact' && artifactRowLooksLikeHeal(option)) return true;
  if (
    option.item?.type === 'artifact' &&
    inferRestorationTemplateFromArtifactText(
      `${option.name || ''} ${option.description || ''} ${option.artifactRowSpecial || ''}`,
    )
  ) {
    return true;
  }
  if (option.item && isHealPowerItem(option.item)) return true;
  return false;
}

/**
 * Resolve a power-shaped item for heal dice / HLR — real power, or a synthetic
 * catalog snapshot from an artifact progression row (templateId + stage rank).
 */
export function healPowerItemFromRadialOption(
  option: RadialCombatOption | null | undefined,
): any | null {
  if (!option) return null;
  if (option.item?.type === 'power' && isHealPowerItem(option.item)) return option.item;

  const tid = String(option.artifactPowerTemplateId || '');
  if (tid && isHealTemplateId(tid)) {
    const tpl = getTemplate(tid);
    const rankKey = artifactLevelToTemplateRank(option.artifactRowLevel || 1);
    const rank = Math.max(1, Math.floor(Number(rankKey) || 1));
    return {
      type: 'power',
      id: option.id,
      name: option.name,
        system: {
          templateId: tid,
          category: 'active',
          subfamily: 'support-heal',
          rank,
          level: rank,
          levels: tpl?.levels ?? {},
        },
    };
  }

  // Authored / legacy artifact rows without a template id. R-05: ordinary HP-heal rows
  // ("Heal 10d8", "Ranged Single Target Heal (PL n)") are migrated to Scarred Bar
  // Restoration — never to a rolled HP heal.
  if (option.item?.type === 'artifact') {
    const blob = `${option.name || ''} ${option.description || ''} ${option.artifactRowSpecial || ''}`;
    const inferred = inferRestorationTemplateFromArtifactText(blob);
    if (inferred || artifactRowLooksLikeHeal(option)) {
      const templateId = inferred?.templateId ?? 'active-ranged-health-level-heal';
      const tpl = getTemplate(templateId);
      const rankKey = inferred?.pl ?? artifactLevelToTemplateRank(option.artifactRowLevel || 1);
      const rank = Math.max(1, Math.floor(Number(rankKey) || 1));
      return {
        type: 'power',
        id: option.id,
        name: option.name,
        system: {
          templateId,
          category: 'active',
          subfamily: 'support-heal',
          rank,
          level: rank,
          levels: tpl?.levels ?? {},
        },
      };
    }
  }

  return option.item?.type === 'power' ? option.item : null;
}

/**
 * Infer a Restoration template id (+ printed PL) from artifact row text such as
 * "Ranged Single Target Restoration (PL 10)" / "Melee AoE Restoration (PL 4)" and
 * legacy "Ranged Single Target Heal (PL 16)" / "Healing Aura (PL 4)" technical references.
 */
export function inferRestorationTemplateFromArtifactText(
  text: string | null | undefined,
): { templateId: string; pl: number | null } | null {
  const blob = String(text || '');
  if (!blob) return null;
  const plMatch = /\(\s*PL\s*(\d{1,2})\s*\)/i.exec(blob);
  const pl = plMatch ? Math.max(1, Math.min(16, parseInt(plMatch[1], 10))) : null;
  const ranged = /\branged\b/i.test(blob);
  const melee = /\bmelee\b/i.test(blob);
  if (/\bAoE\s+(?:Restoration|Heal)\b/i.test(blob) || /\bHealing\s+Aura\b/i.test(blob)) {
    return { templateId: ranged && !melee ? 'active-ranged-aoe-restoration' : 'active-melee-aoe-restoration', pl };
  }
  if (/\bSingle\s+Target\s+(?:Restoration|Heal)\b/i.test(blob) || /\bScarred\s+Bar\s+Restoration\b/i.test(blob)) {
    return { templateId: melee && !ranged ? 'active-melee-health-level-heal' : 'active-ranged-health-level-heal', pl };
  }
  return null;
}

/** Dice formula from mechanics, e.g. "4d8", or null for Health-Level-only heals. */
export function getHealDiceFormula(item: any): string | null {
  try {
    const flat = resolvePowerMechanics(item)?.healing?.flat;
    if (!flat) return null;
    const dice = String(flat).trim().replace(/^\+\s*/, '');
    if (!/^\d*d\d+/i.test(dice)) return null;
    return dice.replace(/^d/i, '1d');
  } catch {
    return null;
  }
}

export function getHealAoETargetMode(item: any): 'target' | 'aoe' | 'self' {
  try {
    const t = String(resolvePowerMechanics(item)?.healing?.target || 'target').toLowerCase();
    if (t === 'aoe' || t === 'alliesinarearea' || t === 'allies') return 'aoe';
    if (t === 'self') return 'self';
  } catch {
    /* ignore */
  }
  return 'target';
}

function blightHealReduction(actor: any): number {
  try {
    return Math.max(0, Math.floor(Number(getActiveSpecialValue(actor, 'blight')) || 0));
  } catch {
    return 0;
  }
}

/** Roll heal dice; posts a Foundry roll message so the dice are visible. */
async function rollHealDiceVisible(
  formula: string,
  opts?: { flavor?: string; speaker?: unknown; maximized?: boolean },
): Promise<{ total: number; formula: string; maximized?: boolean }> {
  const g = globalThis as any;
  let useFormula = formula;
  if (opts?.maximized) {
    try {
      const { maximizeDiceFormula } = await import('../stones/stone-combat-effects.js');
      useFormula = maximizeDiceFormula(formula);
    } catch {
      useFormula = formula;
    }
  }
  const RollCls = g.Roll;
  if (typeof RollCls === 'function') {
    const roll = await new RollCls(useFormula).evaluate({ async: true });
    try {
      const flavor =
        (opts?.flavor || 'Heal') +
        (opts?.maximized ? ' (Maximization: every d8 is 8)' : '');
      await roll.toMessage?.({
        speaker: opts?.speaker ?? {},
        flavor,
      });
    } catch {
      /* chat optional */
    }
    return {
      total: Math.max(0, Math.floor(Number(roll.total) || 0)),
      formula: useFormula,
      maximized: !!opts?.maximized,
    };
  }
  // Test / headless fallback
  const m = /^(\d+)d(\d+)/i.exec(useFormula);
  if (m) {
    const n = parseInt(m[1], 10);
    const sides = parseInt(m[2], 10);
    const total = opts?.maximized
      ? Math.max(0, n * sides)
      : Math.max(0, n * Math.ceil(sides / 2));
    return { total, formula: useFormula, maximized: !!opts?.maximized };
  }
  if (opts?.maximized && /^\d+$/.test(String(useFormula).trim())) {
    return {
      total: Math.max(0, Math.floor(Number(useFormula) || 0)),
      formula: useFormula,
      maximized: true,
    };
  }
  return { total: 0, formula: useFormula };
}

/**
 * Apply rolled HP across open Health Levels (current > 0), most severe first.
 * Scarred bars (0 HP) are never filled by heal dice — only by Health Level Recovery.
 */
export function applyHealHpAcrossOpenBars(
  health: { bars?: any[]; currentBar?: number },
  rolled: number,
): { bars: any[]; currentBar: number; restored: number } {
  const bars = (Array.isArray(health?.bars) ? health.bars : []).map((b: any) => ({ ...b }));
  let remaining = Math.max(0, Math.floor(Number(rolled) || 0));
  let restored = 0;
  let currentBar = Math.max(0, Math.min(Math.max(0, bars.length - 1), Math.floor(Number(health?.currentBar) || 0)));
  const nameOf = (i: number) => String(bars[i]?.name || '').toLowerCase();
  const incapacitated = nameOf(currentBar).includes('incapacitat') || currentBar >= 5;
  if (incapacitated && remaining > 0) {
    const named = bars.findIndex((b) => String(b?.name || '').toLowerCase().includes('broken'));
    currentBar = named >= 0 ? named : Math.min(4, bars.length - 1);
  }
  const bar = bars[currentBar];
  if (bar && remaining > 0) {
    const cur = Math.max(0, Math.floor(Number(bar.current) || 0));
    const max = Math.max(0, Math.floor(Number(bar.max) || 0));
    const add = Math.min(Math.max(0, max - cur), remaining);
    if (add > 0) {
      bars[currentBar] = { ...bar, current: cur + add };
      restored += add;
    }
  }
  return { bars, currentBar, restored };
}

export interface HealTargetResult {
  tokenId: string;
  actorId: string;
  name: string;
  rolled: number;
  afterBlight: number;
  restored: number;
  blight: number;
  scarredBefore: number;
}

export function formatHealResultChat(args: {
  sourceName: string;
  powerName: string;
  results: HealTargetResult[];
  formula: string | null;
  scarredRecovered?: number;
}): string {
  const source = escapeStoneChat(args.sourceName);
  const power = escapeStoneChat(args.powerName);
  const totalRestored = args.results.reduce((s, r) => s + r.restored, 0);
  const totalRolled = args.results.reduce((s, r) => s + r.rolled, 0);
  const headline =
    args.formula && totalRolled > 0
      ? `<p class="ms-heal-headline">Healed <strong class="ms-heal-amount">${totalRestored}</strong> HP <span class="ms-heal-roll">(rolled ${totalRolled} on ${escapeStoneChat(args.formula)})</span></p>`
      : args.formula
        ? `<p class="ms-heal-headline">Heal roll on <strong>${escapeStoneChat(args.formula)}</strong> — no HP restored (bar full or no valid bar).</p>`
        : `<p class="ms-heal-headline">Scarred Health Bars restored at full HP. This Power does not roll or restore ordinary HP.</p>`;
  const scarredLine =
    (args.scarredRecovered ?? 0) > 0
      ? `<p class="ms-heal-scarred-line">Scarred Health Bars restored: <strong>${args.scarredRecovered}</strong></p>`
      : '';
  const rows = args.results
    .map((r) => {
      const name = escapeStoneChat(r.name);
      if (!args.formula) {
        return `<li><strong>${name}</strong> — Scarred bars remaining: ${r.scarredBefore}.</li>`;
      }
      const blight =
        r.blight > 0
          ? ` (Blight −${r.blight}: ${r.rolled} → ${r.afterBlight})`
          : '';
      const cap =
        r.restored <= 0
          ? ` Rolled <strong>${r.rolled}</strong>${blight} — <strong>0 HP</strong> applied (no open Health Level with room; recover Scarred first if needed).`
          : r.restored < r.afterBlight
            ? ` Restored <strong>${r.restored}</strong> / ${r.afterBlight} HP${blight} (open Health Level headroom).`
            : ` Restored <strong>${r.restored}</strong> HP${blight}.`;
      return `<li><strong>${name}</strong> —${cap}</li>`;
    })
    .join('');
  return `<div class="mastery-heal-resolution"><p><strong>${source}</strong> — ${power}</p>${scarredLine}${headline}<ul>${rows}</ul></div>`;
}

export function formatScarredPromptChat(args: {
  healerName: string;
  targetName: string;
  targetActorId: string;
  maxBars: number;
  scarred: number;
  poolRemaining: number;
  poolMax: number;
  powerName?: string;
  formula?: string | null;
  maximizationRemaining?: number;
}): string {
  const healer = escapeStoneChat(args.healerName);
  const target = escapeStoneChat(args.targetName);
  const power = escapeStoneChat(args.powerName || 'Heal');
  const formula = args.formula ? escapeStoneChat(args.formula) : '';
  // Show full band 0…min(scarred, poolMax); gray out spends above remaining.
  const maxShown = Math.max(0, Math.min(args.maxBars, args.scarred, args.poolMax));
  const remaining = Math.max(0, Math.floor(Number(args.poolRemaining) || 0));
  const maxLeft = Math.max(0, Math.floor(Number(args.maximizationRemaining) || 0));
  const healHint = formula ? ` → then roll ${formula}` : '';
  const buttons: string[] = [];
  for (let n = 0; n <= maxShown; n += 1) {
    const disabled = n > remaining;
    const label =
      n === 0
        ? formula
          ? `0 Scarred — roll ${formula}`
          : '0 — skip Scarred'
        : `${n} Scarred${healHint}${disabled ? ' (used up)' : ''}`;
    buttons.push(
      `<button type="button" class="mastery-heal-scarred-pick${disabled ? ' ms-heal-btn-disabled' : ''}" data-bars="${n}" data-maximize="0"${disabled ? ' disabled title="Health Level Recovery already spent this Safe Haven Rest"' : ''}>${label}</button>`,
    );
    if (formula && maxLeft > 0 && !disabled) {
      const maxLabel =
        n === 0 ? `0 Scarred — Roll Maximum` : `${n} Scarred + Roll Maximum`;
      buttons.push(
        `<button type="button" class="mastery-heal-scarred-pick mastery-heal-roll-max" data-bars="${n}" data-maximize="1" title="Spend 1 Maximization (${maxLeft} left). Every d8 becomes 8.">${maxLabel}</button>`,
      );
    }
  }
  if (formula && maxShown <= 0) {
    buttons.push(
      `<button type="button" class="mastery-heal-scarred-pick mastery-heal-roll-only" data-bars="0" data-maximize="0">Roll heal ${formula}</button>`,
    );
    if (maxLeft > 0) {
      buttons.push(
        `<button type="button" class="mastery-heal-scarred-pick mastery-heal-roll-only mastery-heal-roll-max" data-bars="0" data-maximize="1" title="Spend 1 Maximization (${maxLeft} left). Every d8 becomes 8.">Roll Maximum</button>`,
      );
    }
  }
  const healPreview = formula
    ? `<p class="ms-heal-preview"><strong>Click a button</strong> to recover Scarred (optional), then roll — use <strong>Roll Maximum</strong> to spend Maximization.</p>`
    : `<p class="ms-heal-preview"><strong>Click a button</strong> to restore Scarred Health Bars — each restored bar returns at full HP (no Healing Dice).</p>`;
  const headline = formula
    ? `<p><strong>${healer}</strong> — <em>${power}</em>: Scarred zuerst, dann Heal würfeln</p>`
    : `<p><strong>${healer}</strong> — <em>${power}</em>: restore Scarred Health Bars (full HP)</p>`;
  return `<div class="mastery-heal-scarred-prompt" data-target-actor-id="${escapeStoneChat(args.targetActorId)}" data-max-bars="${maxShown}">
  ${headline}
  <p><strong>${target}</strong> has <strong>${args.scarred}</strong> Scarred Health Bar(s).</p>
  <p>This Power's pool: <strong>${remaining}</strong> / ${args.poolMax} Health Level(s) left this Safe Haven Rest.</p>
  ${healPreview}
  <div class="mastery-heal-scarred-actions">${buttons.join('')}</div>
</div>`;
}

/** No Scarred / no HLR — still require a click so dice are visible. */
export function formatHealRollPromptChat(args: {
  healerName: string;
  targetName: string;
  powerName?: string;
  formula: string;
  /** When > 0, show Roll Maximum beside Roll. */
  maximizationRemaining?: number;
}): string {
  const healer = escapeStoneChat(args.healerName);
  const target = escapeStoneChat(args.targetName);
  const power = escapeStoneChat(args.powerName || 'Heal');
  const formula = escapeStoneChat(args.formula);
  const maxLeft = Math.max(0, Math.floor(Number(args.maximizationRemaining) || 0));
  const maxBtn =
    maxLeft > 0
      ? `<button type="button" class="mastery-heal-scarred-pick mastery-heal-roll-only mastery-heal-roll-max" data-bars="0" data-maximize="1" title="Spend 1 Maximization (${maxLeft} left). Every d8 becomes 8.">Roll Maximum</button>`
      : '';
  return `<div class="mastery-heal-scarred-prompt mastery-heal-roll-prompt">
  <p><strong>${healer}</strong> — <em>${power}</em> on <strong>${target}</strong></p>
  <p class="ms-heal-preview">Choose <strong>Roll</strong> or <strong>Roll Maximum</strong> — then ${formula} posts in chat and HP is applied.</p>
  <div class="mastery-heal-scarred-actions">
    <button type="button" class="mastery-heal-scarred-pick mastery-heal-roll-only" data-bars="0" data-maximize="0">Roll heal ${formula}</button>
    ${maxBtn}
  </div>
</div>`;
}

/**
 * Health / Scarred live on the token's battle actor. Do NOT redirect through
 * getActionEconomyActor here — that often returns the world prototype, which
 * can have full bars while the placed (unlinked) token still shows Scarred.
 */
function healTargetActor(actor: any): any {
  return actor ?? null;
}

async function applyHpHealToActor(actor: any, rolled: number): Promise<{ restored: number; afterBlight: number; blight: number }> {
  const owner = healTargetActor(actor);
  const blight = blightHealReduction(owner);
  const afterBlight = Math.max(0, rolled - blight);
  const health = owner?.system?.health;
  if (!health || !Array.isArray(health.bars)) {
    return { restored: 0, afterBlight, blight };
  }
  const applied = applyHealHpAcrossOpenBars(
    { bars: health.bars, currentBar: health.currentBar },
    afterBlight,
  );
  const scarredCount = applied.bars.filter((b: any) => isHealthBarScarred(b)).length;
  const patch: Record<string, unknown> = {
    'system.health.bars': applied.bars,
    'system.health.currentBar': applied.currentBar,
  };
  if (Object.prototype.hasOwnProperty.call(health, 'scarred')) {
    patch['system.health.scarred'] = scarredCount;
  }
  await owner.update?.(patch);
  return { restored: applied.restored, afterBlight, blight };
}

interface PendingHealPayload {
  casterTokenId: string;
  powerName: string;
  powerKey: string;
  formula: string | null;
  cleanseRank: number;
  /** Serialized power snapshot for cleanse / HLR bookkeeping. */
  powerItemSnapshot: any;
  targetTokenIds: string[];
  /** Scarred candidate (one creature per use for AoE). */
  scarredTargetActorId: string;
  scarredTargetTokenId: string;
}

function snapshotHealPowerItem(powerItem: any): any {
  return {
    id: powerItem?.id,
    type: powerItem?.type || 'power',
    name: powerItem?.name,
    system: {
      templateId: powerItem?.system?.templateId,
      category: powerItem?.system?.category,
      subfamily: powerItem?.system?.subfamily,
      rank: powerItemRank(powerItem),
      level: powerItemRank(powerItem),
      levels: powerItem?.system?.levels ?? {},
      mechanics: powerItem?.system?.mechanics,
    },
  };
}

function resolveTokenById(tokenId: string): any | null {
  const g = globalThis as any;
  try {
    const direct = g.canvas?.tokens?.get?.(tokenId);
    if (direct) return direct;
    const placeables = g.canvas?.tokens?.placeables ?? [];
    return (
      placeables.find(
        (t: any) => String(t.id) === tokenId || String(t.document?.id) === tokenId,
      ) ?? null
    );
  } catch {
    return null;
  }
}

async function applyHpHealPass(args: {
  casterToken: any;
  powerItem: any;
  powerName: string;
  targetTokens: any[];
  formula: string | null;
  scarredRecovered?: number;
  /** When set, append the heal result onto this chat message instead of a new one. */
  appendToMessage?: any;
  /** True when the player clicked Roll Maximum on the heal card. */
  maximize?: boolean;
}): Promise<HealTargetResult[]> {
  const g = globalThis as any;
  const caster = args.casterToken?.actor;
  const speaker = g.ChatMessage?.getSpeaker?.({ actor: caster, token: args.casterToken?.document });
  const results: HealTargetResult[] = [];
  // One Maximization for a shared AoE heal roll (first target rolls; others reuse).
  let sharedMaximized = false;
  let sharedRollTotal: number | null = null;
  if (args.formula && caster && args.targetTokens.length > 0 && args.maximize) {
    try {
      const { spendMaximization } = await import('../stones/stone-combat-effects.js');
      sharedMaximized = await spendMaximization(caster);
      if (!sharedMaximized) {
        g.ui?.notifications?.warn?.('No Maximization remaining — rolling heal normally.');
      }
    } catch {
      sharedMaximized = false;
    }
  }
  for (const tok of args.targetTokens) {
    const actor = tok?.actor;
    if (!actor) continue;
    let rolled = 0;
    let afterBlight = 0;
    let restored = 0;
    let blight = 0;
    if (args.formula) {
      if (sharedRollTotal == null) {
        const roll = await rollHealDiceVisible(args.formula, {
          flavor: `${args.powerName} — Heal (${actor.name || tok.name || 'Target'})`,
          speaker,
          maximized: sharedMaximized,
        });
        sharedRollTotal = roll.total;
      }
      rolled = sharedRollTotal;
      const applied = await applyHpHealToActor(actor, rolled);
      afterBlight = applied.afterBlight;
      restored = applied.restored;
      blight = applied.blight;
    }
    const scarredBefore = countScarredHealthBars(healTargetActor(actor));
    results.push({
      tokenId: String(tok.id || ''),
      actorId: String(actor.id || ''),
      name: String(actor.name || tok.name || 'Target'),
      rolled,
      afterBlight,
      restored,
      blight,
      scarredBefore,
    });
  }
  const content = formatHealResultChat({
    sourceName: String(caster?.name || args.casterToken?.name || 'Healer'),
    powerName: args.powerName,
    results,
    formula: args.formula,
    scarredRecovered: args.scarredRecovered ?? 0,
  });

  const totalRestored = results.reduce((s, r) => s + r.restored, 0);
  const totalRolled = results.reduce((s, r) => s + r.rolled, 0);
  if (args.formula && totalRolled > 0) {
    g.ui?.notifications?.info?.(
      `${args.powerName}: rolled ${totalRolled} → restored ${totalRestored} HP` +
        ((args.scarredRecovered ?? 0) > 0 ? ` (+${args.scarredRecovered} Scarred)` : ''),
    );
  } else if ((args.scarredRecovered ?? 0) > 0) {
    g.ui?.notifications?.info?.(
      `${args.powerName}: restored ${args.scarredRecovered} Scarred Health Bar(s).`,
    );
  }

  try {
    if (args.appendToMessage?.update) {
      const prev = String(args.appendToMessage.content || '');
      await args.appendToMessage.update({
        content: `${prev}<div class="mastery-heal-scarred-resolved">${content}</div>`,
      });
    } else {
      await g.ChatMessage?.create?.({
        speaker: g.ChatMessage?.getSpeaker?.({ actor: caster, token: args.casterToken?.document }),
        content,
        flags: {
          'mastery-system': {
            [HEAL_CHAT_FLAG]: {
              kind: 'heal-result',
              powerId: String(args.powerItem?.id || ''),
            },
          },
        },
      });
    }
  } catch (err) {
    console.warn('Mastery System | heal chat failed', err);
  }

  // Heal + Cleanse mixed: interactive Cleanse distribution after HP heal.
  try {
    const { getCleanseRankFromPower, postCleansePromptForTarget } = await import('./cleanse-resolution.js');
    if (getCleanseRankFromPower(args.powerItem) > 0) {
      for (const tok of args.targetTokens) {
        await postCleansePromptForTarget({
          casterToken: args.casterToken,
          powerItem: args.powerItem,
          powerName: args.powerName,
          targetToken: tok,
        });
      }
    }
  } catch (err) {
    console.warn('Mastery System | mixed heal+cleanse prompt failed', err);
  }

  return results;
}

/**
 * Resolve heal on one or more token targets (already chosen). No attack roll.
 * Always posts a chat card — Scarred picks and/or a Roll button; never auto-rolls.
 */
export async function resolveHealOnTokens(args: {
  casterToken: any;
  powerItem: any;
  powerName: string;
  targetTokens: any[];
}): Promise<HealTargetResult[]> {
  const caster = args.casterToken?.actor;
  const formula = getHealDiceFormula(args.powerItem);
  const poolMax = getPowerHlrPoolMax(args.powerItem);
  const poolRemaining = getHlrRemainingOnCaster(caster, args.powerItem);
  const powerKey = healPowerHlrKey(args.powerItem);
  const g = globalThis as any;

  // R-05: AoE Restoration — shared pool distributed across eligible allies.
  const tid = String(args.powerItem?.system?.templateId || '');
  if (/aoe-restoration/i.test(tid) && !formula) {
    try {
      const {
        buildAoeRestorationPending,
        formatAoeRestorationPromptChat,
        AOE_RESTORATION_CHAT_FLAG,
      } = await import('./aoe-restoration.js');
      const pendingAoe = buildAoeRestorationPending({
        caster,
        powerItem: args.powerItem,
        powerName: args.powerName,
        targetTokens: args.targetTokens,
      });
      if (pendingAoe) {
        await g.ChatMessage?.create?.({
          speaker: g.ChatMessage?.getSpeaker?.({ actor: caster, token: args.casterToken?.document }),
          content: formatAoeRestorationPromptChat(pendingAoe),
          flags: {
            'mastery-system': {
              [AOE_RESTORATION_CHAT_FLAG]: { kind: 'aoe-prompt', pending: pendingAoe, resolved: false },
            },
          },
        });
        g.ui?.notifications?.info?.('Distribute Scarred Bar Restoration among allies, then Apply.');
        return [];
      }
    } catch (err) {
      console.warn('Mastery System | AoE Restoration prompt failed', err);
    }
  }

  // Single-target Scarred recipient (ST Restoration / legacy heal+HLR).
  // Read Scarred from the targeted token actor (same source as carousel/sheet),
  // not getActionEconomyActor — world prototype can disagree on unlinked tokens.
  let scarredTok: any = null;
  let scarredCount = 0;
  for (const tok of args.targetTokens) {
    const actor = healTargetActor(tok?.actor);
    if (!actor) continue;
    const n = countScarredHealthBars(actor);
    if (n > 0) {
      scarredTok = tok;
      scarredCount = n;
      break;
    }
  }

  const primaryTok = scarredTok || args.targetTokens[0];
  const pending: PendingHealPayload = {
    casterTokenId: String(args.casterToken?.id || args.casterToken?.document?.id || ''),
    powerName: args.powerName,
    powerKey,
    formula,
    cleanseRank: 0,
    powerItemSnapshot: snapshotHealPowerItem(args.powerItem),
    targetTokenIds: args.targetTokens.map((t) => String(t.id || '')).filter(Boolean),
    scarredTargetActorId: String(primaryTok?.actor?.id || ''),
    scarredTargetTokenId: String(primaryTok?.id || ''),
  };
  try {
    const { getCleanseRankFromPower } = await import('./cleanse-resolution.js');
    pending.cleanseRank = getCleanseRankFromPower(args.powerItem);
  } catch {
    pending.cleanseRank = 0;
  }

  // Show Scarred UI whenever the Power has an HLR band and the target is Scarred
  // (even if remaining is 0 — buttons above remaining stay visible but grayed).
  const offerScarredUi = poolMax > 0 && scarredTok && scarredCount > 0;
  const maxLeft = formula ? remainingMaximizations(caster) : 0;
  const content = offerScarredUi
    ? formatScarredPromptChat({
        healerName: String(caster?.name || 'Healer'),
        targetName: String(scarredTok.actor?.name || scarredTok.name || 'Target'),
        targetActorId: pending.scarredTargetActorId,
        maxBars: Math.min(scarredCount, poolMax),
        scarred: scarredCount,
        poolRemaining,
        poolMax,
        powerName: args.powerName,
        formula,
        maximizationRemaining: maxLeft,
      })
    : formula
      ? formatHealRollPromptChat({
          healerName: String(caster?.name || 'Healer'),
          targetName: String(primaryTok?.actor?.name || primaryTok?.name || 'Target'),
          powerName: args.powerName,
          formula,
          maximizationRemaining: maxLeft,
        })
      : null;

  if (!content && !formula && pending.cleanseRank > 0 && poolMax <= 0) {
    // R-05: Cleanse-only (ex Heal + Cleanse mixed) — no HP / Scarred step; go straight to Cleanse.
    try {
      const { postCleansePromptForTarget } = await import('./cleanse-resolution.js');
      for (const tok of args.targetTokens) {
        await postCleansePromptForTarget({
          casterToken: args.casterToken,
          powerItem: args.powerItem,
          powerName: args.powerName,
          targetToken: tok,
        });
      }
    } catch (err) {
      console.warn('Mastery System | cleanse-only prompt failed', err);
    }
    return [];
  }

  if (!content) {
    // Health-Level-only with no Scarred target: nothing to do.
    const noPool = poolMax <= 0;
    const noRemaining = poolRemaining <= 0;
    const msg = noPool
      ? `${args.powerName}: this Power has no Health Level Recovery pool at this rank.`
      : noRemaining
        ? `${args.powerName}: no Health Level Recovery remaining (refreshes on Safe Haven Rest).`
        : scarredCount <= 0
          ? `${args.powerName}: no Scarred Health Bars on the selected target. Does not restore HP.`
          : `${args.powerName}: no valid Scarred target in range.`;
    g.ui?.notifications?.warn?.(msg);
    return [];
  }

  try {
    await g.ChatMessage?.create?.({
      speaker: g.ChatMessage?.getSpeaker?.({ actor: caster, token: args.casterToken?.document }),
      content,
      flags: {
        'mastery-system': {
          [HEAL_CHAT_FLAG]: {
            kind: 'scarred-prompt',
            targetActorId: pending.scarredTargetActorId,
            casterActorId: String(caster?.id || ''),
            maxBars: offerScarredUi ? Math.min(scarredCount, poolMax) : 0,
            poolRemaining,
            poolMax,
            powerKey,
            pendingHeal: pending,
            resolved: false,
          },
        },
      },
    });
    g.ui?.notifications?.info?.(
      offerScarredUi
        ? formula
          ? `Scarred wählen oder überspringen — Klick würfelt ${formula} sichtbar.`
          : 'Scarred wählen — Klick wendet die Recovery an.'
        : `Klick: ${formula} würfeln und Heal anwenden.`,
    );
  } catch (err) {
    console.warn('Mastery System | heal prompt failed', err);
    return applyHpHealPass({ ...args, formula });
  }
  return [];
}

async function resolveScarredChoice(
  message: any,
  bars: number,
  maximize = false,
): Promise<void> {
  const flags =
    message?.getFlag?.('mastery-system', HEAL_CHAT_FLAG) ??
    message?.flags?.['mastery-system']?.[HEAL_CHAT_FLAG];
  if (!flags || flags.kind !== 'scarred-prompt') return;
  if (flags.resolved) return;

  const pending = flags.pendingHeal as PendingHealPayload | undefined;
  const actorId = String(flags.targetActorId || pending?.scarredTargetActorId || '');
  const maxBars = Math.max(0, Math.floor(Number(flags.maxBars) || 0));
  const want = Math.max(0, Math.min(maxBars, Math.floor(Number(bars) || 0)));
  const g = globalThis as any;

  let target =
    (pending?.scarredTargetTokenId && resolveTokenById(pending.scarredTargetTokenId)?.actor) ||
    g.game?.actors?.get?.(actorId) ||
    null;
  if (!target) {
    try {
      const tokens = g.canvas?.tokens?.placeables ?? [];
      const tok = tokens.find(
        (t: any) => String(t.actor?.id) === actorId || String(t.document?.actorId) === actorId,
      );
      if (tok?.actor) target = tok.actor;
    } catch {
      /* ignore */
    }
  }
  if (!target) {
    g.ui?.notifications?.warn?.('Heal target not found.');
    return;
  }

  // Recover on the same actor the player sees (token battle actor), not world prototype.
  const owner = healTargetActor(target);
  const poolRem = Math.max(0, Math.floor(Number(flags.poolRemaining) || 0));
  // Never spend more than the remaining Safe Haven pool (disabled buttons are a UI guard).
  const spend = Math.max(0, Math.min(want, poolRem));
  let restored = 0;
  if (spend > 0) {
    restored = (await restoreScarredHealthBars(owner, spend)).restored;
    const casterTok = pending?.casterTokenId ? resolveTokenById(pending.casterTokenId) : null;
    const caster = casterTok?.actor ?? g.game?.actors?.get?.(String(flags.casterActorId || '')) ?? null;
    const powerKey = String(flags.powerKey || pending?.powerKey || '');
    if (caster && powerKey && restored > 0) {
      await spendHlrOnCaster(caster, powerKey, restored);
    }
  }

  try {
    await message.setFlag?.('mastery-system', HEAL_CHAT_FLAG, {
      ...flags,
      resolved: true,
      restored,
    });
  } catch {
    /* ignore */
  }

  const poolLeft = Math.max(0, poolRem - restored);
  // Restoration-only Powers (no heal formula): restore + spend HLR, then stop — no HP dice.
  const restorationOnly =
    !pending?.formula && isScarredRestorationTemplateId(pending?.powerItemSnapshot?.system?.templateId);
  const ownerName = escapeStoneChat(owner.name);
  const note = restorationOnly
    ? spend <= 0
      ? `<p><em>No Scarred Health Bar restored.</em></p>`
      : restored > 0
        ? `<p><strong>${ownerName}</strong> — restored <strong>${restored}</strong> Scarred Health Bar(s) at full HP. Pool left: <strong>${poolLeft}</strong>.</p>`
        : `<p><strong>${ownerName}</strong> — no Scarred Health Bar could be restored.</p>`
    : spend <= 0
      ? `<p><em>No Scarred Health Bar recovered — rolling HP heal now…</em></p>`
      : `<p><strong>${ownerName}</strong> — recovered <strong>${restored}</strong> Scarred Health Bar(s) at full HP. Pool left: <strong>${poolLeft}</strong>. Rolling HP heal…</p>`;
  try {
    await message.update?.({
      content: `${message.content}<div class="mastery-heal-scarred-resolved">${note}</div>`,
    });
  } catch {
    /* ignore */
  }

  if (restorationOnly) {
    if (restored > 0) {
      g.ui?.notifications?.info?.(
        `${pending?.powerName || 'Restoration'}: restored ${restored} Scarred Health Bar(s) at full HP.`,
      );
    }
    return;
  }

  // Continue with the deferred HP heal on the same card (and optional Cleanse).
  if (pending) {
    const casterToken =
      resolveTokenById(pending.casterTokenId) ||
      g.canvas?.tokens?.controlled?.[0] ||
      null;
    const targetTokens = (pending.targetTokenIds || [])
      .map((id) => resolveTokenById(id))
      .filter(Boolean);
    if (!targetTokens.length && pending.scarredTargetTokenId) {
      const t = resolveTokenById(pending.scarredTargetTokenId);
      if (t) targetTokens.push(t);
    }
    // Prefer actor lookup if tokens vanished from canvas.
    if (!targetTokens.length) {
      const fallbackActor =
        g.game?.actors?.get?.(pending.scarredTargetActorId) || owner;
      if (fallbackActor) {
        targetTokens.push({
          id: pending.scarredTargetTokenId,
          actor: fallbackActor,
          name: fallbackActor.name,
        });
      }
    }
    await applyHpHealPass({
      casterToken,
      powerItem: pending.powerItemSnapshot,
      powerName: pending.powerName,
      targetTokens,
      formula: pending.formula,
      scarredRecovered: restored,
      appendToMessage: message,
      maximize,
    });
  }
}

function bindScarredPromptHtml(message: any, root: HTMLElement): void {
  const wrap = root.querySelector?.('.mastery-heal-scarred-prompt') as HTMLElement | null;
  if (!wrap || wrap.dataset.msBound === '1') return;
  wrap.dataset.msBound = '1';
  const picks = Array.from(wrap.querySelectorAll('.mastery-heal-scarred-pick')) as HTMLButtonElement[];
  // Legacy yes/no cards from older messages
  const yes = wrap.querySelector('.mastery-heal-scarred-yes') as HTMLButtonElement | null;
  const no = wrap.querySelector('.mastery-heal-scarred-no') as HTMLButtonElement | null;
  const disable = () => {
    picks.forEach((b) => {
      b.disabled = true;
    });
    if (yes) yes.disabled = true;
    if (no) no.disabled = true;
  };
  picks.forEach((btn) => {
    btn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      disable();
      const wantMax = String(btn.dataset.maximize || '0') === '1';
      await resolveScarredChoice(message, Number(btn.dataset.bars || '0'), wantMax);
    });
  });
  yes?.addEventListener('click', async (ev) => {
    ev.preventDefault();
    disable();
    await resolveScarredChoice(message, Number(yes.dataset.bars || '1'), false);
  });
  no?.addEventListener('click', async (ev) => {
    ev.preventDefault();
    disable();
    await resolveScarredChoice(message, 0, false);
  });
}

function bindAoeRestorationHtml(message: any, root: HTMLElement): void {
  const wrap = root.querySelector?.('.mastery-aoe-restoration') as HTMLElement | null;
  if (!wrap || wrap.dataset.msBound === '1') return;
  wrap.dataset.msBound = '1';
  const sumEl = wrap.querySelector('.ms-aoe-rest-sum');
  const refreshSum = () => {
    let total = 0;
    wrap.querySelectorAll('.ms-aoe-rest-alloc').forEach((el) => {
      total += Math.max(0, Math.floor(Number((el as HTMLSelectElement).value) || 0));
    });
    if (sumEl) sumEl.textContent = String(total);
  };
  wrap.querySelectorAll('.ms-aoe-rest-alloc').forEach((el) => {
    el.addEventListener('change', refreshSum);
  });
  wrap.querySelector('.ms-aoe-rest-cancel')?.addEventListener('click', async (ev) => {
    ev.preventDefault();
    try {
      await message.update?.({
        content: `${message.content}<p><em>AoE Restoration cancelled.</em></p>`,
      });
    } catch {
      /* ignore */
    }
  });
  wrap.querySelector('.ms-aoe-rest-commit')?.addEventListener('click', async (ev) => {
    ev.preventDefault();
    const g = globalThis as any;
    const flags =
      message?.getFlag?.('mastery-system', 'aoeRestoration') ??
      message?.flags?.['mastery-system']?.aoeRestoration;
    if (!flags || flags.resolved || flags.kind !== 'aoe-prompt') return;
    const pending = flags.pending;
    if (!pending) return;
    const allocation: Record<string, number> = {};
    wrap.querySelectorAll('.ms-aoe-rest-alloc').forEach((el) => {
      const sel = el as HTMLSelectElement;
      const id = String(sel.dataset.actorId || '');
      if (id) allocation[id] = Math.max(0, Math.floor(Number(sel.value) || 0));
    });
    try {
      const { commitAoeRestorationAllocation, validateAoeRestorationAllocation } = await import(
        './aoe-restoration.js'
      );
      const check = validateAoeRestorationAllocation(pending, allocation);
      if (!check.ok) {
        g.ui?.notifications?.warn?.(
          check.reason === 'over-pool'
            ? 'Allocation exceeds the remaining Restoration pool.'
            : check.reason === 'over-scarred'
              ? 'Cannot restore more Scarred Bars than a target has.'
              : 'Choose how many Scarred Bars to restore, then Apply.',
        );
        return;
      }
      const caster = g.game?.actors?.get?.(pending.casterActorId) ?? null;
      const result = await commitAoeRestorationAllocation(caster, pending, allocation);
      await message.setFlag?.('mastery-system', 'aoeRestoration', { ...flags, resolved: true });
      const lines = result.results
        .map((r) => `<li><strong>${escapeStoneChat(r.name)}</strong> — ${r.restored} Bar(s) at full HP</li>`)
        .join('');
      await message.update?.({
        content:
          `${message.content}<div class="ms-aoe-rest-done"><p>Spent <strong>${result.spent}</strong> Restoration point(s).</p><ul>${lines}</ul></div>`,
      });
      if (result.ok) {
        g.ui?.notifications?.info?.(`AoE Restoration: ${result.spent} Scarred Bar(s) restored at full HP.`);
      }
    } catch (err) {
      console.warn('Mastery System | AoE Restoration commit failed', err);
    }
  });
}

/** Register chat button handlers for Scarred recovery prompts. */
export function registerHealChatHandlers(): void {
  const g = globalThis as any;
  const Hooks = g.Hooks;
  if (!Hooks?.on) return;
  Hooks.on('renderChatMessageHTML', (message: any, htmlRaw: HTMLElement | JQuery) => {
    try {
      const root =
        (htmlRaw as any)?.jquery || (htmlRaw as any)?.[0]
          ? ((htmlRaw as any)[0] as HTMLElement)
          : (htmlRaw as HTMLElement);
      if (!root?.querySelector) return;
      bindScarredPromptHtml(message, root);
      bindAoeRestorationHtml(message, root);
    } catch (err) {
      console.warn('Mastery System | heal scarred chat bind failed', err);
    }
  });
}
