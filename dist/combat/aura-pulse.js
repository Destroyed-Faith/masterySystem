/**
 * Active Buff auras pulse at the end of the owner's turn.
 * One roll per creature inside the radius. Damage hits other dispositions;
 * healing hits the same disposition, including the owner.
 */
import { applyDamage } from '../utils/calculations.js';
import { distanceBetweenActorsMeters } from './reaction-eligibility.js';
function effectList(actor) {
    const effects = actor?.effects;
    if (!effects)
        return [];
    if (Array.isArray(effects?.contents))
        return effects.contents;
    if (typeof effects[Symbol.iterator] === 'function')
        return Array.from(effects);
    return [];
}
function combatActors() {
    const combat = globalThis.game?.combat;
    const bag = combat?.combatants;
    const rows = bag
        ? typeof bag.values === 'function'
            ? Array.from(bag.values())
            : Array.isArray(bag)
                ? bag
                : []
        : [];
    const out = [];
    const seen = new Set();
    for (const row of rows) {
        const actor = row?.actor;
        const id = String(actor?.id || '');
        if (!actor || !id || seen.has(id))
            continue;
        seen.add(id);
        out.push(actor);
    }
    return out;
}
function dispositionOf(actor) {
    try {
        const token = actor?.getActiveTokens?.(true, true)?.[0] ?? actor?.token;
        const raw = token?.document?.disposition ?? token?.disposition;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }
    catch {
        return null;
    }
}
async function rollDice(formula) {
    const RollCtor = globalThis.Roll;
    if (typeof RollCtor !== 'function')
        return 0;
    const roll = new RollCtor(formula);
    await roll.evaluate();
    return Math.max(0, Math.floor(Number(roll.total) || 0));
}
function pulseRoundKey(actor) {
    const combat = globalThis.game?.combat;
    if (!combat?.id || !actor?.id)
        return null;
    const round = Math.max(0, Math.floor(Number(combat.round) || 0));
    return `${combat.id}:${round}:${actor.id}`;
}
export async function pulseActiveBuffAuras(actor) {
    if (!actor)
        return '';
    const key = pulseRoundKey(actor);
    const flags = actor.flags?.['mastery-system'] ?? {};
    if (key && flags.lastAuraPulseKey === key)
        return '';
    if (key) {
        actor.flags = actor.flags || {};
        actor.flags['mastery-system'] = { ...flags, lastAuraPulseKey: key };
    }
    const notes = [];
    const ownerDisp = dispositionOf(actor);
    for (const effect of effectList(actor)) {
        if (effect?.disabled)
            continue;
        const flags = effect?.flags?.['mastery-system'];
        if (!flags?.activeBuff)
            continue;
        const payload = flags?.mechanics?.auraPayload;
        if (!payload || (payload.kind !== 'damage' && payload.kind !== 'healing'))
            continue;
        const dice = String(payload.dice || '').trim();
        const radius = Math.max(0, Number(payload.radiusM) || 0);
        if (!dice || radius <= 0)
            continue;
        for (const other of combatActors()) {
            const self = String(other.id) === String(actor.id);
            if (payload.kind === 'damage' && self)
                continue;
            const otherDisp = dispositionOf(other);
            const sameSide = ownerDisp != null && otherDisp != null && ownerDisp === otherDisp;
            if (payload.kind === 'damage' && sameSide)
                continue;
            if (payload.kind === 'healing' && !self && !sameSide)
                continue;
            if (!self) {
                const meters = distanceBetweenActorsMeters(actor, other);
                if (meters != null && meters > radius + 0.05)
                    continue;
            }
            const amount = await rollDice(dice);
            if (amount <= 0)
                continue;
            try {
                const bars = other.system?.health?.bars;
                if (!Array.isArray(bars) || !bars.length)
                    continue;
                const duplicate = globalThis.foundry?.utils?.duplicate ?? ((v) => JSON.parse(JSON.stringify(v)));
                const next = duplicate(bars);
                const current = Math.max(0, Math.floor(Number(other.system?.health?.currentBar) || 0));
                if (payload.kind === 'damage') {
                    const barIndex = applyDamage(next, current, amount);
                    await other.update?.({ 'system.health.bars': next, 'system.health.currentBar': barIndex });
                    notes.push(`${effect.name || 'Damage Aura'}: ${other.name} takes ${amount}`);
                }
                else {
                    const { applyHealHpAcrossOpenBars } = await import('./heal-resolution.js');
                    const healed = applyHealHpAcrossOpenBars({ bars: next, currentBar: current }, amount);
                    await other.update?.({ 'system.health.bars': healed.bars, 'system.health.currentBar': healed.currentBar });
                    notes.push(`${effect.name || 'Healing Aura'}: ${other.name} heals ${amount}`);
                }
            }
            catch (err) {
                console.warn('Mastery System | aura pulse failed', err);
            }
        }
    }
    if (notes.length) {
        try {
            const ChatMessageCtor = globalThis.ChatMessage;
            await ChatMessageCtor?.create?.({
                speaker: ChatMessageCtor.getSpeaker?.({ actor }),
                content: `<div class="mastery-status-tick"><strong>${actor?.name ?? 'Creature'}</strong> — Aura: ${notes.join('; ')}</div>`,
            });
        }
        catch (err) {
            console.warn('Mastery System | aura chat failed', err);
        }
    }
    return notes.join(' | ');
}
//# sourceMappingURL=aura-pulse.js.map