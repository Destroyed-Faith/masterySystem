/**
 * Combat Cleanse Actives — ally targeting, no attack roll / Reactions.
 * Posts a heal-style chat card so the caster distributes Cleanse(X) with +/−
 * across eligible Specials on the target (token actor for unlinked tokens).
 */
import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { specialDisplayName } from './special-application.js';
import { cleansableSpecials, distributeCleanseAcrossList, formatCleanseDistribution, } from '../system/pool-reduction.js';
import { readActorStatusEffects } from '../system/active-specials.js';
import { writeActorStatusList } from '../system/assign-status.js';
import { escapeStoneChat } from '../stones/stone-resolution.js';
import { powerItemRank } from './heal-resolution.js';
import { artifactLevelToTemplateRank } from '../utils/artifact-spell-pick.js';
import { getTemplate } from '../utils/powers/templates/index.js';
export const CLEANSE_CHAT_FLAG = 'cleanseResolution';
export function isCleanseTemplateId(templateId) {
    const tid = String(templateId || '');
    if (!tid)
        return false;
    return /\bcleanse\b/i.test(tid);
}
export function isCleansePowerItem(item) {
    if (!item || item.type !== 'power')
        return false;
    const sys = item.system ?? {};
    const tid = String(sys.templateId || '');
    const sub = String(sys.subfamily || '');
    if (/support-cleanse/i.test(sub))
        return true;
    if (/\bcleanse\b/i.test(tid) && !/heal-cleanse/i.test(tid))
        return true;
    if (/heal-cleanse-mixed/i.test(tid))
        return true;
    const rank = getCleanseRankFromPower(item);
    return rank > 0;
}
export function isCleanseRadialOption(option) {
    if (!option || option.source !== 'power')
        return false;
    if (option.aoePlacementProfile === 'heal')
        return false;
    if (option.aoePlacementProfile === 'cleanse')
        return true;
    const tid = String(option.artifactPowerTemplateId || '');
    // Pure cleanse only — heal+cleanse mixed stays on the heal path.
    if (tid && /\bcleanse\b/i.test(tid) && !/\bheal\b/i.test(tid))
        return true;
    if (option.item?.type === 'artifact') {
        const blob = `${option.name || ''} ${option.description || ''}`;
        return /\bcleanse\b/i.test(blob) && !/\bheal\b/i.test(blob);
    }
    if (!option.item || option.item.type !== 'power')
        return false;
    const ptid = String(option.item.system?.templateId || '');
    if (/heal-cleanse/i.test(ptid))
        return false;
    return isCleansePowerItem(option.item);
}
/** Synthetic power item so Cleanse(X) can be read from an artifact row. */
export function cleansePowerItemFromRadialOption(option) {
    if (!option)
        return null;
    if (option.item?.type === 'power' && isCleansePowerItem(option.item))
        return option.item;
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
export function getCleanseRankFromPower(item) {
    if (!item)
        return 0;
    const sys = item.system ?? {};
    const rank = powerItemRank(item);
    const levels = sys.levels ?? {};
    const row = (typeof levels === 'object' && !Array.isArray(levels) ? levels[String(rank)] : null) ??
        (Array.isArray(levels) ? levels.find((r) => Number(r?.level) === rank) : null) ??
        null;
    const specials = Array.isArray(row?.specials)
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
        const fromMech = Number(mech?.cleanse ?? mech?.cleanseRank);
        if (Number.isFinite(fromMech) && fromMech > 0)
            return Math.floor(fromMech);
    }
    catch {
        /* ignore */
    }
    const text = String(row?.effect?.text ?? row?.effectText ?? sys.effect ?? '');
    const m = /Cleanse\s*\((\d+)\)/i.exec(text);
    if (m)
        return Math.max(0, parseInt(m[1], 10));
    return 0;
}
/**
 * Battle actor for Cleanse reads/writes. Do NOT redirect through
 * getActionEconomyActor — world prototypes often lack the token's Specials.
 */
