/**
 * Movement-based Special-Effect enforcement (Lacerate + Slow).
 *
 *   Lacerate(X): the first time each turn you voluntarily move > 0 m, take X.
 *                Moving > half your Speed adds +X; exceeding your Speed (Dash /
 *                Sprint) adds +X again.
 *   Slow(X):     if you do not voluntarily move at least 1 m during your turn,
 *                take X damage at the end of your turn.
 *
 * Movement is tracked per-turn on the acting creature via actor flags. Token
 * drags/animations are treated as voluntary movement. GM-side only.
 */
import { applyDamage } from '../utils/calculations.js';
import { getActiveSpecialValue } from '../system/active-specials.js';
const FLAG_SCOPE = 'mastery-system';
const FLAG_MOVED = 'movedThisTurnM';
const FLAG_LACERATE_STAGE = 'lacerateStageThisTurn';
const FLAG_SAFE_MOVE_NOTED = 'safeMoveNotedThisTurn';
/** Apply unmitigated direct damage to an actor's health bars. */
async function applyDirectDamage(actor, amount) {
    const dmg = Math.max(0, Math.floor(amount));
    if (dmg <= 0)
        return;
    const system = actor?.system;
    if (!Array.isArray(system?.health?.bars) || system.health.bars.length === 0)
        return;
    const bars = foundry.utils.duplicate(system.health.bars);
    const currentBar = applyDamage(bars, Number(system.health.currentBar ?? 0), dmg);
    await actor.update({ 'system.health.bars': bars, 'system.health.currentBar': currentBar });
}
/** Meters moved between two token positions on the given scene. */
function metersBetween(scene, oldX, oldY, newX, newY) {
    const gridSize = Number(scene?.grid?.size ?? 100) || 100;
    const gridDistance = Number(scene?.grid?.distance ?? 1) || 1;
    const pxDist = Math.hypot(Number(newX) - Number(oldX), Number(newY) - Number(oldY));
    return (pxDist / gridSize) * gridDistance;
}
/** Reset per-turn movement tracking for the creature whose turn is starting. */
export async function resetMovementForTurn(actor) {
    if (!actor || !game.user?.isGM)
        return;
    try {
        await actor.setFlag(FLAG_SCOPE, FLAG_MOVED, 0);
        await actor.setFlag(FLAG_SCOPE, FLAG_LACERATE_STAGE, 0);
        if (actor.getFlag(FLAG_SCOPE, FLAG_SAFE_MOVE_NOTED)) {
            await actor.unsetFlag(FLAG_SCOPE, FLAG_SAFE_MOVE_NOTED);
        }
    }
    catch (err) {
        console.debug?.('Mastery System | resetMovementForTurn failed', err);
    }
}
/**
 * Handle a token move: accumulate meters and apply Lacerate thresholds. Only
 * processes the token belonging to the current combatant.
 */
export async function handleTokenMovement(tokenDoc, changes) {
    if (!game.user?.isGM)
        return;
    if (changes?.x === undefined && changes?.y === undefined)
        return;
    const combat = game.combat;
    if (!combat?.started)
        return;
    const actor = tokenDoc?.actor;
    if (!actor)
        return;
    // Only track the creature whose turn it currently is.
    const activeActorId = combat.combatant?.actor?.id;
    if (!activeActorId || activeActorId !== actor.id)
        return;
    const scene = tokenDoc?.parent;
    const oldX = changes.x !== undefined ? Number(tokenDoc._source?.x ?? tokenDoc.x) : Number(tokenDoc.x);
    const oldY = changes.y !== undefined ? Number(tokenDoc._source?.y ?? tokenDoc.y) : Number(tokenDoc.y);
    const newX = changes.x !== undefined ? Number(changes.x) : Number(tokenDoc.x);
    const newY = changes.y !== undefined ? Number(changes.y) : Number(tokenDoc.y);
    const moved = metersBetween(scene, oldX, oldY, newX, newY);
    if (moved <= 0)
        return;
    const prevMoved = Number(actor.getFlag(FLAG_SCOPE, FLAG_MOVED) ?? 0);
    const totalMoved = prevMoved + moved;
    await actor.setFlag(FLAG_SCOPE, FLAG_MOVED, totalMoved);
    // Disengage / Safe Movement: this movement does not provoke
    // movement-triggered Reactions — announce once per turn so the table
    // adjudicates any such reaction as illegal.
    try {
        const { getRoundState } = await import('./action-economy.js');
        const rs = getRoundState(actor, combat);
        if (rs?.safeMovementThisTurn && !actor.getFlag(FLAG_SCOPE, FLAG_SAFE_MOVE_NOTED)) {
            await actor.setFlag(FLAG_SCOPE, FLAG_SAFE_MOVE_NOTED, true);
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `<div class="mastery-status-tick"><strong>${actor.name}</strong> — <strong>Disengage:</strong> this movement does not provoke movement-triggered Reactions.</div>`,
            });
        }
    }
    catch (err) {
        console.debug?.('Mastery System | safe movement note failed', err);
    }
    try {
        const { applyMovementCloakDisruption } = await import('./perception-combat-hooks.js');
        await applyMovementCloakDisruption(actor, totalMoved);
    }
    catch (err) {
        console.debug?.('Mastery System | cloak disruption on move failed', err);
    }
    const lacerate = getActiveSpecialValue(actor, 'lacerate');
    if (lacerate <= 0)
        return;
    const speed = Math.max(1, Number(actor.system?.combat?.speed ?? 8));
    let stage = Number(actor.getFlag(FLAG_SCOPE, FLAG_LACERATE_STAGE) ?? 0);
    let damage = 0;
    const notes = [];
    if (stage < 1 && totalMoved > 0) {
        damage += lacerate;
        stage = 1;
        notes.push('moved');
    }
    if (stage < 2 && totalMoved > speed / 2) {
        damage += lacerate;
        stage = 2;
        notes.push('> half Speed');
    }
    if (stage < 3 && totalMoved > speed) {
        damage += lacerate;
        stage = 3;
        notes.push('> Speed');
    }
    if (damage > 0) {
        await actor.setFlag(FLAG_SCOPE, FLAG_LACERATE_STAGE, stage);
        await applyDirectDamage(actor, damage);
        try {
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: `<div class="mastery-status-tick"><strong>${actor.name}</strong> — Lacerate(${lacerate}): ${damage} damage (${notes.join(', ')}).</div>`,
            });
        }
        catch { /* ignore chat errors */ }
    }
}
/**
 * End-of-turn Slow check for the creature whose turn just ended: if it did not
 * voluntarily move at least 1 m, it takes Slow(X) damage.
 */
export async function processTurnEndMovement(actor) {
    if (!actor || !game.user?.isGM)
        return;
    try {
        const slow = getActiveSpecialValue(actor, 'slow');
        if (slow > 0) {
            const moved = Number(actor.getFlag(FLAG_SCOPE, FLAG_MOVED) ?? 0);
            if (moved < 1) {
                await applyDirectDamage(actor, slow);
                try {
                    await ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor }),
                        content: `<div class="mastery-status-tick"><strong>${actor.name}</strong> — Slow(${slow}): ${slow} damage (did not move).</div>`,
                    });
                }
                catch { /* ignore chat errors */ }
            }
        }
    }
    catch (err) {
        console.debug?.('Mastery System | processTurnEndMovement failed', err);
    }
}
//# sourceMappingURL=movement-tracker.js.map