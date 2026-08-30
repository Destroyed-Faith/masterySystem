/**
 * First Aid (Players Guide "Rest & Recovery"):
 *
 * After combat, a character may treat another creature with Medicine. On a
 * successful Medicine Skill Check the treated creature loses all remaining
 * negative Specials caused during that combat. First Aid does not restore HP
 * or Scarred Health Bars. Each creature may receive First Aid once per combat.
 *
 * The Medicine roll itself uses the normal Skill Check flow — this GM tool
 * applies the outcome (and tracks the once-per-combat limit).
 */
import { getEffectById } from './special-effects.js';
import { statusEntryId } from '../system/active-specials.js';
const FIRST_AID_FLAG = 'firstAidReceived';
function isNegativeSpecialEntry(entry) {
    const id = statusEntryId(entry);
    if (!id)
        return true; // unknown stacks are treated as combat residue
    const effect = getEffectById(id);
    if (!effect)
        return true;
    return effect.polarity !== 'positive';
}
/** Remove all negative Specials from the target; returns names removed. */
export async function applyFirstAidTo(target) {
    if (!target)
        return [];
    const list = Array.isArray(target.system?.statusEffects)
        ? target.system.statusEffects
        : [];
    const removed = [];
    const kept = [];
    for (const entry of list) {
        if (isNegativeSpecialEntry(entry)) {
            const id = statusEntryId(entry);
            removed.push(String(entry?.name ?? id ?? 'Special'));
        }
        else {
            kept.push(entry);
        }
    }
    if (removed.length > 0) {
        await target.update({ 'system.statusEffects': kept });
    }
    await target.setFlag?.('mastery-system', FIRST_AID_FLAG, true);
    return removed;
}
export function hasReceivedFirstAid(target) {
    return target?.getFlag?.('mastery-system', FIRST_AID_FLAG) === true;
}
/** New combat: the once-per-combat First Aid limit resets. */
export async function clearFirstAidFlags(actors) {
    for (const actor of actors) {
        try {
            if (actor?.getFlag?.('mastery-system', FIRST_AID_FLAG) != null) {
                await actor.unsetFlag?.('mastery-system', FIRST_AID_FLAG);
            }
        }
        catch {
            /* ignore */
        }
    }
}
/**
 * GM tool: apply First Aid to the currently selected (or targeted) token's
 * actor after a successful Medicine check.
 */
export async function promptFirstAidForSelectedToken() {
    const g = globalThis;
    if (!g.game?.user?.isGM) {
        g.ui?.notifications?.warn?.('Only the GM can apply First Aid.');
        return;
    }
    const token = g.canvas?.tokens?.controlled?.[0] ??
        [...(g.game?.user?.targets ?? [])][0] ??
        null;
    const target = token?.actor ?? null;
    if (!target) {
        g.ui?.notifications?.warn?.('Select or target a token to receive First Aid.');
        return;
    }
    if (hasReceivedFirstAid(target)) {
        g.ui?.notifications?.warn?.(`${target.name} already received First Aid after this combat.`);
        return;
    }
    const ok = await Dialog.confirm({
        title: `First Aid — ${target.name}`,
        content: `<p>Apply <strong>First Aid</strong> to <strong>${target.name}</strong>?</p>` +
            `<p>Requires a successful <strong>Medicine Skill Check</strong> (normal Skill Check rules). ` +
            `On success all remaining negative Specials from this combat are removed. ` +
            `No HP or Scarred Bars are restored. Once per creature per combat.</p>`,
        yes: () => true,
        no: () => false,
    });
    if (!ok)
        return;
    const removed = await applyFirstAidTo(target);
    const summary = removed.length > 0 ? removed.join(', ') : 'no negative Specials present';
    try {
        await g.ChatMessage?.create?.({
            speaker: g.ChatMessage?.getSpeaker?.({ actor: target }),
            content: `<div class="mastery-first-aid"><strong>${target.name}</strong> receives First Aid — removed: ${summary}.</div>`,
        });
    }
    catch {
        /* chat optional */
    }
}
//# sourceMappingURL=first-aid.js.map