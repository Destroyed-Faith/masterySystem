/**
 * Defeated enemies stay on the scene as a ghosted corpse.
 *
 * Do not delete the token (body, loot, revive, boss phase). Player characters
 * at 0 HP stay fully present — Last Breath / Death Checks still need a target.
 * Only the final NPC Health pool counts: boss phase advance runs first.
 */
import { isNpcHealthPoolDepleted } from './npc-phase-advance.js';
import { coerceNpcPhasesArray, ensureNpcHealthState } from '../utils/npc-attack-model.js';
import { tokenDocOfActor } from '../system/status-target.js';
export const DEFEATED_TOKEN_ALPHA = 0.35;
export const DOWNED_FLAG = 'downed';
export const PRE_DOWNED_ALPHA_FLAG = 'preDownedAlpha';
export function isPlayerCharacterActor(actor) {
    return String(actor?.type || '') === 'character';
}
/** True when this NPC has a Health pool at 0 and no further phase to load. */
export function isNpcFinallyDefeated(actor) {
    if (!actor || String(actor.type || '') !== 'npc')
        return false;
    const health = actor.system?.health;
    const state = ensureNpcHealthState(health);
    if (!state.bars.length)
        return false;
    if (!isNpcHealthPoolDepleted(health))
        return false;
    const phases = coerceNpcPhasesArray(actor.system?.phases);
    if (phases.length < 2)
        return true;
    const fromIndex = Math.max(0, Math.min(phases.length - 1, Math.floor(Number(actor.system?.npcActivePhaseIndex) || 0)));
    return fromIndex >= phases.length - 1;
}
function asTokenDoc(token) {
    if (!token)
        return null;
    if (token.documentName === 'Token')
        return token;
    const doc = token.document;
    return doc?.documentName === 'Token' ? doc : null;
}
function tokenIdOf(token) {
    return String(token?.id || token?.document?.id || '').trim();
}
export function tokenHasDownedFlag(token) {
    const doc = asTokenDoc(token) ?? token;
    if (!doc)
        return false;
    const flag = typeof doc.getFlag === 'function'
        ? doc.getFlag('mastery-system', DOWNED_FLAG)
        : doc.flags?.['mastery-system']?.[DOWNED_FLAG];
    return flag === true;
}
export function findCombatantForToken(token) {
    const g = globalThis;
    const combat = g.game?.combat ?? g.game?.combats?.active;
    if (!combat)
        return null;
    const tid = tokenIdOf(token);
    if (!tid)
        return null;
    const combatants = typeof combat.combatants?.[Symbol.iterator] === 'function'
        ? Array.from(combat.combatants)
        : Array.isArray(combat.combatants)
            ? combat.combatants
            : [];
    return (combatants.find((c) => String(c?.tokenId || c?.token?.id || '') === tid) ?? null);
}
/**
 * Dead enemies (or anyone the GM marked defeated) are not legal targets.
 * Characters at 0 HP stay targetable unless explicitly marked defeated.
 */
