/**
 * Last Breath (Core v0.9.9.6) — once per Safe Haven Rest, when you would drop to
 * Incapacitated, Seal 1 Attribute Stone and stay conscious with 1 HP in the
 * Broken Health Bar. The Sealed Stone returns at the next Safe Haven Rest.
 */
import { getStonePool, STONE_POOL_ATTRIBUTE_KEYS } from '../combat/action-economy.js';
export const LAST_BREATH_FLAG = 'lastBreathUsed';
export function lastBreathUsedThisRest(actor) {
    return actor.getFlag?.('mastery-system', LAST_BREATH_FLAG) === true;
}
export function actorHasReadyStone(actor) {
    for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
        if (getStonePool(actor, attr).current > 0)
            return true;
    }
    return false;
}
export function canUseLastBreath(actor) {
    if (!actor || lastBreathUsedThisRest(actor))
        return false;
    return actorHasReadyStone(actor);
}
function barIndexByName(bars, name) {
    const needle = name.toLowerCase();
    return bars.findIndex((b) => String(b?.name || '').toLowerCase() === needle);
}
export function wouldDropToIncapacitated(bars) {
    const incapIdx = barIndexByName(bars, 'incapacitated');
    if (incapIdx >= 0)
        return Math.max(0, Number(bars[incapIdx]?.current) || 0) <= 0;
    return bars.every((b) => Math.max(0, Number(b?.current) || 0) <= 0);
}
/** Mutate bars in place: 1 HP in Broken, later bars restored. Returns the Broken index. */
export function applyLastBreathBars(bars) {
    const broken = barIndexByName(bars, 'broken');
    const idx = broken >= 0 ? broken : Math.max(0, bars.length - 2);
    for (let i = 0; i < bars.length; i++) {
        const bar = bars[i];
        if (!bar)
            continue;
        if (i === idx)
            bar.current = 1;
        else if (i > idx)
            bar.current = Math.max(0, Number(bar.max) || 0);
    }
    return idx;
}
async function sealOneReadyStone(actor) {
    for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
        const pool = getStonePool(actor, attr);
        if (pool.current <= 0)
            continue;
        // `sealed` blocks regen and end-of-combat refills until a Safe Haven Rest.
        const sealedNow = Math.max(0, Number(actor?.system?.stonePools?.[attr]?.sealed) || 0);
        await actor.update?.({
            [`system.stonePools.${attr}.current`]: pool.current - 1,
            [`system.stonePools.${attr}.sealed`]: sealedNow + 1,
        });
        return attr;
    }
    return null;
}
async function confirmLastBreath(actor) {
    const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
    const name = String(actor?.name || 'You');
    const content = `${name} would drop to Incapacitated. Seal <strong>1 Attribute Stone</strong> (it returns at the next Safe Haven Rest) to stay conscious with 1 HP in the Broken Health Bar? Remaining damage from this hit is ignored.`;
    if (typeof DialogV2?.confirm === 'function') {
        return !!(await DialogV2.confirm({
            window: { title: 'Last Breath' },
            content: `<p>${content}</p>`,
            yes: { label: 'Last Breath' },
            no: { label: 'Fall' },
        }));
    }
    const DialogCls = globalThis.Dialog;
    if (typeof DialogCls?.confirm === 'function') {
        return !!(await DialogCls.confirm({
            title: 'Last Breath',
            content: `<p>${content}</p>`,
            yes: () => true,
            no: () => false,
        }));
    }
    return true;
}
/**
 * If this hit would drop the actor to Incapacitated, offer Last Breath.
 * Mutates `bars` when accepted. Returns the Broken bar index, or null.
 */
export async function maybeApplyLastBreath(actor, bars) {
    if (!wouldDropToIncapacitated(bars) || !canUseLastBreath(actor))
        return null;
    const accepted = await confirmLastBreath(actor);
    if (!accepted)
        return null;
    const sealed = await sealOneReadyStone(actor);
    if (!sealed)
        return null;
    await actor.setFlag?.('mastery-system', LAST_BREATH_FLAG, true);
    const brokenIdx = applyLastBreathBars(bars);
    globalThis.ui?.notifications?.info(`${actor.name}: Last Breath — stays conscious with 1 HP in the Broken bar (Sealed 1 ${sealed} Stone).`);
    return brokenIdx;
}
export async function clearLastBreathOnRest(actor) {
    if (actor.getFlag?.('mastery-system', LAST_BREATH_FLAG) !== true)
        return;
    await actor.unsetFlag?.('mastery-system', LAST_BREATH_FLAG);
}
//# sourceMappingURL=last-breath.js.map