/**
 * Combat Cleanse Actives — ally targeting, no attack roll / Reactions.
 * Posts a chat card so the healer distributes Cleanse(X) across eligible Specials.
 */
import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { specialDisplayName } from './special-application.js';
import { cleansableSpecials, distributeCleanseAcrossList, formatCleanseDistribution, } from '../system/pool-reduction.js';
import { readActorStatusEffects } from '../system/active-specials.js';
import { writeActorStatusList } from '../system/assign-status.js';
import { getActionEconomyActor } from './action-economy.js';
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
export function listCleansableForActor(actor) {
    const owner = getActionEconomyActor(actor) ?? actor;
    return cleansableSpecials(owner).map((s) => ({
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
        <span class="ms-cleanse-label">${escapeStoneChat(s.label)}(${s.value})</span>
        <button type="button" class="ms-cleanse-minus" data-special-id="${escapeStoneChat(s.id)}">−</button>
        <span class="ms-cleanse-alloc" data-special-id="${escapeStoneChat(s.id)}">0</span>
        <button type="button" class="ms-cleanse-plus" data-special-id="${escapeStoneChat(s.id)}">+</button>
      </li>`)
        .join('');
    return `<div class="mastery-cleanse-prompt" data-target-actor-id="${escapeStoneChat(args.targetActorId)}" data-cleanse-x="${x}">
  <p><strong>${caster}</strong> — ${power}</p>
  <p>Target: <strong>${target}</strong> — distribute <strong>Cleanse(${x})</strong> (unused points are lost).</p>
  <p>Remaining: <strong class="ms-cleanse-remaining">${x}</strong></p>
  <ul class="ms-cleanse-list">${rows}</ul>
  <div class="mastery-cleanse-actions">
    <button type="button" class="ms-cleanse-apply">Apply</button>
    <button type="button" class="ms-cleanse-cancel">Cancel</button>
  </div>
</div>`;
}
export async function postCleansePromptForTarget(args) {
    const caster = args.casterToken?.actor;
    const target = args.targetToken?.actor;
    if (!target)
        return;
    const cleanseX = getCleanseRankFromPower(args.powerItem);
    const specials = listCleansableForActor(target);
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
    root.querySelectorAll('.ms-cleanse-plus').forEach((btn) => {
        btn.disabled = rem <= 0;
    });
}
async function applyAllocations(message, allocations) {
    const flags = message?.getFlag?.('mastery-system', CLEANSE_CHAT_FLAG) ??
        message?.flags?.['mastery-system']?.[CLEANSE_CHAT_FLAG];
    if (!flags || flags.resolved)
        return;
    const g = globalThis;
    const actorId = String(flags.targetActorId || '');
    const tokenId = String(flags.targetTokenId || '');
    let target = (tokenId && g.canvas?.tokens?.get?.(tokenId)?.actor) ||
        g.game?.actors?.get?.(actorId) ||
        null;
    if (!target && tokenId) {
        try {
            const tok = g.canvas?.tokens?.placeables?.find?.((t) => String(t.id) === tokenId || String(t.document?.id) === tokenId);
            if (tok?.actor)
                target = tok.actor;
        }
        catch {
            /* ignore */
        }
    }
    if (!target) {
        g.ui?.notifications?.warn?.('Cleanse target not found.');
        return;
    }
    const owner = getActionEconomyActor(target) ?? target;
    const cleanseX = Math.max(0, Math.floor(Number(flags.cleanseX) || 0));
    const list = readActorStatusEffects(owner);
    const result = distributeCleanseAcrossList(list, cleanseX, allocations);
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
        : 'no eligible Special reduced';
    const leftover = result.leftover > 0 ? ` (${result.leftover} unused, lost)` : '';
    const note = `<div class="mastery-cleanse-resolved"><p><strong>${escapeStoneChat(owner.name)}</strong> — Cleanse(${cleanseX}) → ${escapeStoneChat(summary)}${leftover}</p></div>`;
    try {
        await message.update?.({ content: `${message.content}${note}` });
    }
    catch {
        /* ignore */
    }
}
function bindCleansePromptHtml(message, root) {
    const wrap = root.querySelector?.('.mastery-cleanse-prompt');
    if (!wrap || wrap.dataset.msBound === '1')
        return;
    const flags = message?.getFlag?.('mastery-system', CLEANSE_CHAT_FLAG) ??
        message?.flags?.['mastery-system']?.[CLEANSE_CHAT_FLAG];
    if (flags?.resolved)
        return;
    wrap.dataset.msBound = '1';
    wrap.querySelectorAll('.ms-cleanse-plus').forEach((btn) => {
        btn.addEventListener('click', (ev) => {
            ev.preventDefault();
            const id = String(btn.dataset.specialId || '');
            const row = wrap.querySelector(`.ms-cleanse-row[data-special-id="${id}"]`);
            const allocEl = wrap.querySelector(`.ms-cleanse-alloc[data-special-id="${id}"]`);
            if (!row || !allocEl)
                return;
            const max = Math.max(0, Math.floor(Number(row.dataset.max) || 0));
            const budget = Math.max(0, Math.floor(Number(wrap.dataset.cleanseX) || 0));
            const alloc = readAllocations(wrap);
            const spent = Object.values(alloc).reduce((a, b) => a + b, 0);
            const cur = Math.max(0, Math.floor(Number(allocEl.textContent) || 0));
            if (spent >= budget || cur >= max)
                return;
            allocEl.textContent = String(cur + 1);
            refreshRemaining(wrap);
        });
    });
    wrap.querySelectorAll('.ms-cleanse-minus').forEach((btn) => {
        btn.addEventListener('click', (ev) => {
            ev.preventDefault();
            const id = String(btn.dataset.specialId || '');
            const allocEl = wrap.querySelector(`.ms-cleanse-alloc[data-special-id="${id}"]`);
            if (!allocEl)
                return;
            const cur = Math.max(0, Math.floor(Number(allocEl.textContent) || 0));
            if (cur <= 0)
                return;
            allocEl.textContent = String(cur - 1);
            refreshRemaining(wrap);
        });
    });
    const applyBtn = wrap.querySelector('.ms-cleanse-apply');
    const cancelBtn = wrap.querySelector('.ms-cleanse-cancel');
    const lock = () => {
        wrap.querySelectorAll('button').forEach((b) => {
            b.disabled = true;
        });
    };
    applyBtn?.addEventListener('click', async (ev) => {
        ev.preventDefault();
        lock();
        await applyAllocations(message, readAllocations(wrap));
    });
    cancelBtn?.addEventListener('click', async (ev) => {
        ev.preventDefault();
        lock();
        try {
            await message.setFlag?.('mastery-system', CLEANSE_CHAT_FLAG, { ...flags, resolved: true, cancelled: true });
            await message.update?.({
                content: `${message.content}<div class="mastery-cleanse-resolved"><p><em>Cleanse cancelled — no Specials removed.</em></p></div>`,
            });
        }
        catch {
            /* ignore */
        }
    });
    refreshRemaining(wrap);
}
export function registerCleanseChatHandlers() {
    const g = globalThis;
    const Hooks = g.Hooks;
    if (!Hooks?.on)
        return;
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