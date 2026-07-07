/**
 * Diminishing Special-Effect runtime: start-of-turn Tick + Decay.
 *
 * At the start of the affected creature's turn, each diminishing Special
 * resolves its Tick (if any) and then decays by 1 (removed at 0), per the
 * Special Effects Reference:
 *   - Ruin(X)         : take X damage (ignores Armor)
 *   - Blight(X)       : take X Stress (ignores Stress Armor)
 *   - Regeneration(X) : heal X HP
 *
 * Movement-based ticks (Lacerate, Slow end-of-turn damage) are resolved from
 * movement tracking, not here. Value-based maluses (Corrode, Expose, Slow speed,
 * Soulburn, Weaken, Disoriented) are applied in `prepareDerivedData` / roll
 * builders and only decay here.
 *
 * Runs GM-side only so a single client mutates the actor.
 */
import { applyDamage, healDamage, applyStress } from '../utils/calculations.js';
import { getEffectById } from '../utils/special-effects.js';
import { statusEntryId } from '../system/active-specials.js';
/**
 * Resolve start-of-turn Tick + Decay for one actor's diminishing Specials.
 * Returns a short human summary of what happened (for chat), or ''.
 */
export async function processTurnStartStatusTick(actor) {
    if (!actor || !game.user?.isGM)
        return '';
    const system = actor.system;
    const list = Array.isArray(system?.statusEffects) ? system.statusEffects : [];
    if (list.length === 0)
        return '';
    let ruinDamage = 0;
    let blightStress = 0;
    let regenHeal = 0;
    const notes = [];
    const next = [];
    for (const entry of list) {
        const id = statusEntryId(entry);
        const effect = id ? getEffectById(id) : undefined;
        // Non-diminishing (timed / until-used / instant) entries are left untouched.
        if (!effect || effect.category !== 'diminishing') {
            next.push(entry);
            continue;
        }
        const value = Math.max(0, Math.floor(Number(entry.value ?? 0)));
        // Tick (before decay).
        if (value > 0) {
            switch (id) {
                case 'ruin':
                    ruinDamage += value;
                    notes.push(`Ruin(${value}) → ${value} damage`);
                    break;
                case 'blight':
                    blightStress += value;
                    notes.push(`Blight(${value}) → ${value} Stress`);
                    break;
                case 'regeneration':
                    regenHeal += value;
                    notes.push(`Regeneration(${value}) → heal ${value}`);
                    break;
                default:
                    break;
            }
        }
        // Decay X → X − 1; drop at 0.
        const decayed = value - 1;
        if (decayed > 0) {
            next.push({ ...entry, id, value: decayed });
        }
        else {
            notes.push(`${effect.name.replace(/\(X\)/, '')} ended`);
        }
    }
    const update = { 'system.statusEffects': next };
    // Apply HP damage (Ruin, ignores Armor) then Regeneration heal to health bars.
    if ((ruinDamage > 0 || regenHeal > 0) && Array.isArray(system?.health?.bars) && system.health.bars.length > 0) {
        const bars = foundry.utils.duplicate(system.health.bars);
        let currentBar = Number(system.health.currentBar ?? 0);
        if (ruinDamage > 0) {
            currentBar = applyDamage(bars, currentBar, ruinDamage);
        }
        if (regenHeal > 0) {
            healDamage(bars, Math.min(Math.max(currentBar, 0), bars.length - 1), regenHeal);
        }
        update['system.health.bars'] = bars;
        update['system.health.currentBar'] = currentBar;
    }
    // Apply Stress (Blight, ignores Stress Armor) to stress bars.
    if (blightStress > 0 && Array.isArray(system?.stress?.bars) && system.stress.bars.length > 0) {
        const bars = foundry.utils.duplicate(system.stress.bars);
        const currentBar = applyStress(bars, Number(system.stress.currentBar ?? 0), blightStress);
        update['system.stress.bars'] = bars;
        update['system.stress.currentBar'] = currentBar;
    }
    try {
        await actor.update(update);
    }
    catch (err) {
        console.warn('Mastery System | status-tick update failed', actor?.name, err);
        return '';
    }
    return notes.join(', ');
}
/**
 * Post a compact chat summary of a turn-start Tick, if anything happened.
 */
export async function announceStatusTick(actor, summary) {
    if (!summary)
        return;
    try {
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `<div class="mastery-status-tick"><strong>${actor?.name ?? 'Creature'}</strong> — Special Effects: ${summary}.</div>`,
        });
    }
    catch (err) {
        console.debug?.('Mastery System | status-tick chat skipped', err);
    }
}
//# sourceMappingURL=status-tick.js.map