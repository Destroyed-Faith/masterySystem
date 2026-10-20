/**
 * Thorns — Passive: Thorns / Active Buff: Thorns.
 * On qualifying final HP damage, retaliate Nd8 (capped by the loss) at the source.
 */
import { getPassiveSlots } from '../powers/passives.js';
function masteryEffects(actor) {
    const effects = actor?.effects;
    if (!effects)
        return [];
    if (Array.isArray(effects))
        return effects;
    if (Array.isArray(effects?.contents))
        return effects.contents;
    if (typeof effects[Symbol.iterator] === 'function')
        return Array.from(effects);
    return [];
}
function slottedPassiveThornsDice(actor) {
    let best = 0;
    if (!actor?.system)
        return 0;
    const items = Array.isArray(actor.items)
        ? actor.items
        : Array.isArray(actor.items?.contents)
            ? actor.items.contents
            : [];
    for (const slot of getPassiveSlots(actor) ?? []) {
        if (!slot?.active || !slot.passive)
            continue;
        const tid = String(slot.passive.templateId || '').toLowerCase();
        const slotId = String(slot.passive.id || '');
        const item = items.find((i) => String(i?.id || '') === slotId) ||
            items.find((i) => String(i?.system?.templateId || '').toLowerCase() === 'passive-thornhide' ||
                String(i?.name || '').toLowerCase().includes('thorns'));
        const itemTid = String(item?.system?.templateId || tid || '').toLowerCase();
        if (itemTid !== 'passive-thornhide' && tid !== 'passive-thornhide')
            continue;
        const rank = Math.max(1, Math.floor(Number(item?.system?.rank ?? item?.system?.level ?? slot.passive.level ?? 1) || 1));
        const row = item?.system?.levels?.[String(rank)];
        const fromMech = Math.floor(Number(row?.mechanics?.thornsDice) || 0);
        if (fromMech > 0) {
            best = Math.max(best, fromMech);
            continue;
        }
        // Fallback: catalogue curve L1=0 … L16=10 when mechanics omitted on old items.
        const table = [0, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10];
        best = Math.max(best, table[Math.min(16, rank) - 1] ?? 0);
    }
    return best;
}
function activeBuffThornsDice(actor) {
    let best = 0;
    for (const effect of masteryEffects(actor)) {
        const flags = effect?.flags?.['mastery-system'] ?? effect?.flags?.masterySystem;
        if (!flags?.activeBuff)
            continue;
        const tid = String(flags.powerTemplateId || '').toLowerCase();
        const name = String(flags.powerName || effect?.name || '').toLowerCase();
        const isThorns = tid === 'ab-thorns' || /\bthorns\b/.test(name);
        if (!isThorns)
            continue;
        const fromMech = Math.floor(Number(flags.mechanics?.thornsDice) || 0);
        if (fromMech > 0) {
            best = Math.max(best, fromMech);
            continue;
        }
        const pl = Math.max(1, Math.floor(Number(flags.effectiveLevel ?? flags.level ?? 1) || 1));
        best = Math.max(best, pl);
    }
    return best;
}
/** Combined Thorns dice from Passive + Active Buff (sources stack by taking the max of each, then sum). */
export function resolveThornsDice(defender) {
    return Math.max(0, slottedPassiveThornsDice(defender)) + Math.max(0, activeBuffThornsDice(defender));
}
function rollNd8(dice) {
    const n = Math.max(0, Math.floor(Number(dice) || 0));
    if (n <= 0)
        return 0;
    let total = 0;
    for (let i = 0; i < n; i++) {
        total += 1 + Math.floor(Math.random() * 8);
    }
    return total;
}
/**
 * After final HP bar damage lands on `defender`, reflect Thorns at `source`.
 * Cap reflected damage at the final HP loss. Skips self-damage / missing source.
 */
export async function maybeApplyThornsRetaliation(defender, source, finalHpLoss) {
    const loss = Math.max(0, Math.floor(Number(finalHpLoss) || 0));
    if (loss <= 0 || !defender || !source)
        return null;
    if (String(defender.id || '') === String(source.id || ''))
        return null;
    const dice = resolveThornsDice(defender);
    if (dice <= 0)
        return null;
    const rolled = rollNd8(dice);
    const applied = Math.min(rolled, loss);
    if (applied <= 0)
        return null;
    try {
        const { applyDamageToTarget } = await import('../dice/damage-dialog.js');
        await applyDamageToTarget(source, applied, defender, 0, {
            skipThorns: true,
            armorPenetration: 0,
        });
    }
    catch (err) {
        console.warn('Mastery System | Thorns retaliation failed', err);
        return null;
    }
    try {
        const defName = String(defender.name ?? 'Defender');
        const srcName = String(source.name ?? 'Attacker');
        await globalThis.ChatMessage?.create?.({
            user: globalThis.game?.user?.id,
            speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: defender }),
            content: `<p class="mastery-thorns-msg"><strong>${defName}</strong> Thorns (${dice}d8 → ${rolled}, capped ${loss}) ` +
                `deal <strong>${applied}</strong> to <strong>${srcName}</strong>.</p>`,
        });
    }
    catch {
        /* chat is best-effort */
    }
    return { applied, dice };
}
//# sourceMappingURL=thorns.js.map