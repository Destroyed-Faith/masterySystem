/**
 * Combat Cleanse Actives — ally targeting, no attack roll / Reactions.
 * Posts a heal-style chat card so the caster distributes Cleanse(X) with +/−
 * across eligible Specials on the target (token actor for unlinked tokens).
 */

import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { specialDisplayName } from './special-application.js';
import {
  cleansableSpecials,
  distributeCleanseAcrossList,
  formatCleanseDistribution,
} from '../system/pool-reduction.js';
import { readActorStatusEffects } from '../system/active-specials.js';
import { writeActorStatusList } from '../system/assign-status.js';
import { escapeStoneChat } from '../stones/stone-resolution.js';
import { powerItemRank } from './heal-resolution.js';
import { artifactLevelToTemplateRank } from '../utils/artifact-spell-pick.js';
import { getTemplate } from '../utils/powers/templates/index.js';
import type { RadialCombatOption } from '../radial-menu/types.js';

export const CLEANSE_CHAT_FLAG = 'cleanseResolution';

/** Cast ids already refunded / committed (Cancel must not double-refund AoE cards). */
const refundedCleanseCastIds = new Set<string>();
const committedCleanseCastIds = new Set<string>();

function newCleanseCastId(): string {
  const g = globalThis as any;
  return String(g.foundry?.utils?.randomID?.() || `cleanse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
}

export function isCleanseTemplateId(templateId: string | null | undefined): boolean {
  const tid = String(templateId || '');
  if (!tid) return false;
  return /\bcleanse\b/i.test(tid);
}

export function isCleansePowerItem(item: any): boolean {
  if (!item || item.type !== 'power') return false;
  const sys = item.system ?? {};
  const tid = String(sys.templateId || '');
  const sub = String(sys.subfamily || '');
  if (/support-cleanse/i.test(sub)) return true;
  if (/\bcleanse\b/i.test(tid) && !/heal-cleanse/i.test(tid)) return true;
  if (/heal-cleanse-mixed/i.test(tid)) return true;
  const rank = getCleanseRankFromPower(item);
  return rank > 0;
}

export function isCleanseRadialOption(
  option: {
    item?: any;
    source?: string;
    aoePlacementProfile?: string;
    artifactPowerTemplateId?: string;
    name?: string;
    description?: string;
  } | null | undefined,
): boolean {
  if (!option || option.source !== 'power') return false;
  if (option.aoePlacementProfile === 'heal') return false;
  if (option.aoePlacementProfile === 'cleanse') return true;
  const tid = String(option.artifactPowerTemplateId || '');
  // Pure cleanse only — heal+cleanse mixed stays on the heal path.
  if (tid && /\bcleanse\b/i.test(tid) && !/\bheal\b/i.test(tid)) return true;
  if (option.item?.type === 'artifact') {
    const blob = `${option.name || ''} ${option.description || ''}`;
    return /\bcleanse\b/i.test(blob) && !/\bheal\b/i.test(blob);
  }
  if (!option.item || option.item.type !== 'power') return false;
  const ptid = String(option.item.system?.templateId || '');
  if (/heal-cleanse/i.test(ptid)) return false;
  return isCleansePowerItem(option.item);
}

/** Synthetic power item so Cleanse(X) can be read from an artifact row. */
export function cleansePowerItemFromRadialOption(
  option: RadialCombatOption | null | undefined,
): any | null {
  if (!option) return null;
  if (option.item?.type === 'power' && isCleansePowerItem(option.item)) return option.item;
  const tid = String(option.artifactPowerTemplateId || '');
  if (tid && isCleanseTemplateId(tid) && !/heal-cleanse/i.test(tid)) {
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
        subfamily: 'support-cleanse',
        rank,
        level: rank,
        levels: tpl?.levels ?? {},
      },
    };
  }
  return option.item?.type === 'power' ? option.item : null;
}

/** Cleanse(X) value from the power's level specials (or 0). */
export function getCleanseRankFromPower(item: any): number {
  if (!item) return 0;
  const sys = item.system ?? {};
  const rank = powerItemRank(item);
  const levels = sys.levels ?? {};
  const row =
    (typeof levels === 'object' && !Array.isArray(levels) ? levels[String(rank)] : null) ??
    (Array.isArray(levels) ? levels.find((r: any) => Number(r?.level) === rank) : null) ??
    null;
  const specials: any[] = Array.isArray(row?.specials)
    ? row.specials
    : Array.isArray(sys.specials)
      ? sys.specials
      : [];
  for (const s of specials) {
    const key = String(s?.key ?? s?.id ?? s?.name ?? '').toLowerCase();
    if (key === 'cleanse' || key === 'cleanse(x)') {
      return Math.max(0, Math.floor(Number(s?.rank ?? s?.value ?? 0) || 0));
    }
  }
  // Catalog fallback via resolve — some rows only print effect text.
  try {
    const mech = resolvePowerMechanics(item);
    const fromMech = Number((mech as any)?.cleanse ?? (mech as any)?.cleanseRank);
    if (Number.isFinite(fromMech) && fromMech > 0) return Math.floor(fromMech);
  } catch {
    /* ignore */
  }
  const text = String(row?.effect?.text ?? row?.effectText ?? sys.effect ?? '');
  const m = /Cleanse\s*\((\d+)\)/i.exec(text);
  if (m) return Math.max(0, parseInt(m[1], 10));
  return 0;
}

/**
 * Battle actor for Cleanse reads/writes. Do NOT redirect through
 * getActionEconomyActor — world prototypes often lack the token's Specials.
 */
export function cleanseTargetActor(actor: any): any {
  return actor ?? null;
}

export function listCleansableForActor(
  actor: any,
  tokenHint?: any,
): Array<{ id: string; label: string; value: number }> {
  const owner = cleanseTargetActor(actor);
  return cleansableSpecials(owner, tokenHint ?? owner).map((s) => ({
    id: s.id,
    label: specialDisplayName(s.id),
    value: s.value,
  }));
}

export function formatCleansePromptChat(args: {
  casterName: string;
  powerName: string;
  targetName: string;
  targetActorId: string;
  cleanseX: number;
  specials: Array<{ id: string; label: string; value: number }>;
}): string {
  const caster = escapeStoneChat(args.casterName);
  const power = escapeStoneChat(args.powerName);
  const target = escapeStoneChat(args.targetName);
  const x = Math.max(0, args.cleanseX);
  if (!args.specials.length) {
    return `<div class="mastery-cleanse-resolution"><p><strong>${caster}</strong> — ${power}</p>
      <p>Target: <strong>${target}</strong> — Cleanse(${x}), but no eligible Specials.</p></div>`;
  }
  // One compact row: [−] Name 9 [+] — the number is the remaining stack (starts at max).
  const rows = args.specials
    .map(
      (s) => `<li class="ms-cleanse-row" data-special-id="${escapeStoneChat(s.id)}" data-max="${s.value}">
        <button type="button" class="ms-cleanse-minus" data-special-id="${escapeStoneChat(s.id)}" title="Cleanse −1 from ${escapeStoneChat(s.label)}" aria-label="Cleanse ${escapeStoneChat(s.label)} −1">−</button>
        <span class="ms-cleanse-label">${escapeStoneChat(s.label)}</span>
        <span class="ms-cleanse-stack-value" data-special-id="${escapeStoneChat(s.id)}">${s.value}</span>
        <button type="button" class="ms-cleanse-plus" data-special-id="${escapeStoneChat(s.id)}" title="Undo −1 on ${escapeStoneChat(s.label)}" aria-label="Restore ${escapeStoneChat(s.label)} +1">+</button>
      </li>`,
    )
    .join('');
  return `<div class="mastery-cleanse-prompt" data-target-actor-id="${escapeStoneChat(args.targetActorId)}" data-cleanse-x="${x}">
  <header class="ms-cleanse-head"><strong>${caster}</strong> — ${power}</header>
  <p class="ms-cleanse-target"><strong>${target}</strong> · Cleanse(<strong>${x}</strong>) · budget <strong class="ms-cleanse-remaining">${x}</strong>/${x}</p>
  <p class="ms-cleanse-hint">− lowers the stack · + undoes · Apply commits · Cancel refunds Action + Power</p>
  <ul class="ms-cleanse-list">${rows}</ul>
  <div class="mastery-cleanse-actions">
    <button type="button" class="ms-cleanse-apply">Apply Cleanse</button>
    <button type="button" class="ms-cleanse-cancel">Cancel (refund Action)</button>
  </div>
</div>`;
}

function resolveTargetFromFlags(flags: any): { actor: any; token: any } {
  const g = globalThis as any;
  const actorId = String(flags?.targetActorId || '');
  const tokenId = String(flags?.targetTokenId || '');
  let token: any = null;
  if (tokenId) {
    token =
      g.canvas?.tokens?.get?.(tokenId) ||
      g.canvas?.tokens?.placeables?.find?.(
        (t: any) => String(t.id) === tokenId || String(t.document?.id) === tokenId,
      ) ||
      null;
  }
  const actor =
    cleanseTargetActor(token?.actor) ||
    g.game?.actors?.get?.(actorId) ||
    null;
  return { actor, token };
}

export async function postCleansePromptForTarget(args: {
  casterToken: any;
  powerItem: any;
  powerName: string;
  targetToken: any;
  /** Radial option / item id marked used this round (for Cancel refund). */
  powerUsageId?: string;
  spentAction?: boolean;
  castId?: string;
}): Promise<void> {
  const caster = args.casterToken?.actor;
  const target = cleanseTargetActor(args.targetToken?.actor);
  if (!target) return;
  const cleanseX = getCleanseRankFromPower(args.powerItem);
  const specials = listCleansableForActor(target, args.targetToken);
  if (!specials.length || cleanseX <= 0) {
    // No eligible Specials — do not post an empty allocator (caller should filter).
    return;
  }
  const g = globalThis as any;
  const content = formatCleansePromptChat({
    casterName: String(caster?.name || args.casterToken?.name || 'Caster'),
    powerName: args.powerName,
    targetName: String(target.name || args.targetToken?.name || 'Target'),
    targetActorId: String(target.id || ''),
    cleanseX,
    specials,
  });
  await g.ChatMessage?.create?.({
    speaker: g.ChatMessage?.getSpeaker?.({ actor: caster, token: args.casterToken?.document }),
    content,
    flags: {
      'mastery-system': {
        [CLEANSE_CHAT_FLAG]: {
          kind: 'prompt',
          castId: String(args.castId || newCleanseCastId()),
          targetActorId: String(target.id || ''),
          targetTokenId: String(args.targetToken?.id || ''),
          casterActorId: String(caster?.id || ''),
          casterTokenId: String(args.casterToken?.id || ''),
          powerUsageId: String(args.powerUsageId || args.powerItem?.id || ''),
          spentAction: !!args.spentAction,
          cleanseX,
          resolved: false,
        },
      },
    },
  });
}

/**
 * Resolve Cleanse on chosen tokens (ally targeting already done).
 * One interactive chat card per target that still has cleansable Specials.
 */
export async function resolveCleanseOnTokens(args: {
  casterToken: any;
  powerItem: any;
  powerName: string;
  targetTokens: any[];
  powerUsageId?: string;
  spentAction?: boolean;
}): Promise<void> {
  const castId = newCleanseCastId();
  let posted = 0;
  for (const tok of args.targetTokens) {
    const specials = listCleansableForActor(tok?.actor, tok);
    if (!specials.length) continue;
    await postCleansePromptForTarget({
      casterToken: args.casterToken,
      powerItem: args.powerItem,
      powerName: args.powerName,
      targetToken: tok,
      powerUsageId: args.powerUsageId,
      spentAction: !!args.spentAction,
      castId,
    });
    posted += 1;
  }
  if (!posted) {
    const g = globalThis as any;
    g.ui?.notifications?.warn?.('Cleanse: no target with cleansable Specials.');
    if (args.spentAction || args.powerUsageId) {
      await refundCleanseCast({
        castId,
        casterActorId: String(args.casterToken?.actor?.id || ''),
        casterTokenId: String(args.casterToken?.id || ''),
        powerUsageId: String(args.powerUsageId || args.powerItem?.id || ''),
        spentAction: !!args.spentAction,
      });
    }
  }
}

/** Allocated Cleanse points = original stack − current displayed stack. */
function readAllocations(root: HTMLElement): Record<string, number> {
  const out: Record<string, number> = {};
  root.querySelectorAll('.ms-cleanse-row').forEach((rowEl) => {
    const row = rowEl as HTMLElement;
    const id = String(row.dataset.specialId || '');
    const max = Math.max(0, Math.floor(Number(row.dataset.max) || 0));
    const stackEl = row.querySelector('.ms-cleanse-stack-value') as HTMLElement | null;
    const cur = Math.max(0, Math.floor(Number(stackEl?.textContent) || 0));
    const spent = Math.max(0, max - cur);
    if (id && spent > 0) out[id] = spent;
  });
  return out;
}

function refreshRemaining(root: HTMLElement): void {
  const budget = Math.max(0, Math.floor(Number(root.dataset.cleanseX) || 0));
  const alloc = readAllocations(root);
  const spent = Object.values(alloc).reduce((a, b) => a + b, 0);
  const rem = Math.max(0, budget - spent);
  const remEl = root.querySelector('.ms-cleanse-remaining');
  if (remEl) remEl.textContent = String(rem);
  root.querySelectorAll('.ms-cleanse-row').forEach((rowEl) => {
    const row = rowEl as HTMLElement;
    const max = Math.max(0, Math.floor(Number(row.dataset.max) || 0));
    const stackEl = row.querySelector('.ms-cleanse-stack-value') as HTMLElement | null;
    const cur = Math.max(0, Math.floor(Number(stackEl?.textContent) || 0));
    const plus = row.querySelector('.ms-cleanse-plus') as HTMLButtonElement | null;
    const minus = row.querySelector('.ms-cleanse-minus') as HTMLButtonElement | null;
    // − spends Cleanse (lower stack); + restores stack.
    if (minus) minus.disabled = rem <= 0 || cur <= 0;
    if (plus) plus.disabled = cur >= max;
  });
  const applyBtn = root.querySelector('.ms-cleanse-apply') as HTMLButtonElement | null;
  if (applyBtn && !root.dataset.msLocked) {
    applyBtn.disabled = spent <= 0;
    applyBtn.title = spent <= 0 ? 'Lower a stack with − first' : 'Apply Cleanse';
  }
}

async function refundCleanseCast(flags: {
  castId?: string;
  casterActorId?: string;
  casterTokenId?: string;
  powerUsageId?: string;
  spentAction?: boolean;
}): Promise<boolean> {
  const castId = String(flags.castId || '');
  if (castId) {
    if (committedCleanseCastIds.has(castId)) return false;
    if (refundedCleanseCastIds.has(castId)) return false;
    refundedCleanseCastIds.add(castId);
  }
  const g = globalThis as any;
  const combat = g.game?.combat ?? null;
  const tokenId = String(flags.casterTokenId || '');
  const actorId = String(flags.casterActorId || '');
  let actor =
    (tokenId && g.canvas?.tokens?.get?.(tokenId)?.actor) ||
    g.game?.actors?.get?.(actorId) ||
    null;
  if (!actor && tokenId) {
    const tok = g.canvas?.tokens?.placeables?.find?.(
      (t: any) => String(t.id) === tokenId || String(t.document?.id) === tokenId,
    );
    if (tok?.actor) actor = tok.actor;
  }
  if (!actor) return false;
  try {
    const { refundAttackAction, unmarkPowerUsedThisRound } = await import('./action-economy.js');
    if (flags.spentAction) await refundAttackAction(actor, combat);
    if (flags.powerUsageId) await unmarkPowerUsedThisRound(actor, combat, String(flags.powerUsageId));
    g.ui?.notifications?.info?.('Cleanse cancelled — Action and Power use restored.');
    return true;
  } catch (err) {
    console.warn('Mastery System | Cleanse cancel refund failed', err);
    return false;
  }
}

async function applyAllocations(message: any, allocations: Record<string, number>): Promise<void> {
  const flags =
    message?.getFlag?.('mastery-system', CLEANSE_CHAT_FLAG) ??
    message?.flags?.['mastery-system']?.[CLEANSE_CHAT_FLAG];
  if (!flags || flags.resolved) return;
  const g = globalThis as any;
  const { actor: target, token } = resolveTargetFromFlags(flags);
  if (!target) {
    g.ui?.notifications?.warn?.('Cleanse target not found.');
    return;
  }
  const owner = cleanseTargetActor(target);
  const cleanseX = Math.max(0, Math.floor(Number(flags.cleanseX) || 0));
  const list = readActorStatusEffects(owner, token);
  // Always pass an object (even `{}`) so empty player choice never greedy-autos.
  const result = distributeCleanseAcrossList(list, cleanseX, allocations ?? {});
  if (result.applied) {
    await writeActorStatusList(owner, result.statusEffects);
  }
  const castId = String(flags.castId || '');
  if (castId) committedCleanseCastIds.add(castId);
  try {
    await message.setFlag?.('mastery-system', CLEANSE_CHAT_FLAG, { ...flags, resolved: true });
  } catch {
    /* ignore */
  }
  const summary = result.applied
    ? formatCleanseDistribution(result)
    : 'nothing allocated — no Specials removed';
  const leftover = result.leftover > 0 ? ` (${result.leftover} unused, lost)` : '';
  const note = `<div class="mastery-cleanse-resolved"><p><strong>${escapeStoneChat(owner.name)}</strong> — Cleanse(${cleanseX}) → ${escapeStoneChat(summary)}${leftover}</p></div>`;
  try {
    await message.update?.({ content: `${message.content}${note}` });
  } catch {
    /* ignore */
  }
}

function findCleansePromptRoot(el: HTMLElement | null): HTMLElement | null {
  return (el?.closest?.('.mastery-cleanse-prompt') as HTMLElement | null) ?? null;
}

function findChatMessageFromEl(el: HTMLElement | null): any | null {
  const g = globalThis as any;
  const msgEl = el?.closest?.('.chat-message, .message') as HTMLElement | null;
  const id = msgEl?.dataset?.messageId || msgEl?.getAttribute?.('data-message-id');
  if (!id) return null;
  return g.game?.messages?.get?.(id) ?? null;
}

/** Adjust remaining stack display. Negative delta spends Cleanse; positive undoes. */
function adjustStack(wrap: HTMLElement, specialId: string, deltaStack: number): void {
  const id = String(specialId || '');
  if (!id || !deltaStack) return;
  const row = wrap.querySelector(`.ms-cleanse-row[data-special-id="${id}"]`) as HTMLElement | null;
  const stackEl = wrap.querySelector(
    `.ms-cleanse-stack-value[data-special-id="${id}"]`,
  ) as HTMLElement | null;
  if (!row || !stackEl) return;
  const max = Math.max(0, Math.floor(Number(row.dataset.max) || 0));
  const budget = Math.max(0, Math.floor(Number(wrap.dataset.cleanseX) || 0));
  const alloc = readAllocations(wrap);
  const spent = Object.values(alloc).reduce((a, b) => a + b, 0);
  const cur = Math.max(0, Math.floor(Number(stackEl.textContent) || 0));
  if (deltaStack < 0) {
    // Spend Cleanse: lower the displayed stack.
    if (spent >= budget || cur <= 0) return;
    stackEl.textContent = String(cur - 1);
  } else if (deltaStack > 0) {
    // Undo: restore stack toward original max.
    if (cur >= max) return;
    stackEl.textContent = String(cur + 1);
  }
  refreshRemaining(wrap);
}

function bindCleansePromptHtml(message: any, root: HTMLElement): void {
  const wrap = root.querySelector?.('.mastery-cleanse-prompt') as HTMLElement | null;
  if (!wrap) return;
  const flags =
    message?.getFlag?.('mastery-system', CLEANSE_CHAT_FLAG) ??
    message?.flags?.['mastery-system']?.[CLEANSE_CHAT_FLAG];
  if (flags?.resolved) {
    wrap.querySelectorAll('button').forEach((b) => {
      (b as HTMLButtonElement).disabled = true;
    });
    return;
  }
  refreshRemaining(wrap);
}

let cleanseChatDelegationBound = false;

function bindCleanseChatDelegation(): void {
  if (cleanseChatDelegationBound) return;
  const g = globalThis as any;
  const doc = g.document;
  if (!doc?.addEventListener) return;
  cleanseChatDelegationBound = true;

  doc.addEventListener(
    'click',
    async (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target?.closest) return;
      const plus = target.closest('.ms-cleanse-plus') as HTMLElement | null;
      const minus = target.closest('.ms-cleanse-minus') as HTMLElement | null;
      const applyBtn = target.closest('.ms-cleanse-apply') as HTMLElement | null;
      const cancelBtn = target.closest('.ms-cleanse-cancel') as HTMLElement | null;
      if (!plus && !minus && !applyBtn && !cancelBtn) return;

      const wrap = findCleansePromptRoot(target);
      if (!wrap) return;
      const message = findChatMessageFromEl(wrap);
      const flags =
        message?.getFlag?.('mastery-system', CLEANSE_CHAT_FLAG) ??
        message?.flags?.['mastery-system']?.[CLEANSE_CHAT_FLAG];
      if (flags?.resolved) return;

      ev.preventDefault();
      ev.stopPropagation();

      if (minus) {
        // − lowers the stack (spends Cleanse).
        adjustStack(wrap, String(minus.dataset.specialId || ''), -1);
        return;
      }
      if (plus) {
        // + restores the stack (undo spend).
        adjustStack(wrap, String(plus.dataset.specialId || ''), 1);
        return;
      }
      if (applyBtn) {
        if ((applyBtn as HTMLButtonElement).disabled) return;
        const spent = Object.values(readAllocations(wrap)).reduce((a, b) => a + b, 0);
        if (spent <= 0) return;
        wrap.dataset.msLocked = '1';
        wrap.querySelectorAll('button').forEach((b) => {
          (b as HTMLButtonElement).disabled = true;
        });
        await applyAllocations(message, readAllocations(wrap));
        return;
      }
      if (cancelBtn) {
        wrap.dataset.msLocked = '1';
        wrap.querySelectorAll('button').forEach((b) => {
          (b as HTMLButtonElement).disabled = true;
        });
        try {
          await message?.setFlag?.('mastery-system', CLEANSE_CHAT_FLAG, {
            ...flags,
            resolved: true,
            cancelled: true,
          });
          await message?.update?.({
            content: `${message.content}<div class="mastery-cleanse-resolved"><p><em>Cleanse cancelled — Action and Power use restored.</em></p></div>`,
          });
          if (flags?.spentAction || flags?.powerUsageId) {
            await refundCleanseCast(flags);
          }
        } catch {
          /* ignore */
        }
      }
    },
    true,
  );
}

export function registerCleanseChatHandlers(): void {
  const g = globalThis as any;
  const Hooks = g.Hooks;
  if (!Hooks?.on) return;
  bindCleanseChatDelegation();
  Hooks.on('renderChatMessageHTML', (message: any, htmlRaw: HTMLElement | JQuery) => {
    try {
      const root =
        (htmlRaw as any)?.jquery || (htmlRaw as any)?.[0]
          ? ((htmlRaw as any)[0] as HTMLElement)
          : (htmlRaw as HTMLElement);
      if (!root?.querySelector) return;
      bindCleansePromptHtml(message, root);
    } catch (err) {
      console.warn('Mastery System | cleanse chat bind failed', err);
    }
  });
}
