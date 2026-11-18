/**
 * Ruin immediate damage (Actives v0.9.9.6, adopted 2026-11-18).
 *
 * Whenever Ruin stacks are newly applied, the creature immediately loses
 * 4 HP per newly applied stack. Only stacks actually added after Ward /
 * Special Negation count. The damage ignores Armor and is not Attack Damage;
 * Damage Reduction and Temporary HP apply. Damage Negation removes Damage
 * Dice before a roll, so it has nothing to remove from this fixed amount.
 * Balance Review: open — printed Ruin values are unchanged.
 */
import { applyDamage } from '../utils/calculations.js';
import { mitigateArmorIgnoringTickDamage } from './status-tick.js';
export const RUIN_IMMEDIATE_DAMAGE_PER_STACK = 4;
/** Raw immediate damage for `stacks` newly applied Ruin stacks. */
export function ruinImmediateDamage(stacks) {
    const n = Math.max(0, Math.floor(Number(stacks) || 0));
    return n * RUIN_IMMEDIATE_DAMAGE_PER_STACK;
}
/**
 * Compute the immediate Ruin damage for a target without writing it. The
 * patch is meant to be merged into the same update that stores the new
 * Ruin stacks so stacks and HP change atomically.
 */
export async function buildRuinImmediateDamage(target, stacks) {
    const n = Math.max(0, Math.floor(Number(stacks) || 0));
    const rawDamage = ruinImmediateDamage(n);
    const empty = {
        stacks: n,
        rawDamage,
        drPercent: 0,
        tempHPAbsorbed: 0,
        barDamage: 0,
        patch: {},
        note: '',
    };
    const system = target?.system;
    if (rawDamage <= 0 || !Array.isArray(system?.health?.bars) || system.health.bars.length === 0) {
        return empty;
    }
    const sheetDr = Math.max(0, Math.min(100, Math.floor(Number(system?.combat?.damageReductionPct) || 0)));
    const mitigated = mitigateArmorIgnoringTickDamage(rawDamage, sheetDr);
    const { previewTempHPConsumption } = await import('./passive-triggers.js');
    const temp = previewTempHPConsumption(target, mitigated.damage);
    const barDamage = Math.max(0, temp.remainingDamage);
    const patch = { ...temp.patch };
    if (barDamage > 0) {
        const fu = globalThis.foundry?.utils;
        const bars = fu?.duplicate
            ? fu.duplicate(system.health.bars)
            : JSON.parse(JSON.stringify(system.health.bars));
        const currentBar = applyDamage(bars, Number(system.health.currentBar ?? 0), barDamage);
        patch['system.health.bars'] = bars;
        patch['system.health.currentBar'] = currentBar;
    }
    const steps = [`Ruin +${n} → ${rawDamage} damage (4 × ${n}, ignores Armor)`];
    if (mitigated.drPercent > 0 && mitigated.damage !== rawDamage) {
        steps.push(`DR ${mitigated.drPercent}% → ${mitigated.damage}`);
    }
    if (temp.reducedBy > 0)
        steps.push(`Temp HP ${temp.reducedBy}`);
    steps.push(`${barDamage} HP lost`);
    return {
        stacks: n,
        rawDamage,
        drPercent: mitigated.drPercent,
        tempHPAbsorbed: temp.reducedBy,
        barDamage,
        patch,
        note: steps.join(' · '),
    };
}
/** Chat line for applied immediate Ruin damage. */
export async function announceRuinImmediateDamage(target, result) {
    if (!result.note)
        return;
    try {
        const CM = globalThis.ChatMessage;
        await CM?.create?.({
            user: globalThis.game?.user?.id,
            speaker: CM?.getSpeaker?.({ actor: target }),
            content: `<p class="mastery-ruin-immediate"><strong>${String(target?.name ?? 'Target')}</strong> — ` +
                `Ruin immediate damage: ${result.note}. <em>(Balance Review open)</em></p>`,
        });
    }
    catch (err) {
        console.warn('Mastery System | Ruin immediate damage chat failed', err);
    }
}
/** Post-HP-change hooks shared with the Ruin Tick (boss phase, defeated token). */
export async function afterRuinImmediateDamage(target, result) {
    if (result.barDamage <= 0 && result.tempHPAbsorbed <= 0)
        return;
    try {
        const { maybeAdvanceNpcBossPhase } = await import('./npc-phase-advance.js');
        await maybeAdvanceNpcBossPhase(target);
    }
    catch (phaseErr) {
        console.warn('Mastery System | NPC phase advance failed', phaseErr);
    }
    try {
        const { syncNpcDefeatedPresentationAfterHpChange } = await import('./defeated-token.js');
        await syncNpcDefeatedPresentationAfterHpChange(target);
    }
    catch (downErr) {
        console.warn('Mastery System | defeated token presentation failed', downErr);
    }
}
//# sourceMappingURL=ruin-immediate.js.map