export function cleanseTargetActor(actor) {
    return actor ?? null;
}
export function listCleansableForActor(actor, tokenHint) {
    const owner = cleanseTargetActor(actor);
    return cleansableSpecials(owner, tokenHint ?? owner).map((s) => ({
        id: s.id,
        label: specialDisplayName(s.id),
        value: s.value,
    }));
}
export function formatCleansePromptChat(args) {
    const caster = escapeStoneChat(args.casterName);
    const power = escapeStoneChat(args.powerName);
    const target = escapeStoneChat(args.targetName);
    const x = Math.max(0, args.cleanseX);
    if (!args.specials.length) {
        return `<div class="mastery-cleanse-resolution"><p><strong>${caster}</strong> — ${power}</p>
      <p>Target: <strong>${target}</strong> — Cleanse(${x}), but no eligible Specials.</p></div>`;
    }
    const rows = args.specials
        .map((s) => `<li class="ms-cleanse-row" data-special-id="${escapeStoneChat(s.id)}" data-max="${s.value}">
        <span class="ms-cleanse-label">${escapeStoneChat(s.label)} <span class="ms-cleanse-stack">(${s.value})</span></span>
        <div class="ms-cleanse-stepper">
          <button type="button" class="ms-cleanse-minus mastery-heal-scarred-pick" data-special-id="${escapeStoneChat(s.id)}" title="−1" aria-label="Reduce ${escapeStoneChat(s.label)}">−</button>
          <span class="ms-cleanse-alloc" data-special-id="${escapeStoneChat(s.id)}">0</span>
          <button type="button" class="ms-cleanse-plus mastery-heal-scarred-pick" data-special-id="${escapeStoneChat(s.id)}" title="+1" aria-label="Cleanse ${escapeStoneChat(s.label)} +1">+</button>
        </div>
      </li>`)
        .join('');
    return `<div class="mastery-cleanse-prompt mastery-heal-scarred-prompt" data-target-actor-id="${escapeStoneChat(args.targetActorId)}" data-cleanse-x="${x}">
  <p><strong>${caster}</strong> — ${power}</p>
  <p><strong>${target}</strong> — distribute <strong>Cleanse(${x})</strong> (unused points are lost).</p>
  <p class="ms-heal-preview"><strong>Use +/−</strong> on each Special, then <strong>Apply</strong>. Remaining budget: <strong class="ms-cleanse-remaining">${x}</strong>/${x}</p>
  <ul class="ms-cleanse-list">${rows}</ul>
  <div class="mastery-cleanse-actions mastery-heal-scarred-actions">
    <button type="button" class="ms-cleanse-apply mastery-heal-scarred-pick">Apply Cleanse</button>
    <button type="button" class="ms-cleanse-cancel mastery-heal-scarred-pick">Cancel</button>
  </div>
</div>`;
}
function resolveTargetFromFlags(flags) {
    const g = globalThis;
    const actorId = String(flags?.targetActorId || '');
    const tokenId = String(flags?.targetTokenId || '');
    let token = null;
    if (tokenId) {
        token =
            g.canvas?.tokens?.get?.(tokenId) ||
                g.canvas?.tokens?.placeables?.find?.((t) => String(t.id) === tokenId || String(t.document?.id) === tokenId) ||
                null;
    }
    const actor = cleanseTargetActor(token?.actor) ||
        g.game?.actors?.get?.(actorId) ||
        null;
    return { actor, token };
}
export async function postCleansePromptForTarget(args) {
    const caster = args.casterToken?.actor;
    const target = cleanseTargetActor(args.targetToken?.actor);
    if (!target)
        return;
    const cleanseX = getCleanseRankFromPower(args.powerItem);
    const specials = listCleansableForActor(target, args.targetToken);
    const g = globalThis;
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
                    kind: specials.length && cleanseX > 0 ? 'prompt' : 'empty',
                    targetActorId: String(target.id || ''),
                    targetTokenId: String(args.targetToken?.id || ''),
                    cleanseX,
                    resolved: specials.length === 0 || cleanseX <= 0,
                },
            },
        },
    });
}
/**
 * Resolve Cleanse on chosen tokens (ally targeting already done).
 * One interactive chat card per target.
 */
