/**
 * One path for setting a catalog status on a character or NPC.
 *
 * Combat, the sheet, and the carousel read flags first, then `system.statusEffects`.
 * The token status bar reads ActiveEffects. Both have to move together,
 * including when a Special never triggered on its own.
 */
import { canCurrentUserUpdateDocument, hasActiveGm } from '../combat/combat-permissions.js';
import { getEffectById } from '../utils/special-effects.js';
import { coerceStatusEffectsArray, encodeStatusFlag, hasActiveSpecial, readActorStatusEffects, statusEntryId, } from './active-specials.js';
import { MASTERY_STATUS_EFFECTS } from './status-effects.js';
import { tokenDocOfActor } from './status-target.js';
const mirroring = new Map();
function catalogById(id) {
    const key = String(id || '').trim().toLowerCase();
    return MASTERY_STATUS_EFFECTS.find((e) => e.id === key);
}
/** Persistent conditions a GM can put on by hand. Instants resolve and vanish. */
export function isAssignableStatusId(id) {
    const key = String(id || '').trim().toLowerCase();
    const catalog = catalogById(key);
    if (!catalog)
        return false;
    const def = getEffectById(key);
    if (!def)
        return true;
    return def.category !== 'instant' && def.category !== 'support';
}
export function listAssignableStatuses() {
    const out = [];
    for (const effect of MASTERY_STATUS_EFFECTS) {
        if (!isAssignableStatusId(effect.id))
            continue;
        const def = getEffectById(effect.id);
        out.push({
            id: effect.id,
            name: effect.name,
            hasValue: def?.hasValue === true,
            img: effect.img,
        });
    }
    return out;
}
export function choiceForStatus(id) {
    const key = String(id || '').trim().toLowerCase();
    return listAssignableStatuses().find((c) => c.id === key);
}
function entryMatches(entry, id) {
    const resolved = statusEntryId(entry) || String(entry?.id || '').trim().toLowerCase();
    return resolved === id;
}
/** Add a missing status, or replace its rank when `value` is given. */
export function upsertStatusEntry(list, statusId, value) {
    const id = String(statusId || '').trim().toLowerCase();
    const next = coerceStatusEffectsArray(list).map((e) => ({ ...e }));
    if (!isAssignableStatusId(id))
        return next;
    const choice = choiceForStatus(id);
    const numeric = value === undefined || value === null || value === ''
        ? null
        : Math.floor(Number(value));
    const idx = next.findIndex((e) => entryMatches(e, id));
    if (idx >= 0) {
        if (choice?.hasValue && numeric != null && Number.isFinite(numeric) && numeric > 0) {
            next[idx] = { ...next[idx], id, name: choice.name, value: numeric };
        }
        return next;
    }
    const entry = { id, name: choice?.name || id };
    if (choice?.hasValue) {
        entry.value = numeric != null && Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
    }
    next.push(entry);
    return next;
}
export function removeStatusById(list, statusId) {
    const id = String(statusId || '').trim().toLowerCase();
    return coerceStatusEffectsArray(list).filter((e) => !entryMatches(e, id));
}
function listChanged(before, after) {
    return JSON.stringify(coerceStatusEffectsArray(before)) !== JSON.stringify(after);
}
function actorEffects(actor) {
    const effects = actor?.effects;
    if (!effects)
        return [];
    if (Array.isArray(effects.contents))
        return effects.contents;
    if (typeof effects[Symbol.iterator] === 'function')
        return Array.from(effects);
    return [];
}
/** Catalog id carried by a token ActiveEffect, ignoring active buffs. */
export function statusIdFromEffect(effect) {
    if (!effect)
        return null;
    if (effect.flags?.['mastery-system']?.activeBuff === true)
        return null;
    const core = String(effect.flags?.core?.statusId ?? '').trim().toLowerCase();
    if (isAssignableStatusId(core))
        return core;
    const statuses = effect.statuses;
    const ids = [];
    if (statuses?.forEach) {
        statuses.forEach((entry) => ids.push(String(entry)));
    }
    else if (Array.isArray(statuses)) {
        ids.push(...statuses.map((entry) => String(entry)));
    }
    else if (statuses && typeof statuses === 'object') {
        ids.push(...Object.keys(statuses));
    }
    for (const raw of ids) {
        const id = raw.trim().toLowerCase();
        if (isAssignableStatusId(id))
            return id;
    }
    const name = String(effect.name ?? effect.label ?? '').trim().toLowerCase();
    const byName = MASTERY_STATUS_EFFECTS.find((e) => e.id === name || e.name.toLowerCase() === name);
    return byName && isAssignableStatusId(byName.id) ? byName.id : null;
}
export function tokenHasStatus(actor, statusId) {
    const id = String(statusId || '').trim().toLowerCase();
    if (!id)
        return false;
    if (actor?.statuses?.has?.(id))
        return true;
    return actorEffects(actor).some((effect) => statusIdFromEffect(effect) === id);
}
function shouldMirrorIcons(actor) {
    if (typeof actor?.toggleStatusEffect !== 'function' && typeof actor?.createEmbeddedDocuments !== 'function') {
        return false;
    }
    const user = typeof game !== 'undefined' ? game.user : null;
    if (!user)
        return true;
    if (!canCurrentUserUpdateDocument(actor))
        return false;
    if (user.isGM)
        return true;
    return !hasActiveGm();
}
async function fallbackToggle(actor, choice, active) {
    const matches = actorEffects(actor).filter((effect) => statusIdFromEffect(effect) === choice.id);
    if (!active) {
        const ids = matches.map((effect) => String(effect.id ?? effect._id ?? '')).filter(Boolean);
        if (ids.length && typeof actor.deleteEmbeddedDocuments === 'function') {
            await actor.deleteEmbeddedDocuments('ActiveEffect', ids);
        }
        return;
    }
    if (matches.length || typeof actor.createEmbeddedDocuments !== 'function')
        return;
    const base = { name: choice.name, img: choice.img, icon: choice.img };
    try {
        await actor.createEmbeddedDocuments('ActiveEffect', [{ ...base, statuses: [choice.id] }]);
    }
    catch {
        await actor.createEmbeddedDocuments('ActiveEffect', [{ ...base, statuses: new Set([choice.id]) }]);
    }
}
/** Make the token status-bar icons match `system.statusEffects`. */
export function syncTokenStatusIcons(actor) {
    const actorId = String(actor?.id || '');
    if (!actorId)
        return Promise.resolve();
    const existing = mirroring.get(actorId);
    if (existing)
        return existing;
    if (!shouldMirrorIcons(actor))
        return Promise.resolve();
    const job = (async () => {
        for (const choice of listAssignableStatuses()) {
            const want = hasActiveSpecial(actor, choice.id);
            const have = tokenHasStatus(actor, choice.id);
            if (want === have)
                continue;
            try {
                if (typeof actor.toggleStatusEffect === 'function') {
                    await actor.toggleStatusEffect(choice.id, { active: want, overlay: false });
                }
                else {
                    await fallbackToggle(actor, choice, want);
                }
            }
            catch (err) {
                try {
                    await fallbackToggle(actor, choice, want);
                }
                catch (err2) {
                    console.warn('Mastery System | status icon failed', choice.id, err2 ?? err);
                }
            }
        }
    })().finally(() => {
        mirroring.delete(actorId);
    });
    mirroring.set(actorId, job);
    return job;
}
export function isMirroringStatusIcons(actor) {
    return mirroring.has(String(actor?.id || ''));
}
async function applyStatusUpdate(actor, update, options) {
    const g = globalThis;
    if (typeof g.game === 'undefined' || !g.game?.user) {
        await actor.update(update, options);
        return;
    }
    const { updateActorViaGm } = await import('../combat/gm-relay.js');
    await updateActorViaGm(actor, update, options);
}
export async function writeTokenStatusJson(token, encoded) {
    if (!token)
        return;
    if (typeof token.setFlag === 'function') {
        await token.setFlag('mastery-system', 'statusJson', encoded);
        return;
    }
    token.flags = token.flags || {};
    token.flags['mastery-system'] = {
        ...(token.flags['mastery-system'] || {}),
        statusJson: encoded,
    };
}
async function persistStatusList(actor, list, extra = {}) {
    const encoded = encodeStatusFlag(list);
    const token = tokenDocOfActor(actor);
    const g = globalThis;
    const noGame = typeof g.game === 'undefined' || !g.game?.user;
    if (token && (noGame || canCurrentUserUpdateDocument(token))) {
        try {
            await writeTokenStatusJson(token, encoded);
        }
        catch (err) {
            console.warn('Mastery System | token status flag write failed', err);
        }
    }
    // Actor flags next. ActorDelta may still drop this on unlinked tokens;
    // the token flag above is what the carousel and token sheet read.
    await applyStatusUpdate(actor, {
        'flags.mastery-system.statusJson': encoded,
        ...extra,
    });
    try {
        await applyStatusUpdate(actor, { 'system.statusEffects': list }, { diff: false });
    }
    catch (err) {
        console.warn('Mastery System | system.statusEffects write dropped', err);
    }
}
export async function writeActorStatusList(actor, list, extra = {}) {
    if (!actor)
        return;
    await persistStatusList(actor, list, extra);
    await syncTokenStatusIcons(actor);
    const sheet = actor.sheet;
    if (sheet?.rendered) {
        try {
            await sheet.render(false);
        }
        catch {
            /* sheet may already be redrawing */
        }
    }
}
/**
 * Turn a catalog status on or off for this actor.
 * `value` sets the rank when the status is new or when a number is passed.
 */