export function tokenIsExcludedAsTarget(token) {
    if (!token)
        return true;
    const actor = token.actor ?? asTokenDoc(token)?.actor;
    if (!actor)
        return true;
    if (tokenHasDownedFlag(token))
        return true;
    const combatant = findCombatantForToken(token);
    if (combatant?.defeated)
        return true;
    return isNpcFinallyDefeated(actor);
}
export function filterExcludedTargetIds(tokenIds) {
    const out = new Set();
    const tokens = globalThis.canvas?.tokens?.placeables ?? [];
    const byId = new Map();
    for (const t of tokens) {
        if (t?.id)
            byId.set(String(t.id), t);
    }
    for (const tid of tokenIds) {
        const tok = byId.get(String(tid));
        if (!tok || tokenIsExcludedAsTarget(tok))
            continue;
        out.add(String(tid));
    }
    return out;
}
function collectTokenDocs(actor, tokenId) {
    const out = [];
    const seen = new Set();
    const add = (raw) => {
        const doc = asTokenDoc(raw) ?? (raw?.documentName === 'Token' ? raw : null);
        if (!doc)
            return;
        const id = String(doc.id || '');
        if (!id || seen.has(id))
            return;
        seen.add(id);
        out.push(doc);
    };
    const g = globalThis;
    const tid = String(tokenId || '').trim();
    if (tid) {
        add(g.canvas?.scene?.tokens?.get?.(tid));
        add(g.canvas?.tokens?.get?.(tid));
        add(g.game?.scenes?.viewed?.tokens?.get?.(tid));
        add(g.game?.scenes?.active?.tokens?.get?.(tid));
        return out;
    }
    add(tokenDocOfActor(actor));
    for (const t of actor?.getActiveTokens?.(true) || [])
        add(t);
    return out;
}
async function writeTokenGhost(doc, defeated) {
    if (!doc)
        return;
    const currentAlpha = Number(doc.alpha ?? 1);
    if (defeated) {
        const stored = Number((typeof doc.getFlag === 'function'
            ? doc.getFlag('mastery-system', PRE_DOWNED_ALPHA_FLAG)
            : doc.flags?.['mastery-system']?.[PRE_DOWNED_ALPHA_FLAG]) ?? 0);
        const original = Number.isFinite(stored) && stored > DEFEATED_TOKEN_ALPHA + 0.05
            ? stored
            : currentAlpha > DEFEATED_TOKEN_ALPHA + 0.05
                ? currentAlpha
                : 1;
        if (typeof doc.setFlag === 'function') {
            await doc.setFlag('mastery-system', PRE_DOWNED_ALPHA_FLAG, original);
            await doc.setFlag('mastery-system', DOWNED_FLAG, true);
        }
        if (typeof doc.update === 'function') {
            await doc.update({ alpha: DEFEATED_TOKEN_ALPHA });
        }
        else {
            doc.alpha = DEFEATED_TOKEN_ALPHA;
        }
        const placeable = doc.object;
        if (placeable)
            placeable.alpha = DEFEATED_TOKEN_ALPHA;
        return;
    }
    const restoreRaw = typeof doc.getFlag === 'function'
        ? doc.getFlag('mastery-system', PRE_DOWNED_ALPHA_FLAG)
        : doc.flags?.['mastery-system']?.[PRE_DOWNED_ALPHA_FLAG];
    const restore = Number(restoreRaw);
    const alpha = Number.isFinite(restore) && restore > 0 ? restore : 1;
    if (typeof doc.update === 'function') {
        await doc.update({ alpha });
    }
    else {
        doc.alpha = alpha;
    }
    const placeable = doc.object;
    if (placeable)
        placeable.alpha = alpha;
    if (typeof doc.unsetFlag === 'function') {
        await doc.unsetFlag('mastery-system', DOWNED_FLAG);
        await doc.unsetFlag('mastery-system', PRE_DOWNED_ALPHA_FLAG);
    }
    else if (doc.flags?.['mastery-system']) {
        delete doc.flags['mastery-system'][DOWNED_FLAG];
        delete doc.flags['mastery-system'][PRE_DOWNED_ALPHA_FLAG];
    }
}
/** GM-side / local writes: ghost the token and mark the combatant defeated. */
export async function writeDefeatedPresentation(args) {
    const docs = collectTokenDocs(args.actor, args.tokenId);
    for (const doc of docs) {
        try {
            await writeTokenGhost(doc, args.defeated);
        }
        catch (err) {
            console.warn('Mastery System | defeated token ghost failed', err);
        }
        const combatant = findCombatantForToken(doc);
        if (combatant && !!combatant.defeated !== !!args.defeated) {
            try {
                await combatant.update?.({ defeated: !!args.defeated });
            }
            catch (err) {
                console.warn('Mastery System | combatant defeated flag failed', err);
            }
        }
    }
}
function currentUserIsGm() {
    const g = globalThis;
    return !!g.game?.user?.isGM || typeof g.game === 'undefined';
}
/** Ghost / restore a token. Players relay to the GM (token + combat writes). */
export async function applyDefeatedPresentation(args) {
    if (currentUserIsGm()) {
        await writeDefeatedPresentation(args);
        return;
    }
    try {
        const { requestDefeatedPresentation } = await import('./gm-relay.js');
        const ok = await requestDefeatedPresentation(args);
        if (!ok) {
            console.warn('Mastery System | defeated presentation relay failed');
        }
    }
    catch (err) {
        console.warn('Mastery System | defeated presentation relay error', err);
    }
}
/**
 * After HP / phase writes: ghost a finally-downed NPC, or restore one that
 * got HP back. No-op for player characters.
 */
export async function syncNpcDefeatedPresentationAfterHpChange(actor, opts) {
    if (!actor || isPlayerCharacterActor(actor))
        return;
    if (String(actor.type || '') !== 'npc')
        return;
    const defeated = isNpcFinallyDefeated(actor);
    await applyDefeatedPresentation({
        actor,
        tokenId: opts?.tokenId || tokenDocOfActor(actor)?.id,
        defeated,
    });
}
//# sourceMappingURL=defeated-token.js.map