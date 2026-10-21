/**
 * Shared Raise allocation for one Power use (Split / Instant AoE / Autofire).
 *
 * Pure in-memory store (no Foundry globals) so the key scheme can be unit tested.
 * `damage-dialog.ts` re-exports `rememberSharedRaiseAllocation`,
 * `peekSharedRaiseAllocation` and `forgetSharedRaiseAllocation`.
 */
const sharedRaiseAllocByKey = new Map();
/** Autofire key: one entry per Power use, shared by every slot of the chain. */
export function autofireRaiseShareKey(powerUseId) {
    const id = String(powerUseId ?? '').trim();
    return id ? `autofire:${id}` : '';
}
/** Read the unique Autofire Power-use id from a flag bag (`powerUseId` / `autofireUseId`). */
export function readAutofirePowerUseId(flags) {
    if (!flags)
        return '';
    return String(flags.powerUseId ?? flags.autofireUseId ?? '').trim();
}
/**
 * Key under which a Power use shares ONE post-roll Raise allocation.
 *
 * Autofire: `autofire:${powerUseId}`. When no id is present (legacy cards) it
 * falls back to the old attacker + attack total + paid-raise key; every real
 * Autofire chain stamps a unique id at the start of `resolveAutofireChain`.
 */
export function raiseAllocShareKey(flags) {
    if (!flags)
        return '';
    const split = String(flags.splitPairId || '').trim();
    if (split)
        return `split:${split}`;
    if (flags.autofire === true) {
        const byId = autofireRaiseShareKey(readAutofirePowerUseId(flags));
        if (byId)
            return byId;
        const paid = Math.max(0, Math.floor(Number(flags.declaredRaiseSlots) || 0));
        return `autofire:${flags.attackerId}:${flags.attackTotal}:${paid}`;
    }
    if (flags.aoeMeleeWeapon === true || String(flags.aoeMeleeWeapon) === 'true') {
        return `aoe:${flags.attackerId}:${flags.attackTotal}:${flags.raiseTn}`;
    }
    return '';
}
export function rememberSharedRaiseAllocation(key, plan) {
    const k = String(key || '').trim();
    if (!k || !plan.length)
        return;
    sharedRaiseAllocByKey.set(k, plan.map((r) => ({ ...r })));
}
export function peekSharedRaiseAllocation(key) {
    const k = String(key || '').trim();
    if (!k)
        return null;
    const plan = sharedRaiseAllocByKey.get(k);
    return plan ? plan.map((r) => ({ ...r })) : null;
}
/** Drop a shared Raise allocation (chain finished or damage cancelled). */
export function forgetSharedRaiseAllocation(key) {
    const k = String(key || '').trim();
    if (!k)
        return false;
    return sharedRaiseAllocByKey.delete(k);
}
//# sourceMappingURL=shared-raise-allocation.js.map