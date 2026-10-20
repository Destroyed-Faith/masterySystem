/**
 * GM effect application service — carousel bulk tools and future Region Behaviors.
 * Does not invent Special formulas; delegates to apply-special-effects / assign-status.
 */
import { ALL_SPECIAL_EFFECTS, getEffectById, getEffectBaseName, } from '../utils/special-effects.js';
import { coerceStatusEffectsArray, encodeStatusFlag, readActorStatusEffects, statusEntryId, } from '../system/active-specials.js';
import { isAssignableStatusId, removeStatusById, writeActorStatusList, } from '../system/assign-status.js';
import { resolveLiveActor, tokenDocOfActor, tokenIdOfActor } from '../system/status-target.js';
import { applySpecialStringsToTarget } from './apply-special-effects.js';
import { specialDisplayName } from './special-application.js';
let lastUndo = null;
export function dispositionSide(d) {
    if (d >= 1)
        return 'friendly';
    if (d <= -1)
        return 'hostile';
    return 'neutral';
}
export function matchesSide(disposition, filter) {
    if (filter === 'all')
        return true;
    return dispositionSide(Math.floor(Number(disposition) || 0)) === filter;
}
/** Legal persistent Specials for the GM picker (instants/support excluded except Cleanse). */
export function listGmAssignableSpecials() {
    return ALL_SPECIAL_EFFECTS.filter((e) => {
        if (e.id === 'cleanse')
            return true;
        if (e.category === 'instant' || e.category === 'support' || e.category === 'multiAttack') {
            return false;
        }
        return isAssignableStatusId(e.id) || !!getEffectById(e.id);
    });
}
export function formatSpecialLine(specialId, value) {
    const def = getEffectById(specialId);
    const name = def ? getEffectBaseName(def.name) : specialDisplayName(specialId);
    if (def?.hasValue && value != null && Number.isFinite(Number(value))) {
        return `${name}(${Math.floor(Number(value))})`;
    }
    return name;
}
function currentValue(actor, specialId, tokenHint) {
    const list = readActorStatusEffects(actor, tokenHint);
    let sum = 0;
    let found = false;
    for (const e of list) {
        const id = statusEntryId(e) || String(e?.id || '').toLowerCase();
        if (id === specialId) {
            found = true;
            sum += Math.max(0, Math.floor(Number(e.value) || 0));
        }
    }
    if (!found)
        return null;
    return sum;
}
export function resolveGmEffectActor(ref) {
    const combat = globalThis.game?.combat;
    if (ref.combatantId && combat) {
        const c = combat.combatants?.get?.(ref.combatantId) ??
            [...(combat.combatants ?? [])].find((x) => String(x.id) === String(ref.combatantId));
        if (c?.actor) {
            const tokenId = String(c.tokenId || c.token?.id || tokenIdOfActor(c.actor) || '');
            return { actor: c.actor, tokenId };
        }
    }
    const actor = resolveLiveActor(ref.actorId, ref.tokenId);
    if (!actor)
        return null;
    return {
        actor,
        tokenId: String(ref.tokenId || tokenIdOfActor(actor) || ''),
    };
}
export function collectTargetsByScope(scope, opts) {
    const side = opts?.sideFilter ?? 'all';
    const out = [];
    const pushUnique = (ref) => {
        if (!matchesSide(ref.disposition, side))
            return;
        const key = ref.tokenId
            ? `t:${ref.tokenId}`
            : ref.combatantId
                ? `c:${ref.combatantId}`
                : `a:${ref.actorId}`;
        if (out.some((r) => {
            const k = r.tokenId
                ? `t:${r.tokenId}`
                : r.combatantId
                    ? `c:${r.combatantId}`
                    : `a:${r.actorId}`;
            return k === key;
        })) {
            return;
        }
        out.push(ref);
    };
    if (scope === 'selected') {
        for (const r of opts?.selected ?? [])
            pushUnique(r);
        return out;
    }
    const combat = opts?.combat ?? globalThis.game?.combat;
    if (scope === 'allCombatants' && combat) {
        const bag = combat.combatants;
        const list = bag?.contents
            ? bag.contents
            : typeof bag?.values === 'function'
                ? Array.from(bag.values())
                : Array.from(bag ?? []);
        for (const c of list) {
            const token = c.token?.document ?? c.token;
            pushUnique({
                combatantId: String(c.id ?? ''),
                actorId: String(c.actorId ?? c.actor?.id ?? ''),
                tokenId: String(c.tokenId ?? token?.id ?? ''),
                name: String(c.name ?? c.actor?.name ?? ''),
                disposition: Number(token?.disposition ?? c.actor?.token?.disposition ?? 0),
            });
        }
        return out;
    }
    if (scope === 'allSceneTokens') {
        const scene = opts?.scene ??
            globalThis.canvas?.scene ??
            globalThis.game?.scenes?.viewed ??
            globalThis.game?.scenes?.active;
        const tokens = scene?.tokens?.contents
            ? scene.tokens.contents
            : typeof scene?.tokens?.values === 'function'
                ? Array.from(scene.tokens.values())
                : [];
        for (const t of tokens) {
            if (!t?.actor)
                continue;
            pushUnique({
                actorId: String(t.actor.id ?? t.actorId ?? ''),
                tokenId: String(t.id ?? ''),
                name: String(t.name ?? t.actor.name ?? ''),
                disposition: Number(t.disposition ?? 0),
            });
        }
    }
    return out;
}
async function snapshotTargets(targets) {
    const entries = [];
    for (const ref of targets) {
        const resolved = resolveGmEffectActor(ref);
        if (!resolved)
            continue;
        const { actor, tokenId } = resolved;
        const list = readActorStatusEffects(actor, tokenDocOfActor(actor)).map((e) => ({ ...e }));
        entries.push({
            actorId: String(actor.id ?? ''),
            tokenId,
            encoded: encodeStatusFlag(list),
            list,
        });
    }
    return entries;
}
async function postAudit(message) {
    try {
        const ChatMessage = globalThis.ChatMessage;
        if (!ChatMessage?.create)
            return;
        await ChatMessage.create({
            user: globalThis.game?.user?.id,
            content: `<div class="mastery-gm-effect-audit"><p>${message}</p></div>`,
            style: globalThis.CONST?.CHAT_MESSAGE_STYLES?.OTHER,
        });
    }
    catch (err) {
        console.warn('Mastery System | GM effect audit chat failed', err);
    }
}
function assertGm() {
    return !!globalThis.game?.user?.isGM;
}
/** Preview expected values before apply (pure; no writes). */
export function previewGmEffectApply(req) {
    const def = getEffectById(req.specialId);
    const rows = [];
    if (req.specialId === 'challenge' && req.mode === 'rules' && !req.source?.uuid) {
        return req.targets.map((ref) => ({
            name: ref.name || '?',
            before: null,
            expectedAfter: null,
            restriction: 'Challenge requires a source',
        }));
    }
    for (const ref of req.targets) {
        const resolved = resolveGmEffectActor(ref);
        if (!resolved) {
            rows.push({
                name: ref.name || '?',
                before: null,
                expectedAfter: null,
                restriction: 'Target not found',
            });
            continue;
        }
        const before = currentValue(resolved.actor, req.specialId, tokenDocOfActor(resolved.actor));
        if (def?.category === 'instant') {
            rows.push({
                name: String(resolved.actor.name || ref.name || '?'),
                before,
                expectedAfter: '—',
                restriction: 'Instant Special cannot be stored from this interface',
            });
            continue;
        }
        const add = Math.max(0, Math.floor(Number(req.value) || (def?.hasValue ? 1 : 0)));
        if (req.mode === 'exact') {
            rows.push({
                name: String(resolved.actor.name || ref.name || '?'),
                before,
                expectedAfter: def?.hasValue ? add : 1,
            });
        }
        else if (req.specialId === 'cleanse') {
            rows.push({
                name: String(resolved.actor.name || ref.name || '?'),
                before,
                expectedAfter: `Cleanse(${add}) distribute`,
            });
        }
        else {
            const base = before ?? 0;
            rows.push({
                name: String(resolved.actor.name || ref.name || '?'),
                before,
                expectedAfter: def?.hasValue ? base + add : 1,
            });
        }
    }
    return rows;
}
export async function applyGmEffect(req) {
    const specialId = String(req.specialId || '')
        .trim()
        .toLowerCase();
    const def = getEffectById(specialId);
    const specialLabel = formatSpecialLine(specialId, req.value);
    const empty = {
        ok: false,
        mode: req.mode,
        specialId,
        specialLabel,
        results: [],
        errors: [],
        undoId: null,
    };
    if (!assertGm()) {
        empty.errors.push('GM only');
        return empty;
    }
    if (!def && !isAssignableStatusId(specialId)) {
        empty.errors.push(`Unknown Special: ${specialId}`);
        return empty;
    }
    if (def?.category === 'instant') {
        empty.errors.push(`${specialLabel} is Instant — it cannot be applied as a persistent status from this interface.`);
        return empty;
    }
    if (req.mode === 'rules' && specialId === 'challenge' && !req.source?.uuid) {
        empty.errors.push('Challenge requires a valid source challenger.');
        return empty;
    }
    const undoEntries = await snapshotTargets(req.targets);
    const results = [];
    const errors = [];
    const line = formatSpecialLine(specialId, req.value);
    for (const ref of req.targets) {
        const resolved = resolveGmEffectActor(ref);
        if (!resolved) {
            results.push({
                name: ref.name || '?',
                actorId: String(ref.actorId || ''),
                tokenId: String(ref.tokenId || ''),
                ok: false,
                beforeValue: null,
                afterValue: null,
                notes: [],
                error: 'Target not found',
            });
            errors.push(`${ref.name || '?'}: not found`);
            continue;
        }
        const { actor, tokenId } = resolved;
        const beforeValue = currentValue(actor, specialId, tokenDocOfActor(actor));
        const notes = [];
        try {
            if (req.mode === 'exact') {
                const list = readActorStatusEffects(actor, tokenDocOfActor(actor)).map((e) => ({ ...e }));
                const filtered = removeStatusById(list, specialId);
                const val = def?.hasValue === false
                    ? undefined
                    : Math.max(1, Math.floor(Number(req.value) || 1));
                if (specialId === 'cleanse') {
                    notes.push('Cleanse is not stored as a status in Override mode — use Apply Normally.');
                    results.push({
                        name: String(actor.name || ''),
                        actorId: String(actor.id || ''),
                        tokenId,
                        ok: false,
                        beforeValue,
                        afterValue: beforeValue,
                        notes,
                        error: 'Use Apply Normally for Cleanse',
                    });
                    continue;
                }
                const entry = {
                    id: specialId,
                    name: def ? getEffectBaseName(def.name) : specialDisplayName(specialId),
                    ...(val != null ? { value: val } : {}),
                    source: req.source?.name || 'GM Override',
                    ...(req.source?.uuid ? { sourceUuid: req.source.uuid } : {}),
                    timestamp: Date.now(),
                };
                filtered.push(entry);
                await writeActorStatusList(actor, filtered);
                notes.push('GM Override – exact value set');
            }
            else {
                const sourceActor = req.source?.uuid
                    ? {
                        name: req.source.name,
                        uuid: req.source.uuid,
                        id: req.source.uuid.split('.').pop(),
                    }
                    : null;
                const applyNotes = await applySpecialStringsToTarget(actor, [line], sourceActor, {
                    skipReactiveCleanse: true,
                    requireChallengeSource: specialId === 'challenge',
                    tokenHint: tokenDocOfActor(actor),
                });
                notes.push(...applyNotes);
            }
            const afterValue = currentValue(actor, specialId, tokenDocOfActor(actor));
            results.push({
                name: String(actor.name || ''),
                actorId: String(actor.id || ''),
                tokenId,
                ok: true,
                beforeValue,
                afterValue,
                notes,
            });
        }
        catch (err) {
            const msg = String(err?.message || err || 'failed');
            errors.push(`${actor.name}: ${msg}`);
            results.push({
                name: String(actor.name || ''),
                actorId: String(actor.id || ''),
                tokenId,
                ok: false,
                beforeValue,
                afterValue: beforeValue,
                notes,
                error: msg,
            });
        }
    }
    const undoId = `gm-fx-${Date.now()}`;
    lastUndo = { id: undoId, at: Date.now(), entries: undoEntries };
    const modeLabel = req.mode === 'exact' ? 'GM Override' : 'Apply Normally';
    const names = results.filter((r) => r.ok).map((r) => r.name).join(', ');
    await postAudit(`<strong>${modeLabel}</strong>: ${specialLabel} → ${names || '—'}${req.reason ? ` (${req.reason})` : ''}`);
    return {
        ok: errors.length === 0 && results.some((r) => r.ok),
        mode: req.mode,
        specialId,
        specialLabel,
        results,
        errors,
        undoId,
    };
}
export async function removeGmEffect(targets, specialId) {
    const id = String(specialId || '')
        .trim()
        .toLowerCase();
    const specialLabel = formatSpecialLine(id);
    if (!assertGm()) {
        return {
            ok: false,
            mode: 'exact',
            specialId: id,
            specialLabel,
            results: [],
            errors: ['GM only'],
            undoId: null,
        };
    }
    const undoEntries = await snapshotTargets(targets);
    const results = [];
    const errors = [];
    for (const ref of targets) {
        const resolved = resolveGmEffectActor(ref);
        if (!resolved) {
            errors.push(`${ref.name || '?'}: not found`);
            continue;
        }
        const { actor, tokenId } = resolved;
        const beforeValue = currentValue(actor, id, tokenDocOfActor(actor));
        try {
            const list = readActorStatusEffects(actor, tokenDocOfActor(actor));
            const next = removeStatusById(list, id);
            await writeActorStatusList(actor, next);
            results.push({
                name: String(actor.name || ''),
                actorId: String(actor.id || ''),
                tokenId,
                ok: true,
                beforeValue,
                afterValue: null,
                notes: ['removed'],
            });
        }
        catch (err) {
            errors.push(`${actor.name}: ${err?.message || err}`);
        }
    }
    const undoId = `gm-fx-${Date.now()}`;
    lastUndo = { id: undoId, at: Date.now(), entries: undoEntries };
    await postAudit(`<strong>Remove Special</strong>: ${specialLabel} → ${results.map((r) => r.name).join(', ')}`);
    return {
        ok: errors.length === 0,
        mode: 'exact',
        specialId: id,
        specialLabel,
        results,
        errors,
        undoId,
    };
}
export async function adjustGmEffect(targets, specialId, newValue) {
    return applyGmEffect({
        targets,
        specialId,
        value: newValue,
        mode: 'exact',
        reason: 'Adjust Existing Special',
    });
}
export async function undoLastGmEffectBulk() {
    if (!assertGm())
        return { ok: false, message: 'GM only' };
    if (!lastUndo?.entries.length)
        return { ok: false, message: 'Nothing to undo' };
    const snap = lastUndo;
    lastUndo = null;
    for (const entry of snap.entries) {
        const actor = resolveLiveActor(entry.actorId, entry.tokenId);
        if (!actor)
            continue;
        const list = coerceStatusEffectsArray(entry.list);
        await writeActorStatusList(actor, list);
    }
    await postAudit(`<strong>Undo</strong> last GM bulk Special operation (${snap.id}).`);
    return { ok: true, message: 'Undid last bulk Special operation' };
}
export function peekLastGmEffectUndoId() {
    return lastUndo?.id ?? null;
}
//# sourceMappingURL=gm-effect-service.js.map