/**
 * Passive Combat-Trigger Framework
 *
 * Generic runtime for time-based passive effects: combat-start one-shots,
 * turn-start refresh pools, and (future) end-of-turn / round-start / once-
 * per-round riders. First production consumer is Temp HP from passives:
 * - Lean Ward: `triggers.combatStart.tempHP = '1d8'` (one-shot, rolled once
 *   per combat, survives until combatEnd).
 * - Dragon Scales: `triggers.turnStartSelf.tempHP = '2'` (refresh pool, set
 *   to at least N at the owner's own turn-start, can drop to 0 mid-turn).
 *
 * ### Source Book-keeping
 *
 * Each granted pool is tracked by a **stable source key** so that re-
 * applying the same passive never double-stacks:
 *
 *     sourceKey = `${powerId}:${triggerKind}`
 *
 * Sources live under `actor.flags['mastery-system'].tempHPSources` and each
 * entry carries `{ value, declared, kind, origin, combatId, createdAt }`.
 * The scalar mirror `actor.system.health.tempHP` continues to drive all
 * existing display/damage code unchanged — but its mutations are now routed
 * through this module so that the pool breakdown stays consistent with the
 * mirror.
 *
 * ### Stacking rules (confirmed with design)
 *
 * - Same source: idempotent; re-apply overrides to the newly declared value,
 *   never additive.
 * - Different sources: separate pools; mirror = sum of all.
 * - Damage consumption order: **one-shot pools first**, refresh pools last;
 *   inside each group, oldest first (stable createdAt sort).
 * - Manual / unsourced temp HP remains untouched by damage until all tracked
 *   pools are exhausted; on combatEnd we subtract *only* the sourced portion
 *   from the mirror, leaving manual residuals intact.
 *
 * ### Edge cases (acknowledged, not handled here)
 *
 * - Non-combat tempHP sources (rituals, safe-haven heals) are out of scope.
 * - If a GM manually edits `tempHP` mid-combat while sources exist, the
 *   delta-based updater will propagate the manual change correctly on the
 *   next upsert (the source values are not auto-rebalanced).
 */
import { getPassiveSlots } from '../powers/passives.js';
import { resolvePowerMechanics } from '../utils/power-mechanics.js';
let _testRoller = null;
/**
 * Replace the dice-roller for tests. Pass `null` to restore Foundry's
 * default Roll pipeline.
 */
