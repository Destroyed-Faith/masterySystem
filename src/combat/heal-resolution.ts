/**
 * Combat Heal Actives — ally targeting, no attack roll, no Reactions.
 *
 * Order when Health Level Recovery is available and the target has Scarred bars:
 *   1) Chat prompt: spend 0..N from this Power's per–Safe-Haven HLR pool
 *   2) Apply Scarred / Health Level recovery
 *   3) Roll HP heal onto the (possibly restored) current Health Bar
 * Otherwise HP heal runs immediately.
 */

import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { getActiveSpecialValue } from '../system/active-specials.js';
import {
  applyHealingToCurrentBar,
  escapeStoneChat,
} from '../stones/stone-resolution.js';
import {
  countScarredHealthBars,
  recoverScarredBars,
} from '../stones/remove-scar.js';
import { getActionEconomyActor } from './action-economy.js';
import { artifactLevelToTemplateRank } from '../utils/artifact-spell-pick.js';
import { getTemplate } from '../utils/powers/templates/index.js';
import type { RadialCombatOption } from '../radial-menu/types.js';

export const HEAL_CHAT_FLAG = 'healResolution';
/** Caster flag: `{ [powerKey]: spentLevels }` since last Safe Haven Rest. */
export const HLR_SPENT_FLAG = 'healthLevelRecoverySpent';

/** Catalog Health Level Recovery band (heal Actives; 0 below L4, max 4 at L15–16). */
export function healHealthLevelRecoveryForRank(rank: number): number {
  const lvl = Math.max(1, Math.min(16, Math.floor(Number(rank) || 1)));
  if (lvl >= 15) return 4;
  if (lvl >= 12) return 3;
  if (lvl >= 8) return 2;
  if (lvl >= 4) return 1;
  return 0;
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
  const poolMax = healHealthLevelRecoveryForRank(powerItemRank(powerItem));
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

  // Legacy / test rows: "Heal 10d8" in the effect column, no templateId.
  if (option.item?.type === 'artifact' && artifactRowLooksLikeHeal(option)) {
    const blob = `${option.description || ''} ${option.artifactRowSpecial || ''}`;
    const m = /(\d+)\s*d\s*8/i.exec(blob);
    if (m) {
      const dice = `${m[1]}d8`;
      return {
        type: 'power',
        id: option.id,
        name: option.name,
        system: {
          templateId: 'active-ranged-single-heal',
          category: 'active',
          subfamily: 'support-heal',
          rank: 4,
          level: 4,
          levels: {
            '4': { mechanics: { healing: { flat: dice, target: 'target' } } },
          },
        },
      };
    }
  }

  return option.item?.type === 'power' ? option.item : null;
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

async function rollFormula(formula: string): Promise<{ total: number; formula: string }> {
  const g = globalThis as any;
  const RollCls = g.Roll;
  if (typeof RollCls === 'function') {
    const roll = await new RollCls(formula).evaluate({ async: true });
    return { total: Math.max(0, Math.floor(Number(roll.total) || 0)), formula };
  }
  // Test / offline fallback: average-ish
  const m = /^(\d+)d(\d+)/i.exec(formula);
  if (m) {
    const n = parseInt(m[1], 10);
    const sides = parseInt(m[2], 10);
    return { total: Math.max(0, n * Math.ceil(sides / 2)), formula };
  }
  return { total: 0, formula };
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
        : `<p class="ms-heal-headline">No HP heal from this Power (Health Level Recovery only).</p>`;
  const scarredLine =
    (args.scarredRecovered ?? 0) > 0
      ? `<p class="ms-heal-scarred-line">Scarred Health Bars restored: <strong>${args.scarredRecovered}</strong></p>`
      : '';
  const rows = args.results
    .map((r) => {
      const name = escapeStoneChat(r.name);
      if (!args.formula) {
        return `<li><strong>${name}</strong> — no HP heal. Scarred bars left: ${r.scarredBefore}.</li>`;
      }
      const blight =
        r.blight > 0
          ? ` (Blight −${r.blight}: ${r.rolled} → ${r.afterBlight})`
          : '';
      const cap =
        r.restored < r.afterBlight
          ? ` Restored <strong>${r.restored}</strong> HP${blight} — current bar was only ${r.restored} short of max.`
          : ` Restored <strong>${r.restored}</strong> HP${blight}.`;
      return `<li><strong>${name}</strong> — rolled <strong>${r.rolled}</strong>.${cap}</li>`;
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
}): string {
  const healer = escapeStoneChat(args.healerName);
  const target = escapeStoneChat(args.targetName);
  const power = escapeStoneChat(args.powerName || 'Heal');
  const formula = args.formula ? escapeStoneChat(args.formula) : '';
  const max = Math.max(0, Math.min(args.maxBars, args.scarred, args.poolRemaining));
  const healHint = formula ? ` → then heal ${formula}` : '';
  const buttons: string[] = [];
  for (let n = 0; n <= max; n += 1) {
    const label =
      n === 0
        ? formula
          ? `0 — skip Scarred, heal ${formula}`
          : '0 — skip Scarred'
        : `${n} Scarred${healHint}`;
    buttons.push(
      `<button type="button" class="mastery-heal-scarred-pick" data-bars="${n}">${label}</button>`,
    );
  }
  const healPreview = formula
    ? `<p class="ms-heal-preview">After your choice, <strong>${formula}</strong> is rolled and applied — you will see the HP healed here.</p>`
    : `<p class="ms-heal-preview">After your choice, Scarred recovery is applied (this Power restores no HP by itself).</p>`;
  return `<div class="mastery-heal-scarred-prompt" data-target-actor-id="${escapeStoneChat(args.targetActorId)}" data-max-bars="${max}">
  <p><strong>${healer}</strong> — <em>${power}</em>: choose Scarred recovery, then heal on click</p>
  <p><strong>${target}</strong> has <strong>${args.scarred}</strong> Scarred Health Bar(s).</p>
  <p>This Power's pool: <strong>${args.poolRemaining}</strong> / ${args.poolMax} Health Level(s) left this Safe Haven Rest.</p>
  ${healPreview}
  <div class="mastery-heal-scarred-actions">${buttons.join('')}</div>
</div>`;
}

async function applyHpHealToActor(actor: any, rolled: number): Promise<{ restored: number; afterBlight: number; blight: number }> {
  const owner = getActionEconomyActor(actor) ?? actor;
  const blight = blightHealReduction(owner);
  const afterBlight = Math.max(0, rolled - blight);
  const health = owner?.system?.health;
  if (!health || !Array.isArray(health.bars)) {
    return { restored: 0, afterBlight, blight };
  }
  const applied = applyHealingToCurrentBar(
    { bars: health.bars, currentBar: health.currentBar },
    afterBlight,
  );
  await owner.update?.({
    'system.health.bars': applied.bars,
    'system.health.currentBar': applied.currentBar,
  });
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
}): Promise<HealTargetResult[]> {
  const results: HealTargetResult[] = [];
  for (const tok of args.targetTokens) {
    const actor = tok?.actor;
    if (!actor) continue;
    let rolled = 0;
    let afterBlight = 0;
    let restored = 0;
    let blight = 0;
    if (args.formula) {
      const roll = await rollFormula(args.formula);
      rolled = roll.total;
      const applied = await applyHpHealToActor(actor, rolled);
      afterBlight = applied.afterBlight;
      restored = applied.restored;
      blight = applied.blight;
    }
    const scarredBefore = countScarredHealthBars(getActionEconomyActor(actor) ?? actor);
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

  const g = globalThis as any;
  const caster = args.casterToken?.actor;
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
 * If HLR remains and a target is Scarred, prompts first — HP heal waits for the click.
 */
export async function resolveHealOnTokens(args: {
  casterToken: any;
  powerItem: any;
  powerName: string;
  targetTokens: any[];
}): Promise<HealTargetResult[]> {
  const caster = args.casterToken?.actor;
  const formula = getHealDiceFormula(args.powerItem);
  const poolMax = healHealthLevelRecoveryForRank(powerItemRank(args.powerItem));
  const poolRemaining = getHlrRemainingOnCaster(caster, args.powerItem);
  const powerKey = healPowerHlrKey(args.powerItem);

  // One Scarred recipient per use (AoE rule).
  let scarredTok: any = null;
  let scarredCount = 0;
  for (const tok of args.targetTokens) {
    const actor = tok?.actor;
    if (!actor) continue;
    const n = countScarredHealthBars(getActionEconomyActor(actor) ?? actor);
    if (n > 0) {
      scarredTok = tok;
      scarredCount = n;
      break;
    }
  }

  const canOfferHlr = poolMax > 0 && poolRemaining > 0 && scarredTok && scarredCount > 0;
  if (canOfferHlr) {
    const maxBars = Math.min(poolRemaining, scarredCount, poolMax);
    const g = globalThis as any;
    const pending: PendingHealPayload = {
      casterTokenId: String(args.casterToken?.id || args.casterToken?.document?.id || ''),
      powerName: args.powerName,
      powerKey,
      formula,
      cleanseRank: 0,
      powerItemSnapshot: snapshotHealPowerItem(args.powerItem),
      targetTokenIds: args.targetTokens.map((t) => String(t.id || '')).filter(Boolean),
      scarredTargetActorId: String(scarredTok.actor?.id || ''),
      scarredTargetTokenId: String(scarredTok.id || ''),
    };
    try {
      const { getCleanseRankFromPower } = await import('./cleanse-resolution.js');
      pending.cleanseRank = getCleanseRankFromPower(args.powerItem);
    } catch {
      pending.cleanseRank = 0;
    }
    try {
      await g.ChatMessage?.create?.({
        speaker: g.ChatMessage?.getSpeaker?.({ actor: caster, token: args.casterToken?.document }),
        content: formatScarredPromptChat({
          healerName: String(caster?.name || 'Healer'),
          targetName: String(scarredTok.actor?.name || scarredTok.name || 'Target'),
          targetActorId: pending.scarredTargetActorId,
          maxBars,
          scarred: scarredCount,
          poolRemaining,
          poolMax,
          powerName: args.powerName,
          formula,
        }),
        flags: {
          'mastery-system': {
            [HEAL_CHAT_FLAG]: {
              kind: 'scarred-prompt',
              targetActorId: pending.scarredTargetActorId,
              casterActorId: String(caster?.id || ''),
              maxBars,
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
        formula
          ? `Scarred wählen — Klick würfelt ${formula} und zeigt den Heal.`
          : 'Scarred wählen — Klick wendet die Recovery an.',
      );
    } catch (err) {
      console.warn('Mastery System | scarred heal prompt failed', err);
      // Fall through to immediate heal if chat fails.
      return applyHpHealPass({ ...args, formula });
    }
    return [];
  }

  return applyHpHealPass({ ...args, formula });
}

async function resolveScarredChoice(message: any, bars: number): Promise<void> {
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

  const owner = getActionEconomyActor(target) ?? target;
  let restored = 0;
  if (want > 0) {
    restored = await recoverScarredBars(owner, want);
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

  const poolLeft = Math.max(
    0,
    Math.floor(Number(flags.poolRemaining) || 0) - restored,
  );
  const note =
    want <= 0
      ? `<p><em>No Scarred Health Bar recovered — rolling HP heal now…</em></p>`
      : `<p><strong>${escapeStoneChat(owner.name)}</strong> — recovered <strong>${restored}</strong> Scarred Health Bar(s). Pool left: <strong>${poolLeft}</strong>. Rolling HP heal…</p>`;
  try {
    await message.update?.({
      content: `${message.content}<div class="mastery-heal-scarred-resolved">${note}</div>`,
    });
  } catch {
    /* ignore */
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
      await resolveScarredChoice(message, Number(btn.dataset.bars || '0'));
    });
  });
  yes?.addEventListener('click', async (ev) => {
    ev.preventDefault();
    disable();
    await resolveScarredChoice(message, Number(yes.dataset.bars || '1'));
  });
  no?.addEventListener('click', async (ev) => {
    ev.preventDefault();
    disable();
    await resolveScarredChoice(message, 0);
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
    } catch (err) {
      console.warn('Mastery System | heal scarred chat bind failed', err);
    }
  });
}
