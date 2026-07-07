/**
 * Pre-attack / power-use enforcement for Dread and Disrupt.
 *
 *   Dread(X): before you make an attack, make the listed Save (DC increased by
 *             X). On a failure, the attack is lost. The Save type is chosen by
 *             the applying Power; since stored Specials do not yet carry the
 *             type, we default to a Spirit Save at DC 8 + X.
 *   Disrupt(X): when you use a Power, reduce Disrupt by X. If you cannot reduce
 *               it by the required amount, the Power fails and the action is
 *               lost. We reduce by the current value (the required amount),
 *               which always succeeds, then clear Disrupt.
 */
import { getActiveSpecialValue } from '../system/active-specials.js';
/** Base save DC before the Dread increase. */
const DREAD_BASE_DC = 8;
/**
 * Roll the attacker's Dread save before an attack. Returns `true` when the
 * attack is blocked (save failed) and should not proceed.
 */
export async function resolveDreadPreAttack(attacker) {
    const dread = getActiveSpecialValue(attacker, 'dread');
    if (dread <= 0)
        return { blocked: false, note: '' };
    const system = attacker?.system ?? {};
    const resolve = Number(system.attributes?.resolve?.value ?? 2);
    const influence = Number(system.attributes?.influence?.value ?? 2);
    const keepDice = Math.max(1, Number(system.mastery?.rank ?? 2));
    const numDice = Math.max(keepDice, Math.max(resolve, influence));
    const dc = DREAD_BASE_DC + dread;
    try {
        const { masteryRoll } = await import('../dice/roll-handler.js');
        const result = await masteryRoll({
            numDice,
            keepDice,
            skill: 0,
            tn: dc,
            normalTn: dc,
            label: `Dread Save (Spirit)`,
            flavor: `Dread(${dread}) — Spirit Save vs DC ${dc} before attacking`,
            actorId: attacker?.id,
            isSaveRoll: true,
            rollKind: 'saveSpirit',
        });
        if (result?.success) {
            return { blocked: false, note: `Dread(${dread}) save passed.` };
        }
        return { blocked: true, note: `Dread(${dread}) save failed — attack lost.` };
    }
    catch (err) {
        console.warn('Mastery System | Dread pre-attack save failed', err);
        return { blocked: false, note: '' };
    }
}
/**
 * Apply Disrupt when a Power is used: reduce Disrupt by its current value
 * (the required amount) and clear it. Returns `true` when the Power may
 * proceed (always true here, since the required amount is always payable).
 */
export async function consumePowerDisrupt(attacker) {
    const disrupt = getActiveSpecialValue(attacker, 'disrupt');
    if (disrupt <= 0)
        return true;
    try {
        const system = attacker.system;
        const list = Array.isArray(system?.statusEffects) ? system.statusEffects : [];
        const next = list.filter((e) => !(e?.id === 'disrupt' || String(e?.name ?? '').toLowerCase() === 'disrupt'));
        await attacker.update({ 'system.statusEffects': next });
        try {
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: attacker }),
                content: `<div class="mastery-status-tick"><strong>${attacker?.name}</strong> — Disrupt(${disrupt}) consumed by Power use.</div>`,
            });
        }
        catch { /* ignore chat errors */ }
    }
    catch (err) {
        console.warn('Mastery System | consumePowerDisrupt failed', err);
    }
    return true;
}
//# sourceMappingURL=dread-gate.js.map