export function setTempHPRollerForTests(roller) {
    _testRoller = roller;
}
async function rollTempHPFormula(formula) {
    const trimmed = String(formula ?? '').trim();
    if (!trimmed)
        return 0;
    // Pure numeric literal (e.g. "3")
    if (/^\d+$/.test(trimmed)) {
        return Math.max(0, parseInt(trimmed, 10));
    }
    // Test injection takes precedence over Foundry for deterministic unit tests.
    if (_testRoller) {
        try {
            const v = await _testRoller(trimmed);
            const n = Number(v);
            return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
        }
        catch {
            return 0;
        }
    }
    // Foundry runtime path
    try {
        const R = globalThis.Roll;
        if (R) {
            const roll = new R(trimmed);
            const result = typeof roll.evaluate === 'function'
                ? await roll.evaluate({ async: true })
                : roll;
            const total = Number(result?.total ?? roll.total ?? 0);
            return Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
        }
    }
    catch (err) {
        console.warn('Mastery System | [passive-triggers] dice roll failed', formula, err);
    }
    // Defensive fallback for environments without Foundry's Roll (e.g. boot
    // path before Foundry is ready). Uses a simple average-based estimate so
    // callers still get a non-zero pool.
    const m = trimmed.match(/^(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
    if (m) {
        const n = parseInt(m[1] || '1', 10);
        const s = parseInt(m[2], 10);
        const sign = m[3] === '-' ? -1 : 1;
        const k = m[4] ? parseInt(m[4], 10) : 0;
        const avg = Math.floor((n * (s + 1)) / 2);
        return Math.max(0, avg + sign * k);
    }
    return 0;
}
// ---------------------------------------------------------------------------
// Actor-state helpers
// ---------------------------------------------------------------------------
const FLAG_BASE = 'flags.mastery-system.tempHPSources';
function getActorFlags(actor) {
    return actor?.flags?.['mastery-system'] ?? {};
}
/** Return a *copy* of the current sources map so callers may mutate freely. */
export function getTempHPSources(actor) {
    const raw = getActorFlags(actor).tempHPSources;
    if (!raw || typeof raw !== 'object')
        return {};
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
        if (v && typeof v === 'object')
            out[k] = { ...v, origin: { ...v.origin } };
    }
    return out;
}
function sumSources(src) {
    let sum = 0;
    for (const s of Object.values(src))
        sum += Math.max(0, Number(s?.value) || 0);
    return sum;
}
function currentTempHP(actor) {
    const n = Number(actor?.system?.health?.tempHP);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
}
async function safeActorUpdate(actor, patch) {
    const u = actor?.update;
    if (typeof u !== 'function')
        return;
    try {
        await u.call(actor, patch);
    }
    catch (err) {
        console.warn('Mastery System | [passive-triggers] actor.update failed', err);
    }
}
/**
 * Build a Foundry-compatible update patch that replaces the `tempHPSources`
 * record with the given `nextSources`: every key present in `previousKeys`
 * but missing from `nextSources` is explicitly deleted via `-=key`.
 */
function buildSourcesPatch(nextSources, previousKeys, nextTempHP) {
    const patch = {
        'system.health.tempHP': nextTempHP,
    };
    const nextKeySet = new Set(Object.keys(nextSources));
    for (const k of previousKeys) {
        if (!nextKeySet.has(k)) {
            patch[`${FLAG_BASE}.-=${k}`] = null;
        }
    }
    for (const [k, v] of Object.entries(nextSources)) {
        patch[`${FLAG_BASE}.${k}`] = v;
    }
    return patch;
}
export function makeSourceKey(...args) {
    if (args.length === 3) {
        const [ownerKind, ownerId, triggerKind] = args;
        return `${ownerKind}:${ownerId}:${triggerKind}`;
    }
    const [ownerId, triggerKind] = args;
    return `${ownerId}:${triggerKind}`;
}
/**
 * Collect every trigger-eligible owner currently attached to the actor: slot-
 * activated passives and live ActiveEffects flagged `activeBuff`. The returned
 * list is deterministic: passives in slot order first, then buffs in effect-
 * collection order.
 */
function collectTriggerOwners(actor) {
    const owners = [];
    // 1) Passive slots
    const slots = getPassiveSlots(actor);
    const items = actor.items;
    for (const slot of slots) {
        if (!slot.active || !slot.passive)
            continue;
        const pid = String(slot.passive.id ?? '').trim();
        if (!pid)
            continue;
        let powerItem = null;
        try {
            powerItem = items?.get?.(pid) ?? null;
            if (!powerItem && Array.isArray(items)) {
                powerItem = items.find((it) => it?.id === pid || it?._id === pid || it?.name === slot.passive?.name);
            }
            if (!powerItem && items && typeof items[Symbol.iterator] === 'function') {
                for (const it of Array.from(items)) {
                    if (it?.id === pid || it?._id === pid || it?.name === slot.passive?.name) {
                        powerItem = it;
                        break;
                    }
                }
            }
        }
        catch {
            powerItem = null;
        }
        if (!powerItem)
            continue;
        const mech = resolvePowerMechanics(powerItem);
        if (!mech || mech.applyWhen !== 'passive-slotted-active')
            continue;
        owners.push({
            ownerKind: 'passive',
            ownerId: pid,
            name: slot.passive.name ?? powerItem.name ?? 'Passive',
            mechanics: mech,
        });
    }
    // 2) ActiveEffect buffs (created by activateActiveBuff in src/utils/active-buffs.ts)
    const effects = actor?.effects;
    if (effects) {
        const iter = typeof effects[Symbol.iterator] === 'function'
            ? Array.from(effects)
            : Array.isArray(effects)
                ? effects
                : [];
        for (const effect of iter) {
            const owner = buildBuffOwner(actor, effect);
            if (owner)
                owners.push(owner);
        }
    }
    return owners;
}
/**
 * Resolve the PowerMechanics snapshot stored on an ActiveEffect flagged as an
 * active buff. Prefers the inline snapshot written by activateActiveBuff
 * (robust against later item deletion); falls back to the live catalog via
 * `resolvePowerMechanics` when the flag is missing mechanics but still
 * references a `powerId`.
 */
function buildBuffOwner(actor, effect) {
    const flags = effect?.flags?.['mastery-system'];
    if (!flags || flags.activeBuff !== true)
        return null;
    let mech = null;
    if (flags.mechanics && typeof flags.mechanics === 'object') {
        mech = flags.mechanics;
    }
    else if (flags.powerId) {
        const items = actor.items;
        let powerItem = null;
        try {
            powerItem = items?.get?.(flags.powerId) ?? null;
            if (!powerItem && Array.isArray(items)) {
                powerItem = items.find((it) => it?.id === flags.powerId || it?._id === flags.powerId);
            }
        }
        catch {
            powerItem = null;
        }
        mech = resolvePowerMechanics(powerItem);
    }
    if (!mech || mech.applyWhen !== 'activeBuff-active')
        return null;
    const effectId = String(effect?.id ?? effect?._id ?? '').trim();
    if (!effectId)
        return null;
    return {
        ownerKind: 'buff',
        ownerId: effectId,
        name: flags.powerName ?? effect?.name ?? 'Active Buff',
        mechanics: mech,
    };
}
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * Upsert a single Temp HP source. The actor mirror `system.health.tempHP`
 * is adjusted by the delta so manual residuals stay intact.
 *
 * Exposed primarily for tests and future callers (e.g. activeBuff-applied
 * Temp HP). The main dispatcher `applyPassiveTrigger` uses an inlined
 * batched version so it only writes once per trigger.
 */
export async function upsertTempHPSource(actor, key, source) {
    if (!actor || !key)
        return;
    const previous = getTempHPSources(actor);
    const prevKeys = Object.keys(previous);
    const oldValue = Math.max(0, previous[key]?.value ?? 0);
    const next = { ...previous, [key]: source };
    const delta = Math.max(0, source.value) - oldValue;
    const nextTempHP = Math.max(0, currentTempHP(actor) + delta);
    await safeActorUpdate(actor, buildSourcesPatch(next, prevKeys, nextTempHP));
}
/**
 * Apply a trigger to every slot-activated passive on the actor whose
 * mechanics block declares `triggers[triggerKind]`. Rolls dice-strings as
 * needed, merges the resulting pools into the actor's `tempHPSources` map,
 * and synchronises the scalar mirror in a single `actor.update`.
 *
 * Idempotence:
 * - `combatStart` skips sources that already exist for the given combatId
 *   (so re-firing the hook does not reroll pools).
 * - `turnStartSelf` always re-evaluates and raises the pool to at least the
 *   declared value; never lowers it.
 */
export async function applyPassiveTrigger(actor, triggerKind, combat) {
    if (!actor)
        return;
    const owners = collectTriggerOwners(actor);
    if (owners.length === 0)
        return;
    await applyTriggerToOwners(actor, owners, [triggerKind], combat);
}
/**
 * Fire every trigger kind declared on a freshly-activated ActiveEffect buff.
 * Called from the `createActiveEffect` hook so that a buff activated mid-combat
 * immediately materialises its one-shot Temp HP (combatStart) and its refresh
 * pool floor (turnStartSelf) without waiting for the next turn or the next
 * combat.
 *
 * Semantics when activated outside combat (`combat == null`): we still roll
 * the one-shot pool and record a `combatId: ''` source so the consume/cleanup
 * pipeline behaves consistently; `combatEnd` / `deleteCombat` won't touch it
 * (no combat id to match), but `deleteActiveEffect` will via the buff-specific
 * cleanup path.
 */
export async function applyBuffTriggersOnActivate(actor, effect, combat) {
    if (!actor || !effect)
        return;
    const owner = buildBuffOwner(actor, effect);
    if (!owner)
        return;
    await applyTriggerToOwners(actor, [owner], ['combatStart', 'turnStartSelf'], combat);
}
/**
 * Shared implementation for both the scheduled dispatcher
 * (`applyPassiveTrigger`) and the buff-activation fast-path
 * (`applyBuffTriggersOnActivate`). Processes a fixed list of trigger owners
 * and kinds and writes the resulting Temp-HP mutations in a single actor
 * update so the mirror never drifts from the sources map.
 */
async function applyTriggerToOwners(actor, owners, triggerKinds, combat) {
    const combatId = String(combat?.id ?? '');
    const sources = getTempHPSources(actor);
    const prevKeys = Object.keys(sources);
    let accumDelta = 0;
    let anyChange = false;
    for (const owner of owners) {
        for (const triggerKind of triggerKinds) {
            const triggerBlock = owner.mechanics.triggers?.[triggerKind];
            if (!triggerBlock)
                continue;
            const formula = triggerBlock.tempHP;
            if (!formula)
                continue;
            const key = makeSourceKey(owner.ownerKind, owner.ownerId, triggerKind);
            // Tolerate legacy 0.4.272 keys (no ownerKind prefix) for passive owners
            // so in-flight combats don't double-roll after upgrade.
            const legacyKey = owner.ownerKind === 'passive' ? makeSourceKey(owner.ownerId, triggerKind) : null;
            const existing = sources[key] ?? (legacyKey ? sources[legacyKey] : undefined);
            if (triggerKind === 'combatStart') {
                if (existing && existing.combatId === combatId && existing.kind === 'one-shot') {
                    continue;
                }
                const rolled = await rollTempHPFormula(formula);
                if (rolled <= 0)
                    continue;
                const oldValue = existing?.value ?? 0;
                sources[key] = {
                    value: rolled,
                    declared: rolled,
                    kind: 'one-shot',
                    origin: {
                        ownerKind: owner.ownerKind,
                        powerId: owner.ownerId,
                        name: owner.name,
                        triggerKind,
                    },
                    combatId,
                    createdAt: Date.now(),
                };
                if (legacyKey && legacyKey !== key && sources[legacyKey]) {
                    delete sources[legacyKey];
                }
                accumDelta += rolled - oldValue;
                anyChange = true;
            }
            else if (triggerKind === 'turnStartSelf') {
                const target = await rollTempHPFormula(formula);
                if (target <= 0)
                    continue;
                const currentValue = existing?.value ?? 0;
                const newValue = Math.max(currentValue, target);
                const delta = newValue - currentValue;
                sources[key] = {
                    value: newValue,
                    declared: target,
                    kind: 'refresh',
                    origin: {
                        ownerKind: owner.ownerKind,
                        powerId: owner.ownerId,
                        name: owner.name,
                        triggerKind,
                    },
                    combatId,
                    createdAt: existing?.createdAt ?? Date.now(),
                };
                if (legacyKey && legacyKey !== key && sources[legacyKey]) {
                    delete sources[legacyKey];
                }
                if (delta !== 0 || !existing || existing.combatId !== combatId) {
                    accumDelta += delta;
                    anyChange = true;
                }
            }
        }
    }
    if (!anyChange)
        return;
    const nextTempHP = Math.max(0, currentTempHP(actor) + accumDelta);
    await safeActorUpdate(actor, buildSourcesPatch(sources, prevKeys, nextTempHP));
}
/**
 * Remove every Temp HP source granted by a specific ActiveEffect buff. Called
 * from `deleteActiveEffect` so that when the buff expires or is manually
 * removed mid-combat, its pools disappear from the mirror without touching
 * sources owned by other passives or manual Temp HP residuals.
 */
export async function clearTempHPSourcesForBuffEffect(actor, effectId) {
    if (!actor || !effectId)
        return;
    const sources = getTempHPSources(actor);
    const prevKeys = Object.keys(sources);
    if (prevKeys.length === 0)
        return;
    let removedValue = 0;
    const next = {};
    for (const [k, src] of Object.entries(sources)) {
        const isThisBuff = src.origin?.ownerKind === 'buff' && src.origin.powerId === effectId;
        if (isThisBuff) {
            removedValue += Math.max(0, src.value ?? 0);
            continue;
        }
        next[k] = src;
    }
    if (removedValue === 0 && Object.keys(next).length === prevKeys.length)
        return;
    const nextTempHP = Math.max(0, currentTempHP(actor) - removedValue);
    await safeActorUpdate(actor, buildSourcesPatch(next, prevKeys, nextTempHP));
}
/**
 * Compute the result of consuming incoming damage from the actor's tempHP
 * pools **without** writing to the actor. Returns both the numeric result
 * and the update patch to apply. Useful for the damage pipeline, which
 * merges tempHP + bar updates into a single atomic `actor.update`.
 *
 * Consumption order:
 *   1. one-shot sources, oldest first;
 *   2. refresh sources, oldest first;
 *   3. any unsourced manual tempHP residual (mirror minus sources).
 */
export function previewTempHPConsumption(actor, incoming) {
    const damage = Math.max(0, Math.floor(Number(incoming) || 0));
    const emptyPatch = {};
    if (damage <= 0 || !actor) {
        return { reducedBy: 0, remainingDamage: Math.max(0, damage), patch: emptyPatch };
    }
    const mirror = currentTempHP(actor);
    if (mirror <= 0) {
        return { reducedBy: 0, remainingDamage: damage, patch: emptyPatch };
    }
    const absorbed = Math.min(mirror, damage);
    const remainingDamage = damage - absorbed;
    const nextTempHP = mirror - absorbed;
    const sources = getTempHPSources(actor);
    const prevKeys = Object.keys(sources);
    const sortedKeys = prevKeys.slice().sort((a, b) => {
        const sa = sources[a];
        const sb = sources[b];
        const ka = sa.kind === 'one-shot' ? 0 : 1;
        const kb = sb.kind === 'one-shot' ? 0 : 1;
        if (ka !== kb)
            return ka - kb;
        return (Number(sa.createdAt) || 0) - (Number(sb.createdAt) || 0);
    });
    let toReduce = absorbed;
    for (const k of sortedKeys) {
        if (toReduce <= 0)
            break;
        const s = sources[k];
        const take = Math.min(Math.max(0, s.value), toReduce);
        if (take > 0) {
            s.value = Math.max(0, s.value - take);
            toReduce -= take;
        }
        if (s.value <= 0) {
            delete sources[k];
        }
    }
    // Remaining `toReduce` > 0 means the mirror had unsourced residual; it is
    // implicitly consumed by the mirror-subtract below and needs no
    // per-source tracking.
    return {
        reducedBy: absorbed,
        remainingDamage,
        patch: buildSourcesPatch(sources, prevKeys, nextTempHP),
    };
}
/**
 * Subtract incoming damage from the actor's tempHP pools in priority order.
 * Writes the resulting patch to the actor and returns the numeric result.
 * Use `previewTempHPConsumption` instead when you need to merge the patch
 * with other updates (e.g. health-bar changes) into a single write.
 */
export async function consumeTempHPFromSources(actor, incoming) {
    const preview = previewTempHPConsumption(actor, incoming);
    if (Object.keys(preview.patch).length > 0) {
        await safeActorUpdate(actor, preview.patch);
    }
    return { reducedBy: preview.reducedBy, remainingDamage: preview.remainingDamage };
}
/**
 * Remove every sourced temp-HP pool for the given combat (or all of them, if
 * no combat is passed — use the no-arg form defensively on `deleteCombat`).
 *
 * The mirror `system.health.tempHP` is decremented by the removed portion
 * only; any unsourced residual (GM-set, ritual-derived, …) stays on the
 * actor.
 */
export async function clearTempHPSourcesOnCombatEnd(actor, combat) {
    if (!actor)
        return;
    const sources = getTempHPSources(actor);
    const prevKeys = Object.keys(sources);
    if (prevKeys.length === 0)
        return;
    const combatId = combat?.id ? String(combat.id) : null;
    const toRemove = combatId
        ? prevKeys.filter((k) => sources[k].combatId === combatId)
        : prevKeys.slice();
    if (toRemove.length === 0)
        return;
    const removedSum = toRemove.reduce((s, k) => s + Math.max(0, sources[k].value || 0), 0);
    for (const k of toRemove)
        delete sources[k];
    const nextTempHP = Math.max(0, currentTempHP(actor) - removedSum);
    await safeActorUpdate(actor, buildSourcesPatch(sources, prevKeys, nextTempHP));
}
/**
 * Iterate every actor attached to the combat's combatants. Handles both
 * Collection-backed (Foundry) and plain-array (tests) combatant stores.
 */
export function getCombatActors(combat) {
    if (!combat)
        return [];
    const combatants = combat.combatants;
    if (!combatants)
        return [];
    const iter = typeof combatants[Symbol.iterator] === 'function'
        ? Array.from(combatants)
        : Array.isArray(combatants)
            ? combatants
            : [];
    const out = [];
    const seen = new Set();
    for (const c of iter) {
        const actor = c?.actor;
        if (!actor)
            continue;
        const id = String(actor.id ?? actor._id ?? out.length);
        if (seen.has(id))
            continue;
        seen.add(id);
        out.push(actor);
    }
    return out;
}
/**
 * Convenience: apply a trigger to every combatant in the combat, one at a
 * time (sequentially — avoids racing `actor.update` calls).
 */
export async function applyPassiveTriggerToCombat(triggerKind, combat) {
    const actors = getCombatActors(combat);
    for (const actor of actors) {
        await applyPassiveTrigger(actor, triggerKind, combat);
    }
}
/** Convenience: clear sources on every combatant in the combat. */
export async function clearTempHPSourcesForCombat(combat) {
    const actors = getCombatActors(combat);
    for (const actor of actors) {
        await clearTempHPSourcesOnCombatEnd(actor, combat);
    }
}
//# sourceMappingURL=passive-triggers.js.map