export async function resolveCleanseOnTokens(args) {
    for (const tok of args.targetTokens) {
        await postCleansePromptForTarget({
            casterToken: args.casterToken,
            powerItem: args.powerItem,
            powerName: args.powerName,
            targetToken: tok,
        });
    }
}
function readAllocations(root) {
    const out = {};
    root.querySelectorAll('.ms-cleanse-alloc').forEach((el) => {
        const id = String(el.dataset.specialId || '');
        const n = Math.max(0, Math.floor(Number(el.textContent) || 0));
        if (id && n > 0)
            out[id] = n;
    });
    return out;
}
function refreshRemaining(root) {
    const budget = Math.max(0, Math.floor(Number(root.dataset.cleanseX) || 0));
    const alloc = readAllocations(root);
    const spent = Object.values(alloc).reduce((a, b) => a + b, 0);
    const rem = Math.max(0, budget - spent);
    const remEl = root.querySelector('.ms-cleanse-remaining');
    if (remEl)
        remEl.textContent = String(rem);
    root.querySelectorAll('.ms-cleanse-row').forEach((rowEl) => {
        const row = rowEl;
        const id = String(row.dataset.specialId || '');
        const max = Math.max(0, Math.floor(Number(row.dataset.max) || 0));
        const cur = Math.max(0, Math.floor(Number(alloc[id] || 0)));
        const plus = row.querySelector('.ms-cleanse-plus');
        const minus = row.querySelector('.ms-cleanse-minus');
        if (plus)
            plus.disabled = rem <= 0 || cur >= max;
        if (minus)
            minus.disabled = cur <= 0;
    });
    const applyBtn = root.querySelector('.ms-cleanse-apply');
    if (applyBtn && !root.dataset.msLocked) {
        applyBtn.disabled = spent <= 0;
        applyBtn.title = spent <= 0 ? 'Allocate at least 1 with + first' : 'Apply Cleanse';
    }
}
async function applyAllocations(message, allocations) {
    const flags = message?.getFlag?.('mastery-system', CLEANSE_CHAT_FLAG) ??
        message?.flags?.['mastery-system']?.[CLEANSE_CHAT_FLAG];
    if (!flags || flags.resolved)
        return;
    const g = globalThis;
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
    try {
        await message.setFlag?.('mastery-system', CLEANSE_CHAT_FLAG, { ...flags, resolved: true });
    }
    catch {
        /* ignore */
    }
    const summary = result.applied
        ? formatCleanseDistribution(result)
        : 'nothing allocated — no Specials removed';
    const leftover = result.leftover > 0 ? ` (${result.leftover} unused, lost)` : '';
    const note = `<div class="mastery-cleanse-resolved"><p><strong>${escapeStoneChat(owner.name)}</strong> — Cleanse(${cleanseX}) → ${escapeStoneChat(summary)}${leftover}</p></div>`;
    try {
        await message.update?.({ content: `${message.content}${note}` });
    }
    catch {
        /* ignore */
    }
}
function findCleansePromptRoot(el) {
    return el?.closest?.('.mastery-cleanse-prompt') ?? null;
}
function findChatMessageFromEl(el) {
    const g = globalThis;
    const msgEl = el?.closest?.('.chat-message, .message');
    const id = msgEl?.dataset?.messageId || msgEl?.getAttribute?.('data-message-id');
    if (!id)
        return null;
    return g.game?.messages?.get?.(id) ?? null;
}
function adjustAllocation(wrap, specialId, delta) {
    const id = String(specialId || '');
    if (!id || !delta)
        return;
    const row = wrap.querySelector(`.ms-cleanse-row[data-special-id="${id}"]`);
    const allocEl = wrap.querySelector(`.ms-cleanse-alloc[data-special-id="${id}"]`);
    if (!row || !allocEl)
        return;
    const max = Math.max(0, Math.floor(Number(row.dataset.max) || 0));
    const budget = Math.max(0, Math.floor(Number(wrap.dataset.cleanseX) || 0));
    const alloc = readAllocations(wrap);
    const spent = Object.values(alloc).reduce((a, b) => a + b, 0);
    const cur = Math.max(0, Math.floor(Number(allocEl.textContent) || 0));
    if (delta > 0) {
        if (spent >= budget || cur >= max)
            return;
        allocEl.textContent = String(cur + 1);
    }
    else if (delta < 0) {
        if (cur <= 0)
            return;
        allocEl.textContent = String(cur - 1);
    }
    refreshRemaining(wrap);
}
function bindCleansePromptHtml(message, root) {
    const wrap = root.querySelector?.('.mastery-cleanse-prompt');
    if (!wrap)
        return;
    const flags = message?.getFlag?.('mastery-system', CLEANSE_CHAT_FLAG) ??
        message?.flags?.['mastery-system']?.[CLEANSE_CHAT_FLAG];
    if (flags?.resolved) {
        wrap.querySelectorAll('button').forEach((b) => {
            b.disabled = true;
        });
        return;
    }
    refreshRemaining(wrap);
}
let cleanseChatDelegationBound = false;
function bindCleanseChatDelegation() {
    if (cleanseChatDelegationBound)
        return;
    const g = globalThis;
    const doc = g.document;
    if (!doc?.addEventListener)
        return;
    cleanseChatDelegationBound = true;
    doc.addEventListener('click', async (ev) => {
        const target = ev.target;
        if (!target?.closest)
            return;
        const plus = target.closest('.ms-cleanse-plus');
        const minus = target.closest('.ms-cleanse-minus');
        const applyBtn = target.closest('.ms-cleanse-apply');
        const cancelBtn = target.closest('.ms-cleanse-cancel');
        if (!plus && !minus && !applyBtn && !cancelBtn)
            return;
        const wrap = findCleansePromptRoot(target);
        if (!wrap)
            return;
        const message = findChatMessageFromEl(wrap);
        const flags = message?.getFlag?.('mastery-system', CLEANSE_CHAT_FLAG) ??
            message?.flags?.['mastery-system']?.[CLEANSE_CHAT_FLAG];
        if (flags?.resolved)
            return;
        ev.preventDefault();
        ev.stopPropagation();
        if (plus) {
            adjustAllocation(wrap, String(plus.dataset.specialId || ''), 1);
            return;
        }
        if (minus) {
            adjustAllocation(wrap, String(minus.dataset.specialId || ''), -1);
            return;
        }
        if (applyBtn) {
            if (applyBtn.disabled)
                return;
            const spent = Object.values(readAllocations(wrap)).reduce((a, b) => a + b, 0);
            if (spent <= 0)
                return;
            wrap.dataset.msLocked = '1';
            wrap.querySelectorAll('button').forEach((b) => {
                b.disabled = true;
            });
            await applyAllocations(message, readAllocations(wrap));
            return;
        }
        if (cancelBtn) {
            wrap.dataset.msLocked = '1';
            wrap.querySelectorAll('button').forEach((b) => {
                b.disabled = true;
            });
            try {
                await message?.setFlag?.('mastery-system', CLEANSE_CHAT_FLAG, {
                    ...flags,
                    resolved: true,
                    cancelled: true,
                });
                await message?.update?.({
                    content: `${message.content}<div class="mastery-cleanse-resolved"><p><em>Cleanse cancelled — no Specials removed.</em></p></div>`,
                });
            }
            catch {
                /* ignore */
            }
        }
    }, true);
}
export function registerCleanseChatHandlers() {
    const g = globalThis;
    const Hooks = g.Hooks;
    if (!Hooks?.on)
        return;
    bindCleanseChatDelegation();
    Hooks.on('renderChatMessageHTML', (message, htmlRaw) => {
        try {
            const root = htmlRaw?.jquery || htmlRaw?.[0]
                ? htmlRaw[0]
                : htmlRaw;
            if (!root?.querySelector)
                return;
            bindCleansePromptHtml(message, root);
        }
        catch (err) {
            console.warn('Mastery System | cleanse chat bind failed', err);
        }
    });
}
//# sourceMappingURL=cleanse-resolution.js.map