export async function setActorCatalogStatus(actor, statusId, active, value, options) {
    if (!actor)
        return;
    const id = String(statusId || '').trim().toLowerCase();
    if (!isAssignableStatusId(id))
        return;
    const choice = choiceForStatus(id);
    const before = readActorStatusEffects(actor);
    const had = before.some((e) => entryMatches(e, id));
    const next = active ? upsertStatusEntry(before, id, value) : removeStatusById(before, id);
    const changed = listChanged(before, next);
    if (changed)
        await writeActorStatusList(actor, next);
    else
        await syncTokenStatusIcons(actor);
    if (!options?.notify)
        return;
    const g = globalThis;
    const label = choice?.name || id;
    const who = String(actor.name || 'dem Ziel');
    if (!active)
        return;
    if (!had) {
        g.ui?.notifications?.info?.(`${label} liegt jetzt auf ${who}.`);
        return;
    }
    if (changed && choice?.hasValue) {
        const row = next.find((e) => entryMatches(e, id));
        g.ui?.notifications?.info?.(`${label} auf ${who} ist jetzt ${row?.value}.`);
        return;
    }
    g.ui?.notifications?.info?.(`${label} liegt schon auf ${who}.`);
}
/** HUD toggle created or deleted an ActiveEffect — copy that into the sheet list. */
export async function adoptEffectStatus(actor, effect, active) {
    if (!actor || isMirroringStatusIcons(actor))
        return;
    const id = statusIdFromEffect(effect);
    if (!id)
        return;
    if (active) {
        if (hasActiveSpecial(actor, id))
            return;
        await setActorCatalogStatus(actor, id, true);
        return;
    }
    if (!hasActiveSpecial(actor, id))
        return;
    const effectId = String(effect?.id ?? effect?._id ?? '');
    const stillThere = actorEffects(actor).some((other) => {
        const otherId = String(other?.id ?? other?._id ?? '');
        return otherId !== effectId && statusIdFromEffect(other) === id;
    });
    if (stillThere)
        return;
    await setActorCatalogStatus(actor, id, false);
}
function selectedHasValue(select) {
    const opt = select?.selectedOptions?.[0];
    return String(opt?.dataset?.hasValue || '').includes('1');
}
function escHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function asJquery(root) {
    if (root?.find)
        return root;
    const jq = globalThis.$;
    return typeof jq === 'function' ? jq(root) : null;
}
function readPickedStatus(root) {
    const $root = asJquery(root);
    const select = $root?.find?.('select.js-status-add-pick')?.[0];
    const input = $root?.find?.('input.js-status-add-value')?.[0];
    const id = String(select?.value || '').trim();
    const hasValue = selectedHasValue(select);
    const value = hasValue ? Math.max(1, Math.floor(Number(input?.value) || 1)) : null;
    return { id, value };
}
/** Dialog: pick a catalog status and optional rank, then write it. */
export async function openStatusAddDialog(actor) {
    if (!actor)
        return;
    const choices = listAssignableStatuses();
    if (!choices.length)
        return;
    const DialogCtor = globalThis.Dialog;
    if (typeof DialogCtor !== 'function')
        return;
    const options = choices
        .map((choice) => `<option value="${escHtml(choice.id)}" data-has-value="${choice.hasValue ? '1' : '0'}">${escHtml(choice.name)}</option>`)
        .join('');
    const who = escHtml(String(actor.name || 'Ziel'));
    await new Promise((resolve) => {
        const dialog = new DialogCtor({
            title: `Status — ${who}`,
            content: `<form class="ms-status-add-dialog">
        <p class="ms-status-add-dialog__hint">Status auf ${who} setzen.</p>
        <label class="ms-status-add-dialog__field">
          <span>Status</span>
          <select class="js-status-add-pick" aria-label="Status">${options}</select>
        </label>
        <label class="ms-status-add-dialog__field js-status-add-value-wrap">
          <span>Stufe</span>
          <input type="number" class="js-status-add-value" min="1" max="30" step="1" value="1" title="Stufe"/>
        </label>
      </form>`,
            buttons: {
                add: {
                    label: 'Setzen',
                    callback: async (html) => {
                        const { id, value } = readPickedStatus(html);
                        if (!id)
                            return;
                        await setActorCatalogStatus(actor, id, true, value, { notify: true });
                    },
                },
                cancel: { label: 'Abbrechen' },
            },
            default: 'add',
            close: () => resolve(),
            render: (html) => {
                const $html = asJquery(html);
                $html?.closest?.('.window-app.dialog')?.addClass?.('mastery-system ms-status-add-app');
                const sync = () => {
                    const wrap = $html?.find?.('.js-status-add-value-wrap');
                    const select = $html?.find?.('select.js-status-add-pick')?.[0];
                    if (wrap?.length)
                        wrap.toggle(selectedHasValue(select));
                };
                $html?.find?.('select.js-status-add-pick')?.on?.('change', sync);
                sync();
            },
        });
        dialog.render(true);
    });
}
/** Sheet control: plus next to the Status heading opens the add dialog. */
export function bindStatusAddControls(html, actor) {
    const openers = html.find('.js-status-add-open');
    if (openers?.length) {
        openers.on('click', async (ev) => {
            ev.preventDefault?.();
            ev.stopPropagation?.();
            ev.stopImmediatePropagation?.();
            await openStatusAddDialog(actor);
        });
    }
    const rows = html.find('.status-add-row');
    if (!rows?.length)
        return;
    const syncValueFields = () => {
        rows.each?.((_i, el) => {
            const select = el.querySelector('select.js-status-add-pick');
            const input = el.querySelector('input.js-status-add-value');
            if (!input)
                return;
            input.hidden = !selectedHasValue(select);
        });
    };
    rows.find('select.js-status-add-pick').on('change', (ev) => {
        ev.preventDefault?.();
        ev.stopPropagation?.();
        syncValueFields();
    });
    syncValueFields();
    rows.find('.js-status-add').on('click', async (ev) => {
        ev.preventDefault?.();
        ev.stopPropagation?.();
        ev.stopImmediatePropagation?.();
        const row = ev.currentTarget?.closest?.('.status-add-row');
        const select = row?.querySelector('select.js-status-add-pick');
        const input = row?.querySelector('input.js-status-add-value');
        const id = String(select?.value || '').trim();
        if (!id)
            return;
        const value = selectedHasValue(select)
            ? Math.max(1, Math.floor(Number(input?.value) || 1))
            : null;
        await setActorCatalogStatus(actor, id, true, value, { notify: true });
    });
}
//# sourceMappingURL=assign-status.js.map