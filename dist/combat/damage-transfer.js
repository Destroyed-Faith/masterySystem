/**
 * Damage Transfer (Vampyr).
 *
 * Healing is the real HP this one damage instance removed from the target
 * after mitigation, Temporary HP, and other buffers. It is capped by the
 * missing HP on the attacker's current Health Bar. Limited doubles printed
 * power dice only; it does not multiply the heal. This is not Life Absorption.
 */
import { applyHealHpAcrossOpenBars } from './heal-resolution.js';
export const MELEE_DAMAGE_TRANSFER_TEMPLATE_ID = 'active-melee-single-target-damage-transfer';
export const RANGED_DAMAGE_TRANSFER_TEMPLATE_ID = 'active-ranged-single-target-damage-transfer';
const processedDamageTransferIds = new Set();
/** Test hook. Production claims live for the session so a replay cannot heal twice. */
export function resetDamageTransferInstances() {
    processedDamageTransferIds.clear();
}
export function isDamageTransferTemplateId(templateId) {
    const tid = String(templateId || '');
    return tid === MELEE_DAMAGE_TRANSFER_TEMPLATE_ID || tid === RANGED_DAMAGE_TRANSFER_TEMPLATE_ID;
}
export function isDamageTransferPower(item) {
    if (!item)
        return false;
    const sys = item.system ?? {};
    if (isDamageTransferTemplateId(sys.templateId))
        return true;
    const levels = sys.levels;
    const list = Array.isArray(levels) ? levels : levels ? Object.values(levels) : [];
    return list.some((row) => row?.mechanics?.damageTransfer === true);
}
/** A miss never transfers. The attack handler and the damage resolver both use this. */
export function damageTransferApplies(opts) {
    return opts.damageTransfer === true && opts.hit === true;
}
function flagTrue(v) {
    return v === true || String(v) === 'true';
}
/**
 * Instant AoE Attack (Melee / Ranged AoE Attack, AoE Special Attacks): one shared
 * Attack/Casting roll and one shared Power damage roll. These attacks never add
 * Weapon Damage or Spell Focus damage and have no Primary Target.
 *
 * `aoeMeleeWeapon` is the legacy flag name kept for compatibility with existing
 * attack-card data; `instantAoe` is the preferred name.
 */
export function isInstantAoeFlags(flags) {
    if (!flags)
        return false;
    return flagTrue(flags.instantAoe) || flagTrue(flags.aoeMeleeWeapon);
}
/**
 * Martial delivery includes weapon damage. Spell delivery, an explicit
 * ignore flag and Instant AoE do not. NPC spell rows are spell delivery.
 */
export function martialWeaponDamageApplies(flags) {
    return (flags.ignoreWeaponDamage !== true &&
        flags.powerIsSpell !== true &&
        flags.npcIsSpell !== true &&
        !isInstantAoeFlags(flags));
}
/**
 * Spell Focus dice boost single-target Spell damage. Instant AoE never receives
 * them (shared Power damage only).
 */
export function spellFocusDamageApplies(flags) {
    return flags.isSpell === true && flags.isNpcAttackFlow !== true && !isInstantAoeFlags(flags);
}
/** Limited doubles the printed power-damage pool only, never a following weapon term. */
export function doublePrintedPowerDice(formula) {
    return String(formula || '').replace(/^(\d+)d(\d+)/i, (_m, n, sides) => `${Number(n) * 2}d${sides}`);
}
export function applyLimitedToTransferPowerDamage(formula, opts) {
    if (opts.damageTransfer !== true || opts.limited !== true)
        return formula;
    return doublePrintedPowerDice(formula);
}
export async function settleDamageTransfer(opts) {
    if (!opts.enabled || !opts.attacker)
        return 0;
    const id = String(opts.instanceId || '').trim();
    if (id) {
        if (processedDamageTransferIds.has(id))
            return 0;
        processedDamageTransferIds.add(id);
    }
    const lost = Math.max(0, Math.floor(Number(opts.realHpLost) || 0));
    if (lost <= 0)
        return 0;
    const health = opts.attacker.system?.health ?? {};
    const healed = applyHealHpAcrossOpenBars(health, lost);
    if (healed.restored <= 0)
        return 0;
    const { updateActorViaGm } = await import('./gm-relay.js');
    await updateActorViaGm(opts.attacker, {
        'system.health.bars': healed.bars,
        'system.health.currentBar': healed.currentBar,
    });
    return healed.restored;
}
//# sourceMappingURL=damage-transfer.js.map