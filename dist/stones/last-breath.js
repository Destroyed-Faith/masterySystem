/**
 * Last Breath — once per Safe Haven Rest, burn 1 Stone to stay up
 * with 1 box in the Wounded bar when you would drop to Incapacitated.
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
/** Mutate bars in place: 1 box in Wounded, later bars restored. Returns wounded index. */
export function applyLastBreathBars(bars) {
    const wounded = barIndexByName(bars, 'wounded');
    const idx = wounded >= 0 ? wounded : Math.max(0, bars.length - 2);
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
async function burnOneReadyStone(actor) {
    for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
        const pool = getStonePool(actor, attr);
        if (pool.current <= 0)
            continue;
        await actor.update?.({ [`system.stonePools.${attr}.current`]: pool.current - 1 });
        return attr;
    }
    return null;
}
async function confirmLastBreath(actor) {
    const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
    const name = String(actor?.name || 'You');
    const content = `${name} would drop to Incapacitated. Burn <strong>1 Stone</strong> to stay conscious with 1 box in the Wounded Health Bar? Remaining damage from this hit is ignored.`;
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
 * Mutates `bars` when accepted. Returns the Wounded bar index, or null.
 */
export async function maybeApplyLastBreath(actor, bars) {
    if (!wouldDropToIncapacitated(bars) || !canUseLastBreath(actor))
        return null;
    const accepted = await confirmLastBreath(actor);
    if (!accepted)
        return null;
    const burned = await burnOneReadyStone(actor);
    if (!burned)
        return null;
    await actor.setFlag?.('mastery-system', LAST_BREATH_FLAG, true);
    const woundedIdx = applyLastBreathBars(bars);
    globalThis.ui?.notifications?.info(`${actor.name}: Last Breath — stays conscious with 1 Wounded box (burned 1 ${burned} Stone).`);
    return woundedIdx;
}
export async function clearLastBreathOnRest(actor) {
    if (actor.getFlag?.('mastery-system', LAST_BREATH_FLAG) !== true)
        return;
    await actor.unsetFlag?.('mastery-system', LAST_BREATH_FLAG);
}
//# sourceMappingURL=last-breath.js.map