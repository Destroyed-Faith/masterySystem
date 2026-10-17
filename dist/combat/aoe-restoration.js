/**
 * R-05 AoE Restoration — distribute a shared Safe Haven pool across allies.
 */
import { escapeStoneChat } from '../stones/stone-resolution.js';
import { countScarredHealthBars } from '../stones/remove-scar.js';
import { getHlrRemainingOnCaster, getPowerHlrPoolMax, healPowerHlrKey, spendHlrOnCaster, } from './heal-resolution.js';
import { restoreScarredHealthBars } from './r05-restoration.js';
export const AOE_RESTORATION_CHAT_FLAG = 'aoeRestoration';
/** Validate allocations: non-negative, ≤ scarred per target, sum ≤ pool. */
export function validateAoeRestorationAllocation(pending, allocation) {
    const cleaned = {};
    let total = 0;
    const byActor = new Map(pending.targets.map((t) => [t.actorId, t]));
    for (const [actorId, raw] of Object.entries(allocation || {})) {
        const n = Math.max(0, Math.floor(Number(raw) || 0));
        if (n <= 0)
            continue;
        const row = byActor.get(actorId);
        if (!row)
            return { ok: false, total: 0, reason: 'unknown-target', cleaned: {} };
        if (n > row.scarred) {
            return { ok: false, total: 0, reason: 'over-scarred', cleaned: {} };
        }
        cleaned[actorId] = n;
        total += n;
    }
    if (total <= 0)
        return { ok: false, total: 0, reason: 'empty', cleaned: {} };
    if (total > pending.poolRemaining) {
        return { ok: false, total, reason: 'over-pool', cleaned: {} };
    }
    return { ok: true, total, cleaned };
}
export function formatAoeRestorationPromptChat(pending) {
    const power = escapeStoneChat(pending.powerName);
    const rows = pending.targets
        .map((t) => {
        const name = escapeStoneChat(t.name);
        const max = Math.min(t.scarred, pending.poolRemaining);
        const opts = [];
        for (let n = 0; n <= max; n += 1) {
            opts.push(`<option value="${n}"${n === 0 ? ' selected' : ''}>${n}</option>`);
        }
        return (`<li class="ms-aoe-rest-row" data-actor-id="${escapeStoneChat(t.actorId)}">` +
            `<strong>${name}</strong> — Scarred ${t.scarred} ` +
            `<select class="ms-aoe-rest-alloc" data-actor-id="${escapeStoneChat(t.actorId)}">${opts.join('')}</select>` +
            `</li>`);
    })
        .join('');
    return (`<div class="mastery-aoe-restoration">` +
        `<p><strong>${power}</strong> — distribute Scarred Bar Restoration (shared pool).</p>` +
        `<p>Pool remaining: <strong>${pending.poolRemaining}</strong> / ${pending.poolMax}. ` +
        `One point = one full Scarred Bar on one creature.</p>` +
        `<ul class="ms-aoe-rest-list">${rows}</ul>` +
        `<p class="ms-aoe-rest-total">Allocated: <strong class="ms-aoe-rest-sum">0</strong></p>` +
        `<button type="button" class="ms-aoe-rest-commit"><i class="fas fa-check"></i> Apply Restoration</button>` +
        `<button type="button" class="ms-aoe-rest-cancel">Cancel</button>` +
        `</div>`);
}
export async function commitAoeRestorationAllocation(caster, pending, allocation) {
    const check = validateAoeRestorationAllocation(pending, allocation);
    if (!check.ok)
        return { ok: false, spent: 0, results: [], reason: check.reason };
    const g = globalThis;
    const results = [];
    let spent = 0;
    for (const t of pending.targets) {
        const want = check.cleaned[t.actorId] ?? 0;
        if (want <= 0)
            continue;
        let actor = g.game?.actors?.get?.(t.actorId) ||
            null;
        try {
            const tok = (g.canvas?.tokens?.placeables ?? []).find((x) => String(x.id) === t.tokenId || String(x.document?.id) === t.tokenId);
            if (tok?.actor)
                actor = tok.actor;
        }
        catch {
            /* ignore */
        }
        if (!actor)
            continue;
        const { restored } = await restoreScarredHealthBars(actor, want);
        if (restored > 0) {
            spent += restored;
            results.push({ name: String(actor.name || t.name), restored });
        }
    }
    if (spent > 0 && caster) {
        await spendHlrOnCaster(caster, pending.powerKey, spent);
    }
    return { ok: spent > 0, spent, results };
}
export function buildAoeRestorationPending(args) {
    const caster = args.caster;
    const powerItem = args.powerItem;
    if (!caster || !powerItem)
        return null;
    const poolRemaining = getHlrRemainingOnCaster(caster, powerItem);
    const poolMax = getPowerHlrPoolMax(powerItem);
    const targets = [];
    for (const tok of args.targetTokens || []) {
        const actor = tok?.actor;
        if (!actor)
            continue;
        const scarred = countScarredHealthBars(actor);
        if (scarred <= 0)
            continue;
        targets.push({
            tokenId: String(tok.id || tok.document?.id || ''),
            actorId: String(actor.id || ''),
            name: String(actor.name || tok.name || 'Ally'),
            scarred,
        });
    }
    if (!targets.length || poolRemaining <= 0)
        return null;
    return {
        casterActorId: String(caster.id || ''),
        powerKey: healPowerHlrKey(powerItem),
        powerName: args.powerName,
        poolRemaining,
        poolMax,
        targets,
    };
}
//# sourceMappingURL=aoe-restoration.js.map