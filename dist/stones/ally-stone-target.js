/**
 * Pick a player for Influence Stone Powers (Regeneration + Movement).
 */
import { getRoundState, setRoundState } from '../combat/action-economy.js';
import { readActorStatusEffects } from '../system/active-specials.js';
import { setActorCatalogStatus } from '../system/assign-status.js';
export function nextRegenerationValue(current, granted) {
    return Math.max(0, Math.floor(Number(current) || 0), Math.floor(Number(granted) || 0));
}
export function currentRegenerationValue(actor) {
    const row = readActorStatusEffects(actor).find((e) => {
        const id = String(e?.id || '').toLowerCase();
        const name = String(e?.name || '').toLowerCase();
        return id === 'regeneration' || name.includes('regeneration');
    });
    return Math.max(0, Math.floor(Number(row?.value) || 0));
}
export function listSelectablePlayerActors(actors, casterId) {
    const self = String(casterId || '').trim();
    const seen = new Set();
    const out = [];
    for (const raw of actors ?? []) {
        const actor = raw?.actor ?? raw;
        if (!actor || String(actor.type || '') !== 'character')
            continue;
        const id = String(actor.id || '').trim();
        if (!id || seen.has(id))
            continue;
        seen.add(id);
        out.push({
            id,
            name: String(actor.name || 'Player'),
            isSelf: !!self && id === self,
        });
    }
    out.sort((a, b) => Number(a.isSelf) - Number(b.isSelf) || a.name.localeCompare(b.name));
    return out;
}
function worldAndCombatActors() {
    const g = globalThis;
    const out = [];
    const combatants = g.game?.combat?.combatants;
    if (combatants && typeof combatants[Symbol.iterator] === 'function') {
        for (const c of combatants)
            out.push(c);
    }
    const actors = g.game?.actors;
    if (actors && typeof actors[Symbol.iterator] === 'function') {
        for (const a of actors)
            out.push(a);
    }
    return out;
}
export async function promptSelectablePlayerTarget(options) {
    const caster = options.caster;
    const choices = listSelectablePlayerActors(worldAndCombatActors(), String(caster?.id || ''));
    if (!choices.length)
        return null;
    const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
    if (typeof DialogV2?.prompt !== 'function')
        return null;
    try {
        const optionsHtml = choices
            .map((c) => {
            const label = c.isSelf ? `${c.name} (self)` : c.name;
            return `<option value="${c.id}">${label}</option>`;
        })
            .join('');
        const id = await DialogV2.prompt({
            window: { title: options.title },
            content: `<form class="mastery-dialog-form"><p class="md-hint">${options.hint}</p><label class="md-label">Player</label><select name="target" class="md-select">${optionsHtml}</select></form>`,
            ok: {
                label: 'Give',
                callback: (_event, button) => String(button?.form?.elements?.target?.value || ''),
            },
        });
        const picked = String(id || '').trim();
        if (!picked)
            return null;
        if (String(caster?.id || '') === picked)
            return caster;
        const fromCombat = globalThis.game?.combat?.combatants?.find?.((c) => String(c?.actor?.id || c?.actorId || '') === picked)?.actor;
        if (fromCombat)
            return fromCombat;
        return globalThis.game?.actors?.get?.(picked) ?? null;
    }
    catch {
        return null;
    }
}
export async function applyRegenerationAndMove(target, regen, moveMeters) {
    if (!target)
        return;
    const value = nextRegenerationValue(currentRegenerationValue(target), regen);
    if (value > 0) {
        try {
            await setActorCatalogStatus(target, 'regeneration', true, value, { notify: false });
        }
        catch (err) {
            console.warn('Mastery System | Regeneration status apply failed', err);
        }
    }
    const combat = globalThis.game?.combat ?? null;
    const move = Math.max(0, Math.floor(Number(moveMeters) || 0));
    if (move > 0 && combat) {
        try {
            const rs = getRoundState(target, combat);
            if (!rs.stoneBonuses) {
                rs.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
            }
            rs.stoneBonuses.extraMoveMeters = (rs.stoneBonuses.extraMoveMeters ?? 0) + move;
            await setRoundState(target, rs);
        }
        catch (err) {
            console.warn('Mastery System | Regeneration movement apply failed', err);
        }
    }
}
//# sourceMappingURL=ally-stone-target